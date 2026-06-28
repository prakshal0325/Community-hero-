import { getOpenAIClient, isAIAvailable, AI_MODEL } from '../config/openai.js';
import { ComplaintCategory, Severity, Priority } from '@prisma/client';

interface AIAnalysisResult {
  category: ComplaintCategory;
  severity: Severity;
  priority: Priority;
  title: string;
  description: string;
  tags: string[];
  estimatedCost: number;
  estimatedTime: string;
  confidence: number;
  suggestedDepartment: string;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number;
  matchedComplaintId?: string;
  reason?: string;
}

interface PredictiveInsight {
  area: string;
  category: string;
  probability: number;
  reasoning: string;
  preventiveMeasure: string;
}

const CATEGORY_MAP: Record<string, ComplaintCategory> = {
  pothole: 'POTHOLE',
  garbage: 'GARBAGE',
  water_leakage: 'WATER_LEAKAGE',
  water_leak: 'WATER_LEAKAGE',
  broken_streetlight: 'BROKEN_STREETLIGHT',
  streetlight: 'BROKEN_STREETLIGHT',
  sewage: 'SEWAGE_PROBLEM',
  sewage_problem: 'SEWAGE_PROBLEM',
  road_damage: 'ROAD_DAMAGE',
  illegal_dumping: 'ILLEGAL_DUMPING',
  traffic_signal: 'TRAFFIC_SIGNAL_FAILURE',
  traffic_signal_failure: 'TRAFFIC_SIGNAL_FAILURE',
  fallen_tree: 'FALLEN_TREE',
  public_property_damage: 'PUBLIC_PROPERTY_DAMAGE',
  property_damage: 'PUBLIC_PROPERTY_DAMAGE',
  other: 'OTHER',
};

const DEPARTMENT_MAP: Record<ComplaintCategory, string> = {
  POTHOLE: 'Roads & Infrastructure',
  ROAD_DAMAGE: 'Roads & Infrastructure',
  GARBAGE: 'Sanitation & Waste',
  ILLEGAL_DUMPING: 'Sanitation & Waste',
  WATER_LEAKAGE: 'Water & Sewage',
  SEWAGE_PROBLEM: 'Water & Sewage',
  BROKEN_STREETLIGHT: 'Electrical & Lighting',
  TRAFFIC_SIGNAL_FAILURE: 'Electrical & Lighting',
  FALLEN_TREE: 'Parks & Environment',
  PUBLIC_PROPERTY_DAMAGE: 'Parks & Environment',
  OTHER: 'Roads & Infrastructure',
};

export class AIService {
  static async analyzeImage(imageUrl: string): Promise<AIAnalysisResult> {
    if (!isAIAvailable()) {
      return this.getFallbackAnalysis();
    }

    const openai = getOpenAIClient()!;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an AI expert in urban infrastructure and community issue identification. Analyze the provided image and identify community issues. Respond ONLY with valid JSON (no markdown, no code blocks).

Response format:
{
  "category": "one of: pothole, garbage, water_leakage, broken_streetlight, sewage_problem, road_damage, illegal_dumping, traffic_signal_failure, fallen_tree, public_property_damage, other",
  "severity": "one of: LOW, MEDIUM, HIGH, CRITICAL",
  "priority": "one of: LOW, MEDIUM, HIGH, URGENT",
  "title": "A concise, descriptive title (max 100 chars)",
  "description": "A detailed description of the issue, its impact, and urgency (2-4 sentences)",
  "tags": ["array", "of", "relevant", "tags"],
  "estimatedCost": number_in_INR,
  "estimatedTime": "estimated repair time like '2-3 days'",
  "confidence": 0.0_to_1.0,
  "suggestedDepartment": "one of: Roads & Infrastructure, Sanitation & Waste, Water & Sewage, Electrical & Lighting, Parks & Environment"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for community infrastructure issues. Identify the type of issue, severity, and provide a detailed assessment.',
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl, detail: 'high' },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.getFallbackAnalysis();
      }

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        category: CATEGORY_MAP[parsed.category] || 'OTHER',
        severity: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(parsed.severity) ? parsed.severity : 'MEDIUM') as Severity,
        priority: (['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(parsed.priority) ? parsed.priority : 'MEDIUM') as Priority,
        title: parsed.title || 'Community Issue Reported',
        description: parsed.description || 'An issue has been reported in the community.',
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        estimatedCost: typeof parsed.estimatedCost === 'number' ? parsed.estimatedCost : 5000,
        estimatedTime: parsed.estimatedTime || '3-5 days',
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.8,
        suggestedDepartment: parsed.suggestedDepartment || 'Roads & Infrastructure',
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return this.getFallbackAnalysis();
    }
  }

  static async detectDuplicates(
    description: string,
    category: ComplaintCategory,
    latitude: number,
    longitude: number,
    nearbyComplaints: Array<{ id: string; title: string; description: string; category: string; latitude: number; longitude: number }>
  ): Promise<DuplicateCheckResult> {
    if (!isAIAvailable() || nearbyComplaints.length === 0) {
      return { isDuplicate: false, confidence: 0 };
    }

    const openai = getOpenAIClient()!;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a duplicate complaint detector. Compare the new complaint with existing nearby complaints and determine if it's a duplicate. Consider location proximity, description similarity, and category match. Respond ONLY with valid JSON:
{
  "isDuplicate": boolean,
  "confidence": 0.0_to_1.0,
  "matchedIndex": number_or_null,
  "reason": "explanation"
}`
          },
          {
            role: 'user',
            content: `New complaint:
Category: ${category}
Description: ${description}
Location: ${latitude}, ${longitude}

Existing nearby complaints:
${nearbyComplaints.map((c, i) => `${i}. [${c.category}] ${c.title}: ${c.description} (at ${c.latitude}, ${c.longitude})`).join('\n')}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return { isDuplicate: false, confidence: 0 };

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        isDuplicate: !!parsed.isDuplicate,
        confidence: parsed.confidence || 0,
        matchedComplaintId: parsed.isDuplicate && parsed.matchedIndex !== null
          ? nearbyComplaints[parsed.matchedIndex]?.id
          : undefined,
        reason: parsed.reason,
      };
    } catch (error) {
      console.error('Duplicate detection error:', error);
      return { isDuplicate: false, confidence: 0 };
    }
  }

  static async chatAssistant(
    messages: Array<{ role: string; content: string }>,
    context?: string
  ): Promise<string> {
    if (!isAIAvailable()) {
      return this.getFallbackChatResponse(messages[messages.length - 1]?.content || '');
    }

    const openai = getOpenAIClient()!;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are Community Hero's AI assistant. You help citizens with:
- How to report community issues (potholes, garbage, water leaks, broken streetlights, etc.)
- Checking complaint status
- Providing government contact information
- Emergency numbers (Police: 100, Fire: 101, Ambulance: 102, Municipal Corp: 1800-XXX-XXXX)
- Answering FAQs about the platform
- Providing tips for effective reporting

Be helpful, concise, and friendly. Support English and Hindi.
${context ? `\nAdditional context: ${context}` : ''}`,
          },
          ...messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'I apologize, I could not process your request. Please try again.';
    } catch (error) {
      console.error('Chat assistant error:', error);
      return 'I apologize, I am currently experiencing technical difficulties. Please try again later.';
    }
  }

  static async generatePredictiveInsights(
    historicalData: Array<{ category: string; area: string; count: number; month: string }>
  ): Promise<PredictiveInsight[]> {
    if (!isAIAvailable()) {
      return this.getFallbackPredictions();
    }

    const openai = getOpenAIClient()!;

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an urban infrastructure analytics expert. Analyze historical complaint data and generate predictions. Respond ONLY with a JSON array:
[{
  "area": "area name",
  "category": "issue category",
  "probability": 0.0_to_1.0,
  "reasoning": "why this prediction",
  "preventiveMeasure": "suggested action"
}]`
          },
          {
            role: 'user',
            content: `Analyze this historical data and predict future issues:\n${JSON.stringify(historicalData, null, 2)}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return this.getFallbackPredictions();

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Predictive analytics error:', error);
      return this.getFallbackPredictions();
    }
  }

  static getDepartmentForCategory(category: ComplaintCategory): string {
    return DEPARTMENT_MAP[category] || 'Roads & Infrastructure';
  }

  private static getFallbackAnalysis(): AIAnalysisResult {
    return {
      category: 'OTHER',
      severity: 'MEDIUM',
      priority: 'MEDIUM',
      title: 'Community Issue Reported',
      description: 'A community issue has been reported. Please review the attached image and provide additional details to help us categorize and address this issue promptly.',
      tags: ['community-issue', 'needs-review'],
      estimatedCost: 5000,
      estimatedTime: '3-5 days',
      confidence: 0.5,
      suggestedDepartment: 'Roads & Infrastructure',
    };
  }

  private static getFallbackChatResponse(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('report') || lower.includes('complaint')) {
      return '📝 To report an issue:\n1. Click "Report Issue" on your dashboard\n2. Upload a photo of the problem\n3. Our AI will automatically categorize it\n4. Confirm the details and submit\n\nYour report will be sent to the relevant department immediately!';
    }
    if (lower.includes('status') || lower.includes('track')) {
      return '📊 To check your complaint status:\n1. Go to "My Complaints" in your dashboard\n2. Click on any complaint to see its current status\n3. You\'ll receive notifications when the status changes';
    }
    if (lower.includes('emergency') || lower.includes('urgent')) {
      return '🚨 Emergency Numbers:\n• Police: 100\n• Fire: 101\n• Ambulance: 102\n• Municipal Corporation: 1800-XXX-XXXX\n• Disaster Management: 108\n\nFor life-threatening emergencies, please call these numbers directly.';
    }
    if (lower.includes('contact') || lower.includes('government')) {
      return '🏛️ Government Contacts:\n• Municipal Corporation: 1800-XXX-XXXX\n• Water Department: (022) XXXX-XXXX\n• Electricity Board: (022) XXXX-XXXX\n• Roads Department: (022) XXXX-XXXX';
    }
    return '👋 Hello! I\'m Community Hero\'s AI assistant. I can help you with:\n• Reporting community issues\n• Tracking complaint status\n• Emergency contacts\n• Platform FAQs\n\nWhat would you like to know?';
  }

  private static getFallbackPredictions(): PredictiveInsight[] {
    return [
      {
        area: 'Ward A - Main Roads',
        category: 'POTHOLE',
        probability: 0.85,
        reasoning: 'Historical data shows increased pothole formation during monsoon season in high-traffic areas.',
        preventiveMeasure: 'Schedule pre-monsoon road resurfacing and drainage improvement.',
      },
      {
        area: 'Ward B - Residential Areas',
        category: 'GARBAGE',
        probability: 0.78,
        reasoning: 'Waste accumulation trends indicate increased collection needs in growing residential zones.',
        preventiveMeasure: 'Increase collection frequency and add new waste bins in identified hotspots.',
      },
      {
        area: 'Ward C - Old Infrastructure',
        category: 'WATER_LEAKAGE',
        probability: 0.72,
        reasoning: 'Aging water pipeline infrastructure in older wards shows patterns of recurring leakage.',
        preventiveMeasure: 'Conduct pipeline inspection and schedule phased replacement of old pipes.',
      },
    ];
  }
}

export default AIService;

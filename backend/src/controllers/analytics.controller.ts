import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import AnalyticsService from '../services/analytics.service.js';
import AIService from '../services/ai.service.js';

export class AnalyticsController {
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const stats = await AnalyticsService.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCategoryDistribution(req: AuthRequest, res: Response) {
    try {
      const data = await AnalyticsService.getCategoryDistribution();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getStatusDistribution(req: AuthRequest, res: Response) {
    try {
      const data = await AnalyticsService.getStatusDistribution();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTrends(req: AuthRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await AnalyticsService.getTrendData(days);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getDepartmentPerformance(req: AuthRequest, res: Response) {
    try {
      const data = await AnalyticsService.getDepartmentPerformance();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAreaData(req: AuthRequest, res: Response) {
    try {
      const data = await AnalyticsService.getAreaWiseData();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMonthlyReport(req: AuthRequest, res: Response) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const data = await AnalyticsService.getMonthlyReport(year, month);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPredictions(req: AuthRequest, res: Response) {
    try {
      // Get historical data for predictions
      const historicalData = await AnalyticsService.getCategoryDistribution();
      const areaData = await AnalyticsService.getAreaWiseData();

      const formatted = historicalData.map((d) => ({
        category: d.label,
        area: areaData[0]?.ward || 'General',
        count: d.count,
        month: new Date().toISOString().substring(0, 7),
      }));

      const predictions = await AIService.generatePredictiveInsights(formatted);
      res.json(predictions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTopAreas(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await AnalyticsService.getMostActiveAreas(limit);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTopContributors(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await AnalyticsService.getTopContributors(limit);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default AnalyticsController;

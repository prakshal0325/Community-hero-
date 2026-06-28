'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { complaintsAPI } from '@/lib/api';
import { categoryIcons, categoryLabels } from '@/lib/utils';
import {
  Camera, Upload, MapPin, Loader2, Sparkles, CheckCircle, X, Image as ImageIcon,
  AlertTriangle, Clock, DollarSign, Tag, ArrowLeft, Send
} from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  'POTHOLE', 'GARBAGE', 'WATER_LEAKAGE', 'BROKEN_STREETLIGHT', 'SEWAGE_PROBLEM',
  'ROAD_DAMAGE', 'ILLEGAL_DUMPING', 'TRAFFIC_SIGNAL_FAILURE', 'FALLEN_TREE', 'PUBLIC_PROPERTY_DAMAGE', 'OTHER'
];

export default function ReportIssuePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    }>
      <ReportIssueForm />
    </Suspense>
  );
}

function ReportIssueForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review' | 'submitting'>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'OTHER', severity: 'MEDIUM', priority: 'MEDIUM',
    latitude: 0, longitude: 0, address: '', ward: '', landmark: '',
    estimatedCost: 0, estimatedTime: '', aiConfidence: 0, aiTags: [] as string[],
  });
  const [locationLoading, setLocationLoading] = useState(false);

  // Pre-populate category from query parameter if present
  useEffect(() => {
    if (categoryParam && categories.includes(categoryParam)) {
      setForm(prev => ({ ...prev, category: categoryParam }));
    }
  }, [categoryParam]);

  // Get GPS location
  const getLocation = useCallback(() => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setForm(prev => ({ ...prev, latitude, longitude }));
          // Reverse geocode using Nominatim
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            setForm(prev => ({
              ...prev,
              address: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              ward: data.address?.suburb || data.address?.neighbourhood || '',
            }));
          } catch {
            setForm(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          }
          setLocationLoading(false);
        },
        () => {
          toast.error('Could not get your location. Please enter it manually.');
          setLocationLoading(false);
          // Default to Mumbai coordinates
          setForm(prev => ({ ...prev, latitude: 19.076, longitude: 72.8777, address: 'Mumbai, Maharashtra' }));
        }
      );
    }
  }, []);

  // Handle file selection
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5);
    setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5));
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // AI Analysis
  const analyzeWithAI = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    setStep('analyzing');
    getLocation();

    try {
      const formData = new FormData();
      formData.append('image', selectedFiles[0]);
      const { data } = await complaintsAPI.analyzeImage(formData);
      const analysis = data.analysis;
      setAiAnalysis(analysis);
      setForm(prev => ({
        ...prev,
        title: analysis.title || prev.title,
        description: analysis.description || prev.description,
        category: analysis.category || prev.category,
        severity: analysis.severity || prev.severity,
        priority: analysis.priority || prev.priority,
        estimatedCost: analysis.estimatedCost || 0,
        estimatedTime: analysis.estimatedTime || '',
        aiConfidence: analysis.confidence || 0,
        aiTags: analysis.tags || [],
      }));
      setStep('review');
    } catch (error) {
      // Fallback - continue without AI
      toast.info('AI analysis unavailable. Please fill in the details manually.');
      setStep('review');
    }
  };

  // Skip AI
  const skipAI = () => {
    getLocation();
    setStep('review');
  };

  // Submit
  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.address) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep('submitting');
    try {
      const { data } = await complaintsAPI.create({
        ...form,
        latitude: form.latitude || 19.076,
        longitude: form.longitude || 72.8777,
        address: form.address || 'Location not specified',
      });

      // Upload images
      if (selectedFiles.length > 0 && data.complaint?.id) {
        const imgFormData = new FormData();
        selectedFiles.forEach(f => imgFormData.append('images', f));
        imgFormData.append('type', 'REPORT');
        await complaintsAPI.uploadImages(data.complaint.id, imgFormData).catch(() => {});
      }

      toast.success('Report submitted successfully! 🎉');
      router.push('/dashboard/citizen/complaints');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit report');
      setStep('review');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Report an Issue</h1>
          <p className="text-muted-foreground text-sm">Upload a photo and let AI do the rest</p>
        </div>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="glass rounded-2xl p-8 space-y-6">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-violet-500/50 hover:bg-accent/30 transition-all group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8 text-violet-500" />
            </div>
            <p className="text-lg font-semibold mb-1">Upload Photo or Video</p>
            <p className="text-sm text-muted-foreground mb-4">Drag and drop, or click to browse</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF, MP4 • Max 10MB • Up to 5 files</p>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {previews.map((preview, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={analyzeWithAI} disabled={selectedFiles.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50">
              <Sparkles className="w-5 h-5" /> Analyze with AI
            </button>
            <button onClick={skipAI}
              className="flex-1 flex items-center justify-center gap-2 py-3 glass rounded-xl font-medium hover:bg-accent/50 transition-colors">
              Skip AI → Manual Entry
            </button>
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="glass rounded-2xl p-12 text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-4 border-violet-500/50 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">AI Analyzing Your Image</h2>
            <p className="text-muted-foreground">Detecting issue type, severity, and generating details...</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>This usually takes 5-10 seconds</span>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* AI Confidence Banner */}
          {aiAnalysis && (
            <div className="glass rounded-2xl p-4 flex items-center gap-4 border border-violet-500/20">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">AI Analysis Complete</p>
                <p className="text-xs text-muted-foreground">Confidence: {Math.round((aiAnalysis.confidence || 0) * 100)}% — Review and adjust below</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          )}

          {/* Image Previews */}
          {previews.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {previews.map((p, i) => (
                <img key={i} src={p} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />
              ))}
            </div>
          )}

          {/* Form */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the issue, its impact, and urgency..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select value={form.category} onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm">
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{categoryIcons[cat]} {categoryLabels[cat]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Severity</label>
                <select value={form.severity} onChange={(e) => setForm(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location *
              </label>
              <div className="flex gap-2">
                <input type="text" value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Address or area description"
                  className="flex-1 px-4 py-3 rounded-xl bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                <button onClick={getLocation} disabled={locationLoading}
                  className="px-4 py-3 rounded-xl bg-violet-600 text-white hover:opacity-90 transition-all disabled:opacity-50 shrink-0">
                  {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                </button>
              </div>
              {form.latitude !== 0 && (
                <p className="text-xs text-muted-foreground mt-1">📍 {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ward</label>
                <input type="text" value={form.ward} onChange={(e) => setForm(prev => ({ ...prev, ward: e.target.value }))}
                  placeholder="Ward / Zone" className="w-full px-4 py-3 rounded-xl bg-background border border-input outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Landmark</label>
                <input type="text" value={form.landmark} onChange={(e) => setForm(prev => ({ ...prev, landmark: e.target.value }))}
                  placeholder="Nearby landmark" className="w-full px-4 py-3 rounded-xl bg-background border border-input outline-none text-sm" />
              </div>
            </div>

            {/* AI Estimates */}
            {(form.estimatedCost > 0 || form.estimatedTime) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-accent/30 flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Cost</p>
                    <p className="font-medium text-sm">₹{form.estimatedCost.toLocaleString()}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-accent/30 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Time</p>
                    <p className="font-medium text-sm">{form.estimatedTime || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {form.aiTags.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> AI Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {form.aiTags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all glow-sm">
              <Send className="w-5 h-5" /> Submit Report
            </button>
          </div>
        </div>
      )}

      {/* Step: Submitting */}
      {step === 'submitting' && (
        <div className="glass rounded-2xl p-12 text-center space-y-4">
          <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto" />
          <h2 className="text-xl font-bold">Submitting Your Report</h2>
          <p className="text-muted-foreground">Routing to the right department...</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import {
  Settings, Save, Loader2, Shield, Bell, Zap, Clock, RefreshCw, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultSettings = {
    rateLimitWindowMs: 900000,
    rateLimitMaxRequests: 100,
    pointsPerReport: 50,
    pointsPerVerification: 10,
    pointsPerComment: 5,
    xpPerReport: 100,
    xpPerVerification: 20,
    xpPerLevel: 500,
    verificationThreshold: 3,
    autoAssignComplaints: true,
    enableEmailNotifications: true,
    enableAIAnalysis: true,
    maxImageUploadSize: 10,
    maxImagesPerComplaint: 5,
    nearbyRadiusKm: 2,
  };

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const { data } = await adminAPI.getSettings();
      setSettings({ ...defaultSettings, ...(data || {}) });
    } catch {
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSettings(settings);
      toast.success('Settings saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-48 animate-shimmer" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-violet-500" /> System Settings</h1>
          <p className="text-muted-foreground text-sm">Configure platform behavior</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all glow-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
        </button>
      </div>

      {/* Rate Limiting */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-violet-500" /> Rate Limiting</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Window (ms)</label>
            <input type="number" value={settings.rateLimitWindowMs} onChange={(e) => updateSetting('rateLimitWindowMs', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
            <p className="text-xs text-muted-foreground mt-1">{Math.round(settings.rateLimitWindowMs / 60000)} minutes</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Requests</label>
            <input type="number" value={settings.rateLimitMaxRequests} onChange={(e) => updateSetting('rateLimitMaxRequests', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
          </div>
        </div>
      </div>

      {/* Gamification */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-violet-500" /> Gamification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Points per Report</label>
            <input type="number" value={settings.pointsPerReport} onChange={(e) => updateSetting('pointsPerReport', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Points per Verification</label>
            <input type="number" value={settings.pointsPerVerification} onChange={(e) => updateSetting('pointsPerVerification', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Points per Comment</label>
            <input type="number" value={settings.pointsPerComment} onChange={(e) => updateSetting('pointsPerComment', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">XP per Report</label>
            <input type="number" value={settings.xpPerReport} onChange={(e) => updateSetting('xpPerReport', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">XP per Verification</label>
            <input type="number" value={settings.xpPerVerification} onChange={(e) => updateSetting('xpPerVerification', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">XP per Level</label>
            <input type="number" value={settings.xpPerLevel} onChange={(e) => updateSetting('xpPerLevel', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-violet-500" /> Features</h3>
        <div className="space-y-4">
          {[
            { key: 'autoAssignComplaints', label: 'Auto-assign complaints to departments', desc: 'Automatically route complaints based on category' },
            { key: 'enableEmailNotifications', label: 'Email notifications', desc: 'Send email for status changes and updates' },
            { key: 'enableAIAnalysis', label: 'AI image analysis', desc: 'Use OpenAI to analyze complaint images' },
          ].map(toggle => (
            <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl bg-accent/30">
              <div>
                <p className="text-sm font-medium">{toggle.label}</p>
                <p className="text-xs text-muted-foreground">{toggle.desc}</p>
              </div>
              <button
                onClick={() => updateSetting(toggle.key, !settings[toggle.key])}
                className={`w-12 h-6 rounded-full transition-all relative ${settings[toggle.key] ? 'bg-violet-600' : 'bg-muted'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings[toggle.key] ? 'left-[26px]' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Limits */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-violet-500" /> Limits & Thresholds</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Verification Threshold</label>
            <input type="number" value={settings.verificationThreshold} onChange={(e) => updateSetting('verificationThreshold', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
            <p className="text-xs text-muted-foreground mt-1">Votes needed to verify</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Image Size (MB)</label>
            <input type="number" value={settings.maxImageUploadSize} onChange={(e) => updateSetting('maxImageUploadSize', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nearby Radius (km)</label>
            <input type="number" value={settings.nearbyRadiusKm} onChange={(e) => updateSetting('nearbyRadiusKm', parseFloat(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

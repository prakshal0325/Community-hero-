'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usersAPI } from '@/lib/api';
import { formatDate, calculateXPProgress, formatNumber } from '@/lib/utils';
import {
  User, Shield, Mail, Phone, MapPin, Calendar, Star, Zap, Flame, Award,
  Edit3, Save, X, Camera, Trophy, Target, CheckCircle, Lock, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', phone: '', bio: '', address: '', ward: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const [profileRes, badgesRes, achievementsRes, activityRes] = await Promise.allSettled([
        usersAPI.getProfile(),
        usersAPI.getBadges(),
        usersAPI.getAchievements(),
        usersAPI.getActivity(),
      ]);

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value.data;
        setProfile(p);
        setEditForm({
          name: p.name || '',
          phone: p.phone || '',
          bio: p.bio || '',
          address: p.address || '',
          ward: p.ward || '',
        });
      }
      if (badgesRes.status === 'fulfilled') setBadges(badgesRes.value.data.earned || []);
      if (achievementsRes.status === 'fulfilled') setAchievements(achievementsRes.value.data || []);
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value.data || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersAPI.updateProfile(editForm);
      await refreshUser();
      await loadProfile();
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const xpProgress = profile ? calculateXPProgress(profile.xp || 0, profile.level || 1) : 0;
  const xpPerLevel = 500;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass rounded-2xl h-48 animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="glass rounded-2xl h-28 animate-shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || '??'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-[10px] font-bold border-2 border-background">
              {profile?.level || 1}
            </div>
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3 w-full max-w-md">
                <input type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full Name" className="w-full px-4 py-2 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
                <input type="tel" value={editForm.phone} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone" className="w-full px-4 py-2 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
                <textarea value={editForm.bio} onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Bio" rows={2} className="w-full px-4 py-2 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={editForm.address} onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Address" className="px-4 py-2 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
                  <input type="text" value={editForm.ward} onChange={(e) => setEditForm(prev => ({ ...prev, ward: e.target.value }))}
                    placeholder="Ward" className="px-4 py-2 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                  <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-medium hover:bg-accent/50">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">{profile?.name}</h1>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-500 capitalize">
                    {profile?.role?.toLowerCase()}
                  </span>
                  {profile?.isVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                {profile?.bio && <p className="text-sm text-muted-foreground mb-2">{profile.bio}</p>}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {profile?.email}</span>
                  {profile?.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {profile.phone}</span>}
                  {profile?.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.address}</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {formatDate(profile?.createdAt)}</span>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <button onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm font-medium hover:bg-accent/50 transition-all shrink-0">
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Points', value: formatNumber(profile?.points || 0), icon: Star, color: 'from-amber-500 to-orange-600' },
          { label: 'Level', value: profile?.level || 1, icon: Zap, color: 'from-violet-500 to-purple-600' },
          { label: 'Streak', value: `${profile?.streak || 0} days`, icon: Flame, color: 'from-red-500 to-pink-600' },
          { label: 'Badges', value: badges.length, icon: Award, color: 'from-blue-500 to-cyan-600' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5 hover:glow-sm transition-all group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* XP Progress */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {profile?.level || 1}
            </div>
            <div>
              <p className="font-semibold">Level {profile?.level || 1}</p>
              <p className="text-sm text-muted-foreground">{profile?.xp || 0} / {(profile?.level || 1) * xpPerLevel} XP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Next Level</p>
            <p className="text-xs text-muted-foreground">{Math.max(0, (profile?.level || 1) * xpPerLevel - (profile?.xp || 0))} XP needed</p>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-1000"
            style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Badges */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-500" /> Badges
          </h2>
          {badges.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No badges earned yet. Keep contributing!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {badges.map((ub: any, i: number) => {
                const badge = ub.badge || ub;
                return (
                  <div key={i} className="text-center p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-all group">
                    <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">{badge.icon || '🏅'}</div>
                    <p className="text-xs font-medium truncate">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground">{badge.description?.substring(0, 30)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-500" /> Achievements
          </h2>
          {achievements.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Complete challenges to unlock achievements!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {achievements.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30">
                  <span className="text-2xl">{a.icon || '🎯'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-violet-500 font-mono">+{a.reward} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {activity.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No recent activity to show</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.slice(0, 10).map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.action || a.title || 'Activity'}</p>
                  {a.createdAt && <p className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

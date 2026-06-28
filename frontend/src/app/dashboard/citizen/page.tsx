'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { complaintsAPI, analyticsAPI, usersAPI } from '@/lib/api';
import { formatRelativeTime, statusColors, categoryIcons, categoryLabels, getStatusLabel, calculateXPProgress } from '@/lib/utils';
import {
  PlusCircle, FileText, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Award, Zap, Flame, Star, ArrowRight, MapPin, BarChart3, Trophy
} from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  change?: string;
}

export default function CitizenDashboard() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [complaintsRes, challengesRes] = await Promise.allSettled([
        complaintsAPI.getMy({ limit: 5 }),
        usersAPI.getChallenges(),
      ]);

      if (complaintsRes.status === 'fulfilled') {
        setMyComplaints(complaintsRes.value.data.complaints || []);
      }
      if (challengesRes.status === 'fulfilled') {
        setChallenges(challengesRes.value.data || []);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const xpProgress = user ? calculateXPProgress(user.xp, user.level) : 0;

  const statCards: StatCard[] = [
    { label: 'My Reports', value: myComplaints.length, icon: FileText, color: 'from-violet-500 to-purple-600' },
    { label: 'Points', value: user?.points || 0, icon: Star, color: 'from-amber-500 to-orange-600' },
    { label: 'Level', value: user?.level || 1, icon: Zap, color: 'from-blue-500 to-cyan-600' },
    { label: 'Streak', value: `${user?.streak || 0} days`, icon: Flame, color: 'from-red-500 to-pink-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening in your community today.</p>
        </div>
        <Link href="/dashboard/citizen/report"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all glow-sm">
          <PlusCircle className="w-5 h-5" />
          Report Issue
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5 hover:glow-sm transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
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
              {user?.level}
            </div>
            <div>
              <p className="font-semibold">Level {user?.level}</p>
              <p className="text-sm text-muted-foreground">{user?.xp} / {(user?.level || 1) * 500} XP</p>
            </div>
          </div>
          <Link href="/dashboard/citizen/profile" className="text-sm text-violet-500 hover:text-violet-400 flex items-center gap-1">
            View Profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full transition-all duration-1000"
            style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Reports</h2>
            <Link href="/dashboard/citizen/complaints" className="text-sm text-violet-500 hover:text-violet-400 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted/50 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : myComplaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No reports yet. Start by reporting an issue!</p>
              <Link href="/dashboard/citizen/report"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:opacity-90">
                <PlusCircle className="w-4 h-4" /> Report Issue
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myComplaints.map((complaint: any) => (
                <Link key={complaint.id} href={`/dashboard/citizen/complaints/${complaint.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent/50 transition-colors group">
                  <span className="text-2xl">{categoryIcons[complaint.category] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover:text-violet-500 transition-colors">{complaint.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{complaint.address}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[complaint.status]}`}>
                      {getStatusLabel(complaint.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(complaint.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active Challenges */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Challenges</h2>
            <Award className="w-5 h-5 text-violet-500" />
          </div>

          {challenges.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active challenges</p>
            </div>
          ) : (
            <div className="space-y-4">
              {challenges.slice(0, 4).map((challenge: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-accent/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{challenge.name}</p>
                    <span className="text-xs text-violet-500 font-mono">+{challenge.reward}pts</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{challenge.description}</p>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full"
                      style={{ width: `${challenge.percentage || 0}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {challenge.userProgress || 0} / {challenge.target}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/dashboard/citizen/report', icon: PlusCircle, label: 'Report Issue', color: 'from-violet-500 to-purple-600' },
          { href: '/dashboard/citizen/map', icon: MapPin, label: 'View Map', color: 'from-blue-500 to-cyan-600' },
          { href: '/dashboard/citizen/leaderboard', icon: Trophy, label: 'Leaderboard', color: 'from-amber-500 to-orange-600' },
          { href: '/dashboard/citizen/profile', icon: BarChart3, label: 'My Stats', color: 'from-emerald-500 to-teal-600' },
        ].map((action, i) => (
          <Link key={i} href={action.href}
            className="glass rounded-2xl p-5 text-center hover:glow-sm transition-all group">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium">{action.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

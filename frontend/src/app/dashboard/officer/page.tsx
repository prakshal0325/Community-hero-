'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { complaintsAPI, analyticsAPI } from '@/lib/api';
import { statusColors, categoryIcons, categoryLabels, getStatusLabel, formatRelativeTime, priorityColors } from '@/lib/utils';
import {
  FileText, Clock, CheckCircle, AlertTriangle, Users, TrendingUp,
  ArrowRight, MapPin, BarChart3, Shield, Loader2, Eye
} from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingComplaints, setPendingComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, complaintsRes] = await Promise.allSettled([
        analyticsAPI.getDashboard(),
        complaintsAPI.getAll({ status: 'SUBMITTED', limit: 10, sortBy: 'priority', sortOrder: 'desc' }),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (complaintsRes.status === 'fulfilled') {
        setPendingComplaints(complaintsRes.value.data.complaints || complaintsRes.value.data || []);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: 'Pending Review', value: stats?.pendingCount || 0, icon: Clock, color: 'from-yellow-500 to-amber-600', change: 'Needs attention' },
    { label: 'In Progress', value: stats?.inProgressCount || 0, icon: AlertTriangle, color: 'from-orange-500 to-red-600', change: 'Active' },
    { label: 'Resolved Today', value: stats?.resolvedTodayCount || 0, icon: CheckCircle, color: 'from-green-500 to-emerald-600', change: 'Great work!' },
    { label: 'Total Complaints', value: stats?.totalComplaints || 0, icon: FileText, color: 'from-violet-500 to-purple-600', change: 'All time' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Officer Dashboard <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-muted-foreground mt-1">Manage and resolve community complaints</p>
        </div>
        <Link href="/dashboard/officer/complaints"
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all glow-sm">
          <Eye className="w-5 h-5" /> View All Complaints
        </Link>
      </div>

      {/* Stats */}
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
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Priority Queue */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Priority Queue — Pending Review</h2>
          <Link href="/dashboard/officer/complaints" className="text-sm text-violet-500 hover:text-violet-400 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-shimmer" />)}
          </div>
        ) : pendingComplaints.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">All caught up! No pending complaints.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingComplaints.map((c: any) => (
              <Link key={c.id} href={`/dashboard/citizen/complaints/${c.id}`}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent/50 transition-colors group">
                <span className="text-2xl">{categoryIcons[c.category] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-violet-500 transition-colors">{c.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {c.address?.split(',').slice(0, 2).join(',') || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {formatRelativeTime(c.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" /> {c.verificationCount || 0} verified
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityColors[c.priority]}`}>
                    {c.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[c.status]}`}>
                    {getStatusLabel(c.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: '/dashboard/officer/complaints', icon: FileText, label: 'All Complaints', color: 'from-violet-500 to-purple-600' },
          { href: '/dashboard/officer/map', icon: MapPin, label: 'Map View', color: 'from-blue-500 to-cyan-600' },
          { href: '/dashboard/officer/analytics', icon: BarChart3, label: 'Analytics', color: 'from-emerald-500 to-teal-600' },
          { href: '/dashboard/officer/complaints?status=IN_PROGRESS', icon: TrendingUp, label: 'In Progress', color: 'from-orange-500 to-amber-600' },
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

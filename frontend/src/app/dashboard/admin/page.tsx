'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminAPI, analyticsAPI } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import {
  Users, FileText, Building2, BarChart3, Award, ScrollText, Settings,
  TrendingUp, CheckCircle, Clock, AlertTriangle, ArrowRight, Shield
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsRes, dashRes] = await Promise.allSettled([
        adminAPI.getStats(),
        analyticsAPI.getDashboard(),
      ]);
      const combined: any = {};
      if (statsRes.status === 'fulfilled') Object.assign(combined, statsRes.value.data);
      if (dashRes.status === 'fulfilled') Object.assign(combined, dashRes.value.data);
      setStats(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'from-violet-500 to-purple-600', change: '+12% this month' },
    { label: 'Total Complaints', value: stats?.totalComplaints || 0, icon: FileText, color: 'from-blue-500 to-cyan-600', change: 'All time' },
    { label: 'Resolution Rate', value: `${stats?.resolutionRate || 0}%`, icon: TrendingUp, color: 'from-green-500 to-emerald-600', change: 'Target: 90%' },
    { label: 'Active Officers', value: stats?.activeOfficers || stats?.officerCount || 0, icon: Shield, color: 'from-orange-500 to-amber-600', change: 'Currently active' },
    { label: 'Pending Review', value: stats?.pendingCount || 0, icon: Clock, color: 'from-yellow-500 to-amber-600', change: 'Needs attention' },
    { label: 'Departments', value: stats?.departmentCount || 0, icon: Building2, color: 'from-pink-500 to-rose-600', change: 'Active departments' },
  ];

  const adminLinks = [
    { href: '/dashboard/admin/users', icon: Users, label: 'User Management', desc: 'Manage roles, verify, ban users', color: 'from-violet-500 to-purple-600' },
    { href: '/dashboard/admin/departments', icon: Building2, label: 'Departments', desc: 'Create and manage departments', color: 'from-blue-500 to-cyan-600' },
    { href: '/dashboard/admin/rewards', icon: Award, label: 'Rewards & Badges', desc: 'Configure gamification', color: 'from-amber-500 to-orange-600' },
    { href: '/dashboard/admin/analytics', icon: BarChart3, label: 'Analytics', desc: 'System-wide insights', color: 'from-emerald-500 to-teal-600' },
    { href: '/dashboard/admin/logs', icon: ScrollText, label: 'Audit Logs', desc: 'View system activity', color: 'from-pink-500 to-rose-600' },
    { href: '/dashboard/admin/settings', icon: Settings, label: 'Settings', desc: 'System configuration', color: 'from-gray-500 to-gray-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className={`glass rounded-2xl p-5 hover:glow-sm transition-all group ${isLoading ? 'animate-shimmer' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{isLoading ? '—' : stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminLinks.map((link, i) => (
            <Link key={i} href={link.href}
              className="glass rounded-2xl p-5 hover:glow-sm transition-all group flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <link.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold group-hover:text-violet-500 transition-colors">{link.label}</p>
                <p className="text-sm text-muted-foreground">{link.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

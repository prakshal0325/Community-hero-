'use client';

import { useState, useEffect } from 'react';
import { analyticsAPI } from '@/lib/api';
import { formatNumber, getStatusLabel, categoryLabels } from '@/lib/utils';
import {
  BarChart3, TrendingUp, PieChart as PieChartIcon, Calendar, Loader2, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16'];

export default function OfficerAnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [dashRes, catRes, statusRes, trendRes, deptRes] = await Promise.allSettled([
        analyticsAPI.getDashboard(),
        analyticsAPI.getCategories(),
        analyticsAPI.getStatuses(),
        analyticsAPI.getTrends(30),
        analyticsAPI.getDepartments(),
      ]);

      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data || []);
      if (statusRes.status === 'fulfilled') setStatuses(statusRes.value.data || []);
      if (trendRes.status === 'fulfilled') setTrends(trendRes.value.data || []);
      if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="glass rounded-2xl h-28 animate-shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="glass rounded-2xl h-80 animate-shimmer" />)}
        </div>
      </div>
    );
  }

  const statsCards = [
    { label: 'Total Complaints', value: dashboard?.totalComplaints || 0, icon: BarChart3, color: 'from-violet-500 to-purple-600' },
    { label: 'Resolution Rate', value: `${dashboard?.resolutionRate || 0}%`, icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
    { label: 'Avg. Resolution Time', value: `${dashboard?.avgResolutionDays || 0}d`, icon: Calendar, color: 'from-blue-500 to-cyan-600' },
    { label: 'Active Officers', value: dashboard?.activeOfficers || 0, icon: PieChartIcon, color: 'from-orange-500 to-amber-600' },
  ];

  const formattedCategories = categories.map((c: any) => ({
    name: categoryLabels[c.category] || c.category || c.name,
    value: c._count?.id || c.count || c.value || 0,
  }));

  const formattedStatuses = statuses.map((s: any) => ({
    name: getStatusLabel(s.status || s.name || ''),
    value: s._count?.id || s.count || s.value || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Performance metrics and insights</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5 hover:glow-sm transition-all group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Complaint Trends (30 days)</h3>
          <div className="h-72">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No trend data available</div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Category Distribution</h3>
          <div className="h-72">
            {formattedCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={formattedCategories} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {formattedCategories.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No category data</div>
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Status Breakdown</h3>
          <div className="h-72">
            {formattedStatuses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedStatuses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No status data</div>
            )}
          </div>
        </div>

        {/* Department Performance */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Department Performance</h3>
          {departments.length > 0 ? (
            <div className="space-y-3">
              {departments.map((dept: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{dept.name || dept.department || 'Unknown'}</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div className="h-full rounded-full" style={{ width: `${dept.resolutionRate || 0}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{dept.total || dept.count || 0}</p>
                    <p className="text-[10px] text-muted-foreground">{dept.resolutionRate || 0}% resolved</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No department data</div>
          )}
        </div>
      </div>
    </div>
  );
}

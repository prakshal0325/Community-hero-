'use client';

import { useState, useEffect } from 'react';
import { analyticsAPI } from '@/lib/api';
import { formatNumber, categoryLabels, getStatusLabel } from '@/lib/utils';
import {
  BarChart3, TrendingUp, Users, MapPin, Calendar, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16'];

export default function AdminAnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [topAreas, setTopAreas] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const [dashRes, catRes, trendRes, areasRes, contribRes] = await Promise.allSettled([
        analyticsAPI.getDashboard(),
        analyticsAPI.getCategories(),
        analyticsAPI.getTrends(60),
        analyticsAPI.getTopAreas(),
        analyticsAPI.getTopContributors(),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data || []);
      if (trendRes.status === 'fulfilled') setTrends(trendRes.value.data || []);
      if (areasRes.status === 'fulfilled') setTopAreas(areasRes.value.data || []);
      if (contribRes.status === 'fulfilled') setTopContributors(contribRes.value.data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="glass rounded-2xl h-28 animate-shimmer" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Complaints', value: formatNumber(dashboard?.totalComplaints || 0), icon: BarChart3, color: 'from-violet-500 to-purple-600' },
    { label: 'Resolution Rate', value: `${dashboard?.resolutionRate || 0}%`, icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
    { label: 'Total Users', value: formatNumber(dashboard?.totalUsers || 0), icon: Users, color: 'from-blue-500 to-cyan-600' },
    { label: 'Avg Resolution', value: `${dashboard?.avgResolutionDays || 0}d`, icon: Calendar, color: 'from-orange-500 to-amber-600' },
  ];

  const formattedCategories = categories.map((c: any) => ({
    name: categoryLabels[c.category] || c.category || c.name || 'Other',
    value: c._count?.id || c.count || c.value || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">System Analytics</h1>
        <p className="text-muted-foreground text-sm">Platform-wide performance insights</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="glass rounded-2xl p-5 hover:glow-sm transition-all group">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Complaint Trends (60 days)</h3>
          <div className="h-72">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#adminGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No trend data</div>}
          </div>
        </div>

        {/* Categories */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Category Distribution</h3>
          <div className="h-72">
            {formattedCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={formattedCategories} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value">
                    {formattedCategories.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>}
          </div>
        </div>

        {/* Top Areas */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-violet-500" /> Top Problem Areas</h3>
          {topAreas.length > 0 ? (
            <div className="space-y-3">
              {topAreas.slice(0, 8).map((area: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-muted-foreground w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{area.ward || area.area || area.name || 'Unknown'}</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(area.count / (topAreas[0]?.count || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-bold shrink-0">{area.count || 0}</span>
                </div>
              ))}
            </div>
          ) : <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No area data</div>}
        </div>

        {/* Top Contributors */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-violet-500" /> Top Contributors</h3>
          {topContributors.length > 0 ? (
            <div className="space-y-3">
              {topContributors.slice(0, 8).map((user: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-mono font-bold text-muted-foreground w-6">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0">{user.points || user.count || 0} pts</span>
                </div>
              ))}
            </div>
          ) : <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No contributor data</div>}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { complaintsAPI } from '@/lib/api';
import { statusColors, categoryIcons, categoryLabels, getStatusLabel, formatRelativeTime, priorityColors, severityColors } from '@/lib/utils';
import {
  FileText, Search, SlidersHorizontal, ChevronLeft, ChevronRight, MapPin, Clock,
  X, PlusCircle, CheckCircle, AlertTriangle, User, Building2, Filter, ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  'ALL', 'POTHOLE', 'GARBAGE', 'WATER_LEAKAGE', 'BROKEN_STREETLIGHT', 'SEWAGE_PROBLEM',
  'ROAD_DAMAGE', 'ILLEGAL_DUMPING', 'TRAFFIC_SIGNAL_FAILURE', 'FALLEN_TREE', 'PUBLIC_PROPERTY_DAMAGE', 'OTHER'
];

const statuses = [
  'ALL', 'SUBMITTED', 'PENDING_REVIEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS',
  'WORK_STARTED', 'AWAITING_VERIFICATION', 'RESOLVED', 'CLOSED', 'REJECTED'
];

const priorities = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function OfficerComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const limit = 15;

  useEffect(() => {
    loadComplaints();
  }, [page, categoryFilter, statusFilter, priorityFilter, search, sortBy, sortOrder]);

  const loadComplaints = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit, sortBy, sortOrder };
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (search) params.search = search;

      const { data } = await complaintsAPI.getAll(params);
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    setStatusUpdating(complaintId);
    try {
      await complaintsAPI.updateStatus(complaintId, { status: newStatus });
      toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
      await loadComplaints();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const activeFilters = (categoryFilter !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0) + (priorityFilter !== 'ALL' ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Complaints</h1>
          <p className="text-muted-foreground text-sm">{total} total complaint{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search complaints..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showFilters ? 'bg-violet-600 text-white' : 'glass hover:bg-accent/50'}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
            {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border space-y-4 animate-slide-up">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat} onClick={() => { setCategoryFilter(cat); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${categoryFilter === cat ? 'bg-violet-600 text-white' : 'bg-accent/50 hover:bg-accent'}`}>
                    {cat === 'ALL' ? 'All' : `${categoryIcons[cat]} ${categoryLabels[cat]}`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Status</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-violet-600 text-white' : 'bg-accent/50 hover:bg-accent'}`}>
                    {s === 'ALL' ? 'All' : getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Priority</label>
              <div className="flex flex-wrap gap-2">
                {priorities.map(p => (
                  <button key={p} onClick={() => { setPriorityFilter(p); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${priorityFilter === p ? 'bg-violet-600 text-white' : 'bg-accent/50 hover:bg-accent'}`}>
                    {p === 'ALL' ? 'All' : p}
                  </button>
                ))}
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setCategoryFilter('ALL'); setStatusFilter('ALL'); setPriorityFilter('ALL'); setSearch(''); setPage(1); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400">
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Complaint</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  <button onClick={() => toggleSort('priority')} className="flex items-center gap-1 hover:text-foreground">
                    Priority <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-foreground">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-12 rounded-xl animate-shimmer" /></td></tr>
                ))
              ) : complaints.length === 0 ? (
                <tr><td colSpan={5} className="p-16 text-center text-muted-foreground">No complaints found</td></tr>
              ) : (
                complaints.map((c: any) => (
                  <tr key={c.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="p-4">
                      <Link href={`/dashboard/citizen/complaints/${c.id}`} className="block group">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{categoryIcons[c.category]}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-violet-500 transition-colors">{c.title}</p>
                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" /> {c.address?.split(',').slice(0, 2).join(',')}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[c.priority]}`}>{c.priority}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${statusColors[c.status]}`}>
                        {getStatusLabel(c.status)}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">{formatRelativeTime(c.createdAt)}</td>
                    <td className="p-4">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusUpdate(c.id, e.target.value)}
                        disabled={statusUpdating === c.id}
                        className="px-2 py-1 rounded-lg bg-background border border-input text-xs outline-none cursor-pointer disabled:opacity-50"
                      >
                        {statuses.filter(s => s !== 'ALL').map(s => (
                          <option key={s} value={s}>{getStatusLabel(s)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl glass hover:bg-accent/50 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl glass hover:bg-accent/50 disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

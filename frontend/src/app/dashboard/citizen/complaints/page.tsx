'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { complaintsAPI } from '@/lib/api';
import { statusColors, categoryIcons, categoryLabels, getStatusLabel, formatRelativeTime, priorityColors } from '@/lib/utils';
import {
  FileText, Search, Filter, Grid3X3, List, MapPin, Clock, ChevronLeft, ChevronRight,
  ArrowLeft, PlusCircle, SlidersHorizontal, X, CheckCircle, AlertTriangle
} from 'lucide-react';

const categories = [
  'ALL', 'POTHOLE', 'GARBAGE', 'WATER_LEAKAGE', 'BROKEN_STREETLIGHT', 'SEWAGE_PROBLEM',
  'ROAD_DAMAGE', 'ILLEGAL_DUMPING', 'TRAFFIC_SIGNAL_FAILURE', 'FALLEN_TREE', 'PUBLIC_PROPERTY_DAMAGE', 'OTHER'
];

const statuses = [
  'ALL', 'SUBMITTED', 'PENDING_REVIEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS',
  'WORK_STARTED', 'AWAITING_VERIFICATION', 'RESOLVED', 'CLOSED', 'REJECTED'
];

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 10;

  useEffect(() => {
    loadComplaints();
  }, [page, categoryFilter, statusFilter, search]);

  const loadComplaints = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const { data } = await complaintsAPI.getMy(params);
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeFilters = (categoryFilter !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Complaints</h1>
          <p className="text-muted-foreground text-sm">{total} total report{total !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/citizen/report"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all glow-sm">
          <PlusCircle className="w-4 h-4" /> New Report
        </Link>
      </div>

      {/* Search & Controls */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showFilters ? 'bg-violet-600 text-white' : 'glass hover:bg-accent/50'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilters > 0 && (
                <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">{activeFilters}</span>
              )}
            </button>

            <div className="flex rounded-xl border border-input overflow-hidden">
              <button onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'hover:bg-accent'}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'hover:bg-accent'}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border space-y-4 animate-slide-up">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat} onClick={() => { setCategoryFilter(cat); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${categoryFilter === cat
                      ? 'bg-violet-600 text-white' : 'bg-accent/50 hover:bg-accent text-foreground'}`}>
                    {cat === 'ALL' ? 'All' : `${categoryIcons[cat] || ''} ${categoryLabels[cat] || cat}`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Status</label>
              <div className="flex flex-wrap gap-2">
                {statuses.map(s => (
                  <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s
                      ? 'bg-violet-600 text-white' : 'bg-accent/50 hover:bg-accent text-foreground'}`}>
                    {s === 'ALL' ? 'All' : getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setCategoryFilter('ALL'); setStatusFilter('ALL'); setSearch(''); setPage(1); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400">
                <X className="w-3 h-3" /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Complaints */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 h-28 animate-shimmer" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No complaints found</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {activeFilters > 0 ? 'Try adjusting your filters' : 'You haven\'t reported any issues yet'}
          </p>
          <Link href="/dashboard/citizen/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all">
            <PlusCircle className="w-4 h-4" /> Report an Issue
          </Link>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {complaints.map((c: any) => (
            <Link key={c.id} href={`/dashboard/citizen/complaints/${c.id}`}
              className="glass rounded-2xl p-5 flex items-center gap-4 hover:glow-sm transition-all group block">
              <span className="text-3xl shrink-0">{categoryIcons[c.category] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate group-hover:text-violet-500 transition-colors">{c.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" /> {c.address?.split(',').slice(0, 2).join(',') || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {formatRelativeTime(c.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${statusColors[c.status]}`}>
                  {getStatusLabel(c.status)}
                </span>
                {c.priority && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityColors[c.priority]}`}>
                    {c.priority}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {complaints.map((c: any) => (
            <Link key={c.id} href={`/dashboard/citizen/complaints/${c.id}`}
              className="glass rounded-2xl overflow-hidden hover:glow-sm transition-all group block">
              {c.images && c.images.length > 0 ? (
                <div className="h-40 bg-muted overflow-hidden">
                  <img src={c.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="h-40 bg-muted/50 flex items-center justify-center">
                  <span className="text-5xl">{categoryIcons[c.category] || '📋'}</span>
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm truncate group-hover:text-violet-500 transition-colors">{c.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${statusColors[c.status]}`}>
                    {getStatusLabel(c.status)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{c.address?.split(',').slice(0, 2).join(',')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatRelativeTime(c.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {c.verificationCount || 0} verified
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl glass hover:bg-accent/50 disabled:opacity-30 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) pageNum = i + 1;
            else if (page <= 4) pageNum = i + 1;
            else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
            else pageNum = page - 3 + i;
            return (
              <button key={pageNum} onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === pageNum
                  ? 'bg-violet-600 text-white' : 'glass hover:bg-accent/50'}`}>
                {pageNum}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl glass hover:bg-accent/50 disabled:opacity-30 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

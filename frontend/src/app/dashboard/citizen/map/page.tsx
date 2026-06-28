'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { complaintsAPI } from '@/lib/api';
import { categoryIcons, categoryLabels, statusColors, getStatusLabel, formatRelativeTime } from '@/lib/utils';
import {
  MapPin, Layers, Filter, X, Search, Loader2, List, ChevronRight, Clock
} from 'lucide-react';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });

const categories = [
  'ALL', 'POTHOLE', 'GARBAGE', 'WATER_LEAKAGE', 'BROKEN_STREETLIGHT', 'SEWAGE_PROBLEM',
  'ROAD_DAMAGE', 'ILLEGAL_DUMPING', 'TRAFFIC_SIGNAL_FAILURE', 'FALLEN_TREE', 'PUBLIC_PROPERTY_DAMAGE', 'OTHER'
];

const statusList = ['ALL', 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const severityColorMap: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export default function LiveMapPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [complaintsRes, heatmapRes] = await Promise.allSettled([
        complaintsAPI.getAll({ limit: 500 }),
        complaintsAPI.getHeatmap(),
      ]);
      if (complaintsRes.status === 'fulfilled') {
        setComplaints(complaintsRes.value.data.complaints || complaintsRes.value.data || []);
      }
      if (heatmapRes.status === 'fulfilled') {
        setHeatmapData(heatmapRes.value.data || []);
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      return true;
    });
  }, [complaints, categoryFilter, statusFilter]);

  // Default center: Mumbai
  const center: [number, number] = useMemo(() => {
    if (filteredComplaints.length > 0) {
      const avgLat = filteredComplaints.reduce((sum, c) => sum + (c.latitude || 0), 0) / filteredComplaints.length;
      const avgLng = filteredComplaints.reduce((sum, c) => sum + (c.longitude || 0), 0) / filteredComplaints.length;
      return [avgLat || 19.076, avgLng || 72.8777];
    }
    return [19.076, 72.8777];
  }, [filteredComplaints]);

  if (!mounted) {
    return (
      <div className="h-[calc(100vh-8rem)] rounded-2xl glass flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Map</h1>
          <p className="text-muted-foreground text-sm">{filteredComplaints.length} issues shown</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showHeatmap ? 'bg-violet-600 text-white' : 'glass hover:bg-accent/50'}`}>
            <Layers className="w-4 h-4" /> Heatmap
          </button>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showFilters ? 'bg-violet-600 text-white' : 'glass hover:bg-accent/50'}`}>
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button onClick={() => setShowList(!showList)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showList ? 'bg-violet-600 text-white' : 'glass hover:bg-accent/50'}`}>
            <List className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass rounded-2xl p-4 animate-slide-up">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${categoryFilter === cat
                      ? 'bg-violet-600 text-white' : 'bg-accent/50 hover:bg-accent text-foreground'}`}>
                    {cat === 'ALL' ? 'All' : `${categoryIcons[cat]} ${categoryLabels[cat]}`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Status</label>
              <div className="flex flex-wrap gap-2">
                {statusList.map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s
                      ? 'bg-violet-600 text-white' : 'bg-accent/50 hover:bg-accent text-foreground'}`}>
                    {s === 'ALL' ? 'All' : getStatusLabel(s)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Map */}
        <div className={`${showList ? 'flex-1' : 'w-full'} h-[calc(100vh-14rem)] rounded-2xl overflow-hidden glass`}>
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : (
            <MapContainer center={center} zoom={12} className="w-full h-full" scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {showHeatmap ? (
                filteredComplaints.map((c: any) => (
                  <CircleMarker
                    key={c.id}
                    center={[c.latitude, c.longitude]}
                    radius={8 + (c.verificationCount || 0) * 2}
                    pathOptions={{
                      color: severityColorMap[c.severity] || '#8b5cf6',
                      fillColor: severityColorMap[c.severity] || '#8b5cf6',
                      fillOpacity: 0.4,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="min-w-48">
                        <p className="font-semibold text-sm">{categoryIcons[c.category]} {c.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{c.address?.split(',').slice(0, 2).join(',')}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs font-medium">{getStatusLabel(c.status)}</span>
                          <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                        </div>
                        <a href={`/dashboard/citizen/complaints/${c.id}`} className="text-xs text-violet-600 mt-2 block">
                          View Details →
                        </a>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))
              ) : (
                filteredComplaints.map((c: any) => (
                  <CircleMarker
                    key={c.id}
                    center={[c.latitude, c.longitude]}
                    radius={6}
                    pathOptions={{
                      color: severityColorMap[c.severity] || '#8b5cf6',
                      fillColor: severityColorMap[c.severity] || '#8b5cf6',
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="min-w-48">
                        <p className="font-semibold text-sm">{categoryIcons[c.category]} {c.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{c.address?.split(',').slice(0, 2).join(',')}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs font-medium">{getStatusLabel(c.status)}</span>
                        </div>
                        <a href={`/dashboard/citizen/complaints/${c.id}`} className="text-xs text-violet-600 mt-2 block">
                          View Details →
                        </a>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))
              )}
            </MapContainer>
          )}
        </div>

        {/* Side List */}
        {showList && (
          <div className="w-80 h-[calc(100vh-14rem)] overflow-y-auto glass rounded-2xl p-3 space-y-2 animate-slide-up">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No issues found</p>
              </div>
            ) : (
              filteredComplaints.map((c: any) => (
                <a key={c.id} href={`/dashboard/citizen/complaints/${c.id}`}
                  className="block p-3 rounded-xl hover:bg-accent/50 transition-all group">
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{categoryIcons[c.category]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-violet-500 transition-colors">{c.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{c.address?.split(',').slice(0, 2).join(',')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[c.status]}`}>
                          {getStatusLabel(c.status)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatRelativeTime(c.createdAt)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

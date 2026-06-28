'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { complaintsAPI } from '@/lib/api';
import { categoryIcons, statusColors, getStatusLabel, formatRelativeTime, priorityColors } from '@/lib/utils';
import { MapPin, Layers, Filter, List, ChevronRight, Loader2, X } from 'lucide-react';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

const priorityColorMap: Record<string, string> = { LOW: '#22c55e', MEDIUM: '#eab308', HIGH: '#f97316', URGENT: '#ef4444' };

export default function OfficerMapPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data } = await complaintsAPI.getAll({ limit: 500 });
      setComplaints(data.complaints || data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const filtered = useMemo(() => {
    return complaints.filter(c => statusFilter === 'ALL' || c.status === statusFilter);
  }, [complaints, statusFilter]);

  const center: [number, number] = useMemo(() => {
    if (filtered.length > 0) {
      const avgLat = filtered.reduce((s, c) => s + (c.latitude || 0), 0) / filtered.length;
      const avgLng = filtered.reduce((s, c) => s + (c.longitude || 0), 0) / filtered.length;
      return [avgLat || 19.076, avgLng || 72.8777];
    }
    return [19.076, 72.8777];
  }, [filtered]);

  if (!mounted) return <div className="h-[calc(100vh-8rem)] rounded-2xl glass flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Officer Map</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} complaints • Color = priority</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl glass text-sm outline-none cursor-pointer border border-input">
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <button onClick={() => setShowList(!showList)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showList ? 'bg-violet-600 text-white' : 'glass hover:bg-accent/50'}`}>
            <List className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className={`${showList ? 'flex-1' : 'w-full'} h-[calc(100vh-14rem)] rounded-2xl overflow-hidden glass`}>
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>
          ) : (
            <MapContainer center={center} zoom={12} className="w-full h-full" scrollWheelZoom={true}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filtered.map((c: any) => (
                <CircleMarker key={c.id} center={[c.latitude, c.longitude]} radius={7}
                  pathOptions={{ color: priorityColorMap[c.priority] || '#8b5cf6', fillColor: priorityColorMap[c.priority] || '#8b5cf6', fillOpacity: 0.7, weight: 2 }}>
                  <Popup>
                    <div className="min-w-48">
                      <p className="font-semibold text-sm">{categoryIcons[c.category]} {c.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{c.address?.split(',').slice(0, 2).join(',')}</p>
                      <div className="flex gap-2 mt-2"><span className="text-xs font-medium">{c.priority}</span><span className="text-xs">{getStatusLabel(c.status)}</span></div>
                      <a href={`/dashboard/citizen/complaints/${c.id}`} className="text-xs text-violet-600 mt-2 block">View Details →</a>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>
        {showList && (
          <div className="w-80 h-[calc(100vh-14rem)] overflow-y-auto glass rounded-2xl p-3 space-y-2 animate-slide-up">
            {filtered.length === 0 ? (
              <div className="text-center py-12"><MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No issues</p></div>
            ) : filtered.map((c: any) => (
              <a key={c.id} href={`/dashboard/citizen/complaints/${c.id}`} className="block p-3 rounded-xl hover:bg-accent/50 transition-all group">
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{categoryIcons[c.category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-violet-500">{c.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityColors[c.priority]}`}>{c.priority}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusColors[c.status]}`}>{getStatusLabel(c.status)}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

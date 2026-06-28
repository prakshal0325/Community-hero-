'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import {
  ScrollText, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  User, FileText, Settings, Shield, Clock, X
} from 'lucide-react';

const actionIcons: Record<string, any> = {
  CREATE: FileText, UPDATE: Settings, DELETE: X, LOGIN: Shield, REGISTER: User,
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => { loadLogs(); }, [page, search, entityFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;
      if (entityFilter !== 'ALL') params.entity = entityFilter;
      const { data } = await adminAPI.getLogs(params);
      setLogs(data.logs || data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const entities = ['ALL', 'User', 'Complaint', 'Comment', 'Vote', 'Department', 'Badge', 'System'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ScrollText className="w-6 h-6 text-violet-500" /> Audit Logs</h1>
        <p className="text-muted-foreground text-sm">{total} log entries</p>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search logs..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
        </div>
        <div className="flex rounded-xl border border-input overflow-hidden">
          {entities.map(e => (
            <button key={e} onClick={() => { setEntityFilter(e); setPage(1); }}
              className={`px-3 py-2.5 text-xs font-medium transition-all ${entityFilter === e ? 'bg-violet-600 text-white' : 'hover:bg-accent'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 rounded-xl animate-shimmer" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center">
            <ScrollText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">No logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log: any) => {
              const Icon = actionIcons[log.action?.split('_')[0]] || FileText;
              const isExpanded = expandedId === log.id;
              return (
                <div key={log.id} className="hover:bg-accent/20 transition-colors">
                  <button onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="w-full flex items-center gap-4 p-4 text-left">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.action}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{log.entity}</span>
                        {log.user && <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> {log.user.name || 'System'}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDateTime(log.createdAt)}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 ml-12 animate-slide-up">
                      <div className="p-3 rounded-xl bg-accent/30 text-xs space-y-1">
                        {log.entityId && <p><span className="text-muted-foreground">Entity ID:</span> <span className="font-mono">{log.entityId}</span></p>}
                        {log.ipAddress && <p><span className="text-muted-foreground">IP:</span> {log.ipAddress}</p>}
                        {log.details && (
                          <div>
                            <span className="text-muted-foreground">Details:</span>
                            <pre className="mt-1 p-2 rounded-lg bg-background text-[11px] overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl glass hover:bg-accent/50 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl glass hover:bg-accent/50 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

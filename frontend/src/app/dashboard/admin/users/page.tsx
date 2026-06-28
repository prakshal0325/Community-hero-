'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/utils';
import {
  Users, Search, ChevronLeft, ChevronRight, Shield, UserCheck, UserX,
  Mail, Calendar, Star, Zap, Edit3, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const roles = ['ALL', 'CITIZEN', 'OFFICER', 'ADMIN'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const limit = 15;

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, search]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (search) params.search = search;
      const { data } = await adminAPI.getUsers(params);
      setUsers(data.users || data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleUpdate = async (userId: string, updates: any) => {
    setUpdatingId(userId);
    try {
      await adminAPI.updateUser(userId, updates);
      toast.success('User updated');
      await loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'ADMIN') return 'bg-red-500/10 text-red-500';
    if (role === 'OFFICER') return 'bg-blue-500/10 text-blue-500';
    return 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground text-sm">{total} total users</p>
      </div>

      {/* Controls */}
      <div className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
        </div>
        <div className="flex rounded-xl border border-input overflow-hidden">
          {roles.map(role => (
            <button key={role} onClick={() => { setRoleFilter(role); setPage(1); }}
              className={`px-4 py-2.5 text-xs font-medium transition-all ${roleFilter === role ? 'bg-violet-600 text-white' : 'hover:bg-accent'}`}>
              {role === 'ALL' ? 'All' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Stats</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-4"><div className="h-12 rounded-xl animate-shimmer" /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="p-16 text-center text-muted-foreground">No users found</td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select value={u.role} onChange={(e) => handleUpdate(u.id, { role: e.target.value })}
                      disabled={updatingId === u.id}
                      className={`px-2 py-1 rounded-lg text-xs font-medium outline-none cursor-pointer border-0 ${getRoleBadgeColor(u.role)}`}>
                      <option value="CITIZEN">CITIZEN</option>
                      <option value="OFFICER">OFFICER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> {u.points || 0}</span>
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-violet-500" /> Lv.{u.level || 1}</span>
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {u.isVerified ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500">Verified</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-500">Unverified</span>
                      )}
                      {!u.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-500">Banned</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {!u.isVerified && (
                        <button onClick={() => handleUpdate(u.id, { isVerified: true })} disabled={updatingId === u.id}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-all" title="Verify">
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleUpdate(u.id, { isActive: !u.isActive })} disabled={updatingId === u.id}
                        className={`p-1.5 rounded-lg transition-all ${u.isActive ? 'text-red-500 hover:bg-red-500/10' : 'text-green-500 hover:bg-green-500/10'}`}
                        title={u.isActive ? 'Ban' : 'Unban'}>
                        {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

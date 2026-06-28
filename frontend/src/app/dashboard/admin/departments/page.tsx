'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import {
  Building2, Plus, Edit3, X, Save, Mail, Phone, Users, Loader2, CheckCircle, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', contactEmail: '', contactPhone: '', icon: '🏢', color: '#6366f1', isActive: true,
  });

  useEffect(() => { loadDepartments(); }, []);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminAPI.getDepartments();
      setDepartments(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', contactEmail: '', contactPhone: '', icon: '🏢', color: '#6366f1', isActive: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (dept: any) => {
    setForm({
      name: dept.name || '', description: dept.description || '', contactEmail: dept.contactEmail || '',
      contactPhone: dept.contactPhone || '', icon: dept.icon || '🏢', color: dept.color || '#6366f1', isActive: dept.isActive ?? true,
    });
    setEditingId(dept.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Department name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await adminAPI.updateDepartment(editingId, form);
        toast.success('Department updated');
      } else {
        await adminAPI.createDepartment(form);
        toast.success('Department created');
      }
      resetForm();
      await loadDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const icons = ['🏢', '🚰', '💡', '🛣️', '🌳', '🗑️', '🚦', '🏛️', '🔧', '⚡', '🚿', '🏗️'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground text-sm">{departments.length} departments</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all glow-sm">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 animate-slide-up border border-violet-500/20">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Department' : 'New Department'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Department name" className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm(p => ({ ...p, contactEmail: e.target.value }))}
                placeholder="email@dept.gov" className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Department description" rows={2} className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input type="tel" value={form.contactPhone} onChange={(e) => setForm(p => ({ ...p, contactPhone: e.target.value }))}
                placeholder="+91-XXXXX" className="w-full px-4 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm(p => ({ ...p, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                <span className="text-sm text-muted-foreground">{form.color}</span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Icon</label>
              <div className="flex flex-wrap gap-2">
                {icons.map(icon => (
                  <button key={icon} onClick={() => setForm(p => ({ ...p, icon }))}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${form.icon === icon ? 'bg-violet-600 ring-2 ring-violet-500' : 'bg-accent/50 hover:bg-accent'}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-sm font-medium hover:bg-accent/50">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Department Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-48 animate-shimmer" />)}
        </div>
      ) : departments.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No departments yet</h3>
          <p className="text-muted-foreground text-sm">Create your first department to organize complaints</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept: any) => (
            <div key={dept.id} className="glass rounded-2xl p-5 hover:glow-sm transition-all group relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${dept.color || '#6366f1'}20` }}>
                  {dept.icon || '🏢'}
                </div>
                <div className="flex items-center gap-1">
                  {dept.isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-500">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-500">Inactive</span>
                  )}
                  <button onClick={() => startEdit(dept)}
                    className="p-1.5 rounded-lg hover:bg-accent opacity-0 group-hover:opacity-100 transition-all">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold mb-1">{dept.name}</h3>
              {dept.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{dept.description}</p>}
              <div className="space-y-1">
                {dept.contactEmail && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" /> {dept.contactEmail}</p>
                )}
                {dept.contactPhone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" /> {dept.contactPhone}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> {dept._count?.officers || dept.officers?.length || 0} officers
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import * as LucideIcons from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', contactEmail: '', contactPhone: '', icon: 'Building2', color: '#6366f1', isActive: true,
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
    setForm({ name: '', description: '', contactEmail: '', contactPhone: '', icon: 'Building2', color: '#6366f1', isActive: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (dept: any) => {
    setForm({
      name: dept.name || '', description: dept.description || '', contactEmail: dept.contactEmail || '',
      contactPhone: dept.contactPhone || '', icon: dept.icon || 'Building2', color: dept.color || '#6366f1', isActive: dept.isActive ?? true,
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

  const presetIcons = [
    'Construction', 'Trash2', 'Droplets', 'Zap', 'Trees', 'Shield', 'HeartPulse', 'Building2',
    '🚰', '💡', '🛣️', '🌳', '🗑️', '🏛️', '🔧', '⚡'
  ];

  // Dynamically render a Lucide Icon based on a string name, or fallback to text/emoji
  const renderIcon = (iconName: string, color: string) => {
    if (!iconName) {
      return <LucideIcons.Building2 className="w-5 h-5" style={{ color }} />;
    }

    // Convert kebab-case or space-case to PascalCase
    const pascalCase = iconName
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/2$/, '2')
      .replace(/3$/, '3')
      .replace(/4$/, '4');

    const possibleNames = [
      pascalCase,
      iconName,
      iconName.charAt(0).toUpperCase() + iconName.slice(1),
      iconName.toUpperCase()
    ];

    for (const name of possibleNames) {
      const IconComponent = (LucideIcons as any)[name];
      if (IconComponent) {
        return <IconComponent className="w-5 h-5" style={{ color }} />;
      }
    }

    return <span className="text-lg leading-none">{iconName}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground text-sm">{departments.length} departments</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all glow-sm">
          <LucideIcons.Plus className="w-4 h-4" /> Add Department
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
              <label className="block text-sm font-medium mb-1.5">Icon</label>
              <div className="flex flex-wrap gap-2">
                {presetIcons.map(icon => (
                  <button key={icon} type="button" onClick={() => setForm(p => ({ ...p, icon }))}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${form.icon === icon ? 'bg-violet-600 ring-2 ring-violet-500 shadow-md scale-105' : 'bg-accent/40 hover:bg-accent/80 text-muted-foreground hover:text-foreground'}`}>
                    {renderIcon(icon, form.icon === icon ? '#ffffff' : form.color)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? <LucideIcons.Loader2 className="w-4 h-4 animate-spin" /> : <LucideIcons.Save className="w-4 h-4" />} {editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-sm font-medium hover:bg-accent/50">
              <LucideIcons.X className="w-4 h-4" /> Cancel
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
          <LucideIcons.Building2 className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No departments yet</h3>
          <p className="text-muted-foreground text-sm">Create your first department to organize complaints</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept: any) => (
            <div key={dept.id} 
              className="glass-strong rounded-2xl p-6 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 group relative border border-border border-t-4"
              style={{ borderTopColor: dept.color || '#6366f1' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 duration-300"
                  style={{ backgroundColor: `${dept.color || '#6366f1'}15` }}>
                  {renderIcon(dept.icon, dept.color || '#6366f1')}
                </div>
                <div className="flex items-center gap-1.5">
                  {dept.isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-500 border border-green-500/20">Active</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">Inactive</span>
                  )}
                  <button onClick={() => startEdit(dept)}
                    className="p-1.5 rounded-lg hover:bg-accent opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-foreground">
                    <LucideIcons.Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-lg mb-1 group-hover:text-violet-500 transition-colors">{dept.name}</h3>
              {dept.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">{dept.description}</p>}
              
              <div className="space-y-2 pt-3 border-t border-border/50">
                {dept.contactEmail && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <LucideIcons.Mail className="w-3.5 h-3.5 text-muted-foreground/75" /> 
                    <span className="truncate">{dept.contactEmail}</span>
                  </p>
                )}
                {dept.contactPhone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <LucideIcons.Phone className="w-3.5 h-3.5 text-muted-foreground/75" /> 
                    <span>{dept.contactPhone}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <LucideIcons.Users className="w-3.5 h-3.5 text-muted-foreground/75" /> 
                  <span>{dept._count?.officers || dept.officers?.length || 0} officers assigned</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

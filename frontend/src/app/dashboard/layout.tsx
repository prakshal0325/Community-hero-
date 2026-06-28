'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSocketEvent } from '@/lib/socket';
import { notificationsAPI } from '@/lib/api';
import {
  Shield, Home, FileText, Map, User, Trophy, Bell, LogOut, Menu, X,
  Sun, Moon, Settings, BarChart3, Users, Building2, Award, ScrollText,
  PlusCircle, MessageCircle, ChevronLeft, Sparkles
} from 'lucide-react';
import { useTheme } from 'next-themes';

const citizenMenu = [
  { href: '/dashboard/citizen', label: 'Overview', icon: Home },
  { href: '/dashboard/citizen/report', label: 'Report Issue', icon: PlusCircle },
  { href: '/dashboard/citizen/complaints', label: 'My Complaints', icon: FileText },
  { href: '/dashboard/citizen/map', label: 'Live Map', icon: Map },
  { href: '/dashboard/citizen/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/chat', label: 'AI Assistant', icon: Sparkles },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/citizen/profile', label: 'Profile', icon: User },
];

const officerMenu = [
  { href: '/dashboard/officer', label: 'Overview', icon: Home },
  { href: '/dashboard/officer/complaints', label: 'All Complaints', icon: FileText },
  { href: '/dashboard/officer/map', label: 'Live Map', icon: Map },
  { href: '/dashboard/officer/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/chat', label: 'AI Assistant', icon: Sparkles },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

const adminMenu = [
  { href: '/dashboard/admin', label: 'Overview', icon: Home },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/departments', label: 'Departments', icon: Building2 },
  { href: '/dashboard/admin/rewards', label: 'Rewards', icon: Award },
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/admin/logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/dashboard/admin/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/chat', label: 'AI Assistant', icon: Sparkles },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (user) {
      notificationsAPI.getUnreadCount()
        .then(({ data }) => setUnreadCount(data.count || 0))
        .catch(() => {});
    }
  }, [user]);

  // Update unread count on real-time notification
  const handleNewNotification = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);
  useSocketEvent('notification:new', handleNewNotification);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const menuItems = user.role === 'ADMIN' ? adminMenu : user.role === 'OFFICER' ? officerMenu : citizenMenu;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col glass-strong transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className={`flex items-center gap-3 p-4 border-b border-border ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <span className="text-lg font-bold gradient-text">Community Hero</span>}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-violet-500 border border-violet-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`p-3 border-t border-border space-y-1 ${collapsed ? '' : ''}`}>
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all justify-center">
            <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={logout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 glass-strong border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button className="lg:hidden p-2 rounded-lg hover:bg-accent" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden lg:block" />

            <div className="flex items-center gap-3">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-accent transition-colors">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-accent transition-colors">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-violet-500 rounded-full text-[10px] font-bold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

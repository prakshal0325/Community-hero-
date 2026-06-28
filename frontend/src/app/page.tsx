'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Shield, MapPin, Brain, Users, TrendingUp, Bell, Award, ChevronRight,
  ArrowRight, Zap, Eye, BarChart3, MessageCircle, Star, CheckCircle,
  Sun, Moon, Menu, X, Globe, Camera, Target, Sparkles
} from 'lucide-react';

// ─── Animated Counter Component ──────────────────────────────
function AnimatedCounter({ end, duration = 2000, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

// ─── Floating Particle Background ────────────────────────────
function ParticleBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20 animate-float"
          style={{
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsl(${260 + Math.random() * 40} 80% 60%)`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Features Data ───────────────────────────────────────────
const features = [
  { icon: Camera, title: 'Smart Reporting', desc: 'Snap a photo and AI instantly identifies the issue, categorizes it, and estimates repair time.', color: 'from-violet-500 to-purple-600' },
  { icon: Brain, title: 'AI Analysis', desc: 'GPT-4.1 powered vision analyzes images to detect severity, generate descriptions, and predict costs.', color: 'from-blue-500 to-cyan-600' },
  { icon: MapPin, title: 'Live Heatmap', desc: 'Interactive maps show issue density, nearby complaints, and real-time status of reports.', color: 'from-emerald-500 to-teal-600' },
  { icon: Users, title: 'Community Verification', desc: 'Neighbors verify reports to increase trust scores and prevent spam or fake complaints.', color: 'from-orange-500 to-amber-600' },
  { icon: Award, title: 'Gamification', desc: 'Earn points, badges, and climb leaderboards. Complete daily challenges and unlock achievements.', color: 'from-pink-500 to-rose-600' },
  { icon: TrendingUp, title: 'Predictive Analytics', desc: 'AI predicts future issues based on historical data, enabling preventive maintenance.', color: 'from-indigo-500 to-violet-600' },
  { icon: Bell, title: 'Real-time Updates', desc: 'Get instant notifications when your complaint status changes or nearby issues are reported.', color: 'from-red-500 to-pink-600' },
  { icon: MessageCircle, title: 'AI Chat Assistant', desc: 'Ask questions about reporting, get emergency contacts, and track status through natural conversation.', color: 'from-teal-500 to-green-600' },
];

const stats = [
  { value: 12847, label: 'Issues Reported', suffix: '+' },
  { value: 8923, label: 'Issues Resolved', suffix: '+' },
  { value: 45200, label: 'Active Citizens', suffix: '+' },
  { value: 94, label: 'Resolution Rate', suffix: '%' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Citizen, Mumbai', text: 'Community Hero made it so easy to report potholes. I just took a photo and the AI did everything else. The issue was fixed within a week!', rating: 5 },
  { name: 'Rajesh Kumar', role: 'Municipal Officer, Delhi', text: 'The dashboard gives us complete visibility. We can prioritize issues based on AI severity scores and community verification counts.', rating: 5 },
  { name: 'Ananya Patel', role: 'Citizen, Bangalore', text: 'I love the gamification! Earning badges for reporting and verifying issues keeps me engaged. Already on the monthly leaderboard!', rating: 5 },
];

const issueCategories = [
  { icon: '🕳️', label: 'Potholes', count: 3240 },
  { icon: '🗑️', label: 'Garbage', count: 2810 },
  { icon: '💧', label: 'Water Leakage', count: 1950 },
  { icon: '💡', label: 'Streetlights', count: 1420 },
  { icon: '🚰', label: 'Sewage', count: 980 },
  { icon: '🛣️', label: 'Road Damage', count: 1670 },
  { icon: '🚦', label: 'Traffic Signals', count: 540 },
  { icon: '🌳', label: 'Fallen Trees', count: 320 },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { setIsVisible(true); }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const dashboardLink = user
    ? user.role === 'ADMIN' ? '/dashboard/admin'
    : user.role === 'OFFICER' ? '/dashboard/officer'
    : '/dashboard/citizen'
    : '/login';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ─── Navbar ─────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Community Hero</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Impact</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {isAuthenticated ? (
                <Link href={dashboardLink} className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
                  <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity glow-sm">
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-border">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#stats" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Impact</a>
              <a href="#testimonials" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="flex-1 text-center px-4 py-2 border border-border rounded-xl text-sm">Sign In</Link>
                <Link href="/register" className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero Section ───────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 via-transparent to-transparent dark:from-violet-600/5" />

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-muted-foreground">AI-Powered Civic Platform</span>
            <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full text-xs font-medium">v1.0</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="gradient-text">Your Community,</span>
            <br />
            <span className="text-foreground">Your Voice</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Report potholes, garbage, water leaks, and more with just a photo.
            Our AI instantly analyzes, categorizes, and routes your report to the right department.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-semibold text-lg hover:opacity-90 transition-all glow">
              Report an Issue
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="flex items-center gap-2 px-8 py-4 glass rounded-2xl font-medium text-foreground hover:bg-accent/50 transition-colors">
              <Eye className="w-5 h-5" />
              See How It Works
            </a>
          </div>

          {/* Live Issue Categories */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 max-w-3xl mx-auto">
            {issueCategories.map((cat, i) => {
              const categoryMapping: Record<string, string> = {
                'Potholes': 'POTHOLE',
                'Garbage': 'GARBAGE',
                'Water Leakage': 'WATER_LEAKAGE',
                'Streetlights': 'BROKEN_STREETLIGHT',
                'Sewage': 'SEWAGE_PROBLEM',
                'Road Damage': 'ROAD_DAMAGE',
                'Traffic Signals': 'TRAFFIC_SIGNAL_FAILURE',
                'Fallen Trees': 'FALLEN_TREE'
              };
              const queryCategory = categoryMapping[cat.label] || 'OTHER';
              const targetUrl = `/dashboard/citizen/report?category=${queryCategory}`;
              return (
                <Link
                  key={i}
                  href={targetUrl}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl glass hover:glow-sm hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-violet-500"
                  aria-label={`Report an issue for ${cat.label}`}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">{cat.icon}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{cat.label}</span>
                  <span className="text-[10px] text-violet-400 font-mono">{cat.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────── */}
      <section id="features" className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-500 tracking-wider uppercase mb-3">Features</p>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Make a Difference</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools for citizens, officers, and administrators to collaborate on community improvement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className={`group p-6 rounded-2xl glass hover:glow-sm transition-all duration-300 opacity-0 animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-500 tracking-wider uppercase mb-3">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-bold">Three Simple Steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Camera, title: 'Capture & Report', desc: 'Take a photo of the issue. Our AI instantly identifies it, suggests a category, and generates a detailed description.' },
              { step: '02', icon: Target, title: 'AI Routes & Prioritizes', desc: 'The AI assigns priority, detects duplicates, estimates costs, and routes the complaint to the right department automatically.' },
              { step: '03', icon: CheckCircle, title: 'Track & Resolve', desc: 'Follow real-time status updates. The community verifies reports and officers update progress until resolution.' },
            ].map((item, i) => (
              <div key={i} className="relative p-8 rounded-2xl glass text-center group hover:glow-sm transition-all">
                <div className="text-6xl font-black text-violet-500/10 absolute top-4 right-6">{item.step}</div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-violet-500/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────── */}
      <section id="stats" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-500 tracking-wider uppercase mb-3">Impact</p>
            <h2 className="text-4xl sm:text-5xl font-bold">
              Making Cities <span className="gradient-text">Better Together</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="p-8 rounded-2xl glass text-center hover:glow-sm transition-all">
                <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────── */}
      <section id="testimonials" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-violet-500 tracking-wider uppercase mb-3">Testimonials</p>
            <h2 className="text-4xl sm:text-5xl font-bold">What Our Heroes Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 rounded-2xl glass hover:glow-sm transition-all">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Be a Community Hero?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of citizens making their neighborhoods better, one report at a time.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="group flex items-center gap-2 px-8 py-4 bg-white text-violet-700 rounded-2xl font-semibold text-lg hover:bg-white/90 transition-colors">
                  Start Reporting
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login" className="flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-2xl font-medium hover:bg-white/10 transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────── */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold gradient-text">Community Hero</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered civic engagement platform for smarter cities.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Platform</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#features" className="block hover:text-foreground transition-colors">Features</a>
                <Link href="/register" className="block hover:text-foreground transition-colors">Report Issue</Link>
                <a href="#" className="block hover:text-foreground transition-colors">Open Data</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Resources</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">API Docs</a>
                <a href="#" className="block hover:text-foreground transition-colors">Help Center</a>
                <a href="#" className="block hover:text-foreground transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="block hover:text-foreground transition-colors">Terms of Service</a>
                <a href="#" className="block hover:text-foreground transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2025 Community Hero. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>English</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

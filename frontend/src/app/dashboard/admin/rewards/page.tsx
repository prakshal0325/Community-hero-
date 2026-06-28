'use client';

import { useState, useEffect } from 'react';
import { usersAPI } from '@/lib/api';
import { Award, Target, Flame, Trophy, Star, Zap, Gift } from 'lucide-react';

export default function AdminRewardsPage() {
  const [badges, setBadges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'badges' | 'achievements' | 'challenges'>('badges');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [badgesRes, achievementsRes, challengesRes] = await Promise.allSettled([
        usersAPI.getBadges(),
        usersAPI.getAchievements(),
        usersAPI.getChallenges(),
      ]);
      if (badgesRes.status === 'fulfilled') {
        const data = badgesRes.value.data;
        const earnedList = (data.earned || []).map((ub: any) => ub.badge || ub);
        const availableList = data.available || [];
        setBadges([...earnedList, ...availableList]);
      }
      if (achievementsRes.status === 'fulfilled') setAchievements(achievementsRes.value.data || []);
      if (challengesRes.status === 'fulfilled') setChallenges(challengesRes.value.data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const tabs = [
    { key: 'badges' as const, label: 'Badges', icon: Award, count: badges.length },
    { key: 'achievements' as const, label: 'Achievements', icon: Target, count: achievements.length },
    { key: 'challenges' as const, label: 'Challenges', icon: Flame, count: challenges.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="w-6 h-6 text-violet-500" /> Rewards & Gamification</h1>
        <p className="text-muted-foreground text-sm">Manage badges, achievements, and challenges</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-input overflow-hidden w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-violet-600 text-white' : 'hover:bg-accent'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${activeTab === tab.key ? 'bg-white/20' : 'bg-accent'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="glass rounded-2xl h-36 animate-shimmer" />)}
        </div>
      ) : (
        <>
          {/* Badges */}
          {activeTab === 'badges' && (
            badges.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <Award className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No badges configured</h3>
                <p className="text-muted-foreground text-sm">Seed the database to populate badges</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((b: any, i: number) => {
                  const badge = b.badge || b;
                  return (
                    <div key={i} className="glass rounded-2xl p-5 hover:glow-sm transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                          style={{ background: `${badge.color || '#6366f1'}15` }}>
                          {badge.icon || '🏅'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold">{badge.name}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{badge.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> {badge.pointsRequired || 0} pts required</span>
                            <span className="px-2 py-0.5 rounded bg-accent text-xs">{badge.category || 'general'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Achievements */}
          {activeTab === 'achievements' && (
            achievements.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <Target className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No achievements configured</h3>
                <p className="text-muted-foreground text-sm">Seed the database to populate achievements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {achievements.map((a: any, i: number) => (
                  <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4 hover:glow-sm transition-all">
                    <span className="text-3xl">{a.icon || '🎯'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{a.type?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">Target: {a.target}</p>
                      <span className="text-xs text-violet-500 font-mono">+{a.reward} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Challenges */}
          {activeTab === 'challenges' && (
            challenges.length === 0 ? (
              <div className="glass rounded-2xl p-16 text-center">
                <Flame className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active challenges</h3>
                <p className="text-muted-foreground text-sm">Seed the database to populate challenges</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {challenges.map((c: any, i: number) => (
                  <div key={i} className="glass rounded-2xl p-5 hover:glow-sm transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.type === 'DAILY' ? 'bg-green-500/10 text-green-500' : c.type === 'WEEKLY' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                        {c.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-1">{c.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Target: {c.target}</span>
                      <span className="text-violet-500 font-mono font-medium">+{c.reward} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

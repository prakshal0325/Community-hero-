'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usersAPI } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import {
  Trophy, Medal, Crown, Star, Flame, Zap, TrendingUp, ChevronUp, ChevronDown, Minus,
  Calendar, Users
} from 'lucide-react';

type Period = 'weekly' | 'monthly' | 'all';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { data } = await usersAPI.getLeaderboard({ period, limit: 50 });
      const leadersList = data.leaderboard || data || [];
      setLeaders(leadersList);
      const rank = leadersList.findIndex((l: any) => l.id === user?.id);
      setUserRank(rank >= 0 ? rank + 1 : null);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-mono font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300/10 to-gray-400/10 border border-gray-400/20';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/10 to-orange-500/10 border border-amber-500/20';
    return 'glass';
  };

  const getAvatarGradient = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-amber-500';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-amber-500 to-orange-600';
    return 'from-violet-500 to-purple-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm">Top community heroes ranked by points</p>
        </div>

        {/* Period Tabs */}
        <div className="flex rounded-xl border border-input overflow-hidden">
          {([
            { value: 'weekly' as Period, label: 'Weekly' },
            { value: 'monthly' as Period, label: 'Monthly' },
            { value: 'all' as Period, label: 'All Time' },
          ]).map(tab => (
            <button key={tab.value} onClick={() => setPeriod(tab.value)}
              className={`px-4 py-2 text-sm font-medium transition-all ${period === tab.value
                ? 'bg-violet-600 text-white' : 'hover:bg-accent text-foreground'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Your Rank Card */}
      {user && (
        <div className="glass rounded-2xl p-5 border border-violet-500/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {userRank || '?'}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Your Rank</p>
              <p className="text-lg font-bold">{user.name}</p>
            </div>
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-lg font-bold">{formatNumber(user.points)}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div>
                <p className="text-lg font-bold flex items-center gap-1"><Zap className="w-4 h-4 text-violet-500" />{user.level}</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
              <div>
                <p className="text-lg font-bold flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" />{user.streak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {!isLoading && leaders.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[leaders[1], leaders[0], leaders[2]].map((leader, i) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const isUser = leader.id === user?.id;
            return (
              <div key={leader.id} className={`${getRankBg(rank)} rounded-2xl p-5 text-center ${rank === 1 ? 'scale-105 -mt-2' : ''} transition-all hover:glow-sm`}>
                <div className="mb-3">{getRankIcon(rank)}</div>
                <div className={`w-14 h-14 mx-auto rounded-full bg-gradient-to-br ${getAvatarGradient(rank)} flex items-center justify-center text-white font-bold text-lg mb-3 ${isUser ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-background' : ''}`}>
                  {leader.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                </div>
                <p className="font-semibold text-sm truncate">{leader.name}</p>
                <p className="text-xs text-muted-foreground mb-2">Level {leader.level}</p>
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">{formatNumber(leader.points)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span className="w-10 text-center">Rank</span>
            <span className="flex-1">User</span>
            <span className="w-16 text-center">Level</span>
            <span className="w-20 text-right">Points</span>
            <span className="w-16 text-center hidden sm:block">Streak</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">No data for this period</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {leaders.map((leader: any, i: number) => {
              const rank = i + 1;
              const isUser = leader.id === user?.id;
              return (
                <div key={leader.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/30 ${isUser ? 'bg-violet-500/5 border-l-2 border-violet-500' : ''}`}>
                  <div className="w-10 flex items-center justify-center">{getRankIcon(rank)}</div>
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarGradient(rank)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {leader.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{leader.name} {isUser && <span className="text-violet-500 text-xs">(You)</span>}</p>
                    </div>
                  </div>
                  <div className="w-16 text-center">
                    <span className="text-sm font-medium flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-violet-500" /> {leader.level}
                    </span>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-bold">{formatNumber(leader.points)}</span>
                  </div>
                  <div className="w-16 text-center hidden sm:flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="text-sm">{leader.streak || 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

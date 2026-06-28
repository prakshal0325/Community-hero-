import prisma from '../config/database.js';

interface PointConfig {
  report: number;
  verification: number;
  comment: number;
  resolved: number;
  xpPerReport: number;
  xpPerVerification: number;
  xpPerLevel: number;
}

const DEFAULT_POINTS: PointConfig = {
  report: 10,
  verification: 5,
  comment: 2,
  resolved: 25,
  xpPerReport: 25,
  xpPerVerification: 15,
  xpPerLevel: 500,
};

export class GamificationService {
  static async getPointConfig(): Promise<PointConfig> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'points_per_report',
              'points_per_verification',
              'points_per_comment',
              'points_per_resolved',
              'xp_per_report',
              'xp_per_verification',
              'xp_per_level',
            ],
          },
        },
      });

      const config = { ...DEFAULT_POINTS };
      for (const s of settings) {
        const val = typeof s.value === 'number' ? s.value : parseInt(String(s.value));
        switch (s.key) {
          case 'points_per_report': config.report = val; break;
          case 'points_per_verification': config.verification = val; break;
          case 'points_per_comment': config.comment = val; break;
          case 'points_per_resolved': config.resolved = val; break;
          case 'xp_per_report': config.xpPerReport = val; break;
          case 'xp_per_verification': config.xpPerVerification = val; break;
          case 'xp_per_level': config.xpPerLevel = val; break;
        }
      }
      return config;
    } catch {
      return DEFAULT_POINTS;
    }
  }

  static async awardPoints(userId: string, action: string, _entityId?: string) {
    const config = await this.getPointConfig();

    let points = 0;
    let xp = 0;

    switch (action) {
      case 'report':
        points = config.report;
        xp = config.xpPerReport;
        break;
      case 'verification':
      case 'verify':
        points = config.verification;
        xp = config.xpPerVerification;
        break;
      case 'comment':
        points = config.comment;
        xp = 5;
        break;
      case 'resolved':
        points = config.resolved;
        xp = 50;
        break;
      default:
        points = 1;
        xp = 2;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true, points: true },
    });

    if (!user) return;

    const newXp = user.xp + xp;
    const newPoints = user.points + points;
    const xpPerLevel = config.xpPerLevel;
    const newLevel = Math.floor(newXp / xpPerLevel) + 1;

    await prisma.user.update({
      where: { id: userId },
      data: {
        points: newPoints,
        xp: newXp,
        level: newLevel,
      },
    });

    // Check for level up
    if (newLevel > user.level) {
      await prisma.notification.create({
        data: {
          title: '🎉 Level Up!',
          message: `Congratulations! You've reached Level ${newLevel}!`,
          type: 'LEVEL_UP',
          userId,
        },
      });
    }

    // Check badge eligibility
    await this.checkBadgeEligibility(userId);

    // Update challenge progress
    await this.updateChallengeProgress(userId, action);

    return { points, xp, newLevel, newPoints, newXp };
  }

  static async checkBadgeEligibility(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: { select: { badgeId: true } },
        _count: {
          select: { complaints: true, votes: true, comments: true },
        },
      },
    });

    if (!user) return;

    const earnedBadgeIds = user.badges.map((b) => b.badgeId);
    const allBadges = await prisma.badge.findMany();

    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      let eligible = false;

      if (badge.pointsRequired > 0 && user.points >= badge.pointsRequired) {
        eligible = true;
      }

      // Check specific criteria
      if (badge.name === 'First Report' && user._count.complaints >= 1) eligible = true;
      if (badge.name === 'Community Hero' && user._count.complaints >= 50) eligible = true;
      if (badge.name === 'Verified Citizen' && user._count.votes >= 10) eligible = true;
      if (badge.name === 'Commentator' && user._count.comments >= 20) eligible = true;
      if (badge.name === 'Streak Master' && user.streak >= 30) eligible = true;

      if (eligible) {
        await prisma.userBadge.create({
          data: { userId, badgeId: badge.id },
        }).catch(() => {}); // Ignore duplicate

        await prisma.notification.create({
          data: {
            title: '🏅 New Badge Earned!',
            message: `You've earned the "${badge.name}" badge! ${badge.description}`,
            type: 'BADGE_EARNED',
            userId,
          },
        });
      }
    }
  }

  static async updateChallengeProgress(userId: string, action: string) {
    const now = new Date();
    const activeChallenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    for (const challenge of activeChallenges) {
      // Match challenge category to action
      const actionCategory = action === 'report' ? 'reporting' : action === 'verify' ? 'verification' : action;
      if (challenge.category && challenge.category !== actionCategory) continue;

      const progress = await prisma.challengeProgress.upsert({
        where: {
          userId_challengeId: { userId, challengeId: challenge.id },
        },
        create: {
          userId,
          challengeId: challenge.id,
          progress: 1,
        },
        update: {
          progress: { increment: 1 },
        },
      });

      if (progress.progress >= challenge.target && !progress.completed) {
        await prisma.challengeProgress.update({
          where: { id: progress.id },
          data: { completed: true, completedAt: now },
        });

        // Award challenge reward
        await prisma.user.update({
          where: { id: userId },
          data: { points: { increment: challenge.reward } },
        });

        await prisma.notification.create({
          data: {
            title: '🏆 Challenge Complete!',
            message: `You completed "${challenge.name}" and earned ${challenge.reward} points!`,
            type: 'CHALLENGE_COMPLETE',
            userId,
          },
        });
      }
    }
  }

  static async getLeaderboard(period: 'weekly' | 'monthly' | 'alltime' = 'alltime', limit: number = 20) {
    let dateFilter: Date | undefined;

    if (period === 'weekly') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'monthly') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const users = await prisma.user.findMany({
      where: {
        role: 'CITIZEN',
        isActive: true,
        ...(dateFilter && { lastActiveDate: { gte: dateFilter } }),
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        points: true,
        xp: true,
        level: true,
        streak: true,
        _count: {
          select: { complaints: true, votes: true },
        },
        badges: {
          include: { badge: { select: { name: true, icon: true } } },
          take: 3,
        },
      },
      orderBy: { points: 'desc' },
      take: limit,
    });

    return users.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));
  }

  static async getUserAchievements(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { complaints: true, votes: true, comments: true },
        },
      },
    });

    if (!user) return [];

    const achievements = await prisma.achievement.findMany();

    return achievements.map((achievement) => {
      let currentProgress = 0;

      switch (achievement.type) {
        case 'REPORTS_SUBMITTED': currentProgress = user._count.complaints; break;
        case 'REPORTS_VERIFIED':
        case 'VOTES_CAST': currentProgress = user._count.votes; break;
        case 'COMMENTS_MADE': currentProgress = user._count.comments; break;
        case 'STREAK_DAYS': currentProgress = user.streak; break;
        case 'POINTS_EARNED': currentProgress = user.points; break;
        case 'LEVEL_REACHED': currentProgress = user.level; break;
        default: currentProgress = 0;
      }

      return {
        ...achievement,
        currentProgress,
        completed: currentProgress >= achievement.target,
        percentage: Math.min(100, Math.round((currentProgress / achievement.target) * 100)),
      };
    });
  }

  static async getChallenges(userId: string) {
    const now = new Date();
    const challenges = await prisma.challenge.findMany({
      where: {
        isActive: true,
        endDate: { gte: now },
      },
      include: {
        progress: {
          where: { userId },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return challenges.map((challenge) => ({
      ...challenge,
      userProgress: challenge.progress[0]?.progress || 0,
      userCompleted: challenge.progress[0]?.completed || false,
      percentage: Math.min(100, Math.round(((challenge.progress[0]?.progress || 0) / challenge.target) * 100)),
    }));
  }
}

export default GamificationService;

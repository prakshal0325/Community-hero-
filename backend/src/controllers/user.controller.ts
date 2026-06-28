import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/database.js';
import GamificationService from '../services/gamification.service.js';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id || req.user?.id;
      if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, name: true, phone: true, avatar: true,
          role: true, points: true, xp: true, level: true, streak: true,
          bio: true, address: true, ward: true, isVerified: true, createdAt: true,
          badges: { include: { badge: true }, orderBy: { earnedAt: 'desc' } },
          _count: { select: { complaints: true, comments: true, votes: true } },
        },
      });

      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const { name, phone, bio, address, ward, avatar } = req.body;
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(bio !== undefined && { bio }),
          ...(address && { address }),
          ...(ward && { ward }),
          ...(avatar && { avatar }),
        },
        select: {
          id: true, email: true, name: true, phone: true, avatar: true,
          role: true, points: true, xp: true, level: true, streak: true,
          bio: true, address: true, ward: true,
        },
      });

      res.json({ message: 'Profile updated successfully', user: updated });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const period = (req.query.period as 'weekly' | 'monthly' | 'alltime') || 'alltime';
      const limit = parseInt(req.query.limit as string) || 20;
      const leaderboard = await GamificationService.getLeaderboard(period, limit);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAchievements(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const achievements = await GamificationService.getUserAchievements(req.user.id);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getChallenges(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }
      const challenges = await GamificationService.getChallenges(req.user.id);
      res.json(challenges);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getBadges(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.id || req.user?.id;
      if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const badges = await prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      });

      const allBadges = await prisma.badge.findMany();
      const earnedIds = badges.map((b) => b.badgeId);

      res.json({
        earned: badges,
        available: allBadges.filter((b) => !earnedIds.includes(b.id)),
        total: allBadges.length,
        earnedCount: badges.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getActivityHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const [complaints, comments, votes] = await Promise.all([
        prisma.complaint.findMany({
          where: { reporterId: req.user.id },
          select: { id: true, title: true, status: true, category: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.comment.findMany({
          where: { userId: req.user.id },
          select: { id: true, content: true, createdAt: true, complaint: { select: { id: true, title: true } } },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.vote.findMany({
          where: { userId: req.user.id },
          select: { id: true, type: true, createdAt: true, complaint: { select: { id: true, title: true } } },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      ]);

      // Merge and sort activities
      const activities = [
        ...complaints.map((c) => ({ type: 'report' as const, data: c, date: c.createdAt })),
        ...comments.map((c) => ({ type: 'comment' as const, data: c, date: c.createdAt })),
        ...votes.map((v) => ({ type: 'vote' as const, data: v, date: v.createdAt })),
      ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);

      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default UserController;

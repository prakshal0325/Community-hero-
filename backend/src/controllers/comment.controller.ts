import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/database.js';
import { GamificationService } from '../services/gamification.service.js';

export class CommentController {
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const { complaintId } = req.params;
      const { content } = req.body;

      const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
      if (!complaint) {
        res.status(404).json({ error: 'Complaint not found' });
        return;
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          userId: req.user.id,
          complaintId,
        },
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
        },
      });

      // Notify complaint reporter
      if (complaint.reporterId !== req.user.id) {
        await prisma.notification.create({
          data: {
            title: 'New Comment',
            message: `${req.user.name} commented on your complaint: "${content.substring(0, 50)}..."`,
            type: 'COMMENT',
            userId: complaint.reporterId,
            complaintId,
          },
        });
      }

      // Award points
      await GamificationService.awardPoints(req.user.id, 'comment', complaintId);

      res.status(201).json(comment);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getByComplaint(req: AuthRequest, res: Response) {
    try {
      const { complaintId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { complaintId },
          include: {
            user: { select: { id: true, name: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.comment.count({ where: { complaintId } }),
      ]);

      res.json({
        comments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const { id } = req.params;
      const comment = await prisma.comment.findUnique({ where: { id } });

      if (!comment) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }

      if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Not authorized to delete this comment' });
        return;
      }

      await prisma.comment.delete({ where: { id } });
      res.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
}

export default CommentController;

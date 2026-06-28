import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/database.js';
import { GamificationService } from '../services/gamification.service.js';

export class VoteController {
  static async vote(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const { complaintId } = req.params as { complaintId: string };
      const { type } = req.body; // VERIFY, REJECT, FLAG

      // Check complaint exists
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
      });
      if (!complaint) {
        res.status(404).json({ error: 'Complaint not found' });
        return;
      }

      // Check if user already voted
      const existingVote = await prisma.vote.findUnique({
        where: { userId_complaintId: { userId: req.user.id, complaintId } },
      });

      if (existingVote) {
        // Update existing vote
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        });
      } else {
        await prisma.vote.create({
          data: { type, userId: req.user.id, complaintId },
        });
      }

      // Update complaint counts
      const counts = await prisma.vote.groupBy({
        by: ['type'],
        where: { complaintId },
        _count: true,
      });

      const verifyCount = counts.find((c) => c.type === 'VERIFY')?._count || 0;
      const rejectCount = counts.find((c) => c.type === 'REJECT')?._count || 0;
      const flagCount = counts.find((c) => c.type === 'FLAG')?._count || 0;

      const totalVotes = verifyCount + rejectCount + flagCount;
      const communityScore = totalVotes > 0 ? verifyCount / totalVotes : 0;

      await prisma.complaint.update({
        where: { id: complaintId },
        data: { verificationCount: verifyCount, rejectionCount: rejectCount, flagCount, communityScore },
      });

      // Award points for verification
      if (type === 'VERIFY' && !existingVote) {
        await GamificationService.awardPoints(req.user.id, 'verify', complaintId);
      }

      res.json({
        message: `Vote recorded: ${type}`,
        counts: { verify: verifyCount, reject: rejectCount, flag: flagCount },
        communityScore,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getVotes(req: AuthRequest, res: Response) {
    try {
      const { complaintId } = req.params as { complaintId: string };
      const votes = await prisma.vote.findMany({
        where: { complaintId },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });
      res.json(votes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default VoteController;

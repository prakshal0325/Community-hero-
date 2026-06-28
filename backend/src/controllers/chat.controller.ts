import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/database.js';
import AIService from '../services/ai.service.js';
import { v4 as uuidv4 } from 'uuid';

export class ChatController {
  static async sendMessage(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const { message, sessionId } = req.body;
      const session = sessionId || uuidv4();

      // Save user message
      await prisma.chatMessage.create({
        data: {
          content: message,
          role: 'user',
          userId: req.user.id,
          sessionId: session,
        },
      });

      // Get conversation history
      const history = await prisma.chatMessage.findMany({
        where: { userId: req.user.id, sessionId: session },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });

      const messages = history.map((m) => ({ role: m.role, content: m.content }));

      // Get AI response
      const aiResponse = await AIService.chatAssistant(messages);

      // Save AI response
      const savedResponse = await prisma.chatMessage.create({
        data: {
          content: aiResponse,
          role: 'assistant',
          userId: req.user.id,
          sessionId: session,
        },
      });

      res.json({
        response: aiResponse,
        sessionId: session,
        messageId: savedResponse.id,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const { sessionId } = req.params;
      const messages = await prisma.chatMessage.findMany({
        where: { userId: req.user.id, sessionId },
        orderBy: { createdAt: 'asc' },
      });

      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getSessions(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const sessions = await prisma.chatMessage.findMany({
        where: { userId: req.user.id, role: 'user' },
        distinct: ['sessionId'],
        orderBy: { createdAt: 'desc' },
        select: { sessionId: true, content: true, createdAt: true },
        take: 20,
      });

      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async clearHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const { sessionId } = req.params;
      await prisma.chatMessage.deleteMany({
        where: { userId: req.user.id, sessionId },
      });

      res.json({ message: 'Chat history cleared' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default ChatController;

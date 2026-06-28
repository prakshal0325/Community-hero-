import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import NotificationService from '../services/notification.service.js';

export class NotificationController {
  static async getAll(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await NotificationService.getByUser(req.user.id, page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      await NotificationService.markRead(req.params.id, req.user.id);
      res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markAllRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      await NotificationService.markAllRead(req.user.id);
      res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const count = await NotificationService.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default NotificationController;

import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import ComplaintService from '../services/complaint.service.js';
import AIService from '../services/ai.service.js';
import NotificationService from '../services/notification.service.js';

export class ComplaintController {
  static async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const complaint = await ComplaintService.create({
        ...req.body,
        reporterId: req.user.id,
      });

      // Notify nearby users
      await NotificationService.notifyNearbyUsers(
        complaint.latitude,
        complaint.longitude,
        2,
        req.user.id,
        'New Issue Reported Nearby',
        `A new ${complaint.category.replace(/_/g, ' ').toLowerCase()} has been reported near your area. Help verify it!`,
        'NEARBY_COMPLAINT',
        complaint.id
      );

      res.status(201).json({
        message: 'Complaint submitted successfully',
        complaint,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getAll(req: AuthRequest, res: Response) {
    try {
      const filters = {
        status: req.query.status as any,
        category: req.query.category as any,
        priority: req.query.priority as any,
        severity: req.query.severity as any,
        ward: req.query.ward as string,
        departmentId: req.query.departmentId as string,
        assignedOfficerId: req.query.assignedOfficerId as string,
        reporterId: req.query.reporterId as string,
        search: req.query.search as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await ComplaintService.getAll(filters);
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const complaint = await ComplaintService.getById(req.params.id);
      res.json(complaint);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getNearby(req: AuthRequest, res: Response) {
    try {
      const { latitude, longitude, radius } = req.query;
      const complaints = await ComplaintService.getNearby(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        radius ? parseFloat(radius as string) : 2
      );
      res.json(complaints);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const { status, note } = req.body;
      const updated = await ComplaintService.updateStatus(
        req.params.id,
        status,
        req.user.id,
        note
      );

      res.json({ message: 'Status updated successfully', complaint: updated });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async assignOfficer(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const { officerId } = req.body;
      const updated = await ComplaintService.assignOfficer(
        req.params.id,
        officerId,
        req.user.id
      );

      res.json({ message: 'Officer assigned successfully', complaint: updated });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async uploadImages(req: AuthRequest, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const type = (req.body.type as string) || 'REPORT';
      const images = await ComplaintService.addImages(req.params.id, files, type);

      res.status(201).json({ message: 'Images uploaded successfully', images });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async analyzeImage(req: AuthRequest, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No image provided' });
        return;
      }

      // Use local path or upload to cloudinary first
      const imageUrl = file.path.startsWith('http')
        ? file.path
        : `data:${file.mimetype};base64,${require('fs').readFileSync(file.path).toString('base64')}`;

      const analysis = await AIService.analyzeImage(imageUrl);

      res.json({ message: 'Image analyzed successfully', analysis });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await ComplaintService.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getHeatmap(req: AuthRequest, res: Response) {
    try {
      const data = await ComplaintService.getHeatmapData();
      res.json(data);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getMyComplaints(req: AuthRequest, res: Response) {
    try {
      if (!req.user) { res.status(401).json({ error: 'Not authenticated' }); return; }

      const result = await ComplaintService.getAll({
        reporterId: req.user.id,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
}

export default ComplaintController;

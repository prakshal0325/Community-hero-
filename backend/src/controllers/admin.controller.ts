import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../config/database.js';
import AnalyticsService from '../services/analytics.service.js';

export class AdminController {
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as string;
      const search = req.query.search as string;

      const where: any = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true, email: true, name: true, phone: true, avatar: true,
            role: true, points: true, level: true, isVerified: true, isActive: true,
            createdAt: true,
            _count: { select: { complaints: true, comments: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role, isActive, isVerified } = req.body;

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(role && { role }),
          ...(isActive !== undefined && { isActive }),
          ...(isVerified !== undefined && { isVerified }),
        },
        select: { id: true, email: true, name: true, role: true, isActive: true, isVerified: true },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_USER',
          entity: 'User',
          entityId: id,
          details: req.body,
          userId: req.user?.id,
        },
      });

      res.json({ message: 'User updated successfully', user: updated });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getDepartments(req: AuthRequest, res: Response) {
    try {
      const departments = await prisma.department.findMany({
        include: {
          _count: { select: { complaints: true, officers: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createDepartment(req: AuthRequest, res: Response) {
    try {
      const { name, description, contactEmail, contactPhone, icon, color } = req.body;

      const department = await prisma.department.create({
        data: { name, description, contactEmail, contactPhone, icon, color },
      });

      await prisma.auditLog.create({
        data: {
          action: 'CREATE_DEPARTMENT',
          entity: 'Department',
          entityId: department.id,
          details: { name },
          userId: req.user?.id,
        },
      });

      res.status(201).json({ message: 'Department created', department });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async updateDepartment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updated = await prisma.department.update({
        where: { id },
        data: req.body,
      });
      res.json({ message: 'Department updated', department: updated });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }

  static async getSystemStats(req: AuthRequest, res: Response) {
    try {
      const stats = await AnalyticsService.getDashboardStats();
      const departmentPerf = await AnalyticsService.getDepartmentPerformance();

      res.json({ ...stats, departments: departmentPerf });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAuditLogs(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const action = req.query.action as string;
      const entity = req.query.entity as string;

      const where: any = {};
      if (action) where.action = action;
      if (entity) where.entity = entity;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getSettings(req: AuthRequest, res: Response) {
    try {
      const settings = await prisma.systemSetting.findMany();
      const result: Record<string, any> = {};
      settings.forEach((s) => { result[s.key] = s.value; });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateSettings(req: AuthRequest, res: Response) {
    try {
      const updates = req.body as Record<string, any>;

      for (const [key, value] of Object.entries(updates)) {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }

      await prisma.auditLog.create({
        data: {
          action: 'UPDATE_SETTINGS',
          entity: 'SystemSetting',
          details: updates,
          userId: req.user?.id,
        },
      });

      res.json({ message: 'Settings updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default AdminController;

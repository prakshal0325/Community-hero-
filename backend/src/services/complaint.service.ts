import prisma from '../config/database.js';
import { ComplaintStatus, ComplaintCategory, Severity, Priority, Prisma } from '@prisma/client';
import { AppError, NotFoundError, BadRequestError } from '../middlewares/errorHandler.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import AIService from './ai.service.js';
import { GamificationService } from './gamification.service.js';

interface CreateComplaintInput {
  title: string;
  description: string;
  category: ComplaintCategory;
  severity?: Severity;
  priority?: Priority;
  latitude: number;
  longitude: number;
  address: string;
  ward?: string;
  landmark?: string;
  reporterId: string;
  aiConfidence?: number;
  aiTags?: string[];
  estimatedCost?: number;
  estimatedTime?: string;
  aiDescription?: string;
}

interface ComplaintFilters {
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  priority?: Priority;
  severity?: Severity;
  ward?: string;
  departmentId?: string;
  assignedOfficerId?: string;
  reporterId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ComplaintService {
  static async create(input: CreateComplaintInput) {
    // Find department based on category
    const departmentName = AIService.getDepartmentForCategory(input.category);
    const department = await prisma.department.findFirst({
      where: { name: departmentName },
    });

    // Check for duplicates within 500m radius
    const nearbyComplaints = await this.getNearby(input.latitude, input.longitude, 0.5);
    let duplicateOfId: string | undefined;

    if (nearbyComplaints.length > 0) {
      const duplicateCheck = await AIService.detectDuplicates(
        input.description,
        input.category,
        input.latitude,
        input.longitude,
        nearbyComplaints.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          latitude: c.latitude,
          longitude: c.longitude,
        }))
      );

      if (duplicateCheck.isDuplicate && duplicateCheck.matchedComplaintId) {
        duplicateOfId = duplicateCheck.matchedComplaintId;
        // Increment verification count on the original
        await prisma.complaint.update({
          where: { id: duplicateOfId },
          data: { verificationCount: { increment: 1 } },
        });
      }
    }

    const complaint = await prisma.complaint.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        severity: input.severity || 'MEDIUM',
        priority: input.priority || 'MEDIUM',
        status: 'SUBMITTED',
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address,
        ward: input.ward,
        landmark: input.landmark,
        reporterId: input.reporterId,
        departmentId: department?.id,
        aiConfidence: input.aiConfidence,
        aiTags: input.aiTags || [],
        estimatedCost: input.estimatedCost,
        estimatedTime: input.estimatedTime,
        aiDescription: input.aiDescription,
        duplicateOfId,
      },
      include: {
        reporter: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true, color: true, icon: true } },
        images: true,
      },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        toStatus: 'SUBMITTED',
        note: duplicateOfId ? 'Report submitted (potential duplicate detected)' : 'Report submitted by citizen',
        changedById: input.reporterId,
        complaintId: complaint.id,
      },
    });

    // Award points for reporting
    await GamificationService.awardPoints(input.reporterId, 'report', complaint.id);

    return complaint;
  }

  static async getAll(filters: ComplaintFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ComplaintWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.severity) where.severity = filters.severity;
    if (filters.ward) where.ward = filters.ward;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.assignedOfficerId) where.assignedOfficerId = filters.assignedOfficerId;
    if (filters.reporterId) where.reporterId = filters.reporterId;

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          reporter: { select: { id: true, name: true, avatar: true } },
          assignedOfficer: { select: { id: true, name: true, avatar: true } },
          department: { select: { id: true, name: true, color: true, icon: true } },
          images: { take: 1 },
          _count: { select: { comments: true, votes: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.complaint.count({ where }),
    ]);

    return {
      complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, name: true, avatar: true, role: true, points: true, level: true },
        },
        assignedOfficer: {
          select: { id: true, name: true, avatar: true, role: true },
        },
        department: true,
        images: { orderBy: { uploadedAt: 'desc' } },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        votes: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        statusHistory: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        duplicateOf: {
          select: { id: true, title: true, status: true },
        },
        duplicates: {
          select: { id: true, title: true, status: true },
        },
        _count: { select: { comments: true, votes: true } },
      },
    });

    if (!complaint) {
      throw new NotFoundError('Complaint');
    }

    return complaint;
  }

  static async getNearby(latitude: number, longitude: number, radiusKm: number = 2) {
    // Haversine approximation using Prisma raw query
    const complaints = await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        status: string;
        latitude: number;
        longitude: number;
        address: string;
        severity: string;
        priority: string;
        distance: number;
      }>
    >`
      SELECT * FROM (
        SELECT id, title, description, category, status, latitude, longitude, address, severity, priority,
          (6371 * acos(
            cos(radians(${latitude})) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(latitude))
          )) AS distance
        FROM "Complaint"
        WHERE status NOT IN ('CLOSED', 'REJECTED')
      ) sub
      WHERE distance < ${radiusKm}
      ORDER BY distance
      LIMIT 50
    `;

    return complaints;
  }

  static async updateStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    userId: string,
    note?: string
  ) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true, status: true, reporterId: true },
    });

    if (!complaint) {
      throw new NotFoundError('Complaint');
    }

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: newStatus,
        ...(newStatus === 'RESOLVED' && { resolvedAt: new Date() }),
      },
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        department: { select: { name: true } },
      },
    });

    await prisma.statusHistory.create({
      data: {
        fromStatus: complaint.status,
        toStatus: newStatus,
        note: note || `Status changed to ${newStatus}`,
        changedById: userId,
        complaintId,
      },
    });

    // Notify reporter
    await prisma.notification.create({
      data: {
        title: 'Complaint Status Updated',
        message: `Your complaint "${updated.title}" status has been changed to ${newStatus.replace(/_/g, ' ')}.`,
        type: 'STATUS_CHANGE',
        userId: complaint.reporterId,
        complaintId,
      },
    });

    // Award points if resolved
    if (newStatus === 'RESOLVED') {
      await GamificationService.awardPoints(complaint.reporterId, 'resolved', complaintId);
    }

    return updated;
  }

  static async assignOfficer(complaintId: string, officerId: string, adminId: string) {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundError('Complaint');

    const officer = await prisma.user.findUnique({ where: { id: officerId } });
    if (!officer || officer.role !== 'OFFICER') {
      throw new BadRequestError('Invalid officer assignment.');
    }

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        assignedOfficerId: officerId,
        status: complaint.status === 'SUBMITTED' || complaint.status === 'PENDING_REVIEW' || complaint.status === 'ACCEPTED'
          ? 'ASSIGNED'
          : complaint.status,
      },
    });

    await prisma.statusHistory.create({
      data: {
        fromStatus: complaint.status,
        toStatus: updated.status,
        note: `Assigned to officer: ${officer.name}`,
        changedById: adminId,
        complaintId,
      },
    });

    await prisma.notification.create({
      data: {
        title: 'New Complaint Assigned',
        message: `You have been assigned complaint: "${complaint.title}"`,
        type: 'ASSIGNMENT',
        userId: officerId,
        complaintId,
      },
    });

    return updated;
  }

  static async addImages(complaintId: string, files: Express.Multer.File[], type: string = 'REPORT') {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundError('Complaint');

    const images = await Promise.all(
      files.map(async (file) => {
        const { url, publicId } = await uploadToCloudinary(file.path, `community-hero/${complaintId}`);
        return prisma.complaintImage.create({
          data: {
            url,
            publicId,
            type: type as any,
            complaintId,
          },
        });
      })
    );

    return images;
  }

  static async getStats() {
    const [total, byStatus, byCategory, byPriority, recentCount] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.complaint.groupBy({
        by: ['category'],
        _count: true,
        orderBy: { _count: { category: 'desc' } },
      }),
      prisma.complaint.groupBy({
        by: ['priority'],
        _count: true,
      }),
      prisma.complaint.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return { total, byStatus, byCategory, byPriority, recentCount };
  }

  static async getHeatmapData() {
    const complaints = await prisma.complaint.findMany({
      where: { status: { notIn: ['CLOSED', 'REJECTED'] } },
      select: {
        latitude: true,
        longitude: true,
        severity: true,
        category: true,
      },
    });

    return complaints.map((c) => ({
      lat: c.latitude,
      lng: c.longitude,
      intensity: c.severity === 'CRITICAL' ? 1.0 : c.severity === 'HIGH' ? 0.75 : c.severity === 'MEDIUM' ? 0.5 : 0.25,
      category: c.category,
    }));
  }
}

export default ComplaintService;

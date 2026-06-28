import prisma from '../config/database.js';
import { ComplaintStatus, ComplaintCategory } from '@prisma/client';

export class AnalyticsService {
  static async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      todayComplaints,
      weekComplaints,
      monthComplaints,
      totalUsers,
      activeUsers,
      avgResolutionTime,
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.complaint.count({ where: { status: { notIn: ['RESOLVED', 'CLOSED', 'REJECTED'] } } }),
      prisma.complaint.count({ where: { createdAt: { gte: today } } }),
      prisma.complaint.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.complaint.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.user.count({ where: { role: 'CITIZEN', lastActiveDate: { gte: sevenDaysAgo } } }),
      prisma.complaint.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
    ]);

    // Calculate average resolution time in hours
    let avgHours = 0;
    if (avgResolutionTime.length > 0) {
      const totalHours = avgResolutionTime.reduce((sum, c) => {
        if (c.resolvedAt) {
          return sum + (c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0);
      avgHours = Math.round(totalHours / avgResolutionTime.length);
    }

    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

    return {
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      todayComplaints,
      weekComplaints,
      monthComplaints,
      totalUsers,
      activeUsers,
      avgResolutionTimeHours: avgHours,
      resolutionRate,
    };
  }

  static async getCategoryDistribution() {
    const data = await prisma.complaint.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } },
    });

    return data.map((d) => ({
      category: d.category,
      count: d._count,
      label: d.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }

  static async getStatusDistribution() {
    const data = await prisma.complaint.groupBy({
      by: ['status'],
      _count: true,
    });

    return data.map((d) => ({
      status: d.status,
      count: d._count,
      label: d.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }

  static async getTrendData(days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const complaints = await prisma.complaint.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true, category: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyData: Record<string, { submitted: number; resolved: number }> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dailyData[key] = { submitted: 0, resolved: 0 };
    }

    complaints.forEach((c) => {
      const key = c.createdAt.toISOString().split('T')[0];
      if (dailyData[key]) {
        dailyData[key].submitted++;
        if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
          dailyData[key].resolved++;
        }
      }
    });

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  static async getDepartmentPerformance() {
    const departments = await prisma.department.findMany({
      include: {
        complaints: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
          },
        },
        _count: { select: { complaints: true, officers: true } },
      },
    });

    return departments.map((dept) => {
      const resolved = dept.complaints.filter(
        (c) => c.status === 'RESOLVED' || c.status === 'CLOSED'
      );

      let avgResolutionHours = 0;
      if (resolved.length > 0) {
        const total = resolved.reduce((sum, c) => {
          if (c.resolvedAt) {
            return sum + (c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
          }
          return sum;
        }, 0);
        avgResolutionHours = Math.round(total / resolved.length);
      }

      return {
        id: dept.id,
        name: dept.name,
        color: dept.color,
        icon: dept.icon,
        totalComplaints: dept._count.complaints,
        resolvedComplaints: resolved.length,
        pendingComplaints: dept._count.complaints - resolved.length,
        officers: dept._count.officers,
        resolutionRate: dept._count.complaints > 0
          ? Math.round((resolved.length / dept._count.complaints) * 100)
          : 0,
        avgResolutionHours,
      };
    });
  }

  static async getAreaWiseData() {
    const data = await prisma.complaint.groupBy({
      by: ['ward'],
      _count: true,
      where: { ward: { not: null } },
      orderBy: { _count: { ward: 'desc' } },
    });

    return data.map((d) => ({
      ward: d.ward || 'Unknown',
      count: d._count,
    }));
  }

  static async getMonthlyReport(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [complaints, resolved, categoryBreakdown] = await Promise.all([
      prisma.complaint.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.complaint.count({
        where: {
          resolvedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.complaint.groupBy({
        by: ['category'],
        _count: true,
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      totalComplaints: complaints,
      resolved,
      resolutionRate: complaints > 0 ? Math.round((resolved / complaints) * 100) : 0,
      categoryBreakdown: categoryBreakdown.map((d) => ({
        category: d.category,
        count: d._count,
      })),
    };
  }

  static async getMostActiveAreas(limit: number = 10) {
    const areas = await prisma.complaint.groupBy({
      by: ['ward'],
      _count: true,
      where: { ward: { not: null } },
      orderBy: { _count: { ward: 'desc' } },
      take: limit,
    });

    return areas.map((a) => ({
      area: a.ward || 'Unknown',
      complaints: a._count,
    }));
  }

  static async getTopContributors(limit: number = 10) {
    return prisma.user.findMany({
      where: { role: 'CITIZEN', isActive: true },
      select: {
        id: true,
        name: true,
        avatar: true,
        points: true,
        level: true,
        _count: { select: { complaints: true, votes: true } },
      },
      orderBy: { points: 'desc' },
      take: limit,
    });
  }
}

export default AnalyticsService;

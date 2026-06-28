import prisma from '../config/database.js';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  static async create(data: {
    title: string;
    message: string;
    type: NotificationType;
    userId: string;
    complaintId?: string;
    data?: any;
  }) {
    return prisma.notification.create({ data });
  }

  static async getByUser(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          complaint: {
            select: { id: true, title: true, status: true },
          },
        },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async markRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  static async notifyNearbyUsers(
    latitude: number,
    longitude: number,
    radiusKm: number,
    excludeUserId: string,
    title: string,
    message: string,
    type: NotificationType,
    complaintId?: string
  ) {
    // Find users within radius
    const nearbyUsers = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "User"
      WHERE id != ${excludeUserId}
        AND role = 'CITIZEN'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND (6371 * acos(
          cos(radians(${latitude})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(latitude))
        )) < ${radiusKm}
      LIMIT 50
    `;

    if (nearbyUsers.length === 0) return;

    await prisma.notification.createMany({
      data: nearbyUsers.map((user) => ({
        title,
        message,
        type,
        userId: user.id,
        complaintId,
      })),
    });

    return nearbyUsers.length;
  }
}

export default NotificationService;

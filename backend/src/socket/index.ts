import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

let io: Server;

export const initializeSocket = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: string };
      (socket as any).userId = decoded.id;
      (socket as any).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`🔌 User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join role-based rooms
    const role = (socket as any).userRole;
    socket.join(`role:${role}`);

    // Handle location updates for nearby notifications
    socket.on('update-location', (data: { latitude: number; longitude: number }) => {
      (socket as any).location = data;
    });

    // Handle joining complaint rooms for live updates
    socket.on('join-complaint', (complaintId: string) => {
      socket.join(`complaint:${complaintId}`);
    });

    socket.on('leave-complaint', (complaintId: string) => {
      socket.leave(`complaint:${complaintId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit events to specific users or rooms
export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: any) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

export const emitToComplaint = (complaintId: string, event: string, data: any) => {
  if (io) {
    io.to(`complaint:${complaintId}`).emit(event, data);
  }
};

export const emitToAll = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};

export default { initializeSocket, getIO, emitToUser, emitToRole, emitToComplaint, emitToAll };

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import complaintRoutes from './complaint.routes.js';
import {
  voteRouter,
  commentRouter,
  notificationRouter,
  userRouter,
  adminRouter,
  analyticsRouter,
  chatRouter,
} from './other.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/votes', voteRouter);
router.use('/comments', commentRouter);
router.use('/notifications', notificationRouter);
router.use('/users', userRouter);
router.use('/admin', adminRouter);
router.use('/analytics', analyticsRouter);
router.use('/chat', chatRouter);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;

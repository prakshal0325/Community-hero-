import { Router } from 'express';
import VoteController from '../controllers/vote.controller.js';
import CommentController from '../controllers/comment.controller.js';
import NotificationController from '../controllers/notification.controller.js';
import UserController from '../controllers/user.controller.js';
import AdminController from '../controllers/admin.controller.js';
import AnalyticsController from '../controllers/analytics.controller.js';
import ChatController from '../controllers/chat.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';
import { aiLimiter } from '../middlewares/rateLimiter.js';
import { z } from 'zod';

// ─── Vote Routes ─────────────────────────────────────────────
export const voteRouter = Router();

voteRouter.post('/:complaintId', authenticate, validate(z.object({
  type: z.enum(['VERIFY', 'REJECT', 'FLAG']),
})), VoteController.vote);

voteRouter.get('/:complaintId', VoteController.getVotes);

// ─── Comment Routes ──────────────────────────────────────────
export const commentRouter = Router();

commentRouter.post('/:complaintId', authenticate, validate(z.object({
  content: z.string().min(1).max(1000),
})), CommentController.create);

commentRouter.get('/:complaintId', CommentController.getByComplaint);
commentRouter.delete('/:id', authenticate, CommentController.delete);

// ─── Notification Routes ─────────────────────────────────────
export const notificationRouter = Router();

notificationRouter.get('/', authenticate, NotificationController.getAll);
notificationRouter.get('/unread-count', authenticate, NotificationController.getUnreadCount);
notificationRouter.patch('/:id/read', authenticate, NotificationController.markRead);
notificationRouter.patch('/read-all', authenticate, NotificationController.markAllRead);

// ─── User Routes ─────────────────────────────────────────────
export const userRouter = Router();

userRouter.get('/profile', authenticate, UserController.getProfile);
userRouter.get('/profile/:id', UserController.getProfile);
userRouter.patch('/profile', authenticate, UserController.updateProfile);
userRouter.get('/leaderboard', UserController.getLeaderboard);
userRouter.get('/achievements', authenticate, UserController.getAchievements);
userRouter.get('/challenges', authenticate, UserController.getChallenges);
userRouter.get('/badges', authenticate, UserController.getBadges);
userRouter.get('/badges/:id', UserController.getBadges);
userRouter.get('/activity', authenticate, UserController.getActivityHistory);

// ─── Admin Routes ────────────────────────────────────────────
export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('ADMIN'));

adminRouter.get('/users', AdminController.getUsers);
adminRouter.patch('/users/:id', AdminController.updateUser);
adminRouter.get('/departments', AdminController.getDepartments);
adminRouter.post('/departments', AdminController.createDepartment);
adminRouter.patch('/departments/:id', AdminController.updateDepartment);
adminRouter.get('/stats', AdminController.getSystemStats);
adminRouter.get('/logs', AdminController.getAuditLogs);
adminRouter.get('/settings', AdminController.getSettings);
adminRouter.patch('/settings', AdminController.updateSettings);

// ─── Analytics Routes ────────────────────────────────────────
export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', authenticate, AnalyticsController.getDashboard);
analyticsRouter.get('/categories', AnalyticsController.getCategoryDistribution);
analyticsRouter.get('/statuses', AnalyticsController.getStatusDistribution);
analyticsRouter.get('/trends', authenticate, AnalyticsController.getTrends);
analyticsRouter.get('/departments', authenticate, AnalyticsController.getDepartmentPerformance);
analyticsRouter.get('/areas', AnalyticsController.getAreaData);
analyticsRouter.get('/monthly', authenticate, AnalyticsController.getMonthlyReport);
analyticsRouter.get('/predictions', authenticate, requireRole('ADMIN', 'OFFICER'), AnalyticsController.getPredictions);
analyticsRouter.get('/top-areas', AnalyticsController.getTopAreas);
analyticsRouter.get('/top-contributors', AnalyticsController.getTopContributors);

// ─── Chat Routes ─────────────────────────────────────────────
export const chatRouter = Router();

chatRouter.post('/send', authenticate, aiLimiter, validate(z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
})), ChatController.sendMessage);

chatRouter.get('/sessions', authenticate, ChatController.getSessions);
chatRouter.get('/history/:sessionId', authenticate, ChatController.getHistory);
chatRouter.delete('/history/:sessionId', authenticate, ChatController.clearHistory);

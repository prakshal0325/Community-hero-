import { Router } from 'express';
import ComplaintController from '../controllers/complaint.controller.js';
import { authenticate, optionalAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';
import { uploadMultiple, uploadSingle } from '../middlewares/upload.js';
import { uploadLimiter, aiLimiter } from '../middlewares/rateLimiter.js';
import { z } from 'zod';

const router = Router();

const createComplaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.enum([
    'POTHOLE', 'GARBAGE', 'WATER_LEAKAGE', 'BROKEN_STREETLIGHT',
    'SEWAGE_PROBLEM', 'ROAD_DAMAGE', 'ILLEGAL_DUMPING',
    'TRAFFIC_SIGNAL_FAILURE', 'FALLEN_TREE', 'PUBLIC_PROPERTY_DAMAGE', 'OTHER'
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(3, 'Address is required'),
  ward: z.string().optional(),
  landmark: z.string().optional(),
  aiConfidence: z.number().optional(),
  aiTags: z.array(z.string()).optional(),
  estimatedCost: z.number().optional(),
  estimatedTime: z.string().optional(),
  aiDescription: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'ACCEPTED', 'ASSIGNED',
    'IN_PROGRESS', 'WORK_STARTED', 'AWAITING_VERIFICATION',
    'RESOLVED', 'CLOSED', 'REJECTED'
  ]),
  note: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/complaints:
 *   get:
 *     tags: [Complaints]
 *     summary: Get all complaints with filtering
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 */
router.get('/', optionalAuth, ComplaintController.getAll);

/**
 * @swagger
 * /api/v1/complaints/stats:
 *   get:
 *     tags: [Complaints]
 *     summary: Get complaint statistics
 */
router.get('/stats', ComplaintController.getStats);

/**
 * @swagger
 * /api/v1/complaints/heatmap:
 *   get:
 *     tags: [Complaints]
 *     summary: Get heatmap data
 */
router.get('/heatmap', ComplaintController.getHeatmap);

/**
 * @swagger
 * /api/v1/complaints/nearby:
 *   get:
 *     tags: [Complaints]
 *     summary: Get nearby complaints
 */
router.get('/nearby', ComplaintController.getNearby);

/**
 * @swagger
 * /api/v1/complaints/my:
 *   get:
 *     tags: [Complaints]
 *     summary: Get my complaints
 *     security: [{ bearerAuth: [] }]
 */
router.get('/my', authenticate, ComplaintController.getMyComplaints);

/**
 * @swagger
 * /api/v1/complaints:
 *   post:
 *     tags: [Complaints]
 *     summary: Create a new complaint
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, validate(createComplaintSchema), ComplaintController.create);

/**
 * @swagger
 * /api/v1/complaints/analyze:
 *   post:
 *     tags: [AI]
 *     summary: Analyze an image with AI
 *     security: [{ bearerAuth: [] }]
 */
router.post('/analyze', authenticate, aiLimiter, uploadSingle, ComplaintController.analyzeImage);

/**
 * @swagger
 * /api/v1/complaints/:id:
 *   get:
 *     tags: [Complaints]
 *     summary: Get complaint by ID
 */
router.get('/:id', optionalAuth, ComplaintController.getById);

/**
 * @swagger
 * /api/v1/complaints/:id/status:
 *   patch:
 *     tags: [Complaints]
 *     summary: Update complaint status
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/status', authenticate, requireRole('OFFICER', 'ADMIN'), validate(updateStatusSchema), ComplaintController.updateStatus);

/**
 * @swagger
 * /api/v1/complaints/:id/assign:
 *   patch:
 *     tags: [Complaints]
 *     summary: Assign officer to complaint
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/assign', authenticate, requireRole('ADMIN', 'OFFICER'), ComplaintController.assignOfficer);

/**
 * @swagger
 * /api/v1/complaints/:id/images:
 *   post:
 *     tags: [Complaints]
 *     summary: Upload images to complaint
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/images', authenticate, uploadLimiter, uploadMultiple, ComplaintController.uploadImages);

export default router;

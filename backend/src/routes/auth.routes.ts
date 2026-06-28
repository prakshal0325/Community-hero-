import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validator.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const otpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: Registration successful }
 *       409: { description: Email already exists }
 */
router.post('/register', authLimiter, validate(registerSchema), AuthController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 */
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     tags: [Auth]
 *     summary: Login with Google OAuth
 */
router.post('/google', authLimiter, AuthController.googleAuth);

/**
 * @swagger
 * /api/v1/auth/otp/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request OTP for login
 */
router.post('/otp/request', authLimiter, validate(otpSchema), AuthController.requestOTP);

/**
 * @swagger
 * /api/v1/auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP and login
 */
router.post('/otp/verify', authLimiter, validate(verifyOtpSchema), AuthController.verifyOTP);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', authenticate, AuthController.me);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset OTP
 */
router.post('/forgot-password', authLimiter, validate(otpSchema), AuthController.forgotPassword);

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with OTP
 */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

export default router;

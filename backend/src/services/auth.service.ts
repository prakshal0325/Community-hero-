import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';
import env from '../config/env.js';
import { Role } from '@prisma/client';
import { AppError, ConflictError, UnauthorizedError, BadRequestError } from '../middlewares/errorHandler.js';
import emailService from './email.service.js';

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: Role;
}

interface LoginInput {
  email: string;
  password: string;
}

interface TokenPayload {
  id: string;
  email: string;
  role: Role;
}

export class AuthService {
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });
  }

  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError('An account with this email already exists.');
    }

    if (input.phone) {
      const phoneExists = await prisma.user.findUnique({ where: { phone: input.phone } });
      if (phoneExists) {
        throw new ConflictError('An account with this phone number already exists.');
      }
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        phone: input.phone || null,
        role: input.role || Role.CITIZEN,
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(input.name)}`,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    const tokenPayload: TokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.name).catch(() => {});

    return { user, accessToken, refreshToken };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        avatar: true,
        isActive: true,
        points: true,
        xp: true,
        level: true,
        streak: true,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const tokenPayload: TokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Update refresh token and streak
    const now = new Date();
    const lastActive = await prisma.user.findUnique({
      where: { id: user.id },
      select: { lastActiveDate: true, streak: true },
    });

    let newStreak = lastActive?.streak || 0;
    if (lastActive?.lastActiveDate) {
      const diff = Math.floor((now.getTime() - lastActive.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        newStreak += 1;
      } else if (diff > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastActiveDate: now, streak: newStreak },
    });

    const { password: _, ...userWithoutPassword } = user;

    return { user: { ...userWithoutPassword, streak: newStreak }, accessToken, refreshToken };
  }

  static async googleAuth(googleId: string, email: string, name: string, avatar?: string) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        googleId: true,
        isActive: true,
        points: true,
        xp: true,
        level: true,
        streak: true,
      },
    });

    if (user && !user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated.');
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          avatar: avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
          isVerified: true,
          role: Role.CITIZEN,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          googleId: true,
          isActive: true,
          points: true,
          xp: true,
          level: true,
          streak: true,
        },
      });
    } else if (!user.googleId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { googleId, isVerified: true },
      });
    }

    const tokenPayload: TokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastActiveDate: new Date() },
    });

    return { user, accessToken, refreshToken };
  }

  static async generateOTP(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestError('No account found with this email.');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiresAt: expiresAt },
    });

    // Send OTP via email (log to console as fallback)
    console.log(`🔑 OTP for ${email}: ${otp}`);
    emailService.sendOTPEmail(email, user.name || email, otp).catch(() => {});

    return { message: 'OTP sent successfully', otpSentTo: email };
  }

  static async verifyOTP(email: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        otpCode: true,
        otpExpiresAt: true,
        isActive: true,
        points: true,
        xp: true,
        level: true,
        streak: true,
      },
    });

    if (!user) {
      throw new BadRequestError('No account found with this email.');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestError('No OTP requested. Please request a new OTP.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestError('OTP has expired. Please request a new one.');
    }

    if (user.otpCode !== otp) {
      throw new BadRequestError('Invalid OTP. Please try again.');
    }

    // Clear OTP and generate tokens
    const tokenPayload: TokenPayload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiresAt: null,
        isVerified: true,
        refreshToken,
        lastActiveDate: new Date(),
      },
    });

    const { otpCode: _, otpExpiresAt: __, ...userWithoutOtp } = user;
    return { user: userWithoutOtp, accessToken, refreshToken };
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, refreshToken: true, isActive: true },
      });

      if (!user || !user.isActive || user.refreshToken !== token) {
        throw new UnauthorizedError('Invalid refresh token.');
      }

      const tokenPayload: TokenPayload = { id: user.id, email: user.email, role: user.role };
      const accessToken = this.generateAccessToken(tokenPayload);
      const newRefreshToken = this.generateRefreshToken(tokenPayload);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        points: true,
        xp: true,
        level: true,
        streak: true,
        bio: true,
        address: true,
        ward: true,
        isVerified: true,
        createdAt: true,
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
        _count: {
          select: {
            complaints: true,
            comments: true,
            votes: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return { message: 'If an account exists with this email, a password reset code has been sent.' };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiresAt: expiresAt },
    });

    console.log(`🔑 Password reset OTP for ${email}: ${otp}`);
    emailService.sendPasswordResetEmail(email, user.name, otp).catch(() => {});

    return { message: 'If an account exists with this email, a password reset code has been sent.' };
  }

  static async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, otpCode: true, otpExpiresAt: true },
    });

    if (!user) {
      throw new BadRequestError('Invalid email or OTP.');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestError('No password reset was requested. Please request a new code.');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestError('Reset code has expired. Please request a new one.');
    }

    if (user.otpCode !== otp) {
      throw new BadRequestError('Invalid reset code. Please try again.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }
}

export default AuthService;

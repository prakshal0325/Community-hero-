import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import AuthService from '../services/auth.service.js';

export class AuthController {
  static async register(req: AuthRequest, res: Response) {
    try {
      const { email, password, name, phone } = req.body;
      const result = await AuthService.register({ email, password, name, phone });
      res.status(201).json({
        message: 'Registration successful',
        ...result,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      res.json({
        message: 'Login successful',
        ...result,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  static async googleAuth(req: AuthRequest, res: Response) {
    try {
      const { googleId, email, name, avatar } = req.body;
      const result = await AuthService.googleAuth(googleId, email, name, avatar);
      res.json({
        message: 'Google authentication successful',
        ...result,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  static async requestOTP(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;
      const result = await AuthService.generateOTP(email);
      res.json(result);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  static async verifyOTP(req: AuthRequest, res: Response) {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.verifyOTP(email, otp);
      res.json({
        message: 'OTP verified successfully',
        ...result,
      });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  static async refreshToken(req: AuthRequest, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }
      const result = await AuthService.refreshToken(refreshToken);
      res.json(result);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  static async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }
      const profile = await AuthService.getProfile(req.user.id);
      res.json(profile);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  static async forgotPassword(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.json(result);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }

  static async resetPassword(req: AuthRequest, res: Response) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await AuthService.resetPassword(email, otp, newPassword);
      res.json(result);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  }
}

export default AuthController;

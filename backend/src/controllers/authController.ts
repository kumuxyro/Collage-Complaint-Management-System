import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.ts';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  }

  public static async logout(_req: Request, res: Response): Promise<void> {
    // Client-side session clearing contract
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully.' },
    });
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code } = req.body;
      const result = await AuthService.verifyOtp(email, code);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code, newPassword } = req.body;
      const result = await AuthService.resetPassword(email, code, newPassword);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

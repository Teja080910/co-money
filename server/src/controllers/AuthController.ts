import { Request, Response } from 'express';
import { Controller, Post } from '@overnightjs/core';
import { AppService } from '../services/AppService';

@Controller('api/auth')
export class AuthController {
  private appService = new AppService();

  @Post('register')
  private async register(req: Request, res: Response) {
    try {
      return res.status(201).json(await this.appService.register(req.body));
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  @Post('verify-email')
  private async verifyEmail(req: Request, res: Response) {
    try {
      const { userId, otp } = req.body as { userId: string; otp: string };
      return res.status(200).json(await this.appService.verifyEmail(userId, otp));
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  @Post('login')
  private async login(req: Request, res: Response) {
    try {
      return res.status(200).json(await this.appService.login(req.body));
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }
}

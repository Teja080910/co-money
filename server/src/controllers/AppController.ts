import { Request, Response } from 'express';
import { Controller, Get, Post } from '@overnightjs/core';
import { AppService } from '../services/AppService';

@Controller('api/app')
export class AppController {
  private appService = new AppService();

  @Get('overview/:userId')
  private async getOverview(req: Request, res: Response) {
    try {
      return res.status(200).json(await this.appService.getOverview(req.params.userId as string));
    } catch (error) {
      return res.status(404).json({ error: (error as Error).message });
    }
  }

  @Get('wallet/:userId')
  private async getWallet(req: Request, res: Response) {
    try {
      return res.status(200).json(await this.appService.getWalletSummary(req.params.userId as string));
    } catch (error) {
      return res.status(404).json({ error: (error as Error).message });
    }
  }

  @Get('transactions/:userId')
  private async getTransactions(req: Request, res: Response) {
    try {
      return res.status(200).json(await this.appService.getTransactions(req.params.userId as string));
    } catch (error) {
      return res.status(404).json({ error: (error as Error).message });
    }
  }

  @Get('promotions')
  private async getPromotions(req: Request, res: Response) {
    return res.status(200).json(await this.appService.getPromotions());
  }

  @Get('shops')
  private async getShops(req: Request, res: Response) {
    return res.status(200).json(await this.appService.getShops());
  }

  @Get('events')
  private async getEvents(req: Request, res: Response) {
    return res.status(200).json(await this.appService.getEvents());
  }

  @Get('users')
  private async getUsers(req: Request, res: Response) {
    return res.status(200).json(await this.appService.getUsers());
  }

  @Get('qr/:userId')
  private async getQr(req: Request, res: Response) {
    try {
      return res.status(200).json(await this.appService.getQrPayload(req.params.userId as string));
    } catch (error) {
      return res.status(404).json({ error: (error as Error).message });
    }
  }

  @Post('transactions/preview')
  private async previewTransaction(req: Request, res: Response) {
    try {
      return res.status(200).json(await this.appService.previewTransaction(req.body));
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  @Post('transactions')
  private async processTransaction(req: Request, res: Response) {
    try {
      return res.status(201).json(await this.appService.processTransaction(req.body));
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  @Post('promotions')
  private async createPromotion(req: Request, res: Response) {
    try {
      return res.status(201).json(await this.appService.createPromotion(req.body));
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }

  @Post('events')
  private async createEvent(req: Request, res: Response) {
    try {
      return res.status(201).json(await this.appService.createEvent(req.body));
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
  }
}

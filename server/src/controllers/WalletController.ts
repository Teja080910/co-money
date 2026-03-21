import { Controller, Get, Post } from '@overnightjs/core';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/requireRole';
import { WalletService } from '../services/WalletService';

@Controller('api/wallet')
export class WalletController {
    private walletService = new WalletService();

    @Get('me')
    private async getMyWallet(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const wallet = await this.walletService.getWalletSummary(authenticatedUser);
            return res.status(200).json(wallet);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Get('qr-code')
    private async getQrCode(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const qrCode = await this.walletService.getCustomerQrCode(authenticatedUser);
            return res.status(200).json(qrCode);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Get('customer/:customerId')
    private async getCustomerWallet(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const customerId = req.params.customerId as string;
            const wallet = await this.walletService.getWalletSummary(authenticatedUser, customerId);
            return res.status(200).json(wallet);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Get('transactions')
    private async getTransactions(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const customerId = typeof req.query.customerId === 'string' ? req.query.customerId : undefined;
            const shopId = typeof req.query.shopId === 'string' ? req.query.shopId : undefined;
            const type = typeof req.query.type === 'string' ? req.query.type : undefined;
            const status = typeof req.query.status === 'string' ? req.query.status : undefined;
            const transactions = await this.walletService.getTransactions(authenticatedUser, customerId, shopId, type, status);
            return res.status(200).json(transactions);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Get('reports/summary')
    private async getReport(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const report = await this.walletService.getReport(authenticatedUser);
            return res.status(200).json(report);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('earn')
    private async earnPoints(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const result = await this.walletService.earnPoints(authenticatedUser, req.body);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('scan-customer')
    private async scanCustomer(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const qrValue = String(req.body.qrValue || '');
            const result = await this.walletService.scanCustomerQr(authenticatedUser, qrValue);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('spend')
    private async spendPoints(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const result = await this.walletService.spendPoints(authenticatedUser, req.body);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}

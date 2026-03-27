import { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../config/db';
import { User } from '../models/User';
import { AuthenticatedRequest } from './requireRole';
import { verifyAccessToken } from '../utils/jwt';

export async function attachAuthenticatedUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userRepository = AppDataSource.getRepository(User);
    const authorizationHeader = req.header('authorization')?.trim();
    const userIdHeader = req.header('x-user-id')?.trim();
    const userEmailHeader = req.header('x-user-email')?.trim().toLowerCase();

    if (authorizationHeader?.startsWith('Bearer ')) {
        const accessToken = authorizationHeader.slice('Bearer '.length).trim();
        const payload = verifyAccessToken(accessToken);

        if (payload) {
            const user = await userRepository.findOneBy({ id: payload.sub });

            if (user && user.isActive && !user.deletedAt) {
                authenticatedRequest.authenticatedUser = {
                    id: user.id,
                    role: user.role,
                    email: user.email,
                };
                return next();
            }
        }
    }

    if (!userIdHeader && !userEmailHeader) {
        return next();
    }

    const user = userIdHeader
        ? await userRepository.findOneBy({ id: userIdHeader })
        : await userRepository.findOneBy({ email: userEmailHeader! });

    if (user && user.isActive && !user.deletedAt) {
        authenticatedRequest.authenticatedUser = {
            id: user.id,
            role: user.role,
            email: user.email,
        };
    }

    next();
}

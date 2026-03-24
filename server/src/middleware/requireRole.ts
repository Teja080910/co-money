import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../constants/userRoles';

export type AuthenticatedUser = {
    id: string;
    role: UserRole;
    email: string;
};

export type AuthenticatedRequest = Request & {
    authenticatedUser?: AuthenticatedUser;
};

export function requireRole(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): Response | void => {
        const authenticatedRequest = req as AuthenticatedRequest;
        const requestUser = authenticatedRequest.authenticatedUser;

        if (!requestUser) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (!allowedRoles.includes(requestUser.role)) {
            return res.status(403).json({ error: 'Insufficient permissions.' });
        }

        next();
    };
}

export function getAuthenticatedUser(req: Request, res: Response, ...allowedRoles: UserRole[]): AuthenticatedUser | null {
    const authenticatedRequest = req as AuthenticatedRequest;
    const requestUser = authenticatedRequest.authenticatedUser;

    if (!requestUser) {
        res.status(401).json({ error: 'Authentication required.' });
        return null;
    }

    if (allowedRoles.length && !allowedRoles.includes(requestUser.role)) {
        res.status(403).json({ error: 'Insufficient permissions.' });
        return null;
    }

    return requestUser;
}

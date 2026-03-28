import { Controller, Delete, Get, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/requireRole';
import { EventService } from '../services/EventService';
import { getPaginationParams, paginateItems } from '../utils/pagination';

@Controller('api/events')
export class EventController {
    private eventService = new EventService();

    @Get('')
    private async list(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const events = await this.eventService.listEvents(authenticatedUser);
            const pagination = getPaginationParams(req.query);
            return res.status(200).json(
                pagination.enabled ? paginateItems(events, pagination) : events,
            );
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Post('')
    private async create(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const event = await this.eventService.createEvent(authenticatedUser, req.body);
            return res.status(201).json(event);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Put(':id')
    private async update(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const event = await this.eventService.updateEvent(authenticatedUser, req.params.id as string, req.body);
            return res.status(200).json(event);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    @Delete(':id')
    private async remove(req: Request, res: Response) {
        try {
            const authenticatedUser = (req as AuthenticatedRequest).authenticatedUser;
            if (!authenticatedUser) {
                return res.status(401).json({ error: 'Authentication required.' });
            }

            const result = await this.eventService.deleteEvent(authenticatedUser, req.params.id as string);
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}

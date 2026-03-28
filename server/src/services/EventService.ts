import { AppDataSource } from '../config/db';
import { UserRole } from '../constants/userRoles';
import { Event } from '../models/Event';

type CurrentUser = {
    id: string;
    role: UserRole;
};

type EventInput = {
    title?: string;
    description?: string;
    location?: string;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
};

export class EventService {
    private eventRepository = AppDataSource.getRepository(Event);

    public async listEvents(currentUser: CurrentUser) {
        const now = new Date();
        const events = await this.eventRepository.find({
            order: { startsAt: 'ASC', createdAt: 'DESC' },
        });

        if (currentUser.role === UserRole.ADMIN) {
            return events;
        }

        if (currentUser.role === UserRole.REPRESENTATIVE) {
            return events.filter(event => event.createdByUserId === currentUser.id);
        }

        return events.filter(event => event.isActive && event.endsAt >= now);
    }

    public async createEvent(currentUser: CurrentUser, input: EventInput) {
        if (![UserRole.ADMIN, UserRole.REPRESENTATIVE].includes(currentUser.role)) {
            throw new Error('You do not have permission to manage events.');
        }

        const title = input.title?.trim();
        const location = input.location?.trim();
        const startsAt = this.parseDate(input.startsAt, 'Event start date is required.');
        const endsAt = this.parseDate(input.endsAt, 'Event end date is required.');

        if (!title) {
            throw new Error('Event title is required.');
        }

        if (!location) {
            throw new Error('Event location is required.');
        }

        if (endsAt < startsAt) {
            throw new Error('Event end date must be after the start date.');
        }

        const event = this.eventRepository.create({
            title,
            description: input.description?.trim() || null,
            location,
            startsAt,
            endsAt,
            createdByUserId: currentUser.id,
            isActive: input.isActive ?? true,
        });

        return this.eventRepository.save(event);
    }

    public async updateEvent(currentUser: CurrentUser, eventId: string, input: EventInput) {
        if (![UserRole.ADMIN, UserRole.REPRESENTATIVE].includes(currentUser.role)) {
            throw new Error('You do not have permission to manage events.');
        }

        const event = await this.eventRepository.findOneBy({ id: eventId.trim() });
        if (!event) {
            throw new Error('Event not found.');
        }

        if (currentUser.role === UserRole.REPRESENTATIVE && event.createdByUserId !== currentUser.id) {
            throw new Error('You do not have permission to manage this event.');
        }

        if (input.title !== undefined) {
            const title = input.title.trim();
            if (!title) {
                throw new Error('Event title is required.');
            }
            event.title = title;
        }

        if (input.description !== undefined) {
            event.description = input.description?.trim() || null;
        }

        if (input.location !== undefined) {
            const location = input.location.trim();
            if (!location) {
                throw new Error('Event location is required.');
            }
            event.location = location;
        }

        if (input.startsAt !== undefined) {
            event.startsAt = this.parseDate(input.startsAt, 'Event start date is required.');
        }

        if (input.endsAt !== undefined) {
            event.endsAt = this.parseDate(input.endsAt, 'Event end date is required.');
        }

        if (event.endsAt < event.startsAt) {
            throw new Error('Event end date must be after the start date.');
        }

        if (typeof input.isActive === 'boolean') {
            event.isActive = input.isActive;
        }

        return this.eventRepository.save(event);
    }

    public async deleteEvent(currentUser: CurrentUser, eventId: string) {
        if (![UserRole.ADMIN, UserRole.REPRESENTATIVE].includes(currentUser.role)) {
            throw new Error('You do not have permission to manage events.');
        }

        const event = await this.eventRepository.findOneBy({ id: eventId.trim() });
        if (!event) {
            throw new Error('Event not found.');
        }

        if (currentUser.role === UserRole.REPRESENTATIVE && event.createdByUserId !== currentUser.id) {
            throw new Error('You do not have permission to manage this event.');
        }

        await this.eventRepository.remove(event);
        return { id: event.id };
    }

    private parseDate(value: string | undefined, errorMessage: string): Date {
        const parsed = value ? new Date(value) : null;
        if (!parsed || Number.isNaN(parsed.getTime())) {
            throw new Error(errorMessage);
        }

        return parsed;
    }
}

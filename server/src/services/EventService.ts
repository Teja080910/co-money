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

        if ([UserRole.ADMIN, UserRole.REPRESENTATIVE].includes(currentUser.role)) {
            return events;
        }

        return events.filter(event => event.isActive && event.endsAt >= now);
    }

    public async createEvent(currentUser: CurrentUser, input: EventInput) {
        if (currentUser.role !== UserRole.ADMIN) {
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

    public async deleteEvent(currentUser: CurrentUser, eventId: string) {
        if (currentUser.role !== UserRole.ADMIN) {
            throw new Error('You do not have permission to manage events.');
        }

        const event = await this.eventRepository.findOneBy({ id: eventId.trim() });
        if (!event) {
            throw new Error('Event not found.');
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

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    description!: string | null;

    @Column({ type: 'varchar', length: 255 })
    location!: string;

    @Column({ type: 'timestamp' })
    startsAt!: Date;

    @Column({ type: 'timestamp' })
    endsAt!: Date;

    @Column({ type: 'uuid' })
    createdByUserId!: string;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

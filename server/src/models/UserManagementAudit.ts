import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_management_audits')
export class UserManagementAudit {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    actorUserId!: string;

    @Column({ type: 'uuid' })
    targetUserId!: string;

    @Column({ type: 'varchar', length: 50 })
    action!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    reason!: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata!: Record<string, unknown> | null;

    @CreateDateColumn()
    createdAt!: Date;
}

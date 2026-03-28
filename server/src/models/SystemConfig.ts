import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('system_configs')
export class SystemConfig {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'integer' })
    version!: number;

    @Column({ type: 'integer', default: 10 })
    welcomeBonusPoints!: number;

    @Column({ type: 'integer', default: 365 })
    pointExpirationDays!: number;

    @Column({ type: 'integer', default: 1000 })
    maxPointsPerTransaction!: number;

    @Column({ type: 'integer', default: 30 })
    defaultMaxDiscountPercent!: number;

    @Column({ type: 'uuid' })
    updatedByUserId!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    changeReason!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}

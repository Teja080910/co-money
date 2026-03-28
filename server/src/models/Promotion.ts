import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('promotions')
export class Promotion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    description!: string | null;

    @Column({ type: 'uuid' })
    shopId!: string;

    @Column({ type: 'uuid' })
    merchantId!: string;

    @Column({ type: 'integer', default: 0 })
    bonusPoints!: number;

    @Column({ type: 'integer', default: 30 })
    maxDiscountPercent!: number;

    @Column({ type: 'timestamp' })
    startsAt!: Date;

    @Column({ type: 'timestamp' })
    endsAt!: Date;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

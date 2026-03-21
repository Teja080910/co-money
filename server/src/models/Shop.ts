import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('shops')
export class Shop {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    name!: string;

    @Column({ type: 'varchar', length: 255, default: '' })
    location!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    description!: string | null;

    @Column({ type: 'uuid' })
    merchantId!: string;

    @Column({ type: 'uuid', nullable: true })
    representativeId!: string | null;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

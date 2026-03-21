import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { UserRole } from '../domain/types';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, default: '' })
    fullName!: string;

    @Column({ type: 'varchar', length: 255 })
    username!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ name: 'password', type: 'varchar' })
    passwordHash!: string;

    @Column({ type: 'varchar', length: 32, default: 'customer' })
    role!: UserRole;

    @Column({ type: 'boolean', default: false })
    verified!: boolean;

    @Column({ type: 'text', array: true, default: () => "'{}'" })
    managedShopIds!: string[];

    @Column({ type: 'text', array: true, default: () => "'{}'" })
    managedMerchantIds!: string[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../constants/userRoles';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    firstName!: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    lastName!: string | null;

    @Column({ type: 'varchar', length: 255 })
    username!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar' })
    password!: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
    role!: UserRole;

    @Column({ type: 'boolean', default: false })
    emailVerified!: boolean;

    @Column({ type: 'varchar', length: 6, nullable: true })
    verificationCode!: string | null;

    @Column({ type: 'timestamp', nullable: true })
    verificationCodeExpiresAt!: Date | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

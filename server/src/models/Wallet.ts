import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('wallets')
export class Wallet {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', unique: true })
    customerId!: string;

    @Column({ type: 'integer', default: 0 })
    balance!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

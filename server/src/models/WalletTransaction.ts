import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { WalletPointType } from '../constants/walletPointTypes';
import { WalletTransactionStatus } from '../constants/walletTransactionStatuses';
import { WalletTransactionType } from '../constants/walletTransactionTypes';

@Entity('wallet_transactions')
export class WalletTransaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    walletId!: string;

    @Column({ type: 'uuid' })
    customerId!: string;

    @Column({ type: 'uuid', nullable: true })
    merchantId!: string | null;

    @Column({ type: 'uuid' })
    performedByUserId!: string;

    @Column({ type: 'uuid', nullable: true })
    shopId!: string | null;

    @Column({ type: 'uuid', nullable: true })
    fromShopId!: string | null;

    @Column({ type: 'uuid', nullable: true })
    toShopId!: string | null;

    @Column({ type: 'enum', enum: WalletTransactionType })
    type!: WalletTransactionType;

    @Column({ type: 'enum', enum: WalletPointType, default: WalletPointType.STANDARD })
    pointType!: WalletPointType;

    @Column({ type: 'enum', enum: WalletTransactionStatus, default: WalletTransactionStatus.SUCCESS })
    status!: WalletTransactionStatus;

    @Column({ type: 'integer' })
    points!: number;

    @Column({ type: 'integer', nullable: true })
    purchaseAmount!: number | null;

    @Column({ type: 'integer', nullable: true })
    discountAmount!: number | null;

    @Column({ type: 'integer', nullable: true })
    payableAmount!: number | null;

    @Column({ type: 'integer', nullable: true })
    earnedPoints!: number | null;

    @Column({ type: 'boolean', default: false })
    isFirstTransactionBonus!: boolean;

    @Column({ type: 'integer' })
    balanceBefore!: number;

    @Column({ type: 'integer' })
    balanceAfter!: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description!: string | null;

    @CreateDateColumn()
    createdAt!: Date;
}

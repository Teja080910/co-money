import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('promotion_claims')
@Unique('UQ_promotion_claims_promotion_customer', ['promotionId', 'customerId'])
export class PromotionClaim {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    promotionId!: string;

    @Column({ type: 'uuid' })
    customerId!: string;

    @Column({ type: 'uuid' })
    walletTransactionId!: string;

    @CreateDateColumn()
    claimedAt!: Date;
}

import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { AppStateData } from '../domain/types';

@Entity('app_state')
export class AppState {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  shops!: AppStateData['shops'];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  wallets!: AppStateData['wallets'];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  promotions!: AppStateData['promotions'];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  events!: AppStateData['events'];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  transactions!: AppStateData['transactions'];

  @UpdateDateColumn()
  updatedAt!: Date;
}

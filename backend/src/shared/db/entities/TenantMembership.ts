import { Entity, Column, Index, Unique } from 'typeorm';
import { AppBaseEntity } from './BaseEntity.js';

@Entity({ name: 'tenant_memberships', schema: 'main' })
@Unique(['tenantId', 'userId'])
@Index('idx_tenant_memberships_tenant', ['tenantId'])
@Index('idx_tenant_memberships_user', ['userId'])
export class TenantMembership extends AppBaseEntity {
  @Column({ name: 'tenant_id', type: 'text' })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'text' })
  userId!: string;

  @Column({ type: 'text', default: 'member' })
  role!: string;

  @Column({ name: 'created_at', type: 'bigint' })
  createdAt!: number;
}

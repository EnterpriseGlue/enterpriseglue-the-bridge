import { Entity, Column, Index } from 'typeorm';
import { AppBaseEntity } from './BaseEntity.js';

@Entity({ name: 'invitations', schema: 'main' })
@Index('idx_invitations_token', ['token'])
@Index('idx_invitations_email', ['email'])
@Index('idx_invitations_tenant', ['tenantId'])
export class Invitation extends AppBaseEntity {
  @Column({ type: 'text', unique: true })
  token!: string;

  @Column({ type: 'text' })
  email!: string;

  @Column({ name: 'tenant_id', type: 'text' })
  tenantId!: string;

  @Column({ name: 'resource_type', type: 'text' })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'text', nullable: true })
  resourceId!: string | null;

  @Column({ type: 'text', default: 'member' })
  role!: string;

  @Column({ name: 'invited_by_user_id', type: 'text' })
  invitedByUserId!: string;

  @Column({ name: 'expires_at', type: 'bigint' })
  expiresAt!: number;

  @Column({ name: 'accepted_at', type: 'bigint', nullable: true })
  acceptedAt!: number | null;

  @Column({ name: 'accepted_by_user_id', type: 'text', nullable: true })
  acceptedByUserId!: string | null;

  @Column({ name: 'revoked_at', type: 'bigint', nullable: true })
  revokedAt!: number | null;

  @Column({ name: 'revoked_by_user_id', type: 'text', nullable: true })
  revokedByUserId!: string | null;

  @Column({ name: 'created_at', type: 'bigint' })
  createdAt!: number;
}

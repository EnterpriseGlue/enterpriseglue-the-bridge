import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'tenant_settings', schema: 'main' })
export class TenantSettings {
  @PrimaryColumn({ name: 'tenant_id', type: 'text' })
  tenantId!: string;

  @Column({ name: 'invite_allow_all_domains', type: 'boolean', default: true })
  inviteAllowAllDomains!: boolean;

  @Column({ name: 'invite_allowed_domains', type: 'text', default: '[]' })
  inviteAllowedDomains!: string;

  @Column({ name: 'email_send_config_id', type: 'text', nullable: true })
  emailSendConfigId!: string | null;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'logo_title', type: 'text', nullable: true })
  logoTitle!: string | null;

  @Column({ name: 'logo_scale', type: 'integer', default: 100 })
  logoScale!: number;

  @Column({ name: 'title_font_url', type: 'text', nullable: true })
  titleFontUrl!: string | null;

  @Column({ name: 'title_font_weight', type: 'text', default: '600' })
  titleFontWeight!: string;

  @Column({ name: 'title_font_size', type: 'integer', default: 14 })
  titleFontSize!: number;

  @Column({ name: 'title_vertical_offset', type: 'integer', default: 0 })
  titleVerticalOffset!: number;

  @Column({ name: 'menu_accent_color', type: 'text', nullable: true })
  menuAccentColor!: string | null;

  @Column({ name: 'updated_at', type: 'bigint' })
  updatedAt!: number;

  @Column({ name: 'updated_by_user_id', type: 'text', nullable: true })
  updatedByUserId!: string | null;
}

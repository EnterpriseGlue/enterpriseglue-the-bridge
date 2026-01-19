import { Table, TableIndex } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsTable1700000000001 implements MigrationInterface {
  name = 'AddNotificationsTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          { name: 'id', type: 'text', isPrimary: true },
          { name: 'user_id', type: 'text' },
          { name: 'tenant_id', type: 'text', isNullable: true },
          { name: 'state', type: 'text' },
          { name: 'title', type: 'text' },
          { name: 'subtitle', type: 'text', isNullable: true },
          { name: 'read_at', type: 'bigint', isNullable: true },
          { name: 'created_at', type: 'bigint' },
        ],
      }),
      true
    );

    await queryRunner.createIndices('notifications', [
      new TableIndex({ name: 'idx_notifications_user', columnNames: ['user_id'] }),
      new TableIndex({ name: 'idx_notifications_tenant', columnNames: ['tenant_id'] }),
      new TableIndex({ name: 'idx_notifications_state', columnNames: ['state'] }),
      new TableIndex({ name: 'idx_notifications_created', columnNames: ['created_at'] }),
      new TableIndex({ name: 'idx_notifications_read', columnNames: ['read_at'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notifications');
  }
}

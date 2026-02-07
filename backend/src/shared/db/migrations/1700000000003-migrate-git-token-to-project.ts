import { TableColumn } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Move Git PAT from user-level git_credentials to project-level git_repositories.
 * 
 * Adds new columns to git_repositories and copies the encrypted token from
 * git_credentials (matched via connectedByUserId + providerId).
 */
export class MigrateGitTokenToProject1700000000003 implements MigrationInterface {
  name = 'MigrateGitTokenToProject1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const gitReposTable = queryRunner.connection.getMetadata('GitRepository').tablePath;

    // 1. Add new columns to git_repositories
    const existingColumns = await queryRunner.getTable(gitReposTable);
    const columnNames = (existingColumns?.columns || []).map(c => c.name);

    if (!columnNames.includes('encrypted_token')) {
      await queryRunner.addColumns(gitReposTable, [
        new TableColumn({ name: 'encrypted_token', type: 'text', isNullable: true }),
        new TableColumn({ name: 'last_validated_at', type: 'bigint', isNullable: true }),
        new TableColumn({ name: 'token_scope_hint', type: 'text', isNullable: true }),
        new TableColumn({ name: 'auto_push_enabled', type: 'boolean', isNullable: true }),
        new TableColumn({ name: 'auto_pull_enabled', type: 'boolean', isNullable: true }),
      ]);
    }

    // 2. Copy encrypted tokens from git_credentials to git_repositories
    // Match by connected_by_user_id + provider_id
    const gitCredsTable = queryRunner.connection.getMetadata('GitCredential').tablePath;

    try {
      // Get all git_repositories that don't yet have a token
      const repos = await queryRunner.query(
        `SELECT id, connected_by_user_id, provider_id FROM ${gitReposTable} WHERE encrypted_token IS NULL`
      );

      for (const repo of repos) {
        if (!repo.connected_by_user_id || !repo.provider_id) continue;

        const creds = await queryRunner.query(
          `SELECT access_token FROM ${gitCredsTable} WHERE user_id = ? AND provider_id = ? LIMIT 1`,
          [repo.connected_by_user_id, repo.provider_id]
        );

        if (creds.length > 0 && creds[0].access_token) {
          await queryRunner.query(
            `UPDATE ${gitReposTable} SET encrypted_token = ? WHERE id = ?`,
            [creds[0].access_token, repo.id]
          );
        }
      }
    } catch (err) {
      // git_credentials table may not exist yet in fresh installs — that's fine
      console.warn('Migration: Could not copy tokens from git_credentials (may not exist):', err);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const gitReposTable = queryRunner.connection.getMetadata('GitRepository').tablePath;

    const existingColumns = await queryRunner.getTable(gitReposTable);
    const columnNames = (existingColumns?.columns || []).map(c => c.name);

    const toDrop = ['encrypted_token', 'last_validated_at', 'token_scope_hint', 'auto_push_enabled', 'auto_pull_enabled'];
    for (const col of toDrop) {
      if (columnNames.includes(col)) {
        await queryRunner.dropColumn(gitReposTable, col);
      }
    }
  }
}

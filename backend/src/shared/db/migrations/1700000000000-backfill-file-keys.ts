import { TableColumn } from 'typeorm';
import type { MigrationInterface, QueryRunner } from 'typeorm';

function extractBpmnProcessId(xml: string): string | null {
  const match = String(xml || '').match(/<\s*(?:[a-zA-Z0-9_-]+:)?process\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/i)
  return match?.[1] ? String(match[1]) : null
}

function extractDmnDecisionId(xml: string): string | null {
  const match = String(xml || '').match(/<\s*(?:[a-zA-Z0-9_-]+:)?decision\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/i)
  return match?.[1] ? String(match[1]) : null
}

export class AddFileLinkColumns1700000000000 implements MigrationInterface {
  name = 'AddFileLinkColumns1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns using TypeORM's database-agnostic API
    await queryRunner.addColumns('files', [
      new TableColumn({ name: 'bpmn_process_id', type: 'text', isNullable: true }),
      new TableColumn({ name: 'dmn_decision_id', type: 'text', isNullable: true }),
    ]);

    // Get fully-qualified table name from TypeORM (handles schema automatically)
    const filesTable = queryRunner.connection.getMetadata('File').tablePath;

    // Fetch all files using database-agnostic query
    const files = await queryRunner.query(
      `SELECT id, type, xml, bpmn_process_id, dmn_decision_id FROM ${filesTable}`
    );

    // Backfill using parameterized queries (TypeORM handles parameter syntax per DB)
    for (const file of files) {
      const type = String(file.type || '');
      if (type === 'bpmn') {
        const nextId = extractBpmnProcessId(String(file.xml || ''));
        if (nextId && nextId !== file.bpmn_process_id) {
          await queryRunner.manager
            .createQueryBuilder()
            .update('File')
            .set({ bpmnProcessId: nextId })
            .where('id = :id', { id: file.id })
            .execute();
        }
      } else if (type === 'dmn') {
        const nextId = extractDmnDecisionId(String(file.xml || ''));
        if (nextId && nextId !== file.dmn_decision_id) {
          await queryRunner.manager
            .createQueryBuilder()
            .update('File')
            .set({ dmnDecisionId: nextId })
            .where('id = :id', { id: file.id })
            .execute();
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('files', 'dmn_decision_id');
    await queryRunner.dropColumn('files', 'bpmn_process_id');
  }
}

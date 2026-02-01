import { Router } from 'express';
import { asyncHandler } from '@shared/middleware/errorHandler.js';
import { getConnectionPool } from '@shared/db/db-pool.js';

const router = Router();

/**
 * GET /api/t/:tenantSlug/auth/sso-config
 * Returns tenant SSO enforcement configuration
 */
router.get('/api/t/:tenantSlug/auth/sso-config', asyncHandler(async (req, res) => {
  const tenantSlug = String(req.params.tenantSlug || '').trim();
  if (!tenantSlug) {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  const pool = getConnectionPool();
  const tenantResult = await pool.query<{ id: string }>(
    'SELECT id FROM main.tenants WHERE slug = $1',
    [tenantSlug]
  );
  const tenantId = tenantResult.rows[0]?.id;
  if (!tenantId) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  const settingsResult = await pool.query<{ sso_required: boolean }>(
    'SELECT sso_required FROM main.tenant_settings WHERE tenant_id = $1',
    [tenantId]
  );
  const ssoRequired = Boolean(settingsResult.rows[0]?.sso_required);

  return res.json({ ssoRequired });
}));

export default router;

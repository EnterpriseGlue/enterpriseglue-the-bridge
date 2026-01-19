import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from '@carbon/react';
import { Enterprise } from '@carbon/icons-react';
import { apiClient } from '../shared/api/client';
import { config } from '../config';

interface TenantMembership {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: string;
}

export default function TenantPicker() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [loading, setLoading] = useState(true);

  if (!config.multiTenant) {
    return null;
  }

  const tenantSlugMatch = pathname.match(/^\/t\/([^/]+)(?:\/|$)/);
  const currentTenantSlug = tenantSlugMatch?.[1] ? decodeURIComponent(tenantSlugMatch[1]) : null;

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<TenantMembership[]>('/api/auth/my-tenants');
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load tenant memberships:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantChange = (selectedItem: TenantMembership | null) => {
    if (!selectedItem) return;

    const effectivePath = currentTenantSlug
      ? pathname.replace(/^\/t\/[^/]+/, '') || '/'
      : pathname;

    if (selectedItem.tenantSlug === 'default') {
      navigate(effectivePath);
    } else {
      navigate(`/t/${encodeURIComponent(selectedItem.tenantSlug)}${effectivePath}`);
    }
  };

  if (loading || tenants.length <= 1) {
    return null;
  }

  const currentTenant = tenants.find((t) => t.tenantSlug === currentTenantSlug) || tenants.find((t) => t.tenantSlug === 'default');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
        marginLeft: 'var(--spacing-4)',
        marginRight: 'var(--spacing-2)',
      }}
    >
      <Enterprise size={16} style={{ color: 'var(--cds-icon-secondary)' }} />
      <Dropdown
        id="tenant-picker"
        size="sm"
        label="Select tenant"
        titleText=""
        hideLabel
        items={tenants}
        itemToString={(item: TenantMembership | null) => item?.tenantName || ''}
        selectedItem={currentTenant}
        onChange={({ selectedItem }) => handleTenantChange(selectedItem)}
        style={{ minWidth: '160px' }}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Button,
  TextInput,
  Tile,
  Toggle,
} from '@carbon/react';
import { Save, Settings } from '@carbon/icons-react';
import { PageHeader, PageLayout, PAGE_GRADIENTS } from '../../shared/components/PageLayout';
import { apiClient } from '../../shared/api/client';
import { parseApiError } from '../../shared/api/apiErrorUtils';
import { useToast } from '../../shared/notifications/ToastProvider';

type TenantSettingsResponse = {
  tenantId: string;
  inviteAllowAllDomains: boolean;
  inviteAllowedDomains: string[];
  emailSendConfigId: string | null;
  logoUrl: string | null;
  logoTitle: string | null;
  logoScale: number | null;
  titleFontUrl: string | null;
  titleFontWeight: string | null;
  titleFontSize: number | null;
  titleVerticalOffset: number | null;
  menuAccentColor: string | null;
  updatedAt: number | null;
  updatedByUserId: string | null;
};

export default function TenantSettings() {
  const { pathname } = useLocation();
  const { notify } = useToast();

  const tenantSlugMatch = pathname.match(/^\/t\/([^/]+)(?:\/|$)/);
  const tenantSlug = tenantSlugMatch?.[1] ? decodeURIComponent(tenantSlugMatch[1]) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [inviteAllowAllDomains, setInviteAllowAllDomains] = useState(true);
  const [inviteAllowedDomainsRaw, setInviteAllowedDomainsRaw] = useState('');

  const [logoUrl, setLogoUrl] = useState('');
  const [logoTitle, setLogoTitle] = useState('');
  const [menuAccentColor, setMenuAccentColor] = useState('');

  const allowedDomains = useMemo(() => {
    return Array.from(
      new Set(
        String(inviteAllowedDomainsRaw || '')
          .split(',')
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean)
          .map((d) => (d.includes('@') ? d.split('@').pop() || '' : d))
          .map((d) => d.replace(/^\.+/, '').replace(/\.+$/, ''))
          .filter(Boolean)
      )
    );
  }, [inviteAllowedDomainsRaw]);

  const loadSettings = async () => {
    if (!tenantSlug) return;
    setLoading(true);

    try {
      const data = await apiClient.get<TenantSettingsResponse>(
        `/api/t/${encodeURIComponent(tenantSlug)}/admin/settings`
      );

      setInviteAllowAllDomains(Boolean(data.inviteAllowAllDomains));
      setInviteAllowedDomainsRaw((Array.isArray(data.inviteAllowedDomains) ? data.inviteAllowedDomains : []).join(', '));
      setLogoUrl(String(data.logoUrl || ''));
      setLogoTitle(String(data.logoTitle || ''));
      setMenuAccentColor(String(data.menuAccentColor || ''));
    } catch (e: any) {
      const parsed = parseApiError(e, 'Failed to load tenant settings');
      notify({ kind: 'error', title: 'Failed to load tenant settings', subtitle: parsed.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tenantSlug) return;
    loadSettings();
  }, [tenantSlug]);

  const handleSave = async () => {
    if (!tenantSlug) return;
    setSaving(true);

    try {
      const body: any = {
        inviteAllowAllDomains,
        inviteAllowedDomains: allowedDomains,
        logoUrl: logoUrl.trim() || null,
        logoTitle: logoTitle.trim() || null,
        menuAccentColor: menuAccentColor.trim() || null,
      };

      await apiClient.put(`/api/t/${encodeURIComponent(tenantSlug)}/admin/settings`, body);
      notify({ kind: 'success', title: 'Settings saved' });
      await loadSettings();
    } catch (e: any) {
      const parsed = parseApiError(e, 'Failed to save tenant settings');
      notify({ kind: 'error', title: 'Failed to save tenant settings', subtitle: parsed.message });
    } finally {
      setSaving(false);
    }
  };

  if (!tenantSlug) {
    return (
      <PageLayout>
        <h1>Tenant context missing</h1>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Tenant-specific settings and defaults"
        gradient={PAGE_GRADIENTS.blue}
      />

      <div style={{ padding: 'var(--spacing-5)', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
        <Tile style={{ padding: 'var(--spacing-5)', opacity: loading ? 0.6 : 1 }}>
          <h3 style={{ margin: 0, marginBottom: 'var(--spacing-4)', fontSize: 18, fontWeight: 600 }}>Invitations</h3>

          <Toggle
            id="invite-allow-all-domains"
            labelText="Allow invitations to any email domain"
            labelA="Restricted"
            labelB="Any"
            toggled={inviteAllowAllDomains}
            onToggle={(v) => setInviteAllowAllDomains(v)}
            disabled={loading || saving}
          />

          {!inviteAllowAllDomains && (
            <div style={{ marginTop: 'var(--spacing-4)' }}>
              <TextInput
                id="invite-allowed-domains"
                labelText="Allowed domains (comma-separated)"
                placeholder="example.com, partner.org"
                value={inviteAllowedDomainsRaw}
                onChange={(e) => setInviteAllowedDomainsRaw(e.target.value)}
                disabled={loading || saving}
                helperText="Invites will be restricted to these domains"
              />
            </div>
          )}
        </Tile>

        <Tile style={{ padding: 'var(--spacing-5)', opacity: loading ? 0.6 : 1 }}>
          <h3 style={{ margin: 0, marginBottom: 'var(--spacing-4)', fontSize: 18, fontWeight: 600 }}>Branding</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <TextInput
              id="tenant-logo-url"
              labelText="Logo URL (optional)"
              placeholder="https://..."
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={loading || saving}
            />
            <TextInput
              id="tenant-logo-title"
              labelText="Logo title (optional)"
              placeholder="Your workspace"
              value={logoTitle}
              onChange={(e) => setLogoTitle(e.target.value)}
              disabled={loading || saving}
            />
            <TextInput
              id="tenant-menu-accent"
              labelText="Menu accent color (hex, optional)"
              placeholder="#0f62fe"
              value={menuAccentColor}
              onChange={(e) => setMenuAccentColor(e.target.value)}
              disabled={loading || saving}
            />
          </div>
        </Tile>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button kind="primary" renderIcon={Save} onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}

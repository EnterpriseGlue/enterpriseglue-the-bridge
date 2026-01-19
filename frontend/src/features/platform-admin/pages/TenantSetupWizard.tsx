import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ProgressIndicator,
  ProgressStep,
  Button,
  TextInput,
  Toggle,
  InlineNotification,
  Tag,
  Tile,
} from '@carbon/react';
import { ArrowRight, ArrowLeft, Checkmark, Enterprise, UserFollow, Security, Email, TrashCan } from '@carbon/icons-react';
import { PageLayout, PageHeader, PAGE_GRADIENTS } from '../../../shared/components/PageLayout';
import { apiClient } from '../../../shared/api/client';
import { parseApiError } from '../../../shared/api/apiErrorUtils';

interface TenantSettings {
  tenantId: string;
  inviteAllowAllDomains: boolean;
  inviteAllowedDomains: string[];
  emailSendConfigId: string | null;
}

export default function TenantSetupWizard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tenantSlugMatch = pathname.match(/^\/t\/([^/]+)(?:\/|$)/);
  const tenantSlug = tenantSlugMatch?.[1] ? decodeURIComponent(tenantSlugMatch[1]) : null;
  const tenantPrefix = tenantSlug ? `/t/${encodeURIComponent(tenantSlug)}` : '';

  const [settings, setSettings] = useState<TenantSettings>({
    tenantId: '',
    inviteAllowAllDomains: true,
    inviteAllowedDomains: [],
    emailSendConfigId: null,
  });

  const [newDomain, setNewDomain] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (tenantSlug) {
      loadTenantSettings();
    }
  }, [tenantSlug]);

  const loadTenantSettings = async () => {
    try {
      setLoading(true);
      const tenants = await apiClient.get<any[]>('/api/auth/my-tenants');
      const currentTenant = tenants.find((t: any) => t.tenantSlug === tenantSlug);

      if (!currentTenant || currentTenant.role !== 'tenant_admin') {
        navigate(tenantPrefix || '/');
        return;
      }

      setSettings((prev) => ({ ...prev, tenantId: currentTenant.tenantId }));
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to load settings');
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (domain && !settings.inviteAllowedDomains.includes(domain)) {
      setSettings((prev) => ({
        ...prev,
        inviteAllowedDomains: [...prev.inviteAllowedDomains, domain],
      }));
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setSettings((prev) => ({
      ...prev,
      inviteAllowedDomains: prev.inviteAllowedDomains.filter((d) => d !== domain),
    }));
  };

  const handleAddInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (email && email.includes('@') && !invitedEmails.includes(email)) {
      setInvitedEmails((prev) => [...prev, email]);
      setInviteEmail('');
    }
  };

  const handleRemoveInvite = (email: string) => {
    setInvitedEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleSendInvites = async () => {
    if (invitedEmails.length === 0 || !tenantSlug) return;
    
    try {
      setInviting(true);
      setError('');
      
      let successCount = 0;
      let failCount = 0;
      
      for (const email of invitedEmails) {
        try {
          await apiClient.post(`/api/t/${encodeURIComponent(tenantSlug)}/invitations`, {
            email,
            resourceType: 'tenant',
            role: 'member',
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        setSuccess(`${successCount} invitation(s) sent! They will receive an email shortly.`);
      }
      if (failCount > 0) {
        setError(`${failCount} invitation(s) failed to send.`);
      }
      setInvitedEmails([]);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to send invites');
      setError(parsed.message);
    } finally {
      setInviting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setSaving(true);
      setError('');

      setSuccess('Setup complete! Redirecting to dashboard...');
      setTimeout(() => {
        navigate(tenantPrefix || '/');
      }, 1500);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to save settings');
      setError(parsed.message);
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { label: 'Welcome', secondaryLabel: 'Get started' },
    { label: 'Invite Domains', secondaryLabel: 'Configure allowed domains' },
    { label: 'SSO', secondaryLabel: 'Single sign-on' },
    { label: 'Invite Users', secondaryLabel: 'Add team members' },
    { label: 'Complete', secondaryLabel: 'Finish setup' },
  ];

  if (loading) {
    return (
      <PageLayout style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-6)',
        background: 'var(--color-bg-primary)',
        minHeight: '100vh',
      }}
    >
      <PageHeader
        icon={Enterprise}
        title="Tenant Setup"
        subtitle="Configure your tenant to get started"
        gradient={PAGE_GRADIENTS.green}
      />

      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          onCloseButtonClick={() => setError('')}
        />
      )}

      {success && (
        <InlineNotification
          kind="success"
          title="Success"
          subtitle={success}
          onCloseButtonClick={() => setSuccess('')}
        />
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <ProgressIndicator currentIndex={currentStep} spaceEqually>
          {steps.map((step, index) => (
            <ProgressStep
              key={index}
              label={step.label}
              secondaryLabel={step.secondaryLabel}
              complete={index < currentStep}
              current={index === currentStep}
            />
          ))}
        </ProgressIndicator>

        <div
          style={{
            marginTop: 'var(--spacing-7)',
            padding: 'var(--spacing-6)',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--color-border-primary)',
          }}
        >
          {currentStep === 0 && (
            <div>
              <h2 style={{ marginBottom: 'var(--spacing-4)' }}>Welcome to your new tenant!</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-5)' }}>
                This wizard will help you configure your tenant settings. You can always change these settings later.
              </p>
              <ul style={{ color: 'var(--color-text-secondary)', marginLeft: 'var(--spacing-5)' }}>
                <li>Configure which email domains can be invited to your tenant</li>
                <li>Set up SSO integration (coming soon)</li>
                <li>Invite your first team members</li>
              </ul>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 style={{ marginBottom: 'var(--spacing-4)' }}>Invite Domain Settings</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-5)' }}>
                Control which email domains can be invited to join your tenant.
              </p>

              <Toggle
                id="allow-all-domains"
                labelText="Allow all email domains"
                labelA="Restricted"
                labelB="All domains"
                toggled={settings.inviteAllowAllDomains}
                onToggle={(checked) => setSettings((prev) => ({ ...prev, inviteAllowAllDomains: checked }))}
                style={{ marginBottom: 'var(--spacing-5)' }}
              />

              {!settings.inviteAllowAllDomains && (
                <div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                    <TextInput
                      id="new-domain"
                      labelText="Add allowed domain"
                      placeholder="example.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                      style={{ flex: 1 }}
                    />
                    <Button kind="secondary" onClick={handleAddDomain} style={{ alignSelf: 'flex-end' }}>
                      Add
                    </Button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                    {settings.inviteAllowedDomains.map((domain) => (
                      <Tag key={domain} type="blue" filter onClose={() => handleRemoveDomain(domain)}>
                        {domain}
                      </Tag>
                    ))}
                    {settings.inviteAllowedDomains.length === 0 && (
                      <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>
                        No domains added yet. Add at least one domain to allow invitations.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <Security size={24} />
                Single Sign-On (SSO)
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-5)' }}>
                Configure SSO to allow users to sign in with their corporate identity provider.
              </p>

              <Tile style={{ padding: 'var(--spacing-5)', backgroundColor: 'var(--color-bg-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                  <Security size={32} style={{ color: 'var(--cds-icon-secondary)' }} />
                  <div>
                    <h4 style={{ marginBottom: 'var(--spacing-2)' }}>SSO Configuration</h4>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: 'var(--spacing-3)' }}>
                      SSO integration with SAML 2.0 and OIDC providers is coming soon. Contact your platform administrator to configure SSO for your tenant.
                    </p>
                    <Tag type="blue">Coming Soon</Tag>
                  </div>
                </div>
              </Tile>

              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginTop: 'var(--spacing-4)' }}>
                You can skip this step for now and configure SSO later from your tenant settings.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <UserFollow size={24} />
                Invite Team Members
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-5)' }}>
                Invite colleagues to join your tenant. They will receive an email with instructions to sign up.
              </p>

              <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
                <TextInput
                  id="invite-email"
                  labelText="Email address"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddInvite()}
                  style={{ flex: 1 }}
                />
                <Button kind="secondary" onClick={handleAddInvite} style={{ alignSelf: 'flex-end' }}>
                  Add
                </Button>
              </div>

              {invitedEmails.length > 0 && (
                <div style={{ marginBottom: 'var(--spacing-4)' }}>
                  <p style={{ fontSize: '14px', marginBottom: 'var(--spacing-2)', color: 'var(--color-text-secondary)' }}>
                    Pending invitations ({invitedEmails.length}):
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                    {invitedEmails.map((email) => (
                      <div
                        key={email}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-bg-tertiary)',
                          borderRadius: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                          <Email size={16} />
                          <span>{email}</span>
                        </div>
                        <Button
                          kind="ghost"
                          size="sm"
                          hasIconOnly
                          renderIcon={TrashCan}
                          iconDescription="Remove"
                          onClick={() => handleRemoveInvite(email)}
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    kind="primary"
                    renderIcon={UserFollow}
                    onClick={handleSendInvites}
                    disabled={inviting}
                    style={{ marginTop: 'var(--spacing-4)' }}
                  >
                    {inviting ? 'Sending...' : `Send ${invitedEmails.length} Invitation(s)`}
                  </Button>
                </div>
              )}

              {invitedEmails.length === 0 && (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>
                  No invitations added yet. You can skip this step and invite users later.
                </p>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div style={{ textAlign: 'center' }}>
              <Checkmark size={48} style={{ color: 'var(--cds-support-success)', marginBottom: 'var(--spacing-4)' }} />
              <h2 style={{ marginBottom: 'var(--spacing-4)' }}>Setup Complete!</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-5)' }}>
                Your tenant is now configured and ready to use. You can invite team members and start working.
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-5)' }}>
          <Button
            kind="secondary"
            renderIcon={ArrowLeft}
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button renderIcon={ArrowRight} onClick={() => setCurrentStep((prev) => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button renderIcon={Checkmark} onClick={handleComplete} disabled={saving}>
              {saving ? 'Saving...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TextInput,
  PasswordInput,
  Button,
  InlineLoading,
  Tile,
} from '@carbon/react';
import { ArrowRight, Checkmark, Close, Enterprise, Email } from '@carbon/icons-react';
import { useAuth } from '../shared/hooks/useAuth';
import { apiClient } from '../shared/api/client';
import { parseApiError } from '../shared/api/apiErrorUtils';
import { useToast } from '../shared/notifications/ToastProvider';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { notify } = useToast();

  const [step, setStep] = useState<'tenant' | 'account' | 'verification'>('tenant');
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [createdTenant, setCreatedTenant] = useState<{ slug: string } | null>(null);

  useEffect(() => {
    if (!tenantSlug || tenantSlug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const data = await apiClient.get<{ available: boolean }>(
          '/api/auth/signup/check-slug',
          { slug: tenantSlug }
        );
        setSlugAvailable(data.available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [tenantSlug]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
  };

  const handleTenantNameChange = (value: string) => {
    setTenantName(value);
    if (!tenantSlug || tenantSlug === generateSlug(tenantName)) {
      setTenantSlug(generateSlug(value));
    }
  };

  const handleNextStep = () => {
    if (step === 'tenant') {
      if (!tenantName || !tenantSlug || !slugAvailable) {
        notify({
          kind: 'error',
          title: 'Missing details',
          subtitle: 'Please enter a valid tenant name and unique slug',
        });
        return;
      }
      setStep('account');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      notify({ kind: 'error', title: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      notify({ kind: 'error', title: 'Password too short', subtitle: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);

    try {
      const data = await apiClient.post<{ tenant: { slug: string } }>(
        '/api/auth/signup',
        {
          tenantName,
          tenantSlug,
          email,
          firstName,
          lastName,
          password,
        }
      );

      setCreatedTenant({ slug: data.tenant.slug });
      setStep('verification');
    } catch (err) {
      const parsed = parseApiError(err, 'Signup failed');
      notify({ kind: 'error', title: 'Signup failed', subtitle: parsed.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
        padding: 'var(--spacing-6)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
          <Enterprise size={48} style={{ color: 'var(--cds-interactive-01)', marginBottom: 'var(--spacing-4)' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: 'var(--spacing-2)' }}>
            Create your workspace
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Get started with EnterpriseGlue in minutes
          </p>
        </div>

        <Tile style={{ padding: 'var(--spacing-6)' }}>
          {step === 'tenant' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--spacing-5)' }}>
                Step 1: Create your tenant
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
                <TextInput
                  id="tenant-name"
                  labelText="Organization name"
                  placeholder="Acme Corporation"
                  value={tenantName}
                  onChange={(e) => handleTenantNameChange(e.target.value)}
                />

                <div>
                  <TextInput
                    id="tenant-slug"
                    labelText="Workspace URL"
                    placeholder="acme"
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(generateSlug(e.target.value))}
                    invalid={slugAvailable === false}
                    invalidText="This slug is already taken"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                      app.enterpriseglue.ai/t/{tenantSlug || 'your-slug'}
                    </span>
                    {slugChecking && <InlineLoading description="Checking..." />}
                    {!slugChecking && slugAvailable === true && (
                      <Checkmark size={16} style={{ color: 'var(--cds-support-success)' }} />
                    )}
                    {!slugChecking && slugAvailable === false && (
                      <Close size={16} style={{ color: 'var(--cds-support-error)' }} />
                    )}
                  </div>
                </div>

                <Button
                  renderIcon={ArrowRight}
                  onClick={handleNextStep}
                  disabled={!tenantName || !tenantSlug || slugAvailable !== true}
                  style={{ width: '100%' }}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'account' && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--spacing-5)' }}>
                Step 2: Create your account
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                  <TextInput
                    id="first-name"
                    labelText="First name"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <TextInput
                    id="last-name"
                    labelText="Last name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                <TextInput
                  id="email"
                  type="email"
                  labelText="Email address"
                  placeholder="john@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <PasswordInput
                  id="password"
                  labelText="Password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <PasswordInput
                  id="confirm-password"
                  labelText="Confirm password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-2)' }}>
                  <Button kind="secondary" onClick={() => setStep('tenant')} disabled={loading}>
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} style={{ flex: 1 }}>
                    {loading ? 'Creating account...' : 'Create account'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step === 'verification' && (
            <div style={{ textAlign: 'center' }}>
              <Email size={48} style={{ color: 'var(--cds-interactive-01)', marginBottom: 'var(--spacing-4)' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--spacing-3)' }}>
                Check your email
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-4)' }}>
                We've sent a verification link to <strong>{email}</strong>. Please click the link to verify your email and activate your workspace.
              </p>
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', marginBottom: 'var(--spacing-4)' }}>
                Didn't receive the email? Check your spam folder or click below to resend.
              </p>
              <Button
                kind="tertiary"
                size="sm"
                disabled={resending}
                onClick={async () => {
                  setResending(true);
                  try {
                    await apiClient.post('/api/auth/resend-verification', { email });
                    notify({ kind: 'success', title: 'Verification email sent' });
                  } catch {
                    notify({ kind: 'error', title: 'Failed to resend verification email' });
                  } finally {
                    setResending(false);
                  }
                }}
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </Button>
            </div>
          )}
        </Tile>

        <p style={{ textAlign: 'center', marginTop: 'var(--spacing-5)', color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cds-link-01)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

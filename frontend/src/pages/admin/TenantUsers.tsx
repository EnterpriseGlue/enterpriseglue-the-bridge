import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Tile,
} from '@carbon/react';
import { Add, TrashCan, Renew, UserMultiple } from '@carbon/icons-react';
import { PageHeader, PageLayout, PAGE_GRADIENTS } from '../../shared/components/PageLayout';
import { apiClient } from '../../shared/api/client';
import { parseApiError } from '../../shared/api/apiErrorUtils';
import { useModal } from '../../shared/hooks/useModal';
import ConfirmModal from '../../shared/components/ConfirmModal';
import InviteMemberModal from '../../components/InviteMemberModal';
import { useToast } from '../../shared/notifications/ToastProvider';

type TenantRole = 'member' | 'tenant_admin';

type TenantUserRow = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: TenantRole;
  createdAt: number;
};

type TenantInvitationRow = {
  id: string;
  email: string;
  resourceType: string;
  resourceId: string | null;
  role: string;
  expiresAt: number;
  acceptedAt: number | null;
  revokedAt: number | null;
  createdAt: number;
};

export default function TenantUsers() {
  const { pathname } = useLocation();

  const tenantSlugMatch = pathname.match(/^\/t\/([^/]+)(?:\/|$)/);
  const tenantSlug = tenantSlugMatch?.[1] ? decodeURIComponent(tenantSlugMatch[1]) : null;

  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [invites, setInvites] = useState<TenantInvitationRow[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);

  const { notify } = useToast();

  const inviteModal = useModal();
  const removeModal = useModal<TenantUserRow>();
  const revokeInviteModal = useModal<TenantInvitationRow>();

  const [busyRemove, setBusyRemove] = useState(false);
  const [busyRevoke, setBusyRevoke] = useState(false);
  const [busyResend, setBusyResend] = useState<string | null>(null);

  const canLoad = Boolean(tenantSlug);

  const loadUsers = async () => {
    if (!tenantSlug) return;
    setUsersLoading(true);
    try {
      const data = await apiClient.get<TenantUserRow[]>(
        `/api/t/${encodeURIComponent(tenantSlug)}/admin/users`
      );
      setUsers(Array.isArray(data) ? data : []);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadInvites = async () => {
    if (!tenantSlug) return;
    setInvitesLoading(true);
    try {
      const data = await apiClient.get<TenantInvitationRow[]>(
        `/api/t/${encodeURIComponent(tenantSlug)}/invitations`
      );
      const rows = Array.isArray(data) ? data : [];
      setInvites(rows.filter((r) => String(r.resourceType || '') === 'tenant'));
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    if (!canLoad) return;

    Promise.all([loadUsers(), loadInvites()]).catch((e: any) => {
      const parsed = parseApiError(e, 'Failed to load tenant users');
      notify({ kind: 'error', title: 'Failed to load tenant users', subtitle: parsed.message });
    });
  }, [tenantSlug]);

  const rows = useMemo(() => {
    return users.map((u) => ({
      id: u.userId,
      email: u.email,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—',
      role: u.role,
    }));
  }, [users]);

  const headers = useMemo(
    () => [
      { key: 'email', header: 'Email' },
      { key: 'name', header: 'Name' },
      { key: 'role', header: 'Role' },
      { key: 'actions', header: 'Actions' },
    ],
    []
  );

  const handleUpdateRole = async (userId: string, role: TenantRole) => {
    if (!tenantSlug) return;

    try {
      await apiClient.patch(
        `/api/t/${encodeURIComponent(tenantSlug)}/admin/users/${encodeURIComponent(userId)}`,
        { role }
      );
      notify({ kind: 'success', title: 'Role updated' });
      await loadUsers();
    } catch (e: any) {
      const parsed = parseApiError(e, 'Failed to update role');
      notify({ kind: 'error', title: 'Failed to update role', subtitle: parsed.message });
    }
  };

  const handleRemoveUser = async () => {
    if (!tenantSlug || !removeModal.data) return;
    setBusyRemove(true);

    try {
      await apiClient.delete(
        `/api/t/${encodeURIComponent(tenantSlug)}/admin/users/${encodeURIComponent(removeModal.data.userId)}`
      );
      notify({ kind: 'success', title: 'User removed from tenant' });
      removeModal.closeModal();
      await loadUsers();
    } catch (e: any) {
      const parsed = parseApiError(e, 'Failed to remove user');
      notify({ kind: 'error', title: 'Failed to remove user', subtitle: parsed.message });
    } finally {
      setBusyRemove(false);
    }
  };

  const handleRevokeInvite = async () => {
    if (!tenantSlug || !revokeInviteModal.data) return;
    setBusyRevoke(true);

    try {
      await apiClient.delete(
        `/api/t/${encodeURIComponent(tenantSlug)}/invitations/${encodeURIComponent(revokeInviteModal.data.id)}`
      );
      notify({ kind: 'success', title: 'Invitation revoked' });
      revokeInviteModal.closeModal();
      await loadInvites();
    } catch (e: any) {
      const parsed = parseApiError(e, 'Failed to revoke invitation');
      notify({ kind: 'error', title: 'Failed to revoke invitation', subtitle: parsed.message });
    } finally {
      setBusyRevoke(false);
    }
  };

  const handleResendInvite = async (invitationId: string) => {
    if (!tenantSlug) return;
    setBusyResend(invitationId);

    try {
      await apiClient.post(
        `/api/t/${encodeURIComponent(tenantSlug)}/invitations/${encodeURIComponent(invitationId)}/resend`
      );
      notify({ kind: 'success', title: 'Invitation resent' });
      await loadInvites();
    } catch (e: any) {
      const parsed = parseApiError(e, 'Failed to resend invitation');
      notify({ kind: 'error', title: 'Failed to resend invitation', subtitle: parsed.message });
    } finally {
      setBusyResend(null);
    }
  };

  if (!tenantSlug) {
    return (
      <PageLayout>
        <h1>Tenant context missing</h1>
      </PageLayout>
    );
  }

  const pendingTenantInvites = invites.filter((i) => !i.acceptedAt && !i.revokedAt);

  return (
    <PageLayout>
      <PageHeader
        icon={UserMultiple}
        title="Users"
        subtitle="Manage users and invitations for this tenant"
        gradient={PAGE_GRADIENTS.purple}
      />

      <div style={{ padding: 'var(--spacing-5)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
        <Tile style={{ padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-4)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Members</h3>
            <Button kind="primary" renderIcon={Add} onClick={() => inviteModal.openModal()}>
              Invite User
            </Button>
          </div>

          <div style={{ marginTop: 'var(--spacing-5)' }}>
            {usersLoading ? (
              <DataTableSkeleton />
            ) : (
              <DataTable rows={rows} headers={headers}>
                {({ rows, headers, getHeaderProps, getTableProps, getRowProps }) => (
                  <TableContainer>
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          {headers.map((h) => (
                            <TableHeader {...getHeaderProps({ header: h })}>
                              {h.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((r) => {
                          const u = users.find((x) => x.userId === r.id);
                          return (
                            <TableRow {...getRowProps({ row: r })}>
                              <TableCell>{r.cells.find((c) => c.info.header === 'email')?.value}</TableCell>
                              <TableCell>{r.cells.find((c) => c.info.header === 'name')?.value}</TableCell>
                              <TableCell>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                                  <Select
                                    id={`role-${r.id}`}
                                    labelText=""
                                    hideLabel
                                    value={String(u?.role || 'member')}
                                    onChange={(e) => handleUpdateRole(r.id, e.target.value as TenantRole)}
                                    size="sm"
                                  >
                                    <SelectItem value="member" text="Member" />
                                    <SelectItem value="tenant_admin" text="Tenant Admin" />
                                  </Select>
                                  {u?.role === 'tenant_admin' && <Tag type="purple" size="sm">Admin</Tag>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  renderIcon={TrashCan}
                                  onClick={() => u && removeModal.openModal(u)}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>
            )}
          </div>
        </Tile>

        <Tile style={{ padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-4)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Pending Invitations</h3>
            <Button kind="secondary" onClick={() => loadInvites()} disabled={invitesLoading}>
              Refresh
            </Button>
          </div>

          <div style={{ marginTop: 'var(--spacing-5)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {invitesLoading ? (
              <DataTableSkeleton />
            ) : pendingTenantInvites.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>No pending invitations.</p>
            ) : (
              pendingTenantInvites.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--spacing-4)',
                    padding: 'var(--spacing-4)',
                    border: '1px solid var(--cds-border-subtle-01)',
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                    <div style={{ fontWeight: 600 }}>{inv.email}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                      Role: {inv.role || 'member'} · Expires: {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={Renew}
                      disabled={busyResend === inv.id}
                      onClick={() => handleResendInvite(inv.id)}
                    >
                      {busyResend === inv.id ? 'Resending...' : 'Resend'}
                    </Button>
                    <Button
                      kind="ghost"
                      size="sm"
                      renderIcon={TrashCan}
                      onClick={() => revokeInviteModal.openModal(inv)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Tile>
      </div>

      <InviteMemberModal
        open={inviteModal.isOpen}
        onClose={() => inviteModal.closeModal()}
        onSuccess={() => {
          loadInvites();
          loadUsers();
        }}
        resourceType="tenant"
        resourceName={tenantSlug}
        availableRoles={[
          { id: 'member', label: 'Member' },
          { id: 'tenant_admin', label: 'Tenant Admin' },
        ]}
        defaultRole="member"
      />

      <ConfirmModal
        open={removeModal.isOpen}
        onClose={() => removeModal.closeModal()}
        onConfirm={handleRemoveUser}
        title="Remove user"
        description={`Remove ${removeModal.data?.email || 'this user'} from this tenant?`}
        confirmText="Remove"
        danger
        busy={busyRemove}
        showWarning
      />

      <ConfirmModal
        open={revokeInviteModal.isOpen}
        onClose={() => revokeInviteModal.closeModal()}
        onConfirm={handleRevokeInvite}
        title="Revoke invitation"
        description={`Revoke invitation for ${revokeInviteModal.data?.email || 'this email'}?`}
        confirmText="Revoke"
        danger
        busy={busyRevoke}
        showWarning
      />
    </PageLayout>
  );
}

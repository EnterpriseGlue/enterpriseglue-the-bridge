import { useState, useEffect } from 'react';
import {
  DataTable,
  DataTableSkeleton,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Button,
  Modal,
  TextInput,
  Select,
  SelectItem,
  InlineNotification,
  Tag,
  OverflowMenu,
  OverflowMenuItem,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@carbon/react';
import { Add, Edit, Enterprise, UserFollow, TrashCan } from '@carbon/icons-react';
import { useAuth } from '../../../shared/hooks/useAuth';
import { PageLayout, PageHeader, PAGE_GRADIENTS } from '../../../shared/components/PageLayout';
import { useModal } from '../../../shared/hooks/useModal';
import { apiClient } from '../../../shared/api/client';
import { parseApiError } from '../../../shared/api/apiErrorUtils';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  createdAt: number;
  updatedAt: number;
  createdByUserId: string | null;
}

interface TenantAdmin {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: number;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface EmailConfig {
  id: string;
  name: string;
  provider: string;
  fromEmail: string;
}

export default function TenantManagement() {
  const { user: currentUser } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const isPlatformAdmin = currentUser?.platformRole === 'admin';

  const createModal = useModal();
  const [createForm, setCreateForm] = useState({ name: '', slug: '' });
  const [createLoading, setCreateLoading] = useState(false);

  const editModal = useModal<Tenant>();
  const [editForm, setEditForm] = useState<{ name: string; status: 'active' | 'suspended'; emailSendConfigId: string }>({ name: '', status: 'active', emailSendConfigId: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);

  const detailModal = useModal<Tenant>();
  const [tenantAdmins, setTenantAdmins] = useState<TenantAdmin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  const assignAdminModal = useModal<Tenant>();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  if (!isPlatformAdmin) {
    return (
      <div style={{ padding: 'var(--spacing-7)' }}>
        <h1>Unauthorized</h1>
        <p>You must be a platform administrator to manage tenants.</p>
      </div>
    );
  }

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.get<Tenant[]>('/api/admin/tenants');
      setTenants(data);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to load tenants');
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTenantAdmins = async (tenantId: string) => {
    try {
      setAdminsLoading(true);
      const data = await apiClient.get<TenantAdmin[]>(`/api/admin/tenants/${tenantId}/admins`);
      setTenantAdmins(data);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to load tenant admins');
      setError(parsed.message);
    } finally {
      setAdminsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const data = await apiClient.get<User[]>('/api/admin/users');
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleCreateTenant = async () => {
    try {
      setCreateLoading(true);
      setError('');
      setSuccess('');

      await apiClient.post('/api/admin/tenants', createForm);

      setSuccess('Tenant created successfully!');
      await loadTenants();
      createModal.closeModal();
      setCreateForm({ name: '', slug: '' });
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to create tenant');
      setError(parsed.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateTenant = async () => {
    if (!editModal.data) return;

    try {
      setEditLoading(true);
      setError('');
      setSuccess('');

      // Update tenant basic info
      await apiClient.put(`/api/admin/tenants/${editModal.data.id}`, {
        name: editForm.name,
        status: editForm.status,
      });

      // Update tenant settings (email config)
      await apiClient.put(`/api/admin/tenants/${editModal.data.id}/settings`, {
        emailSendConfigId: editForm.emailSendConfigId || null,
      });

      setSuccess('Tenant updated successfully!');
      await loadTenants();
      editModal.closeModal();
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to update tenant');
      setError(parsed.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleAssignAdmin = async () => {
    if (!assignAdminModal.data || !selectedUserId) return;

    try {
      setAssignLoading(true);
      setError('');
      setSuccess('');

      await apiClient.post(`/api/admin/tenants/${assignAdminModal.data.id}/admins`, {
        userId: selectedUserId,
      });

      setSuccess('Admin assigned successfully!');
      await loadTenantAdmins(assignAdminModal.data.id);
      assignAdminModal.closeModal();
      setSelectedUserId('');
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to assign admin');
      setError(parsed.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRevokeAdmin = async (tenantId: string, userId: string) => {
    try {
      setError('');
      setSuccess('');

      await apiClient.delete(`/api/admin/tenants/${tenantId}/admins/${userId}`);

      setSuccess('Admin role revoked successfully!');
      await loadTenantAdmins(tenantId);
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to revoke admin')
      setError(parsed.message)
    }
  };

  const loadEmailConfigs = async () => {
    try {
      const data = await apiClient.get<EmailConfig[]>('/api/admin/email-configs');
      setEmailConfigs(data);
    } catch (err) {
      console.error('Failed to load email configs:', err);
    }
  };

  const loadTenantSettings = async (tenantId: string): Promise<string> => {
    try {
      const data = await apiClient.get<{ emailSendConfigId?: string }>(
        `/api/admin/tenants/${tenantId}/settings`
      );
      return data.emailSendConfigId || '';
    } catch (err) {
      console.error('Failed to load tenant settings:', err);
    }
    return '';
  };

  const openEditModal = async (tenant: Tenant) => {
    loadEmailConfigs();
    const emailSendConfigId = await loadTenantSettings(tenant.id);
    setEditForm({ name: tenant.name, status: tenant.status, emailSendConfigId });
    editModal.openModal(tenant);
  };

  const openDetailModal = (tenant: Tenant) => {
    detailModal.openModal(tenant);
    loadTenantAdmins(tenant.id);
  };

  const openAssignAdminModal = (tenant: Tenant) => {
    assignAdminModal.openModal(tenant);
    loadAllUsers();
    setSelectedUserId('');
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const headers = [
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug' },
    { key: 'status', header: 'Status' },
    { key: 'createdAt', header: 'Created' },
    { key: 'actions', header: '' },
  ];

  const rows = filteredTenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    createdAt: new Date(tenant.createdAt).toLocaleDateString(),
    actions: tenant,
  }));

  return (
    <PageLayout
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-5)',
        background: 'var(--color-bg-primary)',
        minHeight: '100vh',
      }}
    >
      <PageHeader
        icon={Enterprise}
        title="Tenant Management"
        subtitle="Create and manage tenants, assign tenant admins, and configure tenant-specific settings"
        gradient={PAGE_GRADIENTS.green}
      />

      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          onCloseButtonClick={() => setError('')}
          style={{ marginBottom: 'var(--spacing-4)' }}
        />
      )}

      {success && (
        <InlineNotification
          kind="success"
          title="Success"
          subtitle={success}
          onCloseButtonClick={() => setSuccess('')}
          style={{ marginBottom: 'var(--spacing-4)' }}
        />
      )}

      {loading ? (
        <DataTableSkeleton headers={headers} rowCount={5} />
      ) : (
        <DataTable rows={rows} headers={headers}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch
                    placeholder="Search tenants..."
                    onChange={(e) => setSearchQuery(typeof e === 'string' ? e : e.target.value)}
                    value={searchQuery}
                  />
                  <Button renderIcon={Add} onClick={() => createModal.openModal()}>
                    Create Tenant
                  </Button>
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const tenant = row.cells.find((c) => c.info.header === 'actions')?.value as Tenant;
                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        {row.cells.map((cell) => {
                          if (cell.info.header === 'status') {
                            return (
                              <TableCell key={cell.id}>
                                <Tag type={cell.value === 'active' ? 'green' : 'red'}>{cell.value}</Tag>
                              </TableCell>
                            );
                          }
                          if (cell.info.header === 'actions') {
                            return (
                              <TableCell key={cell.id}>
                                <OverflowMenu flipped>
                                  <OverflowMenuItem itemText="View Details" onClick={() => openDetailModal(tenant)} />
                                  <OverflowMenuItem itemText="Edit" onClick={() => openEditModal(tenant)} />
                                  <OverflowMenuItem itemText="Assign Admin" onClick={() => openAssignAdminModal(tenant)} />
                                </OverflowMenu>
                              </TableCell>
                            );
                          }
                          return <TableCell key={cell.id}>{cell.value}</TableCell>;
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      )}

      {/* Create Tenant Modal */}
      <Modal
        open={createModal.isOpen}
        onRequestClose={createModal.closeModal}
        modalHeading="Create Tenant"
        primaryButtonText="Create"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleCreateTenant}
        primaryButtonDisabled={createLoading || !createForm.name || !createForm.slug}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', marginTop: 'var(--spacing-5)' }}>
          <TextInput
            id="tenant-name"
            labelText="Tenant Name"
            placeholder="Acme Corporation"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <TextInput
            id="tenant-slug"
            labelText="Tenant Slug"
            placeholder="acme"
            helperText="URL-friendly identifier (lowercase, hyphens allowed)"
            value={createForm.slug}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              })
            }
          />
        </div>
      </Modal>

      {/* Edit Tenant Modal */}
      <Modal
        open={editModal.isOpen}
        onRequestClose={editModal.closeModal}
        modalHeading="Edit Tenant"
        primaryButtonText="Save"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleUpdateTenant}
        primaryButtonDisabled={editLoading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', marginTop: 'var(--spacing-5)' }}>
          <TextInput
            id="edit-tenant-name"
            labelText="Tenant Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Select
            id="edit-tenant-status"
            labelText="Status"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'suspended' })}
          >
            <SelectItem value="active" text="Active" />
            <SelectItem value="suspended" text="Suspended" />
          </Select>
          <Select
            id="edit-tenant-email-config"
            labelText="Email Configuration"
            value={editForm.emailSendConfigId}
            onChange={(e) => setEditForm({ ...editForm, emailSendConfigId: e.target.value })}
          >
            <SelectItem value="" text="Use default configuration" />
            {emailConfigs.map((cfg) => (
              <SelectItem key={cfg.id} value={cfg.id} text={`${cfg.name} (${cfg.provider} - ${cfg.fromEmail})`} />
            ))}
          </Select>
        </div>
      </Modal>

      {/* Tenant Detail Modal */}
      <Modal
        open={detailModal.isOpen}
        onRequestClose={detailModal.closeModal}
        modalHeading={detailModal.data?.name || 'Tenant Details'}
        passiveModal
        size="lg"
      >
        {detailModal.data && (
          <Tabs>
            <TabList aria-label="Tenant details tabs">
              <Tab>Overview</Tab>
              <Tab>Admins</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', padding: 'var(--spacing-5)' }}>
                  <div>
                    <strong>Name:</strong> {detailModal.data.name}
                  </div>
                  <div>
                    <strong>Slug:</strong> {detailModal.data.slug}
                  </div>
                  <div>
                    <strong>Status:</strong> <Tag type={detailModal.data.status === 'active' ? 'green' : 'red'}>{detailModal.data.status}</Tag>
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(detailModal.data.createdAt).toLocaleString()}
                  </div>
                </div>
              </TabPanel>
              <TabPanel>
                <div style={{ padding: 'var(--spacing-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                    <h4>Tenant Administrators</h4>
                    <Button size="sm" renderIcon={UserFollow} onClick={() => openAssignAdminModal(detailModal.data!)}>
                      Assign Admin
                    </Button>
                  </div>
                  {adminsLoading ? (
                    <p>Loading admins...</p>
                  ) : tenantAdmins.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>No administrators assigned yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                      {tenantAdmins.map((admin) => (
                        <div
                          key={admin.userId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 'var(--spacing-3)',
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: '4px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {admin.firstName} {admin.lastName}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{admin.email}</div>
                          </div>
                          <Button
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            renderIcon={TrashCan}
                            iconDescription="Revoke Admin"
                            onClick={() => handleRevokeAdmin(detailModal.data!.id, admin.userId)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Modal>

      {/* Assign Admin Modal */}
      <Modal
        open={assignAdminModal.isOpen}
        onRequestClose={assignAdminModal.closeModal}
        modalHeading="Assign Tenant Admin"
        primaryButtonText="Assign"
        secondaryButtonText="Cancel"
        onRequestSubmit={handleAssignAdmin}
        primaryButtonDisabled={assignLoading || !selectedUserId}
      >
        <div style={{ marginTop: 'var(--spacing-5)' }}>
          <Select
            id="select-user"
            labelText="Select User"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <SelectItem value="" text="Choose a user..." />
            {allUsers.map((user) => (
              <SelectItem
                key={user.id}
                value={user.id}
                text={`${user.firstName || ''} ${user.lastName || ''} (${user.email})`}
              />
            ))}
          </Select>
        </div>
      </Modal>
    </PageLayout>
  );
}

import React from 'react'
import { Button, ComboBox, TextInput, Toggle, Tile } from '@carbon/react'
import { Folder, UserAvatar, Close } from '@carbon/icons-react'
import { PlatformGrid, PlatformRow, PlatformCol } from './PlatformGrid'
import type { ProjectGovernanceItem, UserListItem } from '../../../api/platform-admin'

interface ProjectsSettingsSectionProps {
  allProjects: ProjectGovernanceItem[] | undefined
  projectsLoading: boolean
  selectedProject: ProjectGovernanceItem | null
  setSelectedProject: (project: ProjectGovernanceItem | null) => void
  projectComboKey: number
  setProjectComboKey: React.Dispatch<React.SetStateAction<number>>
  onAssignOwner: (target: { id: string; name: string }) => void
  onAssignDelegate: (target: { id: string; name: string }) => void
  inviteAllowAll: boolean
  normalizedInviteDomains: string[]
  inviteDomainInput: string
  setInviteDomainInput: (value: string) => void
  addInviteDomain: () => void
  removeInviteDomain: (domain: string) => void
  onToggleInviteAllowAll: (checked: boolean) => void
}

export function ProjectsSettingsSection({
  allProjects,
  projectsLoading,
  selectedProject,
  setSelectedProject,
  projectComboKey,
  setProjectComboKey,
  onAssignOwner,
  onAssignDelegate,
  inviteAllowAll,
  normalizedInviteDomains,
  inviteDomainInput,
  setInviteDomainInput,
  addInviteDomain,
  removeInviteDomain,
  onToggleInviteAllowAll,
}: ProjectsSettingsSectionProps) {
  return (
    <PlatformGrid style={{ paddingInline: 0 }}>
      <PlatformRow>
        <PlatformCol sm={4} md={8} lg={16} style={{ marginInlineStart: 0, marginInlineEnd: 0 }}>
          <Tile>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
              <Folder size={20} style={{ color: 'var(--color-text-secondary)' }} />
              <div>
                <h3 style={{ margin: '0 0 var(--spacing-1) 0', fontSize: '16px', fontWeight: 600 }}>
                  Project Governance
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Assign owners or delegates to projects (for employee departures, recovery)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, maxWidth: '400px' }}>
                <ComboBox
                  key={`project-combo-${projectComboKey}`}
                  id="project-combobox"
                  titleText="Select Project"
                  placeholder="Find a project..."
                  items={allProjects || []}
                  itemToString={(item: ProjectGovernanceItem | null) => item?.name || ''}
                  selectedItem={selectedProject}
                  onChange={({ selectedItem }) => {
                    setSelectedProject(selectedItem ?? null)
                  }}
                  shouldFilterItem={({ item, inputValue }) =>
                    !inputValue || item.name.toLowerCase().includes(inputValue.toLowerCase())
                  }
                  size="md"
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                <Button
                  kind="tertiary"
                  size="md"
                  disabled={!selectedProject}
                  onClick={() => selectedProject && onAssignOwner({ id: selectedProject.id, name: selectedProject.name })}
                >
                  Assign Owner
                </Button>
                <Button
                  kind="tertiary"
                  size="md"
                  disabled={!selectedProject}
                  onClick={() => selectedProject && onAssignDelegate({ id: selectedProject.id, name: selectedProject.name })}
                >
                  Assign Delegate
                </Button>
              </div>
            </div>

            {selectedProject && (
              <Tile style={{ marginTop: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
                  <Folder size={20} style={{ color: 'var(--cds-interactive-01, #0f62fe)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>{selectedProject.name}</span>
                  <Button
                    kind="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProject(null)
                      setProjectComboKey((k) => k + 1)
                    }}
                    style={{ marginLeft: 'auto' }}
                  >
                    Clear
                  </Button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Owner</div>
                    <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserAvatar size={16} />
                      {selectedProject.ownerName || selectedProject.ownerEmail || (
                        <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Not assigned</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Delegate</div>
                    <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserAvatar size={16} />
                      {selectedProject.delegateName || selectedProject.delegateEmail || (
                        <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Not assigned</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Created</div>
                    <div style={{ fontSize: '14px' }}>{new Date(selectedProject.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </Tile>
            )}
          </Tile>
        </PlatformCol>
      </PlatformRow>

      <PlatformRow>
        <PlatformCol sm={4} md={8} lg={16} style={{ marginInlineStart: 0, marginInlineEnd: 0 }}>
          <Tile style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 var(--spacing-2) 0', fontSize: '16px', fontWeight: 600 }}>Invite Domains</h3>
            <p style={{ margin: '0 0 var(--spacing-4) 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Control which email domains can be invited from Project Members.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <Toggle
                id="invite-allow-all"
                labelText="Allow all domains"
                labelA="No"
                labelB="Yes"
                toggled={!!inviteAllowAll}
                onToggle={onToggleInviteAllowAll}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--spacing-3)', alignItems: 'end', maxWidth: 520 }}>
                <TextInput
                  id="invite-domain-input"
                  labelText="Allowed domains"
                  placeholder="e.g. enterpriseglue.ai"
                  value={inviteDomainInput}
                  disabled={!!inviteAllowAll}
                  onChange={(e) => setInviteDomainInput((e.target as any).value)}
                  helperText={inviteAllowAll ? 'All domains are allowed' : 'Add domains like enterpriseglue.ai or gmail.com'}
                />
                <Button kind="tertiary" size="md" disabled={!!inviteAllowAll || !inviteDomainInput.trim()} onClick={addInviteDomain}>
                  Add
                </Button>
              </div>

              {!inviteAllowAll && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                  {normalizedInviteDomains.length === 0 ? (
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>No allowed domains configured.</span>
                  ) : (
                    normalizedInviteDomains.map((d) => (
                      <span
                        key={d}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '2px 6px',
                          border: '1px solid var(--cds-border-subtle-01, #e0e0e0)',
                          borderRadius: 999,
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{d}</span>
                        <Button kind="ghost" size="sm" hasIconOnly renderIcon={Close} iconDescription="Remove domain" onClick={() => removeInviteDomain(d)} />
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>
          </Tile>
        </PlatformCol>
      </PlatformRow>
    </PlatformGrid>
  )
}

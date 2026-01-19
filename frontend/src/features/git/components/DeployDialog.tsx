/**
 * Deploy Dialog
 * Modal for configuring and executing Git deployment
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Select,
  SelectItem,
  Checkbox,
  InlineNotification,
  InlineLoading,
} from '@carbon/react';
import { apiClient } from '../../../shared/api/client';
import { parseApiError } from '../../../shared/api/apiErrorUtils';
import { useDeployment } from '../hooks/useDeployment';
import type { DeployRequest } from '../types/git';

interface DeployDialogProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

export default function DeployDialog({ projectId, open, onClose }: DeployDialogProps) {
  const deployment = useDeployment(projectId);

  const [message, setMessage] = useState('');
  const [environment, setEnvironment] = useState<'dev' | 'staging' | 'production' | ''>('');
  const [createTag, setCreateTag] = useState(false);
  const [tagName, setTagName] = useState('');

  // Auto-generate tag name
  useEffect(() => {
    if (createTag && !tagName) {
      const timestamp = Date.now();
      setTagName(`deploy-${timestamp}`);
    }
  }, [createTag, tagName]);

  const handleDeploy = async () => {
    if (!message.trim()) {
      return;
    }

    const deployParams: Omit<DeployRequest, 'projectId'> = {
      message: message.trim(),
      createTag,
    };

    if (environment) {
      deployParams.environment = environment as 'dev' | 'staging' | 'production';
    }

    if (createTag && tagName) {
      deployParams.tagName = tagName;
    }

    try {
      await deployment.mutateAsync(deployParams);
      onClose();
      // Reset form
      setMessage('');
      setEnvironment('');
      setCreateTag(false);
      setTagName('');
    } catch (error) {
      // Error is handled by mutation
      console.error('Deployment failed:', error);
    }
  };

  const isValid = message.trim().length > 0 && message.trim().length <= 500;

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      onRequestSubmit={handleDeploy}
      modalHeading="Deploy"
      primaryButtonText={deployment.isPending ? 'Deploying...' : 'Deploy'}
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!isValid || deployment.isPending}
      size="sm"
    >
      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <TextInput
          id="commit-message"
          labelText="Commit Message"
          placeholder="Deploy: Feature implementation"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          invalid={message.length > 500}
          invalidText="Message must be 500 characters or less"
          helperText="Describe what changes you're deploying"
          maxLength={500}
          autoFocus
          disabled={deployment.isPending}
        />
      </div>

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <Select
          id="environment"
          labelText="Environment (Optional)"
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as any)}
          disabled={deployment.isPending}
        >
          <SelectItem value="" text="Select environment..." />
          <SelectItem value="dev" text="Development" />
          <SelectItem value="staging" text="Staging" />
          <SelectItem value="production" text="Production" />
        </Select>
      </div>

      <div style={{ marginBottom: 'var(--spacing-5)' }}>
        <Checkbox
          id="create-tag"
          labelText="Create deployment tag"
          checked={createTag}
          onChange={(_, { checked }) => setCreateTag(checked)}
          disabled
        />
        <div style={{ marginTop: 'var(--spacing-2)', marginLeft: 'var(--spacing-7)', fontSize: 'var(--text-12)', color: 'var(--color-text-tertiary)' }}>
          Tagging is not supported yet.
        </div>
        {createTag && (
          <div style={{ marginTop: 'var(--spacing-3)', marginLeft: 'var(--spacing-7)' }}>
            <TextInput
              id="tag-name"
              labelText="Tag name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="deploy-1732195200"
              size="sm"
              disabled
            />
          </div>
        )}
      </div>

      {deployment.isPending && (
        <InlineLoading
          description="Committing and pushing to Git..."
          style={{ marginTop: 'var(--spacing-5)' }}
        />
      )}

      {deployment.isError && (
        <InlineNotification
          kind="error"
          title="Deployment failed"
          subtitle={parseApiError(deployment.error, 'Deployment failed').message}
          lowContrast
          hideCloseButton
          style={{ marginTop: 'var(--spacing-5)' }}
        />
      )}

      {deployment.isSuccess && (
        <InlineNotification
          kind="success"
          title="Deployed successfully"
          subtitle={`Committed and pushed to Git repository`}
          lowContrast
          hideCloseButton
          style={{ marginTop: 'var(--spacing-5)' }}
        />
      )}
    </Modal>
  );
}

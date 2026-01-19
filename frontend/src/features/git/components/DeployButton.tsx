/**
 * Deploy to Git button
 * Primary action for committing and pushing changes
 */

import React, { useState } from 'react';
import { Button } from '@carbon/react';
import { Rocket, CheckmarkFilled, WarningAltFilled } from '@carbon/icons-react';
import { useHasGitRepository } from '../hooks/useGitRepository';
import DeployDialog from './DeployDialog';

interface DeployButtonProps {
  projectId: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  kind?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
}

export default function DeployButton({ 
  projectId, 
  disabled = false,
  size = 'md',
  kind = 'primary'
}: DeployButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const hasRepository = useHasGitRepository(projectId);

  if (!hasRepository) {
    return (
      <Button
        size={size}
        kind="ghost"
        disabled
        renderIcon={WarningAltFilled}
        title="No Git repository connected. Set up Git first."
      >
        Deploy
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        kind={kind}
        disabled={disabled}
        renderIcon={Rocket}
        onClick={() => setIsDialogOpen(true)}
        title="Deploy project to Git repository (Cmd/Ctrl + Shift + D)"
      >
        Deploy
      </Button>

      {isDialogOpen && (
        <DeployDialog
          projectId={projectId}
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </>
  );
}

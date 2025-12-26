/**
 * DeleteExpoDialog Component
 * Implements T060: User Story 1 - Delete expo confirmation dialog
 * Warning for active registrations, confirm button
 */

import ConfirmDialog from '../common/ConfirmDialog';
import type { ExpoDetail } from '../../types/expo';

interface DeleteExpoDialogProps {
  open: boolean;
  expo: ExpoDetail | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteExpoDialog({
  open,
  expo,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteExpoDialogProps) {
  if (!expo) return null;

  const hasActiveStatus = expo.status === 'active' || expo.status === 'upcoming';

  const title = 'Delete Expo Event';
  const message = hasActiveStatus
    ? `Are you sure you want to delete "${expo.title}"? This expo is ${expo.status} and may have active registrations. This action cannot be undone.`
    : `Are you sure you want to delete "${expo.title}"? This action cannot be undone.`;

  return (
    <ConfirmDialog
      open={open}
      title={title}
      message={message}
      confirmText={isLoading ? 'Deleting...' : 'Delete'}
      cancelText="Cancel"
      onConfirm={onConfirm}
      onCancel={onCancel}
      severity={hasActiveStatus ? 'error' : 'warning'}
      isLoading={isLoading}
    />
  );
}


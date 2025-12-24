/**
 * BookmarkButton Component
 * Toggle bookmark functionality with capacity warnings
 * Implements T112: User Story 3
 */

import { Button, Alert, Snackbar } from '@mui/material';
import { Bookmark, BookmarkBorder } from '@mui/icons-material';
import { useState } from 'react';
import type { SessionDetail } from '../../types/attendee';

interface BookmarkButtonProps {
  session: SessionDetail;
  onBookmark?: () => void;
  onRemoveBookmark?: () => void;
  isLoading?: boolean;
}

export default function BookmarkButton({
  session,
  onBookmark,
  onRemoveBookmark,
  isLoading = false,
}: BookmarkButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const isFull = session.currentAttendees >= session.capacity;
  const isBookmarked = session.isBookmarked;

  const handleClick = async () => {
    try {
      if (isBookmarked) {
        await onRemoveBookmark?.();
      } else {
        if (isFull) {
          setError('This session is full. You cannot bookmark it.');
          return;
        }
        await onBookmark?.();
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update bookmark';
      if (errorMessage.includes('full') || errorMessage.includes('capacity')) {
        setError('This session has reached maximum capacity.');
      } else if (errorMessage.includes('conflict')) {
        setError('This session conflicts with another session in your schedule.');
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <>
      <Button
        variant={isBookmarked ? 'outlined' : 'contained'}
        startIcon={isBookmarked ? <Bookmark /> : <BookmarkBorder />}
        onClick={handleClick}
        disabled={isLoading || (!isBookmarked && isFull)}
        color={isBookmarked ? 'primary' : 'primary'}
      >
        {isBookmarked ? 'Bookmarked' : isFull ? 'Full' : 'Bookmark'}
      </Button>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}


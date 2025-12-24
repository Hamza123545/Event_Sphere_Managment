/**
 * SessionCard Component
 * Displays session details with bookmark functionality
 * Implements T106: User Story 3
 */

import { Card, CardContent, CardActions, Typography, Chip, Box, LinearProgress } from '@mui/material';
import { Person, Schedule, LocationOn, Bookmark } from '@mui/icons-material';
import BookmarkButton from './BookmarkButton';
import type { SessionDetail } from '../../types/attendee';

interface SessionCardProps {
  session: SessionDetail;
  onBookmark?: () => void;
  onRemoveBookmark?: () => void;
  isLoading?: boolean;
  highlighted?: boolean;
}

export default function SessionCard({
  session,
  onBookmark,
  onRemoveBookmark,
  isLoading = false,
  highlighted = false,
}: SessionCardProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const capacityPercentage = (session.currentAttendees / session.capacity) * 100;
  const isFull = session.currentAttendees >= session.capacity;
  const spotsLeft = session.capacity - session.currentAttendees;

  return (
    <Card
      sx={{
        ...(highlighted && {
          border: 2,
          borderColor: 'primary.main',
          boxShadow: 3,
          animation: 'pulse 0.5s ease-in-out',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.02)' },
          },
        }),
      }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', flex: 1 }}>
            {session.title}
          </Typography>
          {session.isBookmarked && (
            <Chip icon={<Bookmark />} label="Bookmarked" color="primary" size="small" />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {session.description.substring(0, 150)}
          {session.description.length > 150 ? '...' : ''}
        </Typography>

        {/* Schedule */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Schedule fontSize="small" color="action" />
          <Typography variant="body2">
            {formatDate(session.schedule.startTime)} • {formatTime(session.schedule.startTime)} -{' '}
            {formatTime(session.schedule.endTime)}
          </Typography>
        </Box>

        {/* Location */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <LocationOn fontSize="small" color="action" />
          <Typography variant="body2">
            {session.location.room}
            {session.location.building && `, ${session.location.building}`}
          </Typography>
        </Box>

        {/* Speakers */}
        {session.speakers.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Person fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Speakers:
              </Typography>
            </Box>
            {session.speakers.map((speaker, index) => (
              <Typography key={index} variant="body2" sx={{ ml: 2.5, mb: 0.5 }}>
                {speaker.name}
                {speaker.title && ` - ${speaker.title}`}
              </Typography>
            ))}
          </Box>
        )}

        {/* Capacity */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {isFull ? 'Full' : `${spotsLeft} spots remaining`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {session.currentAttendees} / {session.capacity}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={capacityPercentage}
            color={isFull ? 'error' : capacityPercentage > 80 ? 'warning' : 'primary'}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Category and Topic */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
          <Chip label={session.category} size="small" variant="outlined" />
          <Chip label={session.topic} size="small" variant="outlined" />
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <BookmarkButton
          session={session}
          onBookmark={onBookmark}
          onRemoveBookmark={onRemoveBookmark}
          isLoading={isLoading}
        />
      </CardActions>
    </Card>
  );
}


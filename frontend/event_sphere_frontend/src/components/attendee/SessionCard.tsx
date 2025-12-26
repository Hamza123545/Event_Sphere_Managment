/**
 * SessionCard Component
 * Displays session details with bookmark functionality
 * Implements T106: User Story 3
 */

import { Typography, Chip, Box, LinearProgress } from '@mui/material';
import { Person, Schedule, LocationOn, Bookmark } from '@mui/icons-material';
import BookmarkButton from './BookmarkButton';
import type { SessionDetail } from '../../types/attendee';
import {
  GlassCard,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

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
    <MotionBox
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <GlassCard
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          ...(highlighted && {
            border: `2px solid ${activeTheme.accent}`,
            boxShadow: `0 0 20px ${activeTheme.accentGlow}`,
            animation: 'pulse 0.5s ease-in-out',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.02)' },
            },
          }),
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, flex: 1, color: activeTheme.textPrimary }}>
              {session.title}
            </Typography>
            {session.isBookmarked && (
              <Chip 
                icon={<Bookmark />} 
                label="Bookmarked" 
                size="small"
                sx={{
                  bgcolor: `${activeTheme.accent}20`,
                  color: activeTheme.accent,
                  border: `1px solid ${activeTheme.accent}30`,
                  fontWeight: 700
                }}
              />
            )}
          </Box>

          <Typography variant="body2" sx={{ color: activeTheme.textSecondary, mb: 2, lineHeight: 1.6 }}>
            {session.description.substring(0, 150)}
            {session.description.length > 150 ? '...' : ''}
          </Typography>

          {/* Schedule */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Schedule sx={{ fontSize: 16, color: activeTheme.accent }} />
            <Typography variant="body2" sx={{ color: activeTheme.textSecondary }}>
              {formatDate(session.schedule.startTime)} • {formatTime(session.schedule.startTime)} -{' '}
              {formatTime(session.schedule.endTime)}
            </Typography>
          </Box>

          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOn sx={{ fontSize: 16, color: activeTheme.accent }} />
            <Typography variant="body2" sx={{ color: activeTheme.textSecondary }}>
              {session.location.room}
              {session.location.building && `, ${session.location.building}`}
            </Typography>
          </Box>

          {/* Speakers */}
          {session.speakers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Person sx={{ fontSize: 16, color: activeTheme.accent }} />
                <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 700 }}>
                  SPEAKERS:
                </Typography>
              </Box>
              {session.speakers.map((speaker, index) => (
                <Typography key={index} variant="body2" sx={{ ml: 2.5, mb: 0.5, color: activeTheme.textPrimary }}>
                  {speaker.name}
                  {speaker.title && ` - ${speaker.title}`}
                </Typography>
              ))}
            </Box>
          )}

          {/* Capacity */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                {isFull ? 'Full' : `${spotsLeft} spots remaining`}
              </Typography>
              <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                {session.currentAttendees} / {session.capacity}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={capacityPercentage}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                bgcolor: activeTheme.surfaceLight,
                '& .MuiLinearProgress-bar': {
                  bgcolor: isFull ? activeTheme.error : capacityPercentage > 80 ? activeTheme.warning : activeTheme.accent,
                }
              }}
            />
          </Box>

          {/* Category and Topic */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Chip 
              label={session.category} 
              size="small"
              sx={{
                bgcolor: `${activeTheme.accent}20`,
                color: activeTheme.accent,
                border: `1px solid ${activeTheme.accent}30`,
                fontWeight: 600
              }}
            />
            <Chip 
              label={session.topic} 
              size="small"
              sx={{
                bgcolor: `${activeTheme.accent}20`,
                color: activeTheme.accent,
                border: `1px solid ${activeTheme.accent}30`,
                fontWeight: 600
              }}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${activeTheme.border}`, display: 'flex', justifyContent: 'flex-end' }}>
          <BookmarkButton
            session={session}
            onBookmark={onBookmark}
            onRemoveBookmark={onRemoveBookmark}
            isLoading={isLoading}
          />
        </Box>
      </GlassCard>
    </MotionBox>
  );
}


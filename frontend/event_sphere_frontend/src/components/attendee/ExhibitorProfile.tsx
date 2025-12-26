/**
 * ExhibitorProfile Component
 * Displays detailed exhibitor profile for attendees
 * Implements T109: User Story 3
 */

import {
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import { Business, LocationOn } from '@mui/icons-material';
import type { ExhibitorSearchResult } from '../../types/attendee';
import {
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

interface ExhibitorProfileProps {
  exhibitor: ExhibitorSearchResult;
  onContact?: () => void;
}

export default function ExhibitorProfile({ exhibitor, onContact }: ExhibitorProfileProps) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 3, mb: 4 }}>
          {exhibitor.logo ? (
            <Avatar 
              src={exhibitor.logo} 
              alt={exhibitor.companyName} 
              sx={{ 
                width: 80, 
                height: 80,
                border: `3px solid ${activeTheme.accentGlow}`
              }} 
            />
          ) : (
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: activeTheme.accent,
              border: `3px solid ${activeTheme.accentGlow}`
            }}>
              <Business sx={{ fontSize: 40 }} />
            </Avatar>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, color: activeTheme.textPrimary }}>
              {exhibitor.companyName}
            </Typography>
            <Chip 
              label={exhibitor.category} 
              sx={{ 
                mb: 2,
                bgcolor: `${activeTheme.accent}20`,
                color: activeTheme.accent,
                border: `1px solid ${activeTheme.accent}30`,
                fontWeight: 700
              }} 
            />
            <Typography variant="body1" sx={{ color: activeTheme.textSecondary, lineHeight: 1.7 }}>
              {exhibitor.description}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: activeTheme.border }} />

        {/* Products/Services */}
        {exhibitor.productsServices.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
              Products & Services
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {exhibitor.productsServices.map((product, index) => (
                <Chip 
                  key={index} 
                  label={product} 
                  sx={{
                    bgcolor: `${activeTheme.accent}20`,
                    color: activeTheme.accent,
                    border: `1px solid ${activeTheme.accent}30`,
                    fontWeight: 600
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Booth Location */}
        {exhibitor.booth && (
          <Box sx={{ mb: 4, p: 3, bgcolor: activeTheme.surface, borderRadius: 2, border: `1px solid ${activeTheme.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationOn sx={{ color: activeTheme.accent }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: activeTheme.textPrimary }}>
                Booth Location
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: activeTheme.textPrimary, fontWeight: 600, mb: 1 }}>
              Booth: <span style={{ color: activeTheme.accent }}>{exhibitor.booth.identifier}</span>
            </Typography>
            {exhibitor.booth.location && (
              <Typography variant="body2" sx={{ color: activeTheme.textSecondary }}>
                Location: ({exhibitor.booth.location.x}, {exhibitor.booth.location.y})
              </Typography>
            )}
          </Box>
        )}

        {/* Contact Button */}
        {onContact && (
          <Box sx={{ mt: 4 }}>
            <ActionButton primary size="large" fullWidth onClick={onContact}>
              Contact Exhibitor
            </ActionButton>
          </Box>
        )}
      </GlassCard>
    </MotionBox>
  );
}


/**
 * ExhibitorList Component
 * Displays list of exhibitors with category badges
 * Implements T108: User Story 3
 */

import { Grid, Typography, Chip, Box, Avatar } from '@mui/material';
import { Business, Visibility } from '@mui/icons-material';
import type { ExhibitorSearchResult } from '../../types/attendee';
import {
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

interface ExhibitorListProps {
  exhibitors: ExhibitorSearchResult[];
  onViewProfile: (exhibitorId: string) => void;
  isLoading?: boolean;
}

export default function ExhibitorList({ exhibitors, onViewProfile, isLoading = false }: ExhibitorListProps) {
  return (
    <Grid container spacing={3}>
      {exhibitors.length === 0 ? (
        <Grid item xs={12}>
          <GlassCard>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" sx={{ color: activeTheme.textSecondary }}>
                No exhibitors found. Try adjusting your search criteria.
              </Typography>
            </Box>
          </GlassCard>
        </Grid>
      ) : (
        exhibitors.map((exhibitor, index) => (
          <Grid item xs={12} sm={6} md={4} key={exhibitor.profileId}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                    {exhibitor.logo ? (
                      <Avatar 
                        src={exhibitor.logo} 
                        alt={exhibitor.companyName} 
                        sx={{ 
                          width: 56, 
                          height: 56,
                          border: `2px solid ${activeTheme.accentGlow}`
                        }} 
                      />
                    ) : (
                      <Avatar sx={{ 
                        width: 56, 
                        height: 56, 
                        bgcolor: activeTheme.accent,
                        border: `2px solid ${activeTheme.accentGlow}`
                      }}>
                        <Business />
                      </Avatar>
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, color: activeTheme.textPrimary }}>
                        {exhibitor.companyName}
                      </Typography>
                      <Chip 
                        label={exhibitor.category} 
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

                  <Typography variant="body2" sx={{ color: activeTheme.textSecondary, mb: 2, lineHeight: 1.6 }}>
                    {exhibitor.description.substring(0, 150)}
                    {exhibitor.description.length > 150 ? '...' : ''}
                  </Typography>

                  {exhibitor.productsServices.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
                        PRODUCTS/SERVICES:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {exhibitor.productsServices.slice(0, 3).map((product, idx) => (
                          <Chip 
                            key={idx} 
                            label={product} 
                            size="small" 
                            sx={{
                              bgcolor: `${activeTheme.accent}20`,
                              color: activeTheme.accent,
                              border: `1px solid ${activeTheme.accent}30`,
                              fontWeight: 600
                            }}
                          />
                        ))}
                        {exhibitor.productsServices.length > 3 && (
                          <Chip 
                            label={`+${exhibitor.productsServices.length - 3} more`} 
                            size="small"
                            sx={{
                              bgcolor: activeTheme.surfaceLight,
                              color: activeTheme.textSecondary,
                              border: `1px solid ${activeTheme.border}`,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {exhibitor.booth && (
                    <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                      Booth: <span style={{ color: activeTheme.accent }}>{exhibitor.booth.identifier}</span>
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${activeTheme.border}` }}>
                  <ActionButton
                    fullWidth
                    startIcon={<Visibility />}
                    onClick={() => onViewProfile(exhibitor.profileId)}
                    disabled={isLoading}
                  >
                    View Profile
                  </ActionButton>
                </Box>
              </GlassCard>
            </MotionBox>
          </Grid>
        ))
      )}
    </Grid>
  );
}


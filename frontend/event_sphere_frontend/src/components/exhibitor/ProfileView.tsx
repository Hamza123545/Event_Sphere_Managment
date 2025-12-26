/**
 * ProfileView Component
 * Implements T081: User Story 2 - Display company profile, edit button, documents list
 */

import { Box, Typography, Grid, Chip, Divider, Alert, Link } from '@mui/material';
import { Edit, Business, Email, Phone, Language, Description } from '@mui/icons-material';
import type { ExhibitorProfile } from '../../types/exhibitor';
import {
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

interface ProfileViewProps {
  profile: ExhibitorProfile;
  onEdit: () => void;
  onEditBooth?: () => void;
  canEdit?: boolean;
}

export default function ProfileView({ profile, onEdit, onEditBooth, canEdit = true }: ProfileViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return activeTheme.success;
      case 'pending':
        return activeTheme.warning;
      case 'rejected':
        return activeTheme.error;
      default:
        return activeTheme.textSecondary;
    }
  };

  const statusColor = getStatusColor(profile.registrationStatus);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
              {profile.companyName}
            </Typography>
            <Chip
              label={profile.registrationStatus}
              sx={{
                mb: 2,
                bgcolor: `${statusColor}20`,
                color: statusColor,
                border: `1px solid ${statusColor}30`,
                fontWeight: 700
              }}
            />
          </Box>
          {canEdit && profile.registrationStatus !== 'approved' && (
            <ActionButton startIcon={<Edit />} onClick={onEdit}>
              Edit Profile
            </ActionButton>
          )}
        </Box>

        {profile.registrationStatus === 'rejected' && profile.rejectionReason && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              bgcolor: `${activeTheme.error}20`,
              border: `1px solid ${activeTheme.error}30`,
              color: activeTheme.textPrimary
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Rejection Reason:</Typography>
            <Typography variant="body2">{profile.rejectionReason}</Typography>
          </Alert>
        )}

        {profile.registrationStatus === 'approved' && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 4,
              bgcolor: `${activeTheme.info}20`,
              border: `1px solid ${activeTheme.info}30`,
              color: activeTheme.textPrimary
            }}
          >
            This profile is approved and locked. Contact the organizer to make changes.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Expo Info */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 1 }}>
              EXPO
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: activeTheme.textPrimary, fontWeight: 600 }}>
              {profile.expoTitle}
            </Typography>
          </Grid>

          {/* Company Logo */}
          {profile.logo && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 1 }}>
                LOGO
              </Typography>
              <Box
                component="img"
                src={profile.logo}
                alt={`${profile.companyName} logo`}
                sx={{
                  maxWidth: 200,
                  maxHeight: 200,
                  objectFit: 'contain',
                  border: `2px solid ${activeTheme.border}`,
                  borderRadius: 2,
                  p: 2,
                  bgcolor: activeTheme.surfaceLight,
                }}
              />
            </Grid>
          )}

          {/* Description */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 1 }}>
              DESCRIPTION
            </Typography>
            <Typography variant="body1" sx={{ color: activeTheme.textSecondary, lineHeight: 1.7 }}>
              {profile.description}
            </Typography>
          </Grid>

          {/* Category */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 1 }}>
              CATEGORY
            </Typography>
            <Chip 
              label={profile.category}
              sx={{
                bgcolor: `${activeTheme.accent}20`,
                color: activeTheme.accent,
                border: `1px solid ${activeTheme.accent}30`,
                fontWeight: 700
              }}
            />
          </Grid>

          {/* Products/Services */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ color: activeTheme.textSecondary, fontWeight: 700, mb: 1 }}>
              PRODUCTS/SERVICES
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.productsServices.map((product, index) => (
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
          </Grid>

          <Divider sx={{ my: 3, width: '100%', borderColor: activeTheme.border }} />

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
              Contact Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Email sx={{ fontSize: 20, color: activeTheme.accent }} />
              <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>
                {profile.contactInfo.email}
              </Typography>
            </Box>
            {profile.contactInfo.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Phone sx={{ fontSize: 20, color: activeTheme.accent }} />
                <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>
                  {profile.contactInfo.phone}
                </Typography>
              </Box>
            )}
            {profile.contactInfo.website && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Language sx={{ fontSize: 20, color: activeTheme.accent }} />
                <Link 
                  href={profile.contactInfo.website} 
                  target="_blank" 
                  rel="noopener"
                  sx={{ color: activeTheme.accent, fontWeight: 600, '&:hover': { color: activeTheme.accentGlow } }}
                >
                  {profile.contactInfo.website}
                </Link>
              </Box>
            )}
          </Grid>

          {/* Booth Information */}
          {profile.booth && (
            <>
              <Divider sx={{ my: 3, width: '100%', borderColor: activeTheme.border }} />
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Business sx={{ fontSize: 24, color: activeTheme.accent }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: activeTheme.textPrimary }}>
                    Booth Information
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 1.5, color: activeTheme.textPrimary, fontWeight: 600 }}>
                  <span style={{ fontWeight: 700 }}>Booth:</span> {profile.booth.identifier}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: activeTheme.textSecondary, fontWeight: 600 }}>
                  Size: {profile.booth.size.width}m × {profile.booth.size.height}m ({profile.booth.size.area}m²)
                </Typography>
                {profile.booth.priceTier && (
                  <Chip 
                    label={`${profile.booth.priceTier} tier`} 
                    size="small"
                    sx={{ 
                      mt: 1, 
                      mr: 1,
                      bgcolor: `${activeTheme.accent}20`,
                      color: activeTheme.accent,
                      border: `1px solid ${activeTheme.accent}30`,
                      fontWeight: 600
                    }}
                  />
                )}
                {profile.booth.amenities.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 700, display: 'block', mb: 1 }}>
                      AMENITIES:
                    </Typography>
                    <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>
                      {profile.booth.amenities.join(', ')}
                    </Typography>
                  </Box>
                )}
                {onEditBooth && (
                  <Box sx={{ mt: 3 }}>
                    <ActionButton
                      size="small"
                      startIcon={<Edit />}
                      onClick={onEditBooth}
                    >
                      Update Booth Details
                    </ActionButton>
                  </Box>
                )}
              </Grid>
            </>
          )}

          {/* Documents */}
          {profile.documents && profile.documents.length > 0 && (
            <>
              <Divider sx={{ my: 3, width: '100%', borderColor: activeTheme.border }} />
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Description sx={{ fontSize: 20, color: activeTheme.accent }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: activeTheme.textPrimary }}>
                    Documents
                  </Typography>
                </Box>
                {profile.documents.map((doc, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: activeTheme.surfaceLight, borderRadius: 2, border: `1px solid ${activeTheme.border}` }}>
                    <Link 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener"
                      sx={{ color: activeTheme.accent, fontWeight: 600, display: 'block', mb: 0.5, '&:hover': { color: activeTheme.accentGlow } }}
                    >
                      {doc.filename}
                    </Link>
                    <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                      (Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()})
                    </Typography>
                  </Box>
                ))}
              </Grid>
            </>
          )}
        </Grid>
      </GlassCard>
    </MotionBox>
  );
}


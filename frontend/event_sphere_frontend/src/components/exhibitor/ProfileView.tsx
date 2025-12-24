/**
 * ProfileView Component
 * Implements T081: User Story 2 - Display company profile, edit button, documents list
 */

import { Box, Card, CardContent, Typography, Button, Grid, Chip, Divider, Alert, Link } from '@mui/material';
import { Edit, Business, Email, Phone, Language, Description } from '@mui/icons-material';
import type { ExhibitorProfile } from '../../types/exhibitor';

interface ProfileViewProps {
  profile: ExhibitorProfile;
  onEdit: () => void;
  onEditBooth?: () => void;
  canEdit?: boolean;
}

export default function ProfileView({ profile, onEdit, onEditBooth, canEdit = true }: ProfileViewProps) {
  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              {profile.companyName}
            </Typography>
            <Chip
              label={profile.registrationStatus}
              color={getStatusColor(profile.registrationStatus)}
              sx={{ mb: 2 }}
            />
          </Box>
          {canEdit && profile.registrationStatus !== 'approved' && (
            <Button variant="outlined" startIcon={<Edit />} onClick={onEdit}>
              Edit Profile
            </Button>
          )}
        </Box>

        {profile.registrationStatus === 'rejected' && profile.rejectionReason && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2">Rejection Reason:</Typography>
            <Typography variant="body2">{profile.rejectionReason}</Typography>
          </Alert>
        )}

        {profile.registrationStatus === 'approved' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            This profile is approved and locked. Contact the organizer to make changes.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Expo Info */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Expo
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {profile.expoTitle}
            </Typography>
          </Grid>

          {/* Company Logo */}
          {profile.logo && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Logo
              </Typography>
              <Box
                component="img"
                src={profile.logo}
                alt={`${profile.companyName} logo`}
                sx={{
                  maxWidth: 200,
                  maxHeight: 200,
                  objectFit: 'contain',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                }}
              />
            </Grid>
          )}

          {/* Description */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1">{profile.description}</Typography>
          </Grid>

          {/* Category */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Category
            </Typography>
            <Chip label={profile.category} />
          </Grid>

          {/* Products/Services */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Products/Services
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.productsServices.map((product, index) => (
                <Chip key={index} label={product} variant="outlined" />
              ))}
            </Box>
          </Grid>

          <Divider sx={{ my: 2, width: '100%' }} />

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Email fontSize="small" color="action" />
              <Typography variant="body2">{profile.contactInfo.email}</Typography>
            </Box>
            {profile.contactInfo.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">{profile.contactInfo.phone}</Typography>
              </Box>
            )}
            {profile.contactInfo.website && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Language fontSize="small" color="action" />
                <Link href={profile.contactInfo.website} target="_blank" rel="noopener">
                  {profile.contactInfo.website}
                </Link>
              </Box>
            )}
          </Grid>

          {/* Booth Information */}
          {profile.booth && (
            <>
              <Divider sx={{ my: 2, width: '100%' }} />
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Business fontSize="small" color="primary" />
                  <Typography variant="h6">Booth Information</Typography>
                </Box>
                <Typography variant="body1">
                  <strong>Booth:</strong> {profile.booth.identifier}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {profile.booth.size.width}m × {profile.booth.size.height}m ({profile.booth.size.area}m²)
                </Typography>
                {profile.booth.priceTier && (
                  <Chip label={`${profile.booth.priceTier} tier`} size="small" sx={{ mt: 1, mr: 1 }} />
                )}
                {profile.booth.amenities.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Amenities: {profile.booth.amenities.join(', ')}
                    </Typography>
                  </Box>
                )}
                {onEditBooth && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onEditBooth}
                    sx={{ mt: 2 }}
                  >
                    Update Booth Details
                  </Button>
                )}
              </Grid>
            </>
          )}

          {/* Documents */}
          {profile.documents && profile.documents.length > 0 && (
            <>
              <Divider sx={{ my: 2, width: '100%' }} />
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Description fontSize="small" color="action" />
                  <Typography variant="h6">Documents</Typography>
                </Box>
                {profile.documents.map((doc, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Link href={doc.url} target="_blank" rel="noopener">
                      {doc.filename}
                    </Link>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      (Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()})
                    </Typography>
                  </Box>
                ))}
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}


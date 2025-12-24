/**
 * ExhibitorList Component
 * Displays list of exhibitors with category badges
 * Implements T108: User Story 3
 */

import { Grid, Card, CardContent, CardActions, Typography, Button, Chip, Box, Avatar } from '@mui/material';
import { Business, Visibility } from '@mui/icons-material';
import type { ExhibitorSearchResult } from '../../types/attendee';

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
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No exhibitors found. Try adjusting your search criteria.
          </Typography>
        </Grid>
      ) : (
        exhibitors.map((exhibitor) => (
          <Grid item xs={12} sm={6} md={4} key={exhibitor.profileId}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                  {exhibitor.logo ? (
                    <Avatar src={exhibitor.logo} alt={exhibitor.companyName} sx={{ width: 56, height: 56 }} />
                  ) : (
                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                      <Business />
                    </Avatar>
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {exhibitor.companyName}
                    </Typography>
                    <Chip label={exhibitor.category} size="small" color="primary" variant="outlined" />
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {exhibitor.description.substring(0, 150)}
                  {exhibitor.description.length > 150 ? '...' : ''}
                </Typography>

                {exhibitor.productsServices.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Products/Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {exhibitor.productsServices.slice(0, 3).map((product, index) => (
                        <Chip key={index} label={product} size="small" variant="outlined" />
                      ))}
                      {exhibitor.productsServices.length > 3 && (
                        <Chip label={`+${exhibitor.productsServices.length - 3} more`} size="small" />
                      )}
                    </Box>
                  </Box>
                )}

                {exhibitor.booth && (
                  <Typography variant="caption" color="text.secondary">
                    Booth: {exhibitor.booth.identifier}
                  </Typography>
                )}
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Visibility />}
                  onClick={() => onViewProfile(exhibitor.profileId)}
                  disabled={isLoading}
                >
                  View Profile
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );
}


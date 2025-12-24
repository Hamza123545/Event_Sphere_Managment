/**
 * ApplicationCard Component
 * Displays exhibitor application summary with approve/reject actions
 * Implements T156
 */

import { Card, CardContent, CardActions, Typography, Button, Chip, Box, Avatar, Alert } from '@mui/material';
import { CheckCircle, Cancel, Description, Visibility } from '@mui/icons-material';
import type { ExhibitorApplication } from '../../types/approval';

interface ApplicationCardProps {
  application: ExhibitorApplication;
  onReview: (application: ExhibitorApplication) => void;
  onApprove: (application: ExhibitorApplication) => void;
  onReject: (application: ExhibitorApplication) => void;
  isLoading?: boolean;
}

export default function ApplicationCard({
  application,
  onReview,
  onApprove,
  onReject,
  isLoading = false,
}: ApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {application.logo && (
            <Avatar src={application.logo} alt={application.companyName} sx={{ mr: 2, width: 56, height: 56 }} />
          )}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {application.companyName}
            </Typography>
            <Chip
              label={application.registrationStatus.toUpperCase()}
              color={getStatusColor(application.registrationStatus) as any}
              size="small"
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {application.description.length > 150
            ? `${application.description.substring(0, 150)}...`
            : application.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Category: {application.category}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Products/Services: {application.productsServices.length} item(s)
          </Typography>
          {application.documents && application.documents.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Description fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="caption" color="text.secondary">
                {application.documents.length} document(s)
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {application.productsServices.slice(0, 3).map((product, index) => (
            <Chip key={index} label={product} size="small" variant="outlined" />
          ))}
          {application.productsServices.length > 3 && (
            <Chip label={`+${application.productsServices.length - 3} more`} size="small" variant="outlined" />
          )}
        </Box>

        {application.registrationStatus === 'rejected' && application.rejectionReason && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="caption">Rejection Reason: {application.rejectionReason}</Typography>
          </Alert>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {application.registrationStatus === 'pending' && (
          <>
            <Button
              size="small"
              startIcon={<Visibility />}
              onClick={() => onReview(application)}
              variant="outlined"
            >
              Review
            </Button>
            <Button
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => onApprove(application)}
              variant="contained"
              color="success"
              disabled={isLoading}
            >
              Approve
            </Button>
            <Button
              size="small"
              startIcon={<Cancel />}
              onClick={() => onReject(application)}
              variant="contained"
              color="error"
              disabled={isLoading}
            >
              Reject
            </Button>
          </>
        )}
        {application.registrationStatus !== 'pending' && (
          <Button size="small" startIcon={<Visibility />} onClick={() => onReview(application)} variant="outlined">
            View Details
          </Button>
        )}
      </CardActions>
    </Card>
  );
}


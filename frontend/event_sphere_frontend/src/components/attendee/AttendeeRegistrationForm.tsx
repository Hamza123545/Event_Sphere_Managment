/**
 * Attendee Registration Form
 * Registration form for attendees with preferences
 * Implements T114: User Story 3
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Box,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useState } from 'react';
import { useAttendeeStore } from '../../stores/attendeeStore';

interface AttendeeRegistrationFormProps {
  open: boolean;
  expoId: string;
  expoTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AttendeeRegistrationForm({
  open,
  expoId,
  expoTitle,
  onClose,
  onSuccess,
}: AttendeeRegistrationFormProps) {
  const { registerForExpo, isLoading, error } = useAttendeeStore();
  const [interests, setInterests] = useState<string[]>(['']);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(['']);

  const handleInterestChange = (index: number, value: string) => {
    const updated = [...interests];
    updated[index] = value;
    setInterests(updated);
  };

  const addInterest = () => {
    setInterests([...interests, '']);
  };

  const removeInterest = (index: number) => {
    if (interests.length > 1) {
      setInterests(interests.filter((_, i) => i !== index));
    }
  };

  const handleDietaryChange = (index: number, value: string) => {
    const updated = [...dietaryRestrictions];
    updated[index] = value;
    setDietaryRestrictions(updated);
  };

  const addDietary = () => {
    setDietaryRestrictions([...dietaryRestrictions, '']);
  };

  const removeDietary = (index: number) => {
    if (dietaryRestrictions.length > 1) {
      setDietaryRestrictions(dietaryRestrictions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validInterests = interests.filter((i) => i.trim());
    const validDietary = dietaryRestrictions.filter((d) => d.trim());

    try {
      await registerForExpo(expoId, {
        preferences: {
          interests: validInterests.length > 0 ? validInterests : undefined,
          dietaryRestrictions: validDietary.length > 0 ? validDietary : undefined,
        },
      });

      // Reset form
      setInterests(['']);
      setDietaryRestrictions(['']);
      onSuccess();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setInterests(['']);
      setDietaryRestrictions(['']);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Register for {expoTitle}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Interests */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Interests (Optional)
              </Typography>
              {interests.map((interest, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Enter interest (e.g., AI, Cloud Computing)"
                    value={interest}
                    onChange={(e) => handleInterestChange(index, e.target.value)}
                    disabled={isLoading}
                  />
                  {interests.length > 1 && (
                    <IconButton onClick={() => removeInterest(index)} disabled={isLoading} color="error">
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={addInterest} disabled={isLoading} size="small">
                Add Interest
              </Button>
            </Grid>

            {/* Dietary Restrictions */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Dietary Restrictions (Optional)
              </Typography>
              {dietaryRestrictions.map((restriction, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Enter dietary restriction (e.g., Vegetarian, Gluten-free)"
                    value={restriction}
                    onChange={(e) => handleDietaryChange(index, e.target.value)}
                    disabled={isLoading}
                  />
                  {dietaryRestrictions.length > 1 && (
                    <IconButton onClick={() => removeDietary(index)} disabled={isLoading} color="error">
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={addDietary} disabled={isLoading} size="small">
                Add Dietary Restriction
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}


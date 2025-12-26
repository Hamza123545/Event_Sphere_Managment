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
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useState } from 'react';
import { useAttendeeStore } from '../../stores/attendeeStore';
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

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
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: activeTheme.surface,
          border: `1px solid ${activeTheme.border}`,
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ color: activeTheme.textPrimary, fontWeight: 800 }}>
          Register for {expoTitle}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: activeTheme.surface }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                bgcolor: `${activeTheme.error}20`,
                border: `1px solid ${activeTheme.error}30`,
                color: activeTheme.textPrimary
              }}
            >
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Interests */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: activeTheme.textPrimary, fontWeight: 700 }}>
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: activeTheme.surfaceLight,
                        color: activeTheme.textPrimary,
                        '& fieldset': {
                          borderColor: activeTheme.border,
                        },
                        '&:hover fieldset': {
                          borderColor: activeTheme.accent,
                        },
                      },
                    }}
                  />
                  {interests.length > 1 && (
                    <IconButton 
                      onClick={() => removeInterest(index)} 
                      disabled={isLoading}
                      sx={{ color: activeTheme.error }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              <ActionButton startIcon={<Add />} onClick={addInterest} disabled={isLoading} size="small">
                Add Interest
              </ActionButton>
            </Grid>

            {/* Dietary Restrictions */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ color: activeTheme.textPrimary, fontWeight: 700 }}>
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: activeTheme.surfaceLight,
                        color: activeTheme.textPrimary,
                        '& fieldset': {
                          borderColor: activeTheme.border,
                        },
                        '&:hover fieldset': {
                          borderColor: activeTheme.accent,
                        },
                      },
                    }}
                  />
                  {dietaryRestrictions.length > 1 && (
                    <IconButton 
                      onClick={() => removeDietary(index)} 
                      disabled={isLoading}
                      sx={{ color: activeTheme.error }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              <ActionButton startIcon={<Add />} onClick={addDietary} disabled={isLoading} size="small">
                Add Dietary Restriction
              </ActionButton>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
          <ActionButton onClick={handleClose} disabled={isLoading}>
            Cancel
          </ActionButton>
          <ActionButton type="submit" primary disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Register'}
          </ActionButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}


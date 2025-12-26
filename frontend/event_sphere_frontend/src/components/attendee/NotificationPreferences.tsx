/**
 * NotificationPreferences Component
 * Channels checkboxes (email, in-app), default minutes before dropdown
 * Implements T206
 */

import { useState, useEffect } from 'react';
import {
  Typography,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormGroup,
  Switch,
  FormLabel,
  Alert,
} from '@mui/material';
import { useNotificationsStore } from '../../stores/notificationsStore';
import {
  GlassCard,
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

export default function NotificationPreferences() {
  const { preferences, updatePreferences } = useNotificationsStore();
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handleChannelChange = (channel: 'email' | 'in-app', checked: boolean) => {
    setLocalPreferences((prev) => ({
      ...prev,
      channels: checked
        ? [...prev.channels, channel]
        : prev.channels.filter((c) => c !== channel),
    }));
  };

  const handleSave = () => {
    updatePreferences(localPreferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const reminderTimeOptions = [
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 240, label: '4 hours before' },
    { value: 1440, label: '1 day before' },
  ];

  return (
    <GlassCard>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: activeTheme.textPrimary }}>
        Notification Preferences
      </Typography>

      {saved && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            bgcolor: `${activeTheme.success}20`,
            border: `1px solid ${activeTheme.success}30`,
            color: activeTheme.textPrimary
          }} 
          onClose={() => setSaved(false)}
        >
          Preferences saved successfully
        </Alert>
      )}

      <FormGroup sx={{ mb: 4 }}>
        <FormLabel component="legend" sx={{ mb: 2, color: activeTheme.textPrimary, fontWeight: 700 }}>
          Notification Channels
        </FormLabel>
        <FormControlLabel
          control={
            <Checkbox
              checked={localPreferences.channels.includes('email')}
              onChange={(e) => handleChannelChange('email', e.target.checked)}
              sx={{
                color: activeTheme.accent,
                '&.Mui-checked': {
                  color: activeTheme.accent,
                },
              }}
            />
          }
          label={<Typography sx={{ color: activeTheme.textPrimary }}>Email</Typography>}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={localPreferences.channels.includes('in-app')}
              onChange={(e) => handleChannelChange('in-app', e.target.checked)}
              sx={{
                color: activeTheme.accent,
                '&.Mui-checked': {
                  color: activeTheme.accent,
                },
              }}
            />
          }
          label={<Typography sx={{ color: activeTheme.textPrimary }}>In-App Notifications</Typography>}
        />
      </FormGroup>

      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel sx={{ color: activeTheme.textSecondary }}>Default Reminder Time</InputLabel>
        <Select
          value={localPreferences.defaultMinutesBefore}
          label="Default Reminder Time"
          onChange={(e) =>
            setLocalPreferences((prev) => ({
              ...prev,
              defaultMinutesBefore: e.target.value as number,
            }))
          }
          sx={{
            bgcolor: activeTheme.surfaceLight,
            color: activeTheme.textPrimary,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: activeTheme.border,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: activeTheme.accent,
            },
          }}
        >
          {reminderTimeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={localPreferences.soundEnabled}
            onChange={(e) =>
              setLocalPreferences((prev) => ({
                ...prev,
                soundEnabled: e.target.checked,
              }))
            }
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: activeTheme.accent,
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                bgcolor: activeTheme.accent,
              },
            }}
          />
        }
        label={<Typography sx={{ color: activeTheme.textPrimary }}>Enable sound for notifications</Typography>}
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <ActionButton primary onClick={handleSave}>
          Save Preferences
        </ActionButton>
        <ActionButton onClick={() => setLocalPreferences(preferences)}>
          Reset
        </ActionButton>
      </Box>
    </GlassCard>
  );
}


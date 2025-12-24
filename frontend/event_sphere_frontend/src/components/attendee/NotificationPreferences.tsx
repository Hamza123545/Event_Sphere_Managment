/**
 * NotificationPreferences Component
 * Channels checkboxes (email, in-app), default minutes before dropdown
 * Implements T206
 */

import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  FormGroup,
  Switch,
  FormLabel,
  Alert,
} from '@mui/material';
import { useNotificationsStore } from '../../stores/notificationsStore';

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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Notification Preferences
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>
          Preferences saved successfully
        </Alert>
      )}

      <FormGroup sx={{ mb: 3 }}>
        <FormLabel component="legend" sx={{ mb: 1 }}>
          Notification Channels
        </FormLabel>
        <FormControlLabel
          control={
            <Checkbox
              checked={localPreferences.channels.includes('email')}
              onChange={(e) => handleChannelChange('email', e.target.checked)}
            />
          }
          label="Email"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={localPreferences.channels.includes('in-app')}
              onChange={(e) => handleChannelChange('in-app', e.target.checked)}
            />
          }
          label="In-App Notifications"
        />
      </FormGroup>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Default Reminder Time</InputLabel>
        <Select
          value={localPreferences.defaultMinutesBefore}
          label="Default Reminder Time"
          onChange={(e) =>
            setLocalPreferences((prev) => ({
              ...prev,
              defaultMinutesBefore: e.target.value as number,
            }))
          }
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
          />
        }
        label="Enable sound for notifications"
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Preferences
        </Button>
        <Button
          variant="outlined"
          onClick={() => setLocalPreferences(preferences)}
        >
          Reset
        </Button>
      </Box>
    </Paper>
  );
}


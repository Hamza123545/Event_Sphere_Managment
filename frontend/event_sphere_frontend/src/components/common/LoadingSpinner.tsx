import { CircularProgress, Box } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  fullScreen?: boolean;
}

/**
 * LoadingSpinner component
 * Reusable loading indicator
 */
export function LoadingSpinner({ size = 40, fullScreen = false }: LoadingSpinnerProps) {
  const spinner = <CircularProgress size={size} />;

  if (fullScreen) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        {spinner}
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={3}>
      {spinner}
    </Box>
  );
}

export default LoadingSpinner;


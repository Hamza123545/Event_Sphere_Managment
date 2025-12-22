import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import ProtectedRoute from './components/common/ProtectedRoute';

/**
 * React Router configuration
 * Route definitions, protected routes, role-based routing
 * Implements constitutional requirement for Role-Based Access Control
 */

// Placeholder pages (will be created in user story phases)
function LoginPage() {
  return <div>Login Page (Coming Soon)</div>;
}

function OrganizerDashboard() {
  return <div>Organizer Dashboard (Coming Soon)</div>;
}

function ExhibitorDashboard() {
  return <div>Exhibitor Dashboard (Coming Soon)</div>;
}

function AttendeeDashboard() {
  return <div>Attendee Dashboard (Coming Soon)</div>;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected routes with role-based access */}
          <Route
            path="/organizer/*"
            element={
              <ProtectedRoute requiredRole={['admin', 'organizer']}>
                <Routes>
                  <Route path="/" element={<OrganizerDashboard />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          <Route
            path="/exhibitor/*"
            element={
              <ProtectedRoute requiredRole={['admin', 'exhibitor']}>
                <Routes>
                  <Route path="/" element={<ExhibitorDashboard />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendee/*"
            element={
              <ProtectedRoute requiredRole={['admin', 'attendee']}>
                <Routes>
                  <Route path="/" element={<AttendeeDashboard />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* 404 route */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

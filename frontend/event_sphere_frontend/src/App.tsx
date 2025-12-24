import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OrganizerDashboard from './pages/organizer/Dashboard';
import FloorPlanEditorPage from './pages/organizer/FloorPlanEditorPage';
import ApplicationQueuePage from './pages/organizer/ApplicationQueuePage';
import AnalyticsPage from './pages/organizer/AnalyticsPage';
import ExhibitorDashboard from './pages/exhibitor/Dashboard';
import BrowseExposPage from './pages/exhibitor/BrowseExposPage';
import ProfileDetailPage from './pages/exhibitor/ProfileDetailPage';
import FloorPlanPage from './pages/exhibitor/FloorPlanPage';
import AttendeeDashboard from './pages/attendee/Dashboard';
import ExpoDirectoryPage from './pages/attendee/ExpoDirectoryPage';
import ExpoDetailPage from './pages/attendee/ExpoDetailPage';
import PersonalSchedulePage from './pages/attendee/PersonalSchedulePage';
import MessagesPage from './pages/common/MessagesPage';
import ProfilePage from './pages/common/ProfilePage';
import FeedbackPage from './pages/common/FeedbackPage';
import FeedbackQueuePage from './pages/organizer/FeedbackQueuePage';

/**
 * React Router configuration
 * Route definitions, protected routes, role-based routing
 * Implements constitutional requirement for Role-Based Access Control
 */

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected routes with role-based access */}
          <Route
            path="/organizer/*"
            element={
              <ProtectedRoute requiredRole={['admin', 'organizer']}>
                <Routes>
                  <Route path="/" element={<OrganizerDashboard />} />
                  <Route path="/expos/:expoId/floor-plan" element={<FloorPlanEditorPage />} />
                  <Route path="/expos/:expoId/applications" element={<ApplicationQueuePage />} />
                  <Route path="/expos/:expoId/analytics" element={<AnalyticsPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/feedback" element={<FeedbackQueuePage />} />
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
                  <Route path="/browse" element={<BrowseExposPage />} />
                  <Route path="/profile/:profileId" element={<ProfileDetailPage />} />
                  <Route path="/expo/:expoId/floor-plan" element={<FloorPlanPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/settings" element={<ProfilePage />} />
                  <Route path="/feedback" element={<FeedbackPage />} />
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
                  <Route path="/browse" element={<ExpoDirectoryPage />} />
                  <Route path="/expo/:expoId" element={<ExpoDetailPage />} />
                  <Route path="/schedule" element={<PersonalSchedulePage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/feedback" element={<FeedbackPage />} />
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

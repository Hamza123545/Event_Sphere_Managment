import { BrowserRouter, Routes, Route} from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Suspense, lazy } from 'react';
import { theme } from './theme';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load pages for code splitting - Implements T242
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const ServicesPage = lazy(() => import('./pages/public/ServicesPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const OrganizerDashboard = lazy(() => import('./pages/organizer/Dashboard'));
const FloorPlanEditorPage = lazy(() => import('./pages/organizer/FloorPlanEditorPage'));
const ApplicationQueuePage = lazy(() => import('./pages/organizer/ApplicationQueuePage'));
const AnalyticsPage = lazy(() => import('./pages/organizer/AnalyticsPage'));
const ExhibitorDashboard = lazy(() => import('./pages/exhibitor/Dashboard'));
const BrowseExposPage = lazy(() => import('./pages/exhibitor/BrowseExposPage'));
const ProfileDetailPage = lazy(() => import('./pages/exhibitor/ProfileDetailPage'));
const FloorPlanPage = lazy(() => import('./pages/exhibitor/FloorPlanPage'));
const AttendeeDashboard = lazy(() => import('./pages/attendee/Dashboard'));
const ExpoDirectoryPage = lazy(() => import('./pages/attendee/ExpoDirectoryPage'));
const ExpoDetailPage = lazy(() => import('./pages/attendee/ExpoDetailPage'));
const PersonalSchedulePage = lazy(() => import('./pages/attendee/PersonalSchedulePage'));
const MessagesPage = lazy(() => import('./pages/common/MessagesPage'));
const ProfilePage = lazy(() => import('./pages/common/ProfilePage'));
const FeedbackPage = lazy(() => import('./pages/common/FeedbackPage'));
const FeedbackQueuePage = lazy(() => import('./pages/organizer/FeedbackQueuePage'));

/**
 * React Router configuration
 * Route definitions, protected routes, role-based routing
 * Implements constitutional requirement for Role-Based Access Control
 */

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                  <Route path="/expos" element={<ExpoDirectoryPage />} />
                  <Route path="/expos/:expoId" element={<ExpoDetailPage />} />
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
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

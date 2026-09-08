import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AppDashboardPage } from '@/pages/AppDashboardPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SkillProfilePage } from '@/pages/SkillProfilePage';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { PublicProfilePage } from '@/pages/PublicProfilePage';
import { RequestsPage } from '@/pages/RequestsPage';
import { RequestDetailPage } from '@/pages/RequestDetailPage';
import { SessionsPage } from '@/pages/SessionsPage';
import { SessionDetailPage } from '@/pages/SessionDetailPage';
import { VideoCallPage } from '@/pages/VideoCallPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { WalletPage } from '@/pages/WalletPage';
import { ModerationPage } from '@/pages/ModerationPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { AvailabilityPage } from '@/pages/AvailabilityPage';
import { ScheduleSessionPage } from '@/pages/ScheduleSessionPage';

import { SettingsPage } from '@/pages/SettingsPage';

import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/auth/PublicOnlyRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'app',
        element: (
          <ProtectedRoute>
            <AppDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'discover',
        element: (
          <ProtectedRoute>
            <DiscoverPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <ProtectedRoute>
            <PublicProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requests',
        element: (
          <ProtectedRoute>
            <RequestsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'requests/incoming',
        element: <Navigate to="/requests?tab=incoming" replace />,
      },
      {
        path: 'requests/outgoing',
        element: <Navigate to="/requests?tab=outgoing" replace />,
      },
      {
        path: 'requests/:id',
        element: (
          <ProtectedRoute>
            <RequestDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sessions',
        element: (
          <ProtectedRoute>
            <SessionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'availability',
        element: (
          <ProtectedRoute>
            <AvailabilityPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sessions/:id',
        element: (
          <ProtectedRoute>
            <SessionDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sessions/:id/schedule',
        element: (
          <ProtectedRoute>
            <ScheduleSessionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sessions/:id/reschedule',
        element: (
          <ProtectedRoute>
            <ScheduleSessionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sessions/:id/call',
        element: (
          <ProtectedRoute>
            <VideoCallPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'messages/:conversationId',
        element: (
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'wallet',

        element: (
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },

      {
        path: 'profile/skills',
        element: (
          <ProtectedRoute>
            <SkillProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'moderation',
        element: (
          <ProtectedRoute>
            <ModerationPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);



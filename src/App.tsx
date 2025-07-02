import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.ts';
import LoginPage from './features/Auth/LoginPage.tsx';
import MainLayout from './components/layout/MainLayout.tsx';
import JournalPage from './features/Journal/JournalPage.tsx';
import GoalsPage from './features/Goals/GoalsPage.tsx';
import InsightsPage from './features/Insights/InsightsPage.tsx';
import SettingsPage from './features/Settings/SettingsPage.tsx';
import BlueprintPage from './features/Insights/BlueprintPage.tsx';
import { JSX } from 'react';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase.ts';
import SummitPage from './features/Journal/SummitPage.tsx';
import { checkAndResetWeeklyGoals } from './services/firestoreService.ts';

// A helper component to protect routes that require authentication
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuthStore();
  if (!user) {
    // If not logged in, redirect to the login page
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const { user, isLoading } = useAuthStore();

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // When Firebase has determined the auth state, this callback runs.
      // We update our store with the user object (or null if not logged in).
      // CRUCIALLY, we set isLoading to false because the check is now complete.
      useAuthStore.setState({ user: user, isLoading: false });

      if (user) {
        checkAndResetWeeklyGoals(user.uid);
      }
    });

    // The cleanup function will unsubscribe from the listener when the app closes.
    return () => unsubscribe();
  }, []); // The empty array ensures this effect runs only once on mount.


  // This logic now works perfectly.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* These routes are nested inside MainLayout and are protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default route redirects to /journal */}
          <Route index element={<Navigate to="/journal" replace />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="insights/blueprint" element={<BlueprintPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="/journal/entry/:entryId/summit" element={<SummitPage />} />
        </Route>
        
        {/* A catch-all route for any other path */}
        <Route path="*" element={<Navigate to={user ? "/journal" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
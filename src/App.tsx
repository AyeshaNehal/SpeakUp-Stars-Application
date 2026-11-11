import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { WheelPage } from './pages/WheelPage';
import { PrepPage } from './pages/PrepPage';
import { RecordPage } from './pages/RecordPage';
import { ResultsPage } from './pages/ResultsPage';
import { RewardsPage } from './pages/RewardsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { GamesHubPage } from './pages/games/GamesHubPage';
import { VolumeVolcanoGamePage } from './pages/games/VolumeVolcanoGamePage';
import { EchoExplorerGamePage } from './pages/games/EchoExplorerGamePage';
import { FeelingsCatchGamePage } from './pages/games/FeelingsCatchGamePage';
import { StoryDiceGamePage } from './pages/games/StoryDiceGamePage';
import { PaceRacerGamePage } from './pages/games/PaceRacerGamePage';
import { ParentPrivacyPolicyPage } from './pages/legal/ParentPrivacyPolicyPage';
import { KidFriendlyPrivacyPage } from './pages/legal/KidFriendlyPrivacyPage';
import { TermsOfUsePage } from './pages/legal/TermsOfUsePage';

// Onboarding & Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ParentSetupPage } from './pages/onboarding/ParentSetupPage';
import { ConsentPage } from './pages/onboarding/ConsentPage';
import { PinSetupPage } from './pages/onboarding/PinSetupPage';
import { ChildWizardPage } from './pages/onboarding/ChildWizardPage';
import { ChildChooserPage } from './pages/children/ChildChooserPage';

import { RouteGuard } from './components/auth/RouteGuard';
import { ParentAuthProvider } from './context/ParentAuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { I18nProvider } from './context/I18nContext';

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AccessibilityProvider>
        <ParentAuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Standalone Auth & First-Login Onboarding Routes with State Machine Guard */}
              <Route
                path="/login"
                element={
                  <RouteGuard>
                    <LoginPage />
                  </RouteGuard>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <RouteGuard>
                    <VerifyEmailPage />
                  </RouteGuard>
                }
              />
              <Route
                path="/onboarding/parent"
                element={
                  <RouteGuard>
                    <ParentSetupPage />
                  </RouteGuard>
                }
              />
              <Route
                path="/onboarding/consent"
                element={
                  <RouteGuard>
                    <ConsentPage />
                  </RouteGuard>
                }
              />
              <Route
                path="/onboarding/pin"
                element={
                  <RouteGuard>
                    <PinSetupPage />
                  </RouteGuard>
                }
              />
              <Route
                path="/onboarding/child"
                element={
                  <RouteGuard>
                    <ChildWizardPage />
                  </RouteGuard>
                }
              />
              <Route
                path="/child-select"
                element={
                  <RouteGuard>
                    <ChildChooserPage />
                  </RouteGuard>
                }
              />

              {/* Main Application Routes inside AppLayout (Protected by RouteGuard) */}
              <Route
                element={
                  <RouteGuard>
                    <AppLayout />
                  </RouteGuard>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/wheel" element={<WheelPage />} />
                <Route path="/prep" element={<PrepPage />} />
                <Route path="/record" element={<RecordPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/games" element={<GamesHubPage />} />
                <Route path="/games/volcano" element={<VolumeVolcanoGamePage />} />
                <Route path="/games/echo" element={<EchoExplorerGamePage />} />
                <Route path="/games/feelings" element={<FeelingsCatchGamePage />} />
                <Route path="/games/dice" element={<StoryDiceGamePage />} />
                <Route path="/games/racer" element={<PaceRacerGamePage />} />
                <Route path="/rewards" element={<RewardsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/parent" element={<ParentDashboardPage />} />
                <Route path="/parent-dashboard" element={<Navigate to="/parent" replace />} />
                <Route path="/privacy" element={<ParentPrivacyPolicyPage />} />
                <Route path="/kids-privacy" element={<KidFriendlyPrivacyPage />} />
                <Route path="/terms" element={<TermsOfUsePage />} />
                {/* Catch-all redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ParentAuthProvider>
      </AccessibilityProvider>
    </I18nProvider>
  );
};

export default App;

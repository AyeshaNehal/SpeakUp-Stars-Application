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
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
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

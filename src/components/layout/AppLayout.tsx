import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { Footer } from './Footer';
import { PolicyReconsentModal } from '../legal/PolicyReconsentModal';
import { ScreenTimeToast } from '../safety/ScreenTimeToast';
import { RestYourVoiceModal } from '../safety/RestYourVoiceModal';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';
import { screenTimeReminderService } from '../../services/safety/screenTimeReminderService';
import { AgeGroup } from '../../types';

export const AppLayout: React.FC = () => {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('6-8');
  const [showScreenTimeToast, setShowScreenTimeToast] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);

  // Monitor continuous screen time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (screenTimeReminderService.checkReminder()) {
        setShowScreenTimeToast(true);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRestVoice = () => {
    setShowScreenTimeToast(false);
    setShowRestModal(true);
  };

  const handleSnooze = () => {
    setShowScreenTimeToast(false);
    screenTimeReminderService.snoozeReminder(5);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-row relative">
      {/* Accessible Skip to Content Link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Laptop & Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header currentAgeGroup={ageGroup} onAgeGroupChange={setAgeGroup} />

        {/* Scrollable Page Outlet with fluid padding & landscape responsiveness */}
        <main
          id="main-content"
          tabIndex={-1}
          role="main"
          className="
            flex-1 w-full max-w-7xl mx-auto
            px-3 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8
            pb-28 sm:pb-32 md:pb-10
            landscape:pb-24 md:landscape:pb-10
            transition-all duration-150
            focus:outline-none
          "
        >
          <Outlet context={{ ageGroup, setAgeGroup }} />
        </main>

        {/* Global Responsive Legal Footer */}
        <Footer />

        {/* Mobile Bottom Navigation Bar (min 56px touch targets) */}
        <BottomNav />
      </div>

      {/* Privacy Policy & Terms Re-Consent Modal */}
      <PolicyReconsentModal />

      {/* Screen-Time Wellness Reminder Toast */}
      <ScreenTimeToast
        isVisible={showScreenTimeToast}
        onRestVoice={handleRestVoice}
        onSnooze={handleSnooze}
      />

      {/* Rest Your Voice Modal */}
      <RestYourVoiceModal
        isOpen={showRestModal}
        childNickname="Leo"
        childId="default_leo"
        onDismiss={() => {
          setShowRestModal(false);
          screenTimeReminderService.resetSession();
        }}
      />

      {/* PWA Home Screen Install Banner */}
      <PwaInstallPrompt />
    </div>
  );
};

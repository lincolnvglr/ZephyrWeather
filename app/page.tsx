'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useZephyrStore } from '@/store/useZephyrStore';
import { BottomNav } from '@/components/BottomNav';
import { HomeScreen } from '@/components/screens/HomeScreen';
import { ReportScreen } from '@/components/screens/ReportScreen';
import { MapScreen } from '@/components/screens/MapScreen';
import { AlertsScreen } from '@/components/screens/AlertsScreen';

const SCREEN_COMPONENTS = {
  home: HomeScreen,
  report: ReportScreen,
  map: MapScreen,
  alerts: AlertsScreen,
};

export default function App() {
  const { activeScreen, requestLocation, threatLevel } = useZephyrStore();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const ScreenComponent = SCREEN_COMPONENTS[activeScreen];

  return (
    <div
      className="relative flex flex-col h-dvh overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #030712 0%, #0a0f1a 100%)' }}
    >
      {/* Threat level ambient glow */}
      {threatLevel === 'immediate' && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        </div>
      )}
      {threatLevel === 'dangerous' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 z-50" />
      )}

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide z-10" style={{ paddingBottom: '72px' }}>
        <div className="max-w-md mx-auto px-4 pt-6 pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="h-full"
            >
              <ScreenComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}

'use client';

import { useZephyrStore } from '@/store/useZephyrStore';

const NAV_ITEMS = [
  { screen: 'home' as const, icon: '🏠', label: 'Status' },
  { screen: 'report' as const, icon: '📡', label: 'Report' },
  { screen: 'map' as const, icon: '🗺', label: 'Map' },
  { screen: 'alerts' as const, icon: '🔔', label: 'Alerts' },
];

export function BottomNav() {
  const { activeScreen, setScreen, unreadCount } = useZephyrStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800/60 safe-area-pb">
      <div className="flex items-center max-w-md mx-auto">
        {NAV_ITEMS.map(({ screen, icon, label }) => {
          const isActive = activeScreen === screen;
          const badgeCount = screen === 'alerts' ? unreadCount : 0;

          return (
            <button
              key={screen}
              onClick={() => setScreen(screen)}
              className={`
                flex-1 flex flex-col items-center py-3 gap-0.5 transition-all duration-150
                ${isActive ? 'text-white' : 'text-gray-500 active:text-gray-300'}
              `}
            >
              <div className="relative">
                <span className="text-xl">{icon}</span>
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide uppercase ${isActive ? 'text-white' : ''}`}>
                {label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

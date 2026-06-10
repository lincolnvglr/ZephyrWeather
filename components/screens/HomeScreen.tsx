'use client';

import { useZephyrStore } from '@/store/useZephyrStore';
import { ThreatLevelIndicator } from '@/components/ThreatLevelIndicator';
import { ThreatCard } from '@/components/ThreatCard';
import { THREAT_META } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export function HomeScreen() {
  const { threatLevel, threats, alerts, setScreen, user } = useZephyrStore();

  const nearbyThreats = threats
    .filter((t) => (t.distance ?? Infinity) < 10 && t.status !== 'resolved')
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  const unreadAlerts = alerts.filter((a) => !a.read).slice(0, 3);

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">ZEPHYR</h1>
          <p className="text-xs text-gray-500 -mt-0.5">Real-Time Threat Network</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-gray-400">{user.name}</p>
            <p className="text-[10px] text-gray-600">
              {user.credibilityScore} pts
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold text-white">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>

      {/* Threat Level */}
      <ThreatLevelIndicator level={threatLevel} />

      {/* Urgent Alert Banner */}
      {unreadAlerts.length > 0 && (
        <button
          onClick={() => setScreen('alerts')}
          className="w-full text-left"
        >
          <div className="rounded-2xl bg-red-950/60 border border-red-500/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Active Alerts
              </span>
              <span className="text-xs text-red-400/70">{unreadAlerts.length} unread →</span>
            </div>
            {unreadAlerts.slice(0, 2).map((alert) => {
              const meta = THREAT_META[alert.type];
              return (
                <div key={alert.id} className="flex items-start gap-2 py-1">
                  <span className="text-base">{meta.icon}</span>
                  <div>
                    <p className="text-xs text-white font-medium leading-snug">{alert.message}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </button>
      )}

      {/* Report Button CTA */}
      <button
        onClick={() => setScreen('report')}
        className="w-full rounded-2xl bg-red-600 active:bg-red-700 p-4 transition-all duration-100 active:scale-[0.98]"
      >
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">📡</span>
          <div className="text-left">
            <p className="text-white font-black text-lg leading-none">REPORT THREAT</p>
            <p className="text-red-200 text-xs mt-0.5">Tap to report in under 3 seconds</p>
          </div>
          <span className="ml-auto text-red-300 text-xl">›</span>
        </div>
      </button>

      {/* Nearby Threats */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Nearby Threats
          </h2>
          <button onClick={() => setScreen('map')} className="text-xs text-blue-400">
            View Map →
          </button>
        </div>

        {nearbyThreats.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm text-gray-400">No active threats within 10 miles</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {nearbyThreats.map((threat) => (
              <ThreatCard
                key={threat.id}
                threat={threat}
                onClick={() => setScreen('map')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stat Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Threats', value: nearbyThreats.length.toString(), sub: 'within 10mi' },
          { label: 'Reports Today', value: '47', sub: 'in your area' },
          { label: 'Avg Lead Time', value: '+6min', sub: 'vs official' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl bg-gray-900/60 border border-gray-800 p-3 text-center">
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{label}</p>
            <p className="text-[9px] text-gray-600 leading-tight">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

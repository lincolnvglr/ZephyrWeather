'use client';

import { useZephyrStore } from '@/store/useZephyrStore';
import { Alert, THREAT_META, STATUS_META } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const STATUS_BG: Record<string, string> = {
  observation: 'bg-yellow-500/10 border-yellow-500/20',
  developing: 'bg-orange-500/10 border-orange-500/20',
  verified: 'bg-red-500/10 border-red-500/20',
  immediate_danger: 'bg-white/10 border-white/20',
  resolved: 'bg-gray-800/50 border-gray-700/30',
};

function AlertItem({ alert, onRead }: { alert: Alert; onRead: (id: string) => void }) {
  const meta = THREAT_META[alert.type];
  const statusMeta = STATUS_META[alert.status];

  return (
    <div
      onClick={() => onRead(alert.id)}
      className={`
        rounded-2xl border p-4 cursor-pointer transition-all active:scale-[0.98]
        ${STATUS_BG[alert.status]}
        ${alert.read ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <span className="text-3xl">{meta.icon}</span>
          {!alert.read && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-gray-950" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: statusMeta.color }}
            >
              {statusMeta.label}
            </span>
            <span className="text-xs text-gray-500 shrink-0">
              {alert.distance.toFixed(1)}mi
            </span>
          </div>
          <p className="text-sm text-white leading-snug mb-2">{alert.message}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusMeta.color }}
              />
              <span className="text-xs text-gray-400">
                {alert.confidence}% confidence
              </span>
            </div>
            <span className="text-xs text-gray-600">
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlertsScreen() {
  const { alerts, markAlertRead, markAllRead, unreadCount } = useZephyrStore();

  const sorted = [...alerts].sort((a, b) => {
    // Sort by: unread first, then severity, then distance
    if (a.read !== b.read) return a.read ? 1 : -1;
    const severityOrder = { immediate_danger: 0, verified: 1, developing: 2, observation: 3, resolved: 4 };
    const diff = (severityOrder[a.status] ?? 5) - (severityOrder[b.status] ?? 5);
    if (diff !== 0) return diff;
    return a.distance - b.distance;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h1 className="text-xl font-black text-white">ALERTS</h1>
          <p className="text-xs text-gray-500">Sorted by severity & distance</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Alert count */}
      {unreadCount > 0 ? (
        <div className="flex items-center gap-2 mb-4 bg-red-950/40 border border-red-500/20 rounded-xl px-4 py-2.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-300 font-medium">
            {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''} require your attention
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4 bg-green-950/30 border border-green-500/20 rounded-xl px-4 py-2.5">
          <span className="text-green-400">✓</span>
          <span className="text-sm text-green-400">All caught up</span>
        </div>
      )}

      {/* Sort legend */}
      <div className="flex items-center gap-3 mb-3 px-1">
        <span className="text-xs text-gray-600 uppercase tracking-wider">Sorted by:</span>
        {['Unread', 'Severity', 'Distance'].map((label, i) => (
          <span key={label} className="flex items-center gap-1 text-xs text-gray-500">
            {i > 0 && <span className="text-gray-700">→</span>}
            {label}
          </span>
        ))}
      </div>

      {/* Alert list */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center">
            <p className="text-3xl mb-3">🔕</p>
            <p className="text-sm text-gray-400">No alerts in your area</p>
          </div>
        ) : (
          sorted.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onRead={markAlertRead} />
          ))
        )}
      </div>

      {/* Info footer */}
      <div className="mt-4 pt-3 border-t border-gray-800/50">
        <p className="text-xs text-gray-700 text-center">
          Alerts within 10 miles · Updated in real-time
        </p>
      </div>
    </div>
  );
}

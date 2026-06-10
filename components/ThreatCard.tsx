'use client';

import { ActiveThreat, THREAT_META } from '@/types';
import { ConfidenceMeter } from './ConfidenceMeter';
import { ThreatBadge } from './ThreatBadge';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  threat: ActiveThreat;
  onClick?: () => void;
  compact?: boolean;
}

export function ThreatCard({ threat, onClick, compact = false }: Props) {
  const meta = THREAT_META[threat.type];

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl border bg-gray-900/80 backdrop-blur-sm cursor-pointer
        transition-all duration-200 active:scale-[0.98]
        ${threat.status === 'immediate_danger'
          ? 'border-white/30 shadow-lg shadow-white/5'
          : threat.status === 'verified'
          ? 'border-red-500/30 shadow-lg shadow-red-500/10'
          : threat.status === 'developing'
          ? 'border-orange-500/30'
          : 'border-yellow-500/20'}
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      {threat.status === 'immediate_danger' && (
        <div className="absolute inset-0 rounded-2xl bg-white/5 animate-pulse pointer-events-none" />
      )}

      <div className="flex items-start gap-3">
        <div className={`text-${compact ? '2xl' : '3xl'} leading-none`}>{meta.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`font-bold text-white ${compact ? 'text-sm' : 'text-base'}`}>
              {meta.label}
            </span>
            {threat.distance !== undefined && (
              <span className="text-xs text-gray-400 shrink-0">
                {threat.distance < 1
                  ? `${Math.round(threat.distance * 1000)}m`
                  : `${threat.distance.toFixed(1)}mi`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <ThreatBadge status={threat.status} />
            <span className="text-xs text-gray-500">
              {threat.reportCount} report{threat.reportCount !== 1 ? 's' : ''}
            </span>
          </div>

          {!compact && (
            <>
              <ConfidenceMeter confidence={threat.confidence} size="sm" />
              <p className="text-xs text-gray-500 mt-2">
                {formatDistanceToNow(new Date(threat.lastUpdated), { addSuffix: true })}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

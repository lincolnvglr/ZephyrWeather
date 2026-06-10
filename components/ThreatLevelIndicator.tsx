'use client';

import { ThreatLevel, THREAT_LEVEL_META } from '@/types';

const LEVEL_EMOJI: Record<ThreatLevel, string> = {
  normal: '🟢',
  elevated: '🟡',
  significant: '🟠',
  dangerous: '🔴',
  immediate: '⚫',
};

interface Props {
  level: ThreatLevel;
}

export function ThreatLevelIndicator({ level }: Props) {
  const meta = THREAT_LEVEL_META[level];
  const isImmediate = level === 'immediate';

  return (
    <div
      className={`
        relative rounded-3xl p-6 text-center border transition-all duration-500
        ${meta.bg} ${meta.border}
        ${isImmediate ? 'animate-pulse' : ''}
      `}
    >
      {isImmediate && (
        <div className="absolute inset-0 rounded-3xl bg-white/5 animate-ping pointer-events-none" />
      )}

      <div className="text-5xl mb-3">{LEVEL_EMOJI[level]}</div>

      <div className="text-xs uppercase tracking-widest text-gray-400 mb-1 font-medium">
        Threat Level
      </div>

      <div
        className={`text-2xl font-black uppercase tracking-wide`}
        style={{ color: meta.color }}
      >
        {meta.label}
      </div>

      {isImmediate && (
        <p className="text-xs text-gray-300 mt-2 font-medium">
          SEEK SHELTER IMMEDIATELY
        </p>
      )}
      {level === 'dangerous' && (
        <p className="text-xs text-gray-400 mt-2">Verified threat in your area</p>
      )}
      {level === 'significant' && (
        <p className="text-xs text-gray-400 mt-2">Active threats nearby</p>
      )}
      {level === 'elevated' && (
        <p className="text-xs text-gray-400 mt-2">Developing threat detected</p>
      )}
      {level === 'normal' && (
        <p className="text-xs text-gray-500 mt-2">No active threats nearby</p>
      )}
    </div>
  );
}

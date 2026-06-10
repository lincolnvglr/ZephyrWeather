'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useZephyrStore } from '@/store/useZephyrStore';
import { ThreatType, THREAT_META } from '@/types';

const THREAT_CARDS: { type: ThreatType; description: string }[] = [
  { type: 'tornado', description: 'Funnel cloud or tornado on ground' },
  { type: 'flash_flood', description: 'Rising water, flooded roads' },
  { type: 'extreme_wind', description: 'Damaging winds, downed trees' },
  { type: 'large_hail', description: 'Golf ball or larger hail' },
  { type: 'wildfire', description: 'Active fire, smoke, embers' },
  { type: 'severe_storm', description: 'Lightning, damaging storm' },
];

type ReportState = 'idle' | 'confirming' | 'submitting' | 'success';

function SwipeCard({
  type,
  description,
  onReport,
  isTop,
}: {
  type: ThreatType;
  description: string;
  onReport: (t: ThreatType) => void;
  isTop: boolean;
}) {
  const meta = THREAT_META[type];
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -80, 0, 80, 200], [0, 1, 1, 1, 0]);

  const reportOverlayOpacity = useTransform(x, [0, 80], [0, 1]);
  const dismissOverlayOpacity = useTransform(x, [-80, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 100) {
      onReport(type);
    }
  };

  if (!isTop) {
    return (
      <div
        className="absolute inset-0 rounded-3xl"
        style={{ transform: 'scale(0.95) translateY(12px)', opacity: 0.6 }}
      />
    );
  }

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: -300, right: 300 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      className="absolute inset-0 cursor-grab select-none"
    >
      <div
        className="h-full rounded-3xl border flex flex-col items-center justify-center p-8 relative overflow-hidden"
        style={{
          borderColor: `${meta.color}40`,
          background: `radial-gradient(ellipse at center, ${meta.color}15 0%, transparent 70%), #111827`,
        }}
      >
        {/* Report overlay (right swipe) */}
        <motion.div
          className="absolute inset-0 rounded-3xl flex items-center justify-start p-8 pointer-events-none"
          style={{
            opacity: reportOverlayOpacity as unknown as number,
            background: 'linear-gradient(90deg, rgba(34,197,94,0.3) 0%, transparent 60%)',
          }}
        >
          <div className="border-4 border-green-400 rounded-2xl px-4 py-2 rotate-[-15deg]">
            <span className="text-2xl font-black text-green-400 uppercase tracking-widest">REPORT</span>
          </div>
        </motion.div>

        {/* Dismiss overlay (left swipe) */}
        <motion.div
          className="absolute inset-0 rounded-3xl flex items-center justify-end p-8 pointer-events-none"
          style={{
            opacity: dismissOverlayOpacity as unknown as number,
            background: 'linear-gradient(270deg, rgba(239,68,68,0.2) 0%, transparent 60%)',
          }}
        >
          <div className="border-4 border-gray-500 rounded-2xl px-4 py-2 rotate-[15deg]">
            <span className="text-2xl font-black text-gray-400 uppercase tracking-widest">SKIP</span>
          </div>
        </motion.div>

        <div className="text-8xl mb-6">{meta.icon}</div>
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{meta.label}</h2>
        <p className="text-base text-gray-400 text-center">{description}</p>

        <div className="absolute bottom-8 flex items-center gap-3 text-gray-600">
          <span className="text-sm">← Skip</span>
          <div className="w-12 h-0.5 bg-gray-700" />
          <span className="text-sm font-semibold text-green-500">Report →</span>
        </div>
      </div>
    </motion.div>
  );
}

export function ReportScreen() {
  const { submitReport, submittingReport, location, lastReport } = useZephyrStore();
  const [reportState, setReportState] = useState<ReportState>('idle');
  const [pendingType, setPendingType] = useState<ThreatType | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [submitted, setSubmitted] = useState<ThreatType | null>(null);
  const startTime = useRef<number>(Date.now());

  const handleSwipeReport = (type: ThreatType) => {
    setPendingType(type);
    setReportState('confirming');
  };

  const handleSkip = () => {
    setCardIndex((i) => (i + 1) % THREAT_CARDS.length);
  };

  const handleConfirm = async () => {
    if (!pendingType) return;
    setReportState('submitting');
    await submitReport(pendingType);
    setSubmitted(pendingType);
    setReportState('success');
    setCardIndex((i) => (i + 1) % THREAT_CARDS.length);
    setTimeout(() => {
      setReportState('idle');
      setPendingType(null);
      setSubmitted(null);
    }, 3000);
  };

  const currentCard = THREAT_CARDS[cardIndex % THREAT_CARDS.length];
  const nextCard = THREAT_CARDS[(cardIndex + 1) % THREAT_CARDS.length];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 px-1">
        <h1 className="text-xl font-black text-white tracking-tight">REPORT THREAT</h1>
        <p className="text-xs text-gray-500">Swipe right to report · Swipe left to skip</p>
      </div>

      {/* Location indicator */}
      <div className="flex items-center gap-2 mb-4 bg-gray-900/60 rounded-xl px-3 py-2 border border-gray-800">
        <span className="text-green-400 text-sm">📍</span>
        <span className="text-xs text-gray-400">
          {location
            ? `GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
            : 'Acquiring location...'}
        </span>
        {location && <span className="ml-auto text-[10px] text-green-500 font-semibold">LOCKED</span>}
      </div>

      {/* Swipe Card Stack */}
      <div className="flex-1 relative" style={{ minHeight: 340 }}>
        <AnimatePresence mode="wait">
          {reportState === 'success' && submitted ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-0 rounded-3xl bg-green-950/60 border border-green-500/40 flex flex-col items-center justify-center gap-4"
            >
              <div className="text-6xl">✅</div>
              <div className="text-center">
                <p className="text-xl font-black text-white">
                  {THREAT_META[submitted].label} Reported
                </p>
                <p className="text-sm text-green-400 mt-1">
                  Threat verification in progress...
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Nearby users are being alerted
                </p>
              </div>
              {lastReport && (
                <div className="bg-gray-900/60 rounded-2xl px-4 py-3 border border-gray-700 text-center">
                  <p className="text-xs text-gray-400 mb-1">AI Confidence Score</p>
                  <p className="text-2xl font-black text-white">{lastReport.confidence}%</p>
                </div>
              )}
            </motion.div>
          ) : reportState === 'confirming' && pendingType ? (
            <motion.div
              key="confirm"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-0 rounded-3xl bg-gray-900 border border-orange-500/40 flex flex-col items-center justify-center gap-6 p-8"
            >
              <div className="text-6xl">{THREAT_META[pendingType].icon}</div>
              <div className="text-center">
                <p className="text-2xl font-black text-white mb-1">
                  Report {THREAT_META[pendingType].label}?
                </p>
                <p className="text-sm text-gray-400">
                  Your location will be attached automatically
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setReportState('idle')}
                  className="flex-1 py-4 rounded-2xl bg-gray-800 border border-gray-700 text-white font-bold text-base active:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submittingReport}
                  className="flex-2 flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-base active:bg-red-700 disabled:opacity-60"
                  style={{ flex: 2 }}
                >
                  {submittingReport ? 'Sending...' : 'CONFIRM REPORT'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={`card-${cardIndex}`} className="absolute inset-0">
              {/* Next card (behind) */}
              <div
                className="absolute inset-0 rounded-3xl border bg-gray-900"
                style={{
                  borderColor: `${THREAT_META[nextCard.type].color}20`,
                  transform: 'scale(0.96) translateY(8px)',
                  opacity: 0.5,
                }}
              />
              {/* Current card */}
              <SwipeCard
                key={`${currentCard.type}-${cardIndex}`}
                type={currentCard.type}
                description={currentCard.description}
                onReport={handleSwipeReport}
                isTop
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick tap buttons */}
      {reportState === 'idle' && (
        <div className="mt-4">
          <p className="text-xs text-gray-600 text-center mb-3 uppercase tracking-wider">
            Or tap to report quickly
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THREAT_CARDS.map(({ type }) => {
              const meta = THREAT_META[type];
              return (
                <button
                  key={type}
                  onClick={() => {
                    setPendingType(type);
                    setReportState('confirming');
                  }}
                  className="flex flex-col items-center gap-1 py-3 px-2 rounded-2xl bg-gray-900/60 border border-gray-800 active:border-gray-600 transition-all active:scale-95"
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

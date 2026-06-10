'use client';

import { useEffect, useRef, useState } from 'react';
import { useZephyrStore } from '@/store/useZephyrStore';
import { ActiveThreat, THREAT_META, STATUS_META, ThreatType } from '@/types';
import { ThreatBadge } from '@/components/ThreatBadge';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  observation: '#EAB308',
  developing: '#F97316',
  verified: '#EF4444',
  immediate_danger: '#FFFFFF',
  resolved: '#6B7280',
};

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Simple canvas-based map (no external map lib needed)
function ThreatMapCanvas({
  threats,
  userLocation,
  onSelectThreat,
}: {
  threats: ActiveThreat[];
  userLocation: { lat: number; lng: number };
  onSelectThreat: (t: ActiveThreat | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ w: 360, h: 480 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Map bounds: 0.12 degree padding around user
  const PAD = 0.08;
  const bounds = {
    minLat: userLocation.lat - PAD,
    maxLat: userLocation.lat + PAD,
    minLng: userLocation.lng - PAD * 1.2,
    maxLng: userLocation.lng + PAD * 1.2,
  };

  const toCanvas = (lat: number, lng: number) => ({
    x: ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * dimensions.w,
    y: ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * dimensions.h,
  });

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        setDimensions({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.w * dpr;
    canvas.height = dimensions.h * dpr;
    canvas.style.width = `${dimensions.w}px`;
    canvas.style.height = `${dimensions.h}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, dimensions.w, dimensions.h);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * dimensions.w;
      const y = (i / 8) * dimensions.h;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.w, y);
      ctx.stroke();
    }

    // Range rings around user
    const user = toCanvas(userLocation.lat, userLocation.lng);
    [1, 3, 5].forEach((miles) => {
      const kmPerDeg = 111;
      const degRadius = (miles * 1.609) / kmPerDeg;
      const radiusPx = (degRadius / (bounds.maxLat - bounds.minLat)) * dimensions.h;
      ctx.beginPath();
      ctx.arc(user.x, user.y, radiusPx, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = `${10}px system-ui`;
      ctx.fillText(`${miles}mi`, user.x + radiusPx + 3, user.y - 3);
    });

    // Threat radius halos
    threats.forEach((threat) => {
      if (threat.status === 'resolved') return;
      const pos = toCanvas(threat.location.lat, threat.location.lng);
      const color = STATUS_COLORS[threat.status] || '#EAB308';
      const kmPerDeg = 111;
      const degRadius = threat.radius / kmPerDeg;
      const radiusPx = (degRadius / (bounds.maxLat - bounds.minLat)) * dimensions.h;

      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radiusPx);
      gradient.addColorStop(0, `${color}30`);
      gradient.addColorStop(1, `${color}00`);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    // Threat markers
    threats.forEach((threat) => {
      if (threat.status === 'resolved') return;
      const pos = toCanvas(threat.location.lat, threat.location.lng);
      const color = STATUS_COLORS[threat.status] || '#EAB308';
      const meta = THREAT_META[threat.type];

      // Outer ring
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = `${color}20`;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Icon
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.icon, pos.x, pos.y - 32);

      // Pulsing ring for immediate danger
      if (threat.status === 'immediate_danger') {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
        ctx.strokeStyle = `${color}60`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // User location
    ctx.beginPath();
    ctx.arc(user.x, user.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#3B82F6';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(user.x, user.y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(59,130,246,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 10px system-ui';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU', user.x, user.y + 22);
  }, [threats, userLocation, dimensions]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    let closest: ActiveThreat | null = null;
    let minDist = 40;
    threats.forEach((threat) => {
      const pos = toCanvas(threat.location.lat, threat.location.lng);
      const d = Math.hypot(pos.x - cx, pos.y - cy);
      if (d < minDist) {
        minDist = d;
        closest = threat;
      }
    });
    onSelectThreat(closest);
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} onClick={handleClick} className="w-full h-full rounded-2xl cursor-crosshair" />
    </div>
  );
}

export function MapScreen() {
  const { threats, location } = useZephyrStore();
  const [selected, setSelected] = useState<ActiveThreat | null>(null);
  const [filter, setFilter] = useState<ThreatType | null>(null);

  const userLocation = location || { lat: 36.1627, lng: -86.7816 };
  const visibleThreats = filter ? threats.filter((t) => t.type === filter) : threats;

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-black text-white">THREAT MAP</h1>
          <p className="text-xs text-gray-500">Real-time threat visualization</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilter(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            !filter ? 'bg-white text-gray-900 border-white' : 'bg-transparent text-gray-400 border-gray-700'
          }`}
        >
          All
        </button>
        {(Object.keys(THREAT_META) as ThreatType[]).map((type) => {
          const meta = THREAT_META[type];
          return (
            <button
              key={type}
              onClick={() => setFilter(filter === type ? null : type)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1 ${
                filter === type
                  ? 'text-gray-900 border-transparent'
                  : 'bg-transparent text-gray-400 border-gray-700'
              }`}
              style={filter === type ? { backgroundColor: meta.color } : {}}
            >
              {meta.icon} {meta.label}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-800 relative" style={{ minHeight: 320 }}>
        <ThreatMapCanvas
          threats={visibleThreats}
          userLocation={userLocation}
          onSelectThreat={setSelected}
        />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-gray-950/80 backdrop-blur-sm rounded-xl p-2 border border-gray-800">
          {[
            { color: '#EAB308', label: 'Observation' },
            { color: '#F97316', label: 'Developing' },
            { color: '#EF4444', label: 'Verified' },
            { color: '#FFFFFF', label: 'Immediate' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 py-0.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected threat detail */}
      {selected && (
        <div
          className="rounded-2xl border bg-gray-900 p-4"
          style={{ borderColor: `${STATUS_COLORS[selected.status]}40` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{THREAT_META[selected.type].icon}</span>
              <div>
                <p className="text-base font-bold text-white">{THREAT_META[selected.type].label}</p>
                <p className="text-xs text-gray-400">
                  {selected.distance?.toFixed(1)}mi · {selected.reportCount} reports
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-600 text-lg p-1"
            >
              ✕
            </button>
          </div>
          <ThreatBadge status={selected.status} />
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">AI Confidence</p>
            <ConfidenceMeter confidence={selected.confidence} />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Last updated {formatDistanceToNow(new Date(selected.lastUpdated), { addSuffix: true })}
          </p>
        </div>
      )}
    </div>
  );
}

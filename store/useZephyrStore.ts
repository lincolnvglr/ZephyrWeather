'use client';

import { create } from 'zustand';
import { ActiveThreat, Alert, Coordinates, Report, ThreatLevel, ThreatType, UserProfile } from '@/types';
import { MOCK_ALERTS, MOCK_THREATS, MOCK_USER, computeThreatLevel } from '@/lib/mock-data';

type Screen = 'home' | 'report' | 'map' | 'alerts';

interface ZephyrState {
  // Navigation
  activeScreen: Screen;
  setScreen: (screen: Screen) => void;

  // User
  user: UserProfile;

  // Location
  location: Coordinates | null;
  locationError: string | null;
  setLocation: (loc: Coordinates) => void;
  requestLocation: () => void;

  // Threats
  threats: ActiveThreat[];
  threatLevel: ThreatLevel;

  // Alerts
  alerts: Alert[];
  unreadCount: number;
  markAlertRead: (id: string) => void;
  markAllRead: () => void;

  // Reporting
  submittingReport: boolean;
  lastReport: Report | null;
  submitReport: (type: ThreatType) => Promise<void>;
}

export const useZephyrStore = create<ZephyrState>((set, get) => ({
  activeScreen: 'home',
  setScreen: (screen) => set({ activeScreen: screen }),

  user: MOCK_USER,

  location: { lat: 36.1627, lng: -86.7816 }, // Default: Nashville, TN
  locationError: null,
  setLocation: (loc) => set({ location: loc }),
  requestLocation: () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      set({ locationError: 'Geolocation not supported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          locationError: null,
        });
      },
      (err) => {
        set({ locationError: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  threats: MOCK_THREATS,
  threatLevel: computeThreatLevel(MOCK_THREATS),

  alerts: MOCK_ALERTS,
  unreadCount: MOCK_ALERTS.filter((a) => !a.read).length,
  markAlertRead: (id) => {
    set((state) => {
      const alerts = state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
      return { alerts, unreadCount: alerts.filter((a) => !a.read).length };
    });
  },
  markAllRead: () => {
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    }));
  },

  submittingReport: false,
  lastReport: null,
  submitReport: async (type) => {
    const { location, user, threats } = get();
    if (!location) return;

    set({ submittingReport: true });

    // Simulate AI verification delay
    await new Promise((r) => setTimeout(r, 800));

    const newReport: Report = {
      id: `r-${Date.now()}`,
      type,
      location,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userLevel: user.level,
      confidence: Math.floor(Math.random() * 30) + 55,
      status: 'observation',
      distance: 0,
    };

    // Check if threat of this type already exists nearby
    const existing = threats.find((t) => t.type === type && (t.distance ?? Infinity) < 3);

    let updatedThreats: ActiveThreat[];
    if (existing) {
      updatedThreats = threats.map((t) =>
        t.id === existing.id
          ? {
              ...t,
              reportCount: t.reportCount + 1,
              confidence: Math.min(t.confidence + 8, 99),
              lastUpdated: new Date().toISOString(),
              reports: [...t.reports, newReport],
              status:
                t.reportCount + 1 >= 5
                  ? 'verified'
                  : t.reportCount + 1 >= 3
                  ? 'developing'
                  : t.status,
            }
          : t
      );
    } else {
      const newThreat: ActiveThreat = {
        id: `t-${Date.now()}`,
        type,
        location,
        status: 'observation',
        confidence: newReport.confidence,
        reportCount: 1,
        firstReported: newReport.timestamp,
        lastUpdated: newReport.timestamp,
        radius: 1.0,
        distance: 0,
        reports: [newReport],
      };
      updatedThreats = [...threats, newThreat];
    }

    set({
      threats: updatedThreats,
      threatLevel: computeThreatLevel(updatedThreats),
      lastReport: newReport,
      submittingReport: false,
    });
  },
}));

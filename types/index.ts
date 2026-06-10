export type ThreatType =
  | 'tornado'
  | 'flash_flood'
  | 'extreme_wind'
  | 'large_hail'
  | 'wildfire'
  | 'severe_storm';

export type ThreatLevel = 'normal' | 'elevated' | 'significant' | 'dangerous' | 'immediate';

export type ReportStatus = 'observation' | 'developing' | 'verified' | 'immediate_danger' | 'resolved';

export type UserLevel =
  | 'bronze_reporter'
  | 'silver_reporter'
  | 'gold_reporter'
  | 'verified_spotter'
  | 'verified_first_responder';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Report {
  id: string;
  type: ThreatType;
  location: Coordinates;
  timestamp: string;
  userId: string;
  userName: string;
  userLevel: UserLevel;
  confidence: number;
  status: ReportStatus;
  description?: string;
  mediaUrl?: string;
  distance?: number; // km from current user
}

export interface ActiveThreat {
  id: string;
  type: ThreatType;
  location: Coordinates;
  status: ReportStatus;
  confidence: number;
  reportCount: number;
  firstReported: string;
  lastUpdated: string;
  radius: number; // km
  distance?: number; // km from current user
  reports: Report[];
}

export interface Alert {
  id: string;
  threatId: string;
  type: ThreatType;
  status: ReportStatus;
  location: Coordinates;
  distance: number;
  confidence: number;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  level: UserLevel;
  credibilityScore: number;
  reportCount: number;
  verifiedReports: number;
}

export const THREAT_META: Record<ThreatType, { label: string; icon: string; color: string }> = {
  tornado: { label: 'Tornado', icon: '🌪', color: '#EF4444' },
  flash_flood: { label: 'Flash Flood', icon: '🌊', color: '#3B82F6' },
  extreme_wind: { label: 'Extreme Wind', icon: '💨', color: '#F59E0B' },
  large_hail: { label: 'Large Hail', icon: '🧊', color: '#60A5FA' },
  wildfire: { label: 'Wildfire', icon: '🔥', color: '#F97316' },
  severe_storm: { label: 'Severe Storm', icon: '⚡', color: '#A855F7' },
};

export const THREAT_LEVEL_META: Record<
  ThreatLevel,
  { label: string; color: string; bg: string; border: string; ring: string }
> = {
  normal: {
    label: 'Normal',
    color: '#22C55E',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    ring: 'ring-green-500',
  },
  elevated: {
    label: 'Elevated',
    color: '#EAB308',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    ring: 'ring-yellow-500',
  },
  significant: {
    label: 'Significant',
    color: '#F97316',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    ring: 'ring-orange-500',
  },
  dangerous: {
    label: 'Dangerous',
    color: '#EF4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    ring: 'ring-red-500',
  },
  immediate: {
    label: 'Immediate Life Threat',
    color: '#111827',
    bg: 'bg-gray-900',
    border: 'border-gray-600',
    ring: 'ring-gray-300',
  },
};

export const STATUS_META: Record<
  ReportStatus,
  { label: string; color: string; dotColor: string }
> = {
  observation: { label: 'Observation', color: '#EAB308', dotColor: 'bg-yellow-400' },
  developing: { label: 'Developing Threat', color: '#F97316', dotColor: 'bg-orange-500' },
  verified: { label: 'Verified Threat', color: '#EF4444', dotColor: 'bg-red-500' },
  immediate_danger: { label: 'Immediate Danger', color: '#FFFFFF', dotColor: 'bg-white' },
  resolved: { label: 'Resolved', color: '#6B7280', dotColor: 'bg-gray-500' },
};

export const USER_LEVEL_META: Record<UserLevel, { label: string; icon: string; color: string }> = {
  bronze_reporter: { label: 'Bronze Reporter', icon: '🥉', color: '#CD7F32' },
  silver_reporter: { label: 'Silver Reporter', icon: '🥈', color: '#C0C0C0' },
  gold_reporter: { label: 'Gold Reporter', icon: '🥇', color: '#FFD700' },
  verified_spotter: { label: 'Verified Spotter', icon: '⭐', color: '#60A5FA' },
  verified_first_responder: { label: 'Verified First Responder', icon: '🚨', color: '#EF4444' },
};

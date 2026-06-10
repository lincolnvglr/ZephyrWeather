import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useZephyrStore } from '../../store/useZephyrStore';
import { ActiveThreat, THREAT_META, STATUS_META, ThreatType } from '../../types';
import { formatDistanceToNow } from 'date-fns';

// React Native doesn't support Canvas directly — use a View-based map
const { width: W } = Dimensions.get('window');
const MAP_H = 360;

const STATUS_COLORS: Record<string, string> = {
  observation: '#EAB308',
  developing: '#F97316',
  verified: '#EF4444',
  immediate_danger: '#FFFFFF',
  resolved: '#6B7280',
};

function latLngToXY(
  lat: number, lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  w: number, h: number
) {
  return {
    x: ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * w,
    y: ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * h,
  };
}

export default function MapScreen() {
  const { threats, location } = useZephyrStore();
  const [selected, setSelected] = useState<ActiveThreat | null>(null);
  const [filter, setFilter] = useState<ThreatType | null>(null);

  const userLocation = location || { lat: 36.1627, lng: -86.7816 };
  const PAD = 0.08;
  const bounds = {
    minLat: userLocation.lat - PAD,
    maxLat: userLocation.lat + PAD,
    minLng: userLocation.lng - PAD * 1.3,
    maxLng: userLocation.lng + PAD * 1.3,
  };

  const visibleThreats = filter ? threats.filter((t) => t.type === filter) : threats;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>THREAT MAP</Text>
          <Text style={s.subtitle}>Real-time threat visualization</Text>
        </View>
        <View style={s.liveTag}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>Live</Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
        <TouchableOpacity
          onPress={() => setFilter(null)}
          style={[s.chip, !filter && s.chipActive]}
        >
          <Text style={[s.chipText, !filter && s.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {(Object.keys(THREAT_META) as ThreatType[]).map((type) => {
          const meta = THREAT_META[type];
          const active = filter === type;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setFilter(active ? null : type)}
              style={[s.chip, active && { backgroundColor: meta.color }]}
            >
              <Text style={[s.chipText, active && { color: '#000' }]}>
                {meta.icon} {meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Map view */}
      <View style={s.mapContainer}>
        {/* Dark background grid */}
        <View style={s.mapBg} />

        {/* Threat halos and markers */}
        {visibleThreats.map((threat) => {
          if (threat.status === 'resolved') return null;
          const pos = latLngToXY(threat.location.lat, threat.location.lng, bounds, W - 32, MAP_H);
          const color = STATUS_COLORS[threat.status] || '#EAB308';
          const kmPerDeg = 111;
          const degRadius = threat.radius / kmPerDeg;
          const radiusPx = (degRadius / (bounds.maxLat - bounds.minLat)) * MAP_H;
          const meta = THREAT_META[threat.type];
          const isSelected = selected?.id === threat.id;

          return (
            <TouchableOpacity
              key={threat.id}
              onPress={() => setSelected(isSelected ? null : threat)}
              style={[
                s.threatMarker,
                {
                  left: pos.x - radiusPx,
                  top: pos.y - radiusPx,
                  width: radiusPx * 2,
                  height: radiusPx * 2,
                  borderRadius: radiusPx,
                  backgroundColor: `${color}15`,
                  borderColor: isSelected ? color : `${color}50`,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              <View
                style={[s.threatDot, { backgroundColor: color }]}
              />
            </TouchableOpacity>
          );
        })}

        {/* Threat icons above halos */}
        {visibleThreats.map((threat) => {
          if (threat.status === 'resolved') return null;
          const pos = latLngToXY(threat.location.lat, threat.location.lng, bounds, W - 32, MAP_H);
          const meta = THREAT_META[threat.type];
          return (
            <TouchableOpacity
              key={`icon-${threat.id}`}
              onPress={() => setSelected(selected?.id === threat.id ? null : threat)}
              style={[s.threatIcon, { left: pos.x - 16, top: pos.y - 44 }]}
            >
              <Text style={s.threatIconText}>{meta.icon}</Text>
            </TouchableOpacity>
          );
        })}

        {/* User dot */}
        {(() => {
          const pos = latLngToXY(userLocation.lat, userLocation.lng, bounds, W - 32, MAP_H);
          return (
            <View style={[s.userDot, { left: pos.x - 10, top: pos.y - 10 }]}>
              <View style={s.userDotInner} />
            </View>
          );
        })()}

        {/* Legend */}
        <View style={s.legend}>
          {[
            { color: '#EAB308', label: 'Observation' },
            { color: '#F97316', label: 'Developing' },
            { color: '#EF4444', label: 'Verified' },
            { color: '#FFFFFF', label: 'Immediate' },
          ].map(({ color, label }) => (
            <View key={label} style={s.legendRow}>
              <View style={[s.legendDot, { backgroundColor: color }]} />
              <Text style={s.legendText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Selected threat detail */}
      {selected && (
        <View style={[s.detailCard, { borderColor: `${STATUS_COLORS[selected.status]}40` }]}>
          <View style={s.detailHeader}>
            <Text style={s.detailIcon}>{THREAT_META[selected.type].icon}</Text>
            <View style={s.detailInfo}>
              <Text style={s.detailTitle}>{THREAT_META[selected.type].label}</Text>
              <Text style={s.detailSub}>
                {selected.distance?.toFixed(1)}mi · {selected.reportCount} reports
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={s.detailClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={s.detailBadge}>
            <View style={[s.dot, { backgroundColor: STATUS_META[selected.status].color }]} />
            <Text style={[s.badgeText, { color: STATUS_META[selected.status].color }]}>
              {STATUS_META[selected.status].label}
            </Text>
          </View>
          <View style={s.confRow}>
            <Text style={s.confLabel}>AI Confidence</Text>
            <View style={s.confTrack}>
              <View
                style={[s.confFill, {
                  width: `${selected.confidence}%` as `${number}%`,
                  backgroundColor: selected.confidence >= 80 ? '#ef4444' : selected.confidence >= 60 ? '#f97316' : '#eab308',
                }]}
              />
            </View>
            <Text style={s.confPct}>{selected.confidence}%</Text>
          </View>
          <Text style={s.detailTime}>
            Updated {formatDistanceToNow(new Date(selected.lastUpdated), { addSuffix: true })}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712', padding: 16, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#6b7280', fontSize: 12 },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  liveText: { color: '#9ca3af', fontSize: 12 },
  filterRow: { marginBottom: 12, flexGrow: 0 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#374151', backgroundColor: 'transparent' },
  chipActive: { backgroundColor: '#fff' },
  chipText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  mapContainer: { height: MAP_H, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#1f2937', position: 'relative', backgroundColor: '#0a0f1a', marginBottom: 12 },
  mapBg: { position: 'absolute', inset: 0, backgroundColor: '#0a0f1a' },
  threatMarker: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  threatDot: { width: 10, height: 10, borderRadius: 5 },
  threatIcon: { position: 'absolute' },
  threatIconText: { fontSize: 24 },
  userDot: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(59,130,246,0.3)', borderWidth: 2, borderColor: 'rgba(59,130,246,0.5)', alignItems: 'center', justifyContent: 'center' },
  userDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
  legend: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(3,7,18,0.85)', borderRadius: 12, padding: 8, gap: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#d1d5db', fontSize: 10 },
  detailCard: { borderRadius: 18, borderWidth: 1, backgroundColor: '#0d1117', padding: 14 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  detailIcon: { fontSize: 28 },
  detailInfo: { flex: 1 },
  detailTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  detailSub: { color: '#6b7280', fontSize: 12 },
  detailClose: { color: '#6b7280', fontSize: 18, paddingHorizontal: 4 },
  detailBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  confLabel: { color: '#6b7280', fontSize: 12, width: 90 },
  confTrack: { flex: 1, height: 4, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden' },
  confFill: { height: 4, borderRadius: 2 },
  confPct: { color: '#9ca3af', fontSize: 12, fontWeight: '700', width: 32, textAlign: 'right' },
  detailTime: { color: '#4b5563', fontSize: 11 },
});

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useZephyrStore } from '../../store/useZephyrStore';
import { ThreatType, THREAT_META } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

const THREAT_CARDS: { type: ThreatType; description: string }[] = [
  { type: 'tornado', description: 'Funnel cloud or tornado on ground' },
  { type: 'flash_flood', description: 'Rising water, flooded roads' },
  { type: 'extreme_wind', description: 'Damaging winds, downed trees' },
  { type: 'large_hail', description: 'Golf ball or larger hail' },
  { type: 'wildfire', description: 'Active fire, smoke, embers' },
  { type: 'severe_storm', description: 'Lightning, damaging storm' },
];

type State = 'idle' | 'confirming' | 'submitting' | 'success';

export default function ReportScreen() {
  const { submitReport, submittingReport, location, lastReport } = useZephyrStore();
  const [state, setState] = useState<State>('idle');
  const [cardIndex, setCardIndex] = useState(0);
  const [pendingType, setPendingType] = useState<ThreatType | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const reportOpacity = pan.x.interpolate({ inputRange: [0, 80, 200], outputRange: [0, 1, 1], extrapolate: 'clamp' });
  const skipOpacity = pan.x.interpolate({ inputRange: [-200, -80, 0], outputRange: [1, 1, 0], extrapolate: 'clamp' });
  const cardRotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-12deg', '0deg', '12deg'] });

  const current = THREAT_CARDS[cardIndex % THREAT_CARDS.length];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => state === 'idle',
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 100) {
        // Swipe right = report
        Animated.spring(pan, { toValue: { x: CARD_WIDTH + 100, y: gestureState.dy }, useNativeDriver: false }).start(() => {
          pan.setValue({ x: 0, y: 0 });
          setPendingType(current.type);
          setState('confirming');
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (gestureState.dx < -80) {
        // Swipe left = skip
        Animated.spring(pan, { toValue: { x: -(CARD_WIDTH + 100), y: gestureState.dy }, useNativeDriver: false }).start(() => {
          pan.setValue({ x: 0, y: 0 });
          setCardIndex((i) => i + 1);
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      }
    },
  });

  const handleConfirm = async () => {
    if (!pendingType) return;
    setState('submitting');
    await submitReport(pendingType);
    setState('success');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCardIndex((i) => i + 1);
    setTimeout(() => {
      setState('idle');
      setPendingType(null);
    }, 3000);
  };

  if (state === 'success' && lastReport) {
    const meta = THREAT_META[lastReport.type];
    return (
      <View style={[s.container, s.center]}>
        <Text style={s.successIcon}>✅</Text>
        <Text style={s.successTitle}>{meta.label} Reported</Text>
        <Text style={s.successSub}>Threat verification in progress...</Text>
        <View style={s.confCard}>
          <Text style={s.confCardLabel}>AI Confidence Score</Text>
          <Text style={s.confCardValue}>{lastReport.confidence}%</Text>
        </View>
        <Text style={s.successNote}>Nearby users are being alerted</Text>
      </View>
    );
  }

  if (state === 'confirming' && pendingType) {
    const meta = THREAT_META[pendingType];
    return (
      <View style={[s.container, s.center]}>
        <Text style={s.confirmIcon}>{meta.icon}</Text>
        <Text style={s.confirmTitle}>Report {meta.label}?</Text>
        <Text style={s.confirmSub}>GPS location attached automatically</Text>
        <View style={s.confirmButtons}>
          <TouchableOpacity onPress={() => setState('idle')} style={s.cancelBtn}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleConfirm} style={s.confirmBtn} disabled={submittingReport}>
            <Text style={s.confirmBtnText}>{submittingReport ? 'Sending...' : 'CONFIRM REPORT'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const nextCard = THREAT_CARDS[(cardIndex + 1) % THREAT_CARDS.length];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>REPORT THREAT</Text>
        <Text style={s.subtitle}>Swipe right to report · Swipe left to skip</Text>
      </View>

      {/* GPS badge */}
      <View style={s.gpsBadge}>
        <Text style={s.gpsPin}>📍</Text>
        <Text style={s.gpsText}>
          {location ? `GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Acquiring location...'}
        </Text>
        {location && <Text style={s.gpsLocked}>LOCKED</Text>}
      </View>

      {/* Card stack */}
      <View style={s.cardStack}>
        {/* Background card */}
        <View
          style={[s.card, s.cardBehind, { borderColor: `${THREAT_META[nextCard.type].color}20` }]}
        />

        {/* Main draggable card */}
        <Animated.View
          style={[
            s.card,
            {
              transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: cardRotate }],
              borderColor: `${THREAT_META[current.type].color}40`,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Report overlay */}
          <Animated.View style={[s.overlay, s.overlayRight, { opacity: reportOpacity }]}>
            <View style={s.reportStamp}>
              <Text style={s.reportStampText}>REPORT</Text>
            </View>
          </Animated.View>

          {/* Skip overlay */}
          <Animated.View style={[s.overlay, s.overlayLeft, { opacity: skipOpacity }]}>
            <View style={s.skipStamp}>
              <Text style={s.skipStampText}>SKIP</Text>
            </View>
          </Animated.View>

          <Text style={s.cardIcon}>{THREAT_META[current.type].icon}</Text>
          <Text style={s.cardTitle}>{THREAT_META[current.type].label}</Text>
          <Text style={s.cardDesc}>{current.description}</Text>

          <View style={s.cardHint}>
            <Text style={s.hintLeft}>← Skip</Text>
            <View style={s.hintLine} />
            <Text style={s.hintRight}>Report →</Text>
          </View>
        </Animated.View>
      </View>

      {/* Quick tap grid */}
      <View style={s.quickSection}>
        <Text style={s.quickLabel}>OR TAP TO REPORT QUICKLY</Text>
        <View style={s.quickGrid}>
          {THREAT_CARDS.map(({ type }) => {
            const meta = THREAT_META[type];
            return (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setPendingType(type);
                  setState('confirming');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                style={s.quickBtn}
                activeOpacity={0.75}
              >
                <Text style={s.quickBtnIcon}>{meta.icon}</Text>
                <Text style={s.quickBtnLabel}>{meta.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712', padding: 16, paddingTop: 56 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  gpsBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(17,24,39,0.6)',
    borderRadius: 12, borderWidth: 1, borderColor: '#1f2937', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
  },
  gpsPin: { fontSize: 14, marginRight: 6 },
  gpsText: { flex: 1, color: '#9ca3af', fontSize: 11 },
  gpsLocked: { color: '#4ade80', fontSize: 10, fontWeight: '700' },
  // Card stack
  cardStack: { height: 280, marginBottom: 16, position: 'relative' },
  card: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    borderRadius: 28, borderWidth: 1.5, backgroundColor: '#0d1117',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  cardBehind: { transform: [{ scale: 0.96 }, { translateY: 8 }], opacity: 0.5 },
  overlay: { position: 'absolute', inset: 0, borderRadius: 28, justifyContent: 'center' },
  overlayRight: { alignItems: 'flex-start', paddingLeft: 24, backgroundColor: 'rgba(34,197,94,0.15)' },
  overlayLeft: { alignItems: 'flex-end', paddingRight: 24, backgroundColor: 'rgba(239,68,68,0.1)' },
  reportStamp: { borderWidth: 3, borderColor: '#4ade80', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, transform: [{ rotate: '-15deg' }] },
  reportStampText: { color: '#4ade80', fontWeight: '900', fontSize: 22, letterSpacing: 2 },
  skipStamp: { borderWidth: 3, borderColor: '#6b7280', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, transform: [{ rotate: '15deg' }] },
  skipStampText: { color: '#6b7280', fontWeight: '900', fontSize: 22, letterSpacing: 2 },
  cardIcon: { fontSize: 72, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  cardDesc: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  cardHint: { position: 'absolute', bottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  hintLeft: { color: '#6b7280', fontSize: 13 },
  hintLine: { width: 40, height: 1, backgroundColor: '#374151' },
  hintRight: { color: '#4ade80', fontSize: 13, fontWeight: '600' },
  // Quick tap
  quickSection: { flex: 1 },
  quickLabel: { color: '#4b5563', fontSize: 10, letterSpacing: 1.5, textAlign: 'center', marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    width: (SCREEN_WIDTH - 32 - 16) / 3,
    backgroundColor: 'rgba(17,24,39,0.6)', borderRadius: 16,
    borderWidth: 1, borderColor: '#1f2937', paddingVertical: 12,
    alignItems: 'center', gap: 4,
  },
  quickBtnIcon: { fontSize: 22 },
  quickBtnLabel: { color: '#9ca3af', fontSize: 10, fontWeight: '600' },
  // Confirm
  confirmIcon: { fontSize: 64, marginBottom: 16 },
  confirmTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  confirmSub: { color: '#9ca3af', fontSize: 14, marginBottom: 32 },
  confirmButtons: { flexDirection: 'row', gap: 12, width: '100%', paddingHorizontal: 16 },
  cancelBtn: { flex: 1, backgroundColor: '#1f2937', borderRadius: 18, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  cancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  confirmBtn: { flex: 2, backgroundColor: '#dc2626', borderRadius: 18, paddingVertical: 18, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  // Success
  successIcon: { fontSize: 56, marginBottom: 16 },
  successTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 6 },
  successSub: { color: '#4ade80', fontSize: 14, marginBottom: 24 },
  confCard: { backgroundColor: 'rgba(17,24,39,0.8)', borderRadius: 16, borderWidth: 1, borderColor: '#374151', padding: 20, alignItems: 'center', marginBottom: 12 },
  confCardLabel: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
  confCardValue: { color: '#fff', fontSize: 36, fontWeight: '900' },
  successNote: { color: '#6b7280', fontSize: 13 },
});

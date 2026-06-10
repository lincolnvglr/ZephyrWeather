import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useZephyrStore } from '../../store/useZephyrStore';
import {
  THREAT_META,
  THREAT_LEVEL_META,
  STATUS_META,
  ThreatLevel,
} from '../../types';

const LEVEL_EMOJI: Record<ThreatLevel, string> = {
  normal: '🟢',
  elevated: '🟡',
  significant: '🟠',
  dangerous: '🔴',
  immediate: '⚫',
};

export default function HomeScreen() {
  const { threatLevel, threats, alerts, user } = useZephyrStore();
  const router = useRouter();

  const levelMeta = THREAT_LEVEL_META[threatLevel];
  const nearbyThreats = threats
    .filter((t) => (t.distance ?? Infinity) < 10 && t.status !== 'resolved')
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  const unreadAlerts = alerts.filter((a) => !a.read).slice(0, 2);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.appName}>ZEPHYR</Text>
          <Text style={s.appSub}>Real-Time Threat Network</Text>
        </View>
        <View style={s.userBadge}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user.name.charAt(0)}</Text>
          </View>
        </View>
      </View>

      {/* Threat Level Card */}
      <View style={[s.threatLevelCard, { borderColor: `${levelMeta.color}40` }]}>
        <Text style={s.threatEmoji}>{LEVEL_EMOJI[threatLevel]}</Text>
        <Text style={s.threatLevelLabel}>THREAT LEVEL</Text>
        <Text style={[s.threatLevelText, { color: levelMeta.color }]}>
          {levelMeta.label.toUpperCase()}
        </Text>
        {threatLevel === 'immediate' && (
          <Text style={s.shelterText}>SEEK SHELTER IMMEDIATELY</Text>
        )}
        {threatLevel === 'dangerous' && (
          <Text style={s.threatSub}>Verified threat in your area</Text>
        )}
        {threatLevel === 'normal' && (
          <Text style={s.threatSub}>No active threats nearby</Text>
        )}
      </View>

      {/* Unread alert banner */}
      {unreadAlerts.length > 0 && (
        <TouchableOpacity onPress={() => router.push('/(tabs)/alerts')} style={s.alertBanner}>
          <View style={s.alertBannerHeader}>
            <View style={s.pulseDot} />
            <Text style={s.alertBannerTitle}>ACTIVE ALERTS</Text>
            <Text style={s.alertBannerCount}>{unreadAlerts.length} unread →</Text>
          </View>
          {unreadAlerts.map((alert) => (
            <View key={alert.id} style={s.alertBannerItem}>
              <Text style={s.alertBannerIcon}>{THREAT_META[alert.type].icon}</Text>
              <Text style={s.alertBannerMsg} numberOfLines={2}>{alert.message}</Text>
            </View>
          ))}
        </TouchableOpacity>
      )}

      {/* Report CTA */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/report')}
        style={s.reportCta}
        activeOpacity={0.85}
      >
        <Text style={s.reportCtaIcon}>📡</Text>
        <View style={s.reportCtaText}>
          <Text style={s.reportCtaTitle}>REPORT THREAT</Text>
          <Text style={s.reportCtaSub}>Tap to report in under 3 seconds</Text>
        </View>
        <Text style={s.reportCtaArrow}>›</Text>
      </TouchableOpacity>

      {/* Nearby Threats */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>NEARBY THREATS</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/map')}>
            <Text style={s.sectionLink}>View Map →</Text>
          </TouchableOpacity>
        </View>

        {nearbyThreats.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyIcon}>✅</Text>
            <Text style={s.emptyText}>No active threats within 10 miles</Text>
          </View>
        ) : (
          nearbyThreats.map((threat) => {
            const meta = THREAT_META[threat.type];
            const statusMeta = STATUS_META[threat.status];
            return (
              <TouchableOpacity
                key={threat.id}
                onPress={() => router.push('/(tabs)/map')}
                style={[s.threatCard, { borderColor: `${statusMeta.color}30` }]}
                activeOpacity={0.85}
              >
                <Text style={s.threatCardIcon}>{meta.icon}</Text>
                <View style={s.threatCardBody}>
                  <View style={s.threatCardRow}>
                    <Text style={s.threatCardTitle}>{meta.label}</Text>
                    <Text style={s.threatCardDist}>
                      {(threat.distance ?? 0) < 1
                        ? `${Math.round((threat.distance ?? 0) * 1000)}m`
                        : `${(threat.distance ?? 0).toFixed(1)}mi`}
                    </Text>
                  </View>
                  <View style={s.threatCardBadge}>
                    <View style={[s.dot, { backgroundColor: statusMeta.color }]} />
                    <Text style={[s.badgeText, { color: statusMeta.color }]}>
                      {statusMeta.label}
                    </Text>
                    <Text style={s.reportCount}>· {threat.reportCount} reports</Text>
                  </View>
                  <View style={s.confBar}>
                    <View style={s.confTrack}>
                      <View
                        style={[
                          s.confFill,
                          {
                            width: `${threat.confidence}%`,
                            backgroundColor:
                              threat.confidence >= 80
                                ? '#ef4444'
                                : threat.confidence >= 60
                                ? '#f97316'
                                : '#eab308',
                          },
                        ]}
                      />
                    </View>
                    <Text style={s.confLabel}>{threat.confidence}%</Text>
                  </View>
                  <Text style={s.threatTime}>
                    {formatDistanceToNow(new Date(threat.lastUpdated), { addSuffix: true })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        {[
          { label: 'Active Threats', value: nearbyThreats.length.toString(), sub: '10mi radius' },
          { label: 'Reports Today', value: '47', sub: 'in your area' },
          { label: 'Lead Time', value: '+6min', sub: 'vs official' },
        ].map(({ label, value, sub }) => (
          <View key={label} style={s.statCard}>
            <Text style={s.statValue}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
            <Text style={s.statSub}>{sub}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 12 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712' },
  content: { padding: 16, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  appName: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  appSub: { color: '#6b7280', fontSize: 11, marginTop: -2 },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  // Threat level card
  threatLevelCard: { borderRadius: 24, borderWidth: 1, backgroundColor: '#0d1117', padding: 24, alignItems: 'center', marginBottom: 12 },
  threatEmoji: { fontSize: 48, marginBottom: 8 },
  threatLevelLabel: { color: '#6b7280', fontSize: 10, letterSpacing: 2, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  threatLevelText: { fontSize: 22, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  threatSub: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  shelterText: { color: '#d1d5db', fontSize: 12, fontWeight: '600', marginTop: 4 },
  // Alert banner
  alertBanner: { backgroundColor: 'rgba(127,29,29,0.4)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 14, marginBottom: 12 },
  alertBannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 6 },
  alertBannerTitle: { color: '#f87171', fontSize: 11, fontWeight: '700', letterSpacing: 1, flex: 1 },
  alertBannerCount: { color: '#f87171', fontSize: 11, opacity: 0.7 },
  alertBannerItem: { flexDirection: 'row', gap: 8, paddingVertical: 3 },
  alertBannerIcon: { fontSize: 16 },
  alertBannerMsg: { color: '#fff', fontSize: 12, flex: 1, lineHeight: 17 },
  // Report CTA
  reportCta: { backgroundColor: '#dc2626', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  reportCtaIcon: { fontSize: 24 },
  reportCtaText: { flex: 1 },
  reportCtaTitle: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },
  reportCtaSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  reportCtaArrow: { color: 'rgba(255,255,255,0.5)', fontSize: 24 },
  // Section
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  sectionLink: { color: '#60a5fa', fontSize: 12 },
  // Empty
  emptyCard: { borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', backgroundColor: 'rgba(17,24,39,0.5)', padding: 28, alignItems: 'center' },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  emptyText: { color: '#9ca3af', fontSize: 13 },
  // Threat card
  threatCard: { borderRadius: 18, borderWidth: 1, backgroundColor: 'rgba(17,24,39,0.8)', padding: 14, flexDirection: 'row', gap: 12, marginBottom: 10 },
  threatCardIcon: { fontSize: 30 },
  threatCardBody: { flex: 1 },
  threatCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  threatCardTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  threatCardDist: { color: '#6b7280', fontSize: 12 },
  threatCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  reportCount: { color: '#6b7280', fontSize: 11 },
  confBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  confTrack: { flex: 1, height: 4, backgroundColor: '#1f2937', borderRadius: 2, overflow: 'hidden' },
  confFill: { height: 4, borderRadius: 2 },
  confLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '700', width: 32, textAlign: 'right' },
  threatTime: { color: '#6b7280', fontSize: 10 },
  // Stats
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: 'rgba(17,24,39,0.6)', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12, alignItems: 'center' },
  statValue: { color: '#fff', fontWeight: '900', fontSize: 18 },
  statLabel: { color: '#9ca3af', fontSize: 10, textAlign: 'center', marginTop: 2 },
  statSub: { color: '#4b5563', fontSize: 9, textAlign: 'center' },
});

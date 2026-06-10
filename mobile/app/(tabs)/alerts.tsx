import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';
import { useZephyrStore } from '../../store/useZephyrStore';
import { Alert, THREAT_META, STATUS_META } from '../../types';

const STATUS_BG: Record<string, { bg: string; border: string }> = {
  observation: { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)' },
  developing: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
  verified: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  immediate_danger: { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)' },
  resolved: { bg: 'rgba(55,65,81,0.3)', border: '#1f2937' },
};

function AlertItem({ alert, onRead }: { alert: Alert; onRead: (id: string) => void }) {
  const meta = THREAT_META[alert.type];
  const statusMeta = STATUS_META[alert.status];
  const colors = STATUS_BG[alert.status] || STATUS_BG.observation;

  return (
    <TouchableOpacity
      onPress={() => {
        onRead(alert.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      style={[
        s.alertCard,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity: alert.read ? 0.5 : 1,
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={s.alertLeft}>
        <Text style={s.alertIcon}>{meta.icon}</Text>
        {!alert.read && <View style={s.unreadDot} />}
      </View>
      <View style={s.alertBody}>
        <View style={s.alertTop}>
          <Text style={[s.alertStatus, { color: statusMeta.color }]}>
            {statusMeta.label.toUpperCase()}
          </Text>
          <Text style={s.alertDist}>{alert.distance.toFixed(1)}mi</Text>
        </View>
        <Text style={s.alertMsg}>{alert.message}</Text>
        <View style={s.alertBottom}>
          <View style={[s.confDot, { backgroundColor: statusMeta.color }]} />
          <Text style={s.alertConf}>{alert.confidence}% confidence</Text>
          <Text style={s.alertTime}>
            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AlertsScreen() {
  const { alerts, markAlertRead, markAllRead, unreadCount } = useZephyrStore();

  const sorted = [...alerts].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    const order: Record<string, number> = { immediate_danger: 0, verified: 1, developing: 2, observation: 3, resolved: 4 };
    const diff = (order[a.status] ?? 5) - (order[b.status] ?? 5);
    return diff !== 0 ? diff : a.distance - b.distance;
  });

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>ALERTS</Text>
          <Text style={s.subtitle}>Sorted by severity & distance</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => {
              markAllRead();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={s.markAllBtn}
          >
            <Text style={s.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status banner */}
      {unreadCount > 0 ? (
        <View style={s.unreadBanner}>
          <View style={s.bannerDot} />
          <Text style={s.bannerText}>
            {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''} require your attention
          </Text>
        </View>
      ) : (
        <View style={s.clearBanner}>
          <Text style={s.clearCheck}>✓</Text>
          <Text style={s.clearText}>All caught up</Text>
        </View>
      )}

      {/* Sort labels */}
      <View style={s.sortRow}>
        <Text style={s.sortLabel}>Sorted by: </Text>
        <Text style={s.sortItem}>Unread</Text>
        <Text style={s.sortArrow}> → </Text>
        <Text style={s.sortItem}>Severity</Text>
        <Text style={s.sortArrow}> → </Text>
        <Text style={s.sortItem}>Distance</Text>
      </View>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} style={s.list} contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
        {sorted.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔕</Text>
            <Text style={s.emptyText}>No alerts in your area</Text>
          </View>
        ) : (
          sorted.map((alert) => (
            <AlertItem key={alert.id} alert={alert} onRead={markAlertRead} />
          ))
        )}
      </ScrollView>

      <Text style={s.footer}>Alerts within 10 miles · Updated in real-time</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#030712', padding: 16, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  subtitle: { color: '#6b7280', fontSize: 12 },
  markAllBtn: { backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', paddingHorizontal: 12, paddingVertical: 6 },
  markAllText: { color: '#60a5fa', fontSize: 12 },
  unreadBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(127,29,29,0.35)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, gap: 8 },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  bannerText: { color: '#fca5a5', fontSize: 13, fontWeight: '500', flex: 1 },
  clearBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(5,46,22,0.4)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10, gap: 8 },
  clearCheck: { color: '#4ade80', fontSize: 14, fontWeight: '700' },
  clearText: { color: '#4ade80', fontSize: 13 },
  sortRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 2 },
  sortLabel: { color: '#4b5563', fontSize: 11 },
  sortItem: { color: '#6b7280', fontSize: 11 },
  sortArrow: { color: '#374151', fontSize: 11 },
  list: { flex: 1 },
  alertCard: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 12 },
  alertLeft: { position: 'relative' },
  alertIcon: { fontSize: 30 },
  unreadDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#030712' },
  alertBody: { flex: 1 },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  alertStatus: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  alertDist: { color: '#6b7280', fontSize: 12 },
  alertMsg: { color: '#fff', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  alertBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confDot: { width: 5, height: 5, borderRadius: 3 },
  alertConf: { color: '#9ca3af', fontSize: 11, flex: 1 },
  alertTime: { color: '#4b5563', fontSize: 11 },
  empty: { borderRadius: 18, borderWidth: 1, borderColor: '#1f2937', backgroundColor: 'rgba(17,24,39,0.5)', padding: 40, alignItems: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  footer: { color: '#374151', fontSize: 11, textAlign: 'center', paddingTop: 8 },
});

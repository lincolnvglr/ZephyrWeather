import { Tabs } from 'expo-router';
import { useZephyrStore } from '../../store/useZephyrStore';

export default function TabLayout() {
  const unreadCount = useZephyrStore((s) => s.unreadCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#060d1a',
          borderTopColor: '#1f2937',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Status', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="report"
        options={{ title: 'Report', tabBarIcon: ({ color }) => <TabIcon emoji="📡" color={color} /> }}
      />
      <Tabs.Screen
        name="map"
        options={{ title: 'Map', tabBarIcon: ({ color }) => <TabIcon emoji="🗺" color={color} /> }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <TabIcon emoji="🔔" color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444', fontSize: 10 },
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: unknown }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#ffffff' ? 1 : 0.5 }}>{emoji}</Text>;
}

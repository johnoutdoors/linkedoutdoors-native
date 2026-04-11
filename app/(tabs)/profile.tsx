import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>MK</Text>
        </View>
        <Text style={styles.name}>Mike K.</Text>
        <Text style={styles.region}>Eastern Shore, Maryland</Text>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>⭐ Ranger · Top 30%</Text>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>247</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>1.8k</Text>
            <Text style={styles.statLabel}>Helpful</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>5</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.bio}>Lifelong Chesapeake Bay fisherman. If it swims in the bay, I've probably tried to catch it. Also into hiking the Eastern Shore trails and kayak fishing. Happy to share spots — the bay's big enough for all of us.</Text>

        <Text style={styles.sectionTitle}>BADGES</Text>
        <View style={styles.badges}>
          {['🏅 Chesapeake Bay Expert', '🍂 Autumn Explorer 2025', '🎣 First Cast of Spring'].map(badge => (
            <View key={badge} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ACTIVITIES</Text>
        {[
          { emoji: '🎣', name: 'Bay Fishing', level: '12 years experience', skill: 'Advanced', skillColor: '#3a5f3a' },
          { emoji: '🛶', name: 'Kayak Fishing', level: '5 years experience', skill: 'Advanced', skillColor: '#3a5f3a' },
          { emoji: '🥾', name: 'Hiking', level: 'Casual weekends', skill: 'Intermediate', skillColor: '#c8853a' },
        ].map(activity => (
          <View key={activity.name} style={styles.activityItem}>
            <Text style={styles.activityEmoji}>{activity.emoji}</Text>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{activity.name}</Text>
              <Text style={styles.activityLevel}>{activity.level}</Text>
            </View>
            <View style={[styles.skillBadge, { backgroundColor: activity.skillColor + '20' }]}>
              <Text style={[styles.skillText, { color: activity.skillColor }]}>{activity.skill}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: { backgroundColor: '#1a2e1a', paddingTop: 60, paddingBottom: 24, alignItems: 'center' },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#c8853a', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 24 },
  name: { fontWeight: '700', fontSize: 22, color: '#faf8f4', marginBottom: 2 },
  region: { fontSize: 13, color: '#a4b890', marginBottom: 10 },
  rankBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(200,133,58,0.25)', borderWidth: 1, borderColor: 'rgba(200,133,58,0.4)', marginBottom: 16 },
  rankText: { color: '#e0a85c', fontSize: 13, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 30 },
  stat: { alignItems: 'center' },
  statNum: { fontWeight: '700', fontSize: 18, color: '#faf8f4' },
  statLabel: { fontSize: 11, color: '#a4b890' },
  body: { padding: 20 },
  bio: { fontSize: 15, lineHeight: 24, color: '#6b6560', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea' },
  sectionTitle: { fontWeight: '700', fontSize: 11, color: '#1a2e1a', letterSpacing: 1, marginBottom: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  badge: { backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#2c2825' },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  activityEmoji: { fontSize: 22, marginRight: 12 },
  activityInfo: { flex: 1 },
  activityName: { fontWeight: '600', fontSize: 14, color: '#2c2825' },
  activityLevel: { fontSize: 12, color: '#8e8e93', marginTop: 1 },
  skillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  skillText: { fontSize: 12, fontWeight: '600' },
});
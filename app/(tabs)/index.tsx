import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FILTERS = ['All', '🎣 Fishing', '🥾 Hiking', '🛶 Kayaking', '🏕️ Camping', '🚴 Biking'];

const POSTS = [
  { id: '1', initials: 'MK', color: '#3a5f3a', name: 'Mike K.', expert: true, location: 'Eastern Shore, MD', tag: 'Bay Fishing', time: '2h', body: "Fished the bay side of Assateague yesterday evening. Caught three nice rockfish on white bucktails. Tide was going out — that's the move this time of year. Wind was calm, no bugs yet.", helpful: 24, comments: 8 },
  { id: '2', initials: 'JR', color: '#c8853a', name: 'Jen R.', expert: false, location: 'Central MD', tag: 'Family Hiking', time: '4h', body: "Hit the Gunpowder Falls trail this morning with my kids (6 and 9). Totally doable for them — mostly flat with a few rocky sections. Parking lot was full by 10am so get there early. Saw a bald eagle!", helpful: 41, comments: 15 },
  { id: '3', initials: 'DP', color: '#5c3d2e', name: 'Dan P.', expert: false, location: 'Delaware', tag: 'Stream Fishing', time: '6h', body: "Anyone know if White Clay Creek is fishable after last night's rain? Thinking of heading out tomorrow morning for some trout.", helpful: 6, comments: 12 },
  { id: '4', initials: 'SL', color: '#7a9a6d', name: 'Sarah L.', expert: true, location: 'Western MD', tag: 'Backpacking', time: '8h', body: "C&O towpath update: muddy after last night's rain. Avoid the first two miles from the Hancock trailhead. Everything past mile 3 is fine. Spring wildflowers starting to pop!", helpful: 37, comments: 5 },
];

export default function FeedScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Linked<Text style={styles.logoAccent}>Outdoors</Text></Text>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}>
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Posts */}
      <FlatList
        data={POSTS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feed}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.avatar, { backgroundColor: item.color }]}>
                <Text style={styles.avatarText}>{item.initials}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}{item.expert ? ' ★' : ''}</Text>
                <Text style={styles.userLocation}>{item.location} · <Text style={styles.tag}>{item.tag}</Text></Text>
              </View>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <Text style={styles.body}>{item.body}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionHelpful}>👍 Helpful · {item.helpful}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionText}>💬 {item.comments}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: { backgroundColor: '#1a2e1a', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 },
  logo: { fontWeight: '900', fontSize: 22, color: '#faf8f4' },
  logoAccent: { color: '#e0a85c' },
  filterBar: { backgroundColor: '#1a2e1a', height: 68 },
  filterContent: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8, gap: 8, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  filterChipActive: { backgroundColor: '#c8853a', borderColor: '#c8853a' },
  filterText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  filterTextActive: { color: 'white' },
  feed: { padding: 14, gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 13 },
  userInfo: { flex: 1 },
  userName: { fontWeight: '600', fontSize: 14, color: '#2c2825' },
  userLocation: { fontSize: 12, color: '#6b6560', marginTop: 1 },
  tag: { fontWeight: '600', color: '#3a5f3a' },
  time: { fontSize: 11, color: '#8e8e93' },
  body: { fontSize: 14, lineHeight: 22, color: '#2c2825', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionHelpful: { fontSize: 13, fontWeight: '600', color: '#3a5f3a' },
  actionText: { fontSize: 13, color: '#6b6560' },
});

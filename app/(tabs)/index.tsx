import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const FILTERS = ['All', '🎣 Fishing', '🥾 Hiking', '🛶 Kayaking', '🏕️ Camping', '🚴 Biking'];

const ACTIVITY_FILTER_MAP: Record<string, string> = {
  '🎣 Fishing': 'Fishing',
  '🥾 Hiking': 'Hiking',
  '🛶 Kayaking': 'Kayaking',
  '🏕️ Camping': 'Camping',
  '🚴 Biking': 'Biking',
};

const AVATAR_COLORS = ['#3a5f3a', '#c8853a', '#5c3d2e', '#7a9a6d', '#2a4a6a'];

type Post = {
  id: string;
  body: string;
  activity_tag: string | null;
  location: string | null;
  helpful_count: number;
  created_at: string;
  profiles: {
    username: string | null;
    full_name: string | null;
    show_real_name: boolean;
    location_state: string | null;
    avatar_color: string | null;
  } | null;
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(userId: string) {
  const idx = userId.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function FeedScreen() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    fetchPosts();
  }, []));

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username, full_name, show_real_name, location_state, avatar_color)')
      .order('created_at', { ascending: false });

    if (!error && data) setPosts(data as Post[]);
    setLoading(false);
  }

  const filtered = activeFilter === 'All'
    ? posts
    : posts.filter(p => p.activity_tag === ACTIVITY_FILTER_MAP[activeFilter]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Linked<Text style={styles.logoAccent}>Outdoors</Text></Text>
      </View>

      {/* Filters */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#3a5f3a" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <ScrollView
          style={styles.flex1}
          contentContainerStyle={styles.centered}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPosts} tintColor="#3a5f3a" />}
        >
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to share a trip report!</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.feed}
          onRefresh={fetchPosts}
          refreshing={loading}
          renderItem={({ item }) => {
            const p = item.profiles;
            const displayName = p?.show_real_name && p?.full_name ? p.full_name : `@${p?.username ?? 'unknown'}`;
            const color = p?.avatar_color ?? getAvatarColor(item.id);
            const location = item.location ?? p?.location_state ?? '';
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: color }]}>
                    <Text style={styles.avatarText}>{getInitials(p?.username ?? '?')}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userLocation}>
                      {location}
                      {item.activity_tag ? <Text style={styles.tag}> · {item.activity_tag}</Text> : null}
                    </Text>
                  </View>
                  <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
                </View>
                <Text style={styles.body}>{item.body}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionHelpful}>👍 Helpful · {item.helpful_count}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  flex1: { flex: 1 },
  header: { backgroundColor: '#1a2e1a', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 },
  logo: { fontWeight: '900', fontSize: 22, color: '#faf8f4' },
  logoAccent: { color: '#e0a85c' },
  filterBar: { backgroundColor: '#1a2e1a', paddingVertical: 10 },
  filterContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  filterChipActive: { backgroundColor: '#c8853a', borderColor: '#c8853a' },
  filterText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  filterTextActive: { color: 'white' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2c2825' },
  emptySubtitle: { fontSize: 13, color: '#8e8e93' },
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
});

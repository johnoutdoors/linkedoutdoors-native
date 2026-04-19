import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const FILTERS = ['All', '🎣 Fishing', '🥾 Hiking', '🛶 Kayaking', '🏕️ Camping', '🚵 Biking', '🦌 Hunting'];

const ACTIVITY_FILTER_MAP: Record<string, string> = {
  '🎣 Fishing': 'Fishing',
  '🥾 Hiking': 'Hiking',
  '🛶 Kayaking': 'Kayaking',
  '🏕️ Camping': 'Camping',
  '🚵 Biking': 'Biking',
  '🦌 Hunting': 'Hunting',
};

const AVATAR_COLORS = ['#3a5f3a', '#c8853a', '#5c3d2e', '#7a9a6d', '#2a4a6a'];

type Post = {
  id: string;
  user_id: string;
  body: string;
  activity_tag: string | null;
  location: string | null;
  image_url: string | null;
  created_at: string;
  post_likes: { user_id: string }[];
  comments: { id: string }[];
  profiles: {
    username: string | null;
    full_name: string | null;
    show_real_name: boolean;
    location_state: string | null;
    avatar_color: string | null;
    avatar_url: string | null;
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
  const { user } = useAuth();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchPosts();
  }, []));

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username, full_name, show_real_name, location_state, avatar_color, avatar_url), post_likes(user_id), comments(id)')
      .order('created_at', { ascending: false });
    if (!error && data) setPosts(data as Post[]);
    setLoading(false);
  }

  async function toggleLike(post: Post) {
    if (!user || liking) return;
    setLiking(post.id);
    const liked = post.post_likes.some(l => l.user_id === user.id);
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
    await fetchPosts();
    setLiking(null);
  }

  function openPostMenu(post: Post) {
    Alert.alert('Post options', undefined, [
      { text: 'Edit', onPress: () => { setEditingPost(post); setEditText(post.body); } },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(post) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function confirmDelete(post: Post) {
    Alert.alert('Delete post', 'This cannot be undone.', [
      { text: 'Delete', style: 'destructive', onPress: () => deletePost(post.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function deletePost(id: string) {
    await supabase.from('posts').delete().eq('id', id);
    await fetchPosts();
  }

  async function saveEdit() {
    if (!editingPost || !editText.trim()) return;
    setIsSaving(true);
    await supabase.from('posts').update({ body: editText.trim() }).eq('id', editingPost.id);
    setIsSaving(false);
    setEditingPost(null);
    await fetchPosts();
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
            const isOwn = item.user_id === user?.id;
            const displayName = p?.show_real_name && p?.full_name ? p.full_name : `@${p?.username ?? 'unknown'}`;
            const color = p?.avatar_color ?? getAvatarColor(item.id);
            const location = item.location ?? p?.location_state ?? '';
            return (
              <TouchableOpacity style={styles.card} onPress={() => router.push(`/post/${item.id}`)} activeOpacity={0.85}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: color }]}>
                    {p?.avatar_url
                      ? <Image source={{ uri: p.avatar_url }} style={styles.avatarImg} />
                      : <Text style={styles.avatarText}>{getInitials(p?.username ?? '?')}</Text>
                    }
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userLocation}>
                      {location}
                      {item.activity_tag ? <Text style={styles.tag}> · {item.activity_tag}</Text> : null}
                    </Text>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
                    {isOwn && (
                      <TouchableOpacity onPress={() => openPostMenu(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.menuDots}>···</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={styles.body}>{item.body}</Text>
                {item.image_url && (
                  <Image source={{ uri: item.image_url }} style={styles.postImage} resizeMode="cover" />
                )}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => toggleLike(item)}
                    disabled={liking === item.id}
                  >
                    {liking === item.id
                      ? <ActivityIndicator size="small" color="#3a5f3a" />
                      : <Text style={[styles.actionHelpful, item.post_likes.some(l => l.user_id === user?.id) && styles.actionHelpfulLiked]}>
                          👍 Helpful · {item.post_likes.length}
                        </Text>
                    }
                  </TouchableOpacity>
                  {item.comments.length > 0 && (
                    <Text style={styles.actionComments}>💬 {item.comments.length}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Edit post modal */}
      <Modal visible={!!editingPost} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.editModal}>
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={() => setEditingPost(null)}>
              <Text style={styles.editCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editTitle}>Edit Post</Text>
            <TouchableOpacity
              style={[styles.editSaveBtn, (!editText.trim() || isSaving) && styles.editSaveBtnDisabled]}
              onPress={saveEdit}
              disabled={!editText.trim() || isSaving}
            >
              {isSaving
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={styles.editSaveText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            autoFocus
            maxLength={290}
          />
        </View>
      </Modal>
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
  cardHeaderRight: { alignItems: 'flex-end', gap: 4 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 13 },
  avatarImg: { width: 38, height: 38, borderRadius: 19 },
  userInfo: { flex: 1 },
  userName: { fontWeight: '600', fontSize: 14, color: '#2c2825' },
  userLocation: { fontSize: 12, color: '#6b6560', marginTop: 1 },
  tag: { fontWeight: '600', color: '#3a5f3a' },
  time: { fontSize: 11, color: '#8e8e93' },
  menuDots: { fontSize: 18, color: '#c0c0c0', fontWeight: '700', lineHeight: 18 },
  body: { fontSize: 14, lineHeight: 22, color: '#2c2825', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionHelpful: { fontSize: 13, fontWeight: '600', color: '#3a5f3a' },
  actionHelpfulLiked: { color: '#c8853a' },
  actionComments: { fontSize: 13, fontWeight: '600', color: '#8e8e93' },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 12 },
  editModal: { flex: 1, backgroundColor: '#faf8f4' },
  editHeader: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea' },
  editCancel: { fontSize: 16, color: '#6b6560' },
  editTitle: { fontSize: 16, fontWeight: '700', color: '#2c2825' },
  editSaveBtn: { backgroundColor: '#3a5f3a', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 18 },
  editSaveBtnDisabled: { opacity: 0.35 },
  editSaveText: { color: 'white', fontWeight: '700', fontSize: 14 },
  editInput: { flex: 1, fontSize: 17, lineHeight: 26, color: '#2c2825', padding: 20, textAlignVertical: 'top' },
});

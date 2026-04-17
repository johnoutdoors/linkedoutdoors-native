import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const AVATAR_COLORS = ['#3a5f3a', '#c8853a', '#5c3d2e', '#7a9a6d', '#2a4a6a'];

type Post = {
  id: string;
  body: string;
  activity_tag: string | null;
  location: string | null;
  image_url: string | null;
  created_at: string;
  post_likes: { user_id: string }[];
  profiles: {
    username: string | null;
    full_name: string | null;
    show_real_name: boolean;
    avatar_color: string | null;
  } | null;
};

type Comment = {
  id: string;
  body: string;
  created_at: string;
  profiles: {
    username: string | null;
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
  return (name ?? '?').slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  async function fetchAll() {
    const [postRes, commentsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('*, profiles(username, full_name, show_real_name, avatar_color), post_likes(user_id)')
        .eq('id', id)
        .single(),
      supabase
        .from('comments')
        .select('*, profiles(username, avatar_color)')
        .eq('post_id', id)
        .order('created_at', { ascending: true }),
    ]);
    if (postRes.data) setPost(postRes.data as Post);
    if (commentsRes.data) setComments(commentsRes.data as Comment[]);
    setLoading(false);
  }

  async function toggleLike() {
    if (!post || !user || liking) return;
    setLiking(true);
    const liked = post.post_likes.some(l => l.user_id === user.id);
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
    await fetchAll();
    setLiking(false);
  }

  async function submitComment() {
    if (!commentText.trim() || !user || isSubmitting) return;
    setIsSubmitting(true);
    await supabase.from('comments').insert({
      post_id: id,
      user_id: user.id,
      body: commentText.trim(),
    });
    setCommentText('');
    await fetchAll();
    setIsSubmitting(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#3a5f3a" size="large" />
      </View>
    );
  }

  if (!post) return null;

  const p = post.profiles;
  const displayName = p?.show_real_name ? (p?.full_name ?? `@${p?.username}`) : `@${p?.username ?? 'unknown'}`;
  const avatarColor = p?.avatar_color ?? getAvatarColor(post.id);
  const liked = post.post_likes.some(l => l.user_id === user?.id);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Original post */}
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{getInitials(p?.username ?? '?')}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.postMeta}>
                {post.location ?? ''}
                {post.activity_tag ? `${post.location ? ' · ' : ''}${post.activity_tag}` : ''}
              </Text>
            </View>
            <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
          </View>

          <Text style={styles.postBody}>{post.body}</Text>

          {post.image_url && (
            <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
          )}

          <TouchableOpacity style={styles.likeBtn} onPress={toggleLike} disabled={liking}>
            {liking
              ? <ActivityIndicator size="small" color="#3a5f3a" />
              : <Text style={[styles.likeBtnText, liked && styles.likeBtnTextLiked]}>
                  👍 Helpful · {post.post_likes.length}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Comments header */}
        <Text style={styles.commentsLabel}>
          {comments.length === 0 ? 'No comments yet' : `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
        </Text>

        {/* Comments */}
        {comments.map(comment => {
          const cp = comment.profiles;
          const cColor = cp?.avatar_color ?? getAvatarColor(comment.id);
          return (
            <View key={comment.id} style={styles.commentRow}>
              <View style={[styles.commentAvatar, { backgroundColor: cColor }]}>
                <Text style={styles.commentAvatarText}>{getInitials(cp?.username ?? '?')}</Text>
              </View>
              <View style={styles.commentBubble}>
                <View style={styles.commentTop}>
                  <Text style={styles.commentUsername}>@{cp?.username ?? 'unknown'}</Text>
                  <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
                </View>
                <Text style={styles.commentBody}>{comment.body}</Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Comment input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment…"
          placeholderTextColor="#aaa"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!commentText.trim() || isSubmitting) && styles.sendBtnDisabled]}
          onPress={submitComment}
          disabled={!commentText.trim() || isSubmitting}
        >
          {isSubmitting
            ? <ActivityIndicator size="small" color="white" />
            : <Text style={styles.sendBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f2f7' },
  header: {
    backgroundColor: '#1a2e1a', paddingTop: 60, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { width: 80, flexShrink: 0 },
  backText: { color: '#a4b890', fontSize: 16, fontWeight: '600', flexShrink: 0 },
  headerTitle: { color: '#faf8f4', fontWeight: '700', fontSize: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 14 },
  postCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 14 },
  userInfo: { flex: 1 },
  userName: { fontWeight: '700', fontSize: 15, color: '#2c2825' },
  postMeta: { fontSize: 12, color: '#6b6560', marginTop: 1 },
  time: { fontSize: 11, color: '#8e8e93' },
  postBody: { fontSize: 16, lineHeight: 24, color: '#2c2825', marginBottom: 12 },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12 },
  likeBtn: { paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: '#f2f2f7', alignItems: 'flex-start' },
  likeBtnText: { fontSize: 13, fontWeight: '700', color: '#3a5f3a' },
  likeBtnTextLiked: { color: '#c8853a' },
  commentsLabel: { fontSize: 11, fontWeight: '700', color: '#8e8e93', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
  commentRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  commentAvatarText: { color: 'white', fontWeight: '700', fontSize: 11 },
  commentBubble: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentUsername: { fontWeight: '700', fontSize: 13, color: '#2c2825' },
  commentTime: { fontSize: 11, color: '#c0c0c0' },
  commentBody: { fontSize: 14, lineHeight: 20, color: '#2c2825' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: 'white', borderTopWidth: 0.5, borderTopColor: '#e5e5ea',
  },
  commentInput: { flex: 1, fontSize: 15, color: '#2c2825', maxHeight: 100, paddingTop: 8, paddingBottom: 8 },
  sendBtn: { backgroundColor: '#3a5f3a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, minWidth: 56, alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.35 },
  sendBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
});

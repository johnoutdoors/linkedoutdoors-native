import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ACTIVITIES } from '../../constants/activities';
import { LOCATIONS, STATES, formatLocation } from '../../constants/locations';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

type Post = {
  id: string;
  body: string;
  activity_tag: string | null;
  location: string | null;
  created_at: string;
};

type LocationStep = 'state' | 'region';

function getRank(count: number) {
  if (count >= 100) return { label: 'Guide', emoji: '🏔️' };
  if (count >= 26)  return { label: 'Ranger', emoji: '⭐' };
  if (count >= 6)   return { label: 'Pathfinder', emoji: '🧭' };
  if (count >= 1)   return { label: 'Trailblazer', emoji: '🌿' };
  return { label: 'Explorer', emoji: '🔭' };
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function ProfileScreen() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editShowRealName, setEditShowRealName] = useState(false);
  const [editLocationState, setEditLocationState] = useState<string | null>(null);
  const [editLocationRegion, setEditLocationRegion] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'>('idle');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationStep, setLocationStep] = useState<LocationStep>('state');
  const [pendingState, setPendingState] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchPosts();
  }, []));

  async function fetchPosts() {
    if (!user) return;
    setLoadingPosts(true);
    const { data } = await supabase
      .from('posts')
      .select('id, body, activity_tag, location, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPosts((data as Post[]) ?? []);
    setLoadingPosts(false);
  }

  async function handleAvatarPress() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setUploadingAvatar(true);
    const base64 = result.assets[0].base64;
    const path = `${user!.id}/avatar.jpg`;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) { Alert.alert('Upload failed', uploadError.message); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user!.id);
    await refreshProfile();
    setUploadingAvatar(false);
  }

  function openEdit() {
    setEditUsername(profile?.username ?? '');
    setEditBio(profile?.bio ?? '');
    setEditFullName(profile?.full_name ?? '');
    setEditShowRealName(profile?.show_real_name ?? false);
    setEditLocationState(profile?.location_state ?? null);
    setEditLocationRegion(profile?.location_region ?? null);
    setUsernameStatus('unchanged');
    setShowEdit(true);
  }

  // Debounced username check in edit modal
  useEffect(() => {
    if (!showEdit) return;
    if (editUsername === profile?.username) { setUsernameStatus('unchanged'); return; }
    if (!editUsername) { setUsernameStatus('idle'); return; }
    if (!USERNAME_REGEX.test(editUsername)) { setUsernameStatus('invalid'); return; }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', editUsername)
        .neq('id', user!.id)
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [editUsername, showEdit]);

  function handleEditUsernameChange(text: string) {
    setEditUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  }

  function openLocationPicker() {
    setLocationStep('state');
    setPendingState(null);
    setShowLocationPicker(true);
  }

  function selectState(state: string) {
    setPendingState(state);
    setLocationStep('region');
  }

  function selectRegion(region: string | null) {
    setEditLocationState(pendingState);
    setEditLocationRegion(region);
    setShowLocationPicker(false);
  }

  const canSave = (usernameStatus === 'available' || usernameStatus === 'unchanged')
    && !!editLocationState
    && !isSaving;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({
      username: editUsername,
      bio: editBio.trim() || null,
      full_name: editFullName.trim() || null,
      show_real_name: editShowRealName,
      location_state: editLocationState,
      location_region: editLocationRegion,
    }).eq('id', user!.id);
    setIsSaving(false);
    if (error) {
      Alert.alert('Save failed', error.message);
    } else {
      await refreshProfile();
      setShowEdit(false);
    }
  }

  // Derived data
  const rank = getRank(posts.length);
  const locationLabel = formatLocation(profile?.location_state ?? null, profile?.location_region ?? null);
  const displayName = profile?.show_real_name && profile?.full_name ? profile.full_name : null;

  const activityCounts = posts.reduce((acc, post) => {
    if (post.activity_tag) acc[post.activity_tag] = (acc[post.activity_tag] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topActivities = Object.entries(activityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  function getUsernameIndicator() {
    switch (usernameStatus) {
      case 'checking':   return <ActivityIndicator size="small" color="#8e8e93" />;
      case 'available':  return <Text style={styles.statusAvailable}>✓ Available</Text>;
      case 'taken':      return <Text style={styles.statusTaken}>✗ Already taken</Text>;
      case 'invalid':    return <Text style={styles.statusInvalid}>3–20 chars, letters, numbers, underscores</Text>;
      default:           return null;
    }
  }

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatar} onPress={handleAvatarPress} disabled={uploadingAvatar}>
          {uploadingAvatar ? (
            <ActivityIndicator color="white" />
          ) : profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(profile?.username ?? '?')}</Text>
          )}
          <View style={styles.avatarEditBadge}>
            <Text style={styles.avatarEditBadgeText}>📷</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.username}>@{profile?.username ?? '…'}</Text>
        {displayName && <Text style={styles.realName}>{displayName}</Text>}
        {locationLabel && <Text style={styles.location}>📍 {locationLabel}</Text>}

        <View style={styles.badges}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank.emoji} {rank.label}</Text>
          </View>
          {(profile?.role === 'admin' || profile?.role === 'moderator') && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {profile.role === 'admin' ? '⚡ Admin' : '🛡️ Moderator'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>

        {/* Bio */}
        <TouchableOpacity onPress={openEdit}>
          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioEmpty}>Tap to add a bio…</Text>
          )}
        </TouchableOpacity>

        {/* Activities */}
        {topActivities.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>ACTIVITIES</Text>
            <View style={styles.activityList}>
              {topActivities.map(([tag, count]) => {
                const activity = ACTIVITIES.find(a => a.label === tag);
                return (
                  <View key={tag} style={styles.activityItem}>
                    <Text style={styles.activityEmoji}>{activity?.emoji ?? '🌿'}</Text>
                    <Text style={styles.activityName}>{tag}</Text>
                    <Text style={styles.activityCount}>{count} {count === 1 ? 'post' : 'posts'}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Recent Posts */}
        <Text style={styles.sectionTitle}>RECENT POSTS</Text>
        {loadingPosts ? (
          <ActivityIndicator color="#3a5f3a" style={{ marginVertical: 20 }} />
        ) : posts.length === 0 ? (
          <Text style={styles.emptyPosts}>No posts yet. Share your first trip report!</Text>
        ) : (
          posts.slice(0, 5).map(post => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postMeta}>
                {post.activity_tag && (
                  <View style={styles.postTag}>
                    <Text style={styles.postTagText}>
                      {ACTIVITIES.find(a => a.label === post.activity_tag)?.emoji} {post.activity_tag}
                    </Text>
                  </View>
                )}
                {post.location && <Text style={styles.postLocation}>📍 {post.location}</Text>}
                <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
              </View>
              <Text style={styles.postBody} numberOfLines={3}>{post.body}</Text>
            </View>
          ))
        )}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </View>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEdit(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={[styles.modalSaveBtn, !canSave && styles.modalSaveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              {isSaving
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={styles.modalSaveText}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">

            {/* Username */}
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.usernameRow}>
              <View style={styles.atSign}>
                <Text style={styles.atText}>@</Text>
              </View>
              <TextInput
                style={styles.usernameInput}
                value={editUsername}
                onChangeText={handleEditUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>
            <View style={styles.statusRow}>{getUsernameIndicator()}</View>

            {/* Bio */}
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={styles.bioInput}
              placeholder="Tell the community about yourself…"
              placeholderTextColor="#aaa"
              multiline
              value={editBio}
              onChangeText={setEditBio}
              maxLength={200}
            />
            <Text style={styles.bioCount}>{editBio.length}/200</Text>

            {/* Home Region */}
            <Text style={styles.fieldLabel}>Home Region</Text>
            <TouchableOpacity
              style={[styles.regionBtn, editLocationState && styles.regionBtnFilled]}
              onPress={openLocationPicker}
            >
              <Text style={[styles.regionBtnText, editLocationState && styles.regionBtnTextFilled]}>
                {formatLocation(editLocationState, editLocationRegion) ?? '📍 Select region'}
              </Text>
              {editLocationState && (
                <TouchableOpacity onPress={() => { setEditLocationState(null); setEditLocationRegion(null); }}>
                  <Text style={styles.regionClear}>×</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Real Name */}
            <View style={styles.realNameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Real Name</Text>
                <Text style={styles.fieldHint}>Shown on your profile if enabled</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, editShowRealName && styles.toggleOn]}
                onPress={() => setEditShowRealName(!editShowRealName)}
              >
                <View style={[styles.toggleThumb, editShowRealName && styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>
            {editShowRealName && (
              <TextInput
                style={styles.input}
                placeholder="First name + last initial (e.g. John N.)"
                placeholderTextColor="#aaa"
                value={editFullName}
                onChangeText={setEditFullName}
                autoCapitalize="words"
              />
            )}

          </ScrollView>
        </View>

        {/* Location Picker inside Edit Modal */}
        <Modal visible={showLocationPicker} transparent animationType="slide">
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowLocationPicker(false)}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHandle} />
              {locationStep === 'state' ? (
                <>
                  <Text style={styles.pickerTitle}>Select State</Text>
                  {STATES.map(state => (
                    <TouchableOpacity key={state} style={styles.pickerOption} onPress={() => selectState(state)}>
                      <Text style={styles.pickerOptionText}>{state}</Text>
                      <Text style={styles.pickerChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={() => setLocationStep('state')} style={styles.pickerBack}>
                    <Text style={styles.pickerBackText}>‹ {pendingState}</Text>
                  </TouchableOpacity>
                  <Text style={styles.pickerTitle}>
                    Select Region <Text style={styles.pickerOptional}>(optional)</Text>
                  </Text>
                  <TouchableOpacity style={styles.pickerOption} onPress={() => selectRegion(null)}>
                    <Text style={styles.pickerOptionText}>No specific region</Text>
                  </TouchableOpacity>
                  {LOCATIONS[pendingState!].map(region => (
                    <TouchableOpacity
                      key={region}
                      style={[styles.pickerOption, editLocationRegion === region && styles.pickerOptionSelected]}
                      onPress={() => selectRegion(region)}
                    >
                      <Text style={[styles.pickerOptionText, editLocationRegion === region && styles.pickerOptionTextSelected]}>
                        {region}
                      </Text>
                      {editLocationRegion === region && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },

  // Header
  header: { backgroundColor: '#1a2e1a', paddingTop: 60, paddingBottom: 28, alignItems: 'center' },
  editBtn: { position: 'absolute', top: 64, right: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#c8853a', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)' },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 30 },
  avatarEditBadge: { position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: '#1a2e1a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1a2e1a' },
  avatarEditBadgeText: { fontSize: 12 },
  username: { fontWeight: '800', fontSize: 22, color: '#faf8f4', marginBottom: 2 },
  realName: { fontSize: 14, color: '#a4b890', marginBottom: 2 },
  location: { fontSize: 13, color: '#a4b890', marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rankBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(200,133,58,0.25)', borderWidth: 1, borderColor: 'rgba(200,133,58,0.4)' },
  rankText: { color: '#e0a85c', fontSize: 13, fontWeight: '700' },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  roleText: { color: '#faf8f4', fontSize: 13, fontWeight: '700' },
  stats: { flexDirection: 'row' },
  stat: { alignItems: 'center' },
  statNum: { fontWeight: '700', fontSize: 20, color: '#faf8f4' },
  statLabel: { fontSize: 11, color: '#a4b890', marginTop: 1 },

  // Body
  body: { padding: 20 },
  bio: { fontSize: 15, lineHeight: 24, color: '#6b6560', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea' },
  bioEmpty: { fontSize: 15, color: '#c0c0c0', fontStyle: 'italic', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea' },
  sectionTitle: { fontWeight: '700', fontSize: 11, color: '#1a2e1a', letterSpacing: 1, marginBottom: 10, marginTop: 4 },

  // Activities
  activityList: { marginBottom: 24 },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  activityEmoji: { fontSize: 22, marginRight: 12 },
  activityName: { flex: 1, fontWeight: '600', fontSize: 14, color: '#2c2825' },
  activityCount: { fontSize: 12, color: '#8e8e93' },

  // Posts
  emptyPosts: { fontSize: 14, color: '#8e8e93', marginBottom: 24, fontStyle: 'italic' },
  postCard: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  postTag: { backgroundColor: 'rgba(58,95,58,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  postTagText: { fontSize: 11, fontWeight: '600', color: '#3a5f3a' },
  postLocation: { fontSize: 11, color: '#8e8e93' },
  postTime: { fontSize: 11, color: '#c0c0c0', marginLeft: 'auto' },
  postBody: { fontSize: 14, lineHeight: 21, color: '#2c2825' },

  // Sign out
  signOutBtn: { marginTop: 24, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e5e5ea', alignItems: 'center' },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#c0392b' },

  // Edit Modal
  modalContainer: { flex: 1, backgroundColor: '#faf8f4' },
  modalHeader: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea' },
  modalCancel: { fontSize: 16, color: '#6b6560' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2c2825' },
  modalSaveBtn: { backgroundColor: '#3a5f3a', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 18 },
  modalSaveBtnDisabled: { opacity: 0.35 },
  modalSaveText: { color: 'white', fontWeight: '700', fontSize: 14 },
  modalScroll: { flex: 1 },
  modalBody: { padding: 20, gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#2c2825', marginTop: 16, marginBottom: 6 },
  fieldHint: { fontSize: 12, color: '#8e8e93', marginBottom: 6, marginTop: -4 },
  usernameRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, backgroundColor: 'white', overflow: 'hidden' },
  atSign: { paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#f2f2f7', borderRightWidth: 1, borderRightColor: '#e5e5ea' },
  atText: { fontSize: 16, fontWeight: '700', color: '#3a5f3a' },
  usernameInput: { flex: 1, fontSize: 16, color: '#2c2825', paddingHorizontal: 12, paddingVertical: 14 },
  statusRow: { height: 20, marginTop: 4 },
  statusAvailable: { fontSize: 12, color: '#3a5f3a', fontWeight: '600' },
  statusTaken: { fontSize: 12, color: '#c0392b', fontWeight: '600' },
  statusInvalid: { fontSize: 12, color: '#8e8e93' },
  bioInput: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 14, fontSize: 15, color: '#2c2825', backgroundColor: 'white', minHeight: 90, textAlignVertical: 'top' },
  bioCount: { fontSize: 11, color: '#c0c0c0', textAlign: 'right', marginTop: 4 },
  regionBtn: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white' },
  regionBtnFilled: { borderColor: '#3a5f3a', backgroundColor: 'rgba(58,95,58,0.06)' },
  regionBtnText: { fontSize: 15, color: '#8e8e93' },
  regionBtnTextFilled: { color: '#3a5f3a', fontWeight: '600' },
  regionClear: { fontSize: 20, color: '#3a5f3a', paddingLeft: 8 },
  realNameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#e5e5ea', padding: 2, justifyContent: 'center', marginTop: 18 },
  toggleOn: { backgroundColor: '#3a5f3a' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  toggleThumbOn: { alignSelf: 'flex-end' },
  input: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 14, fontSize: 15, color: '#2c2825', backgroundColor: 'white' },

  // Location Picker (nested in edit modal)
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, maxHeight: '75%' },
  pickerHandle: { width: 36, height: 4, backgroundColor: '#e5e5ea', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  pickerBack: { marginBottom: 8 },
  pickerBackText: { fontSize: 15, color: '#3a5f3a', fontWeight: '600' },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: '#2c2825', marginBottom: 12 },
  pickerOptional: { fontSize: 13, fontWeight: '400', color: '#8e8e93' },
  pickerOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f2f2f7' },
  pickerOptionSelected: { backgroundColor: 'rgba(58,95,58,0.05)', marginHorizontal: -24, paddingHorizontal: 24 },
  pickerOptionText: { flex: 1, fontSize: 16, color: '#2c2825', fontWeight: '500' },
  pickerOptionTextSelected: { color: '#3a5f3a', fontWeight: '700' },
  pickerChevron: { fontSize: 20, color: '#c0c0c0' },
  checkmark: { fontSize: 16, color: '#3a5f3a', fontWeight: '700' },
});

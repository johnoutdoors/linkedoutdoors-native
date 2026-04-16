import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { LOCATIONS, STATES, formatLocation } from '../../constants/locations';
import { ACTIVITIES } from '../../constants/activities';

const MAX_CHARS = 280;

type LocationStep = 'state' | 'region';

export default function CreateScreen() {
  const [postText, setPostText] = useState('');
  const [locationState, setLocationState] = useState<string | null>(null);
  const [locationRegion, setLocationRegion] = useState<string | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [locationStep, setLocationStep] = useState<LocationStep>('state');
  const [pendingState, setPendingState] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const { user, profile } = useAuth();
  const router = useRouter();

  const username = profile?.username ?? '';
  const initials = username.slice(0, 2).toUpperCase();
  const charsLeft = MAX_CHARS - postText.length;
  const nearLimit = charsLeft <= 20;
  const overLimit = charsLeft < 0;
  const canPost = postText.trim().length > 0 && !overLimit && !isPosting && !!locationState && !!activity;

  const locationLabel = formatLocation(locationState, locationRegion);
  const selectedActivity = ACTIVITIES.find(a => a.label === activity);

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
    setLocationState(pendingState);
    setLocationRegion(region);
    setShowLocationPicker(false);
  }

  function clearLocation() {
    setLocationState(null);
    setLocationRegion(null);
  }

  async function handlePost() {
    if (!canPost) return;
    setIsPosting(true);
    const location = locationRegion ? `${locationRegion}, ${locationState}` : locationState;
    const { error } = await supabase.from('posts').insert({
      user_id: user!.id,
      body: postText.trim(),
      activity_tag: activity,
      location,
    });
    setIsPosting(false);
    if (error) {
      Alert.alert('Post failed', error.message);
    } else {
      setPostText('');
      setActivity(null);
      setLocationState(null);
      setLocationRegion(null);
      router.replace('/(tabs)');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!canPost}
        >
          {isPosting
            ? <ActivityIndicator color="white" size="small" />
            : <Text style={styles.postBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Compose area */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.composeArea} keyboardShouldPersistTaps="handled">
        <View style={styles.row}>
          {/* Avatar */}
          <View style={styles.avatarCol}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.contentCol}>
            <Text style={styles.userName}>@{username}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What's happening out there?"
              placeholderTextColor="#aaa"
              multiline
              value={postText}
              onChangeText={t => setPostText(t.slice(0, MAX_CHARS + 10))}
              editable={!isPosting}
              autoFocus
            />

            {/* Required selectors */}
            <View style={styles.selectors}>
              {/* Activity */}
              {activity ? (
                <TouchableOpacity style={styles.chipFilled} onPress={() => setShowActivityPicker(true)}>
                  <Text style={styles.chipFilledText}>{selectedActivity?.emoji} {activity}</Text>
                  <TouchableOpacity onPress={() => setActivity(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.chipX}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.chipEmpty} onPress={() => setShowActivityPicker(true)}>
                  <Text style={styles.chipEmptyText}>What are you doing? <Text style={styles.required}>*</Text></Text>
                </TouchableOpacity>
              )}

              {/* Location */}
              {locationState ? (
                <TouchableOpacity style={styles.chipFilled} onPress={openLocationPicker}>
                  <Text style={styles.chipFilledText}>{locationLabel}</Text>
                  <TouchableOpacity onPress={clearLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.chipX}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.chipEmpty} onPress={openLocationPicker}>
                  <Text style={styles.chipEmptyText}>Where are you? <Text style={styles.required}>*</Text></Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn}>
          <Text style={styles.toolIcon}>📷</Text>
        </TouchableOpacity>
        <Text style={[styles.charCount, nearLimit && styles.charCountNear, overLimit && styles.charCountOver]}>
          {charsLeft}
        </Text>
      </View>

      {/* Location Picker Modal */}
      <Modal visible={showLocationPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLocationPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {locationStep === 'state' ? (
              <>
                <Text style={styles.modalTitle}>Select State</Text>
                {STATES.map(state => (
                  <TouchableOpacity key={state} style={styles.modalOption} onPress={() => selectState(state)}>
                    <Text style={styles.modalOptionText}>{state}</Text>
                    <Text style={styles.modalChevron}>›</Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setLocationStep('state')} style={styles.modalBack}>
                  <Text style={styles.modalBackText}>‹ {pendingState}</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Region <Text style={styles.modalOptional}>(optional)</Text></Text>
                <TouchableOpacity style={styles.modalOption} onPress={() => selectRegion(null)}>
                  <Text style={styles.modalOptionText}>No specific region</Text>
                  {!locationRegion && locationState === pendingState && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                {LOCATIONS[pendingState!].map(region => (
                  <TouchableOpacity
                    key={region}
                    style={[styles.modalOption, locationRegion === region && styles.modalOptionSelected]}
                    onPress={() => selectRegion(region)}
                  >
                    <Text style={[styles.modalOptionText, locationRegion === region && styles.modalOptionTextSelected]}>
                      {region}
                    </Text>
                    {locationRegion === region && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Activity Picker Modal */}
      <Modal visible={showActivityPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowActivityPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Activity</Text>
            {ACTIVITIES.map(a => (
              <TouchableOpacity
                key={a.label}
                style={[styles.modalOption, activity === a.label && styles.modalOptionSelected]}
                onPress={() => { setActivity(a.label); setShowActivityPicker(false); }}
              >
                <Text style={styles.modalOptionEmoji}>{a.emoji}</Text>
                <Text style={[styles.modalOptionText, activity === a.label && styles.modalOptionTextSelected]}>
                  {a.label}
                </Text>
                {activity === a.label && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f4' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea',
  },
  cancel: { fontSize: 16, color: '#6b6560' },
  postBtn: { backgroundColor: '#3a5f3a', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, minWidth: 64, alignItems: 'center' },
  postBtnDisabled: { opacity: 0.35 },
  postBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  composeArea: { padding: 16 },
  row: { flexDirection: 'row', gap: 12 },
  avatarCol: { alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3a5f3a', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 15 },
  contentCol: { flex: 1, paddingTop: 2 },
  userName: { fontWeight: '700', fontSize: 15, color: '#2c2825', marginBottom: 6 },
  textInput: { fontSize: 17, lineHeight: 25, color: '#2c2825', minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
  selectors: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipEmpty: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d0d0d0', borderStyle: 'dashed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipEmptyText: { fontSize: 13, color: '#8e8e93', fontWeight: '500' },
  required: { color: '#c8853a' },
  chipFilled: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(58,95,58,0.1)', borderWidth: 1, borderColor: 'rgba(58,95,58,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipFilledText: { fontSize: 13, color: '#3a5f3a', fontWeight: '600' },
  chipX: { fontSize: 16, color: '#3a5f3a', lineHeight: 18 },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 0.5, borderTopColor: '#e5e5ea', backgroundColor: '#faf8f4',
  },
  toolBtn: { padding: 6 },
  toolIcon: { fontSize: 22 },
  charCount: { fontSize: 14, fontWeight: '600', color: '#c0c0c0' },
  charCountNear: { color: '#c8853a' },
  charCountOver: { color: '#c0392b' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, maxHeight: '75%' },
  modalHandle: { width: 36, height: 4, backgroundColor: '#e5e5ea', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalBack: { marginBottom: 8 },
  modalBackText: { fontSize: 15, color: '#3a5f3a', fontWeight: '600' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#2c2825', marginBottom: 12 },
  modalOptional: { fontSize: 13, fontWeight: '400', color: '#8e8e93' },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f2f2f7' },
  modalOptionSelected: { backgroundColor: 'rgba(58,95,58,0.05)', marginHorizontal: -24, paddingHorizontal: 24 },
  modalOptionEmoji: { fontSize: 22, marginRight: 12 },
  modalOptionText: { flex: 1, fontSize: 16, color: '#2c2825', fontWeight: '500' },
  modalOptionTextSelected: { color: '#3a5f3a', fontWeight: '700' },
  modalChevron: { fontSize: 20, color: '#c0c0c0' },
  checkmark: { fontSize: 16, color: '#3a5f3a', fontWeight: '700' },
});

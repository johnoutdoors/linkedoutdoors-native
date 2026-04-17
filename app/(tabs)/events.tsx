import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ACTIVITIES } from '../../constants/activities';

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  activity_type: string | null;
  event_date: string;
  start_time: string | null;
  max_attendees: number | null;
  event_rsvps: { id: string; user_id: string }[];
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function get7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getNext60Days(): Date[] {
  return Array.from({ length: 60 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toDateString(d: Date) {
  return d.toISOString().split('T')[0];
}

function formatDayLabel(d: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (toDateString(d) === toDateString(today)) return 'Today';
  if (toDateString(d) === toDateString(tomorrow)) return 'Tomorrow';
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatPickerDate(d: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (toDateString(d) === toDateString(today)) return `Today · ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  if (toDateString(d) === toDateString(tomorrow)) return `Tomorrow · ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  return `${DAY_NAMES[d.getDay()]} · ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

const ACTIVITY_COLORS: Record<string, string> = {
  'Fishing': '#c8853a', 'Hiking': '#3a5f3a', 'Kayaking': '#3a6a9a',
  'Camping': '#5c4a2e', 'Biking': '#6b4c3b', 'Hunting': '#4a5c2e',
};

export default function EventsScreen() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState<string | null>(null);
  const days = get7Days();
  const [selectedDay, setSelectedDay] = useState(toDateString(days[0]));

  // Create event modal state
  const [showCreate, setShowCreate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newActivity, setNewActivity] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<Date>(new Date());
  const [newTime, setNewTime] = useState('');
  const [newMaxAttendees, setNewMaxAttendees] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canCreate = newTitle.trim().length > 0 && newLocation.trim().length > 0 && !isSaving;

  useFocusEffect(useCallback(() => {
    fetchEvents();
  }, []));

  async function fetchEvents() {
    setLoading(true);
    const from = toDateString(days[0]);
    const to = toDateString(days[days.length - 1]);
    const { data } = await supabase
      .from('events')
      .select('*, event_rsvps(id, user_id)')
      .gte('event_date', from)
      .lte('event_date', to)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });
    setEvents((data as Event[]) ?? []);
    setLoading(false);
  }

  async function toggleRsvp(event: Event) {
    if (!user || rsvping) return;
    setRsvping(event.id);
    const hasRsvp = event.event_rsvps.some(r => r.user_id === user.id);
    if (hasRsvp) {
      await supabase.from('event_rsvps').delete().eq('event_id', event.id).eq('user_id', user.id);
    } else {
      await supabase.from('event_rsvps').insert({ event_id: event.id, user_id: user.id });
    }
    await fetchEvents();
    setRsvping(null);
  }

  function openCreate() {
    setNewTitle('');
    setNewLocation('');
    setNewDescription('');
    setNewActivity(null);
    setNewDate(new Date());
    setNewTime('');
    setNewMaxAttendees('');
    setShowCreate(true);
  }

  async function handleCreate() {
    if (!canCreate || !user) return;
    setIsSaving(true);
    const { error } = await supabase.from('events').insert({
      title: newTitle.trim(),
      location: newLocation.trim(),
      description: newDescription.trim() || null,
      activity_type: newActivity,
      event_date: toDateString(newDate),
      start_time: newTime.trim() || null,
      max_attendees: newMaxAttendees ? parseInt(newMaxAttendees, 10) : null,
      created_by: user.id,
    });
    setIsSaving(false);
    if (error) {
      Alert.alert('Failed to create event', error.message);
    } else {
      setShowCreate(false);
      // Switch to the new event's date if it's in the 7-day window
      const ds = toDateString(newDate);
      if (days.some(d => toDateString(d) === ds)) setSelectedDay(ds);
      await fetchEvents();
    }
  }

  const dayEvents = events.filter(e => e.event_date === selectedDay);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Events</Text>
              <Text style={styles.subtitle}>Mid-Atlantic Outdoors</Text>
            </View>
            {isAdmin && (
              <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
                <Text style={styles.createBtnText}>+ New Event</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 7-day strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
            {days.map(d => {
              const ds = toDateString(d);
              const hasEvents = events.some(e => e.event_date === ds);
              const active = ds === selectedDay;
              return (
                <TouchableOpacity key={ds} onPress={() => setSelectedDay(ds)} style={[styles.dateChip, active && styles.dateChipActive]}>
                  <Text style={[styles.dayName, active && styles.dayNameActive]}>{DAY_NAMES[d.getDay()]}</Text>
                  <Text style={[styles.dayNum, active && styles.dayNumActive]}>{d.getDate()}</Text>
                  {hasEvents && <View style={[styles.dot, active && styles.dotActive]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.body}>
          <Text style={styles.dayLabel}>{formatDayLabel(new Date(selectedDay + 'T12:00:00'))}</Text>

          {loading ? (
            <ActivityIndicator color="#3a5f3a" style={{ marginTop: 40 }} />
          ) : dayEvents.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No events this day</Text>
              <Text style={styles.emptySubtitle}>Check another day or come back soon.</Text>
            </View>
          ) : (
            dayEvents.map(event => {
              const rsvpCount = event.event_rsvps.length;
              const joined = event.event_rsvps.some(r => r.user_id === user?.id);
              const isFull = !!event.max_attendees && rsvpCount >= event.max_attendees;
              const isLoadingRsvp = rsvping === event.id;
              const color = ACTIVITY_COLORS[event.activity_type ?? ''] ?? '#3a5f3a';
              const emoji = ACTIVITIES.find(a => a.label === event.activity_type)?.emoji ?? '🌿';

              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={[styles.eventAccent, { backgroundColor: color }]} />
                  <View style={styles.eventContent}>
                    <View style={styles.eventTopRow}>
                      {event.start_time && <Text style={[styles.eventTime, { color }]}>{event.start_time}</Text>}
                      {event.activity_type && (
                        <View style={[styles.activityBadge, { backgroundColor: `${color}18` }]}>
                          <Text style={[styles.activityBadgeText, { color }]}>{emoji} {event.activity_type}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.eventName}>{event.title}</Text>
                    <Text style={styles.eventLocation}>📍 {event.location}</Text>
                    {event.description && <Text style={styles.eventDescription}>{event.description}</Text>}
                    <View style={styles.eventBottom}>
                      <Text style={styles.attendeeCount}>
                        👥 {rsvpCount}{event.max_attendees ? `/${event.max_attendees}` : ''} going
                      </Text>
                      <TouchableOpacity
                        onPress={() => (!isFull || joined) ? toggleRsvp(event) : null}
                        disabled={isLoadingRsvp}
                        style={[styles.rsvpBtn, joined && styles.rsvpJoined, isFull && !joined && styles.rsvpFull]}
                      >
                        {isLoadingRsvp
                          ? <ActivityIndicator size="small" color={joined ? '#3a5f3a' : 'white'} />
                          : <Text style={[styles.rsvpText, joined && styles.rsvpTextJoined, isFull && !joined && styles.rsvpTextFull]}>
                              {isFull && !joined ? 'Full' : joined ? 'Joined ✓' : 'Join'}
                            </Text>
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Create Event Modal ── */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Event</Text>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !canCreate && styles.modalSaveBtnDisabled]}
                onPress={handleCreate}
                disabled={!canCreate}
              >
                {isSaving
                  ? <ActivityIndicator color="white" size="small" />
                  : <Text style={styles.modalSaveText}>Create</Text>
                }
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">

              {/* Title */}
              <Text style={styles.fieldLabel}>Event Title <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Saturday Morning Hike"
                placeholderTextColor="#aaa"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              {/* Location */}
              <Text style={styles.fieldLabel}>Location <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Gunpowder Falls State Park, MD"
                placeholderTextColor="#aaa"
                value={newLocation}
                onChangeText={setNewLocation}
              />

              {/* Activity */}
              <Text style={styles.fieldLabel}>Activity</Text>
              <TouchableOpacity
                style={[styles.selectBtn, newActivity && styles.selectBtnFilled]}
                onPress={() => setShowActivityPicker(true)}
              >
                <Text style={[styles.selectBtnText, newActivity && styles.selectBtnTextFilled]}>
                  {newActivity
                    ? `${ACTIVITIES.find(a => a.label === newActivity)?.emoji} ${newActivity}`
                    : 'Select activity'}
                </Text>
                {newActivity && (
                  <TouchableOpacity onPress={() => setNewActivity(null)}>
                    <Text style={styles.clearX}>×</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {/* Date */}
              <Text style={styles.fieldLabel}>Date <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.selectBtnTextFilled}>
                  {formatPickerDate(newDate)}
                </Text>
              </TouchableOpacity>

              {/* Time */}
              <Text style={styles.fieldLabel}>Start Time</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 8:00 AM"
                placeholderTextColor="#aaa"
                value={newTime}
                onChangeText={setNewTime}
              />

              {/* Max Attendees */}
              <Text style={styles.fieldLabel}>Max Attendees <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Leave blank for unlimited"
                placeholderTextColor="#aaa"
                value={newMaxAttendees}
                onChangeText={t => setNewMaxAttendees(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />

              {/* Description */}
              <Text style={styles.fieldLabel}>Description <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details about the event…"
                placeholderTextColor="#aaa"
                multiline
                value={newDescription}
                onChangeText={setNewDescription}
              />

            </ScrollView>
          </View>
        </KeyboardAvoidingView>

        {/* Activity picker */}
        <Modal visible={showActivityPicker} transparent animationType="slide">
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowActivityPicker(false)}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHandle} />
              <Text style={styles.pickerTitle}>Select Activity</Text>
              {ACTIVITIES.map(a => (
                <TouchableOpacity
                  key={a.label}
                  style={[styles.pickerOption, newActivity === a.label && styles.pickerOptionSelected]}
                  onPress={() => { setNewActivity(a.label); setShowActivityPicker(false); }}
                >
                  <Text style={styles.pickerEmoji}>{a.emoji}</Text>
                  <Text style={[styles.pickerOptionText, newActivity === a.label && styles.pickerOptionTextSelected]}>
                    {a.label}
                  </Text>
                  {newActivity === a.label && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Date picker */}
        <Modal visible={showDatePicker} transparent animationType="slide">
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHandle} />
              <Text style={styles.pickerTitle}>Select Date</Text>
              {getNext60Days().map(d => {
                const ds = toDateString(d);
                const selected = ds === toDateString(newDate);
                return (
                  <TouchableOpacity
                    key={ds}
                    style={[styles.pickerOption, selected && styles.pickerOptionSelected]}
                    onPress={() => { setNewDate(d); setShowDatePicker(false); }}
                  >
                    <Text style={[styles.pickerOptionText, selected && styles.pickerOptionTextSelected]}>
                      {formatPickerDate(d)}
                    </Text>
                    {selected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: { backgroundColor: '#faf8f4', paddingTop: 60, paddingBottom: 12, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontWeight: '700', fontSize: 28, color: '#1a2e1a', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#6b6560' },
  createBtn: { backgroundColor: '#3a5f3a', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 6 },
  createBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },
  dateStrip: { gap: 6, paddingBottom: 4 },
  dateChip: { width: 48, alignItems: 'center', paddingVertical: 8, borderRadius: 12 },
  dateChipActive: { backgroundColor: '#3a5f3a' },
  dayName: { fontSize: 10, fontWeight: '600', color: '#8e8e93', textTransform: 'uppercase', marginBottom: 2 },
  dayNameActive: { color: 'rgba(255,255,255,0.7)' },
  dayNum: { fontSize: 17, fontWeight: '700', color: '#2c2825' },
  dayNumActive: { color: 'white' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#c8853a', marginTop: 3 },
  dotActive: { backgroundColor: 'rgba(255,255,255,0.7)' },
  body: { padding: 16 },
  dayLabel: { fontWeight: '700', fontSize: 12, color: '#1a2e1a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#2c2825', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#8e8e93' },
  eventCard: { backgroundColor: 'white', borderRadius: 16, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  eventAccent: { width: 4 },
  eventContent: { flex: 1, padding: 16 },
  eventTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  eventTime: { fontSize: 12, fontWeight: '700' },
  activityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  activityBadgeText: { fontSize: 11, fontWeight: '600' },
  eventName: { fontSize: 15, fontWeight: '700', color: '#2c2825', marginBottom: 4 },
  eventLocation: { fontSize: 13, color: '#6b6560', marginBottom: 6 },
  eventDescription: { fontSize: 13, color: '#8e8e93', marginBottom: 10, lineHeight: 19 },
  eventBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  attendeeCount: { fontSize: 12, color: '#8e8e93' },
  rsvpBtn: { backgroundColor: '#3a5f3a', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 16, minWidth: 64, alignItems: 'center' },
  rsvpJoined: { backgroundColor: 'rgba(58,95,58,0.12)' },
  rsvpFull: { backgroundColor: '#f2f2f7' },
  rsvpText: { fontSize: 13, fontWeight: '700', color: 'white' },
  rsvpTextJoined: { color: '#3a5f3a' },
  rsvpTextFull: { color: '#8e8e93' },
  // Create modal
  modalContainer: { flex: 1, backgroundColor: '#faf8f4' },
  modalHeader: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea' },
  modalCancel: { fontSize: 16, color: '#6b6560' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#2c2825' },
  modalSaveBtn: { backgroundColor: '#3a5f3a', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 18 },
  modalSaveBtnDisabled: { opacity: 0.35 },
  modalSaveText: { color: 'white', fontWeight: '700', fontSize: 14 },
  modalScroll: { flex: 1 },
  modalBody: { padding: 20, gap: 4, paddingBottom: 40 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#2c2825', marginTop: 16, marginBottom: 6 },
  required: { color: '#c8853a' },
  optional: { fontWeight: '400', color: '#8e8e93' },
  input: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 14, fontSize: 15, color: '#2c2825', backgroundColor: 'white' },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  selectBtn: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white' },
  selectBtnFilled: { borderColor: '#3a5f3a', backgroundColor: 'rgba(58,95,58,0.06)' },
  selectBtnText: { fontSize: 15, color: '#8e8e93' },
  selectBtnTextFilled: { fontSize: 15, color: '#3a5f3a', fontWeight: '600' },
  clearX: { fontSize: 20, color: '#3a5f3a', paddingLeft: 8 },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, maxHeight: '75%' },
  pickerHandle: { width: 36, height: 4, backgroundColor: '#e5e5ea', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: '#2c2825', marginBottom: 12 },
  pickerOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f2f2f7' },
  pickerOptionSelected: { backgroundColor: 'rgba(58,95,58,0.05)', marginHorizontal: -24, paddingHorizontal: 24 },
  pickerEmoji: { fontSize: 22, marginRight: 12 },
  pickerOptionText: { flex: 1, fontSize: 16, color: '#2c2825', fontWeight: '500' },
  pickerOptionTextSelected: { color: '#3a5f3a', fontWeight: '700' },
  checkmark: { fontSize: 16, color: '#3a5f3a', fontWeight: '700' },
});

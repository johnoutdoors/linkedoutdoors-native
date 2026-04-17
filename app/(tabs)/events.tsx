import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState<string | null>(null);
  const days = get7Days();
  const [selectedDay, setSelectedDay] = useState(toDateString(days[0]));

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
      await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('event_rsvps')
        .insert({ event_id: event.id, user_id: user.id });
    }

    await fetchEvents();
    setRsvping(null);
  }

  const dayEvents = events.filter(e => e.event_date === selectedDay);
  const activityColor = (type: string | null) => {
    const found = ACTIVITIES.find(a => a.label === type);
    const colors: Record<string, string> = {
      'Fishing': '#c8853a', 'Hiking': '#3a5f3a', 'Kayaking': '#3a6a9a',
      'Camping': '#5c4a2e', 'Biking': '#6b4c3b', 'Hunting': '#4a5c2e',
    };
    return found ? (colors[found.label] ?? '#3a5f3a') : '#3a5f3a';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>Mid-Atlantic Outdoors</Text>

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
            <Text style={styles.emptySubtitle}>Check another day or pull to refresh.</Text>
          </View>
        ) : (
          dayEvents.map(event => {
            const rsvpCount = event.event_rsvps.length;
            const joined = event.event_rsvps.some(r => r.user_id === user?.id);
            const isFull = !!event.max_attendees && rsvpCount >= event.max_attendees;
            const isLoading = rsvping === event.id;
            const color = activityColor(event.activity_type);
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
                      onPress={() => !isFull || joined ? toggleRsvp(event) : null}
                      disabled={isLoading}
                      style={[styles.rsvpBtn, joined && styles.rsvpJoined, isFull && !joined && styles.rsvpFull]}
                    >
                      {isLoading
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: { backgroundColor: '#faf8f4', paddingTop: 60, paddingBottom: 12, paddingHorizontal: 20 },
  title: { fontWeight: '700', fontSize: 28, color: '#1a2e1a', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#6b6560', marginBottom: 14 },
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
});

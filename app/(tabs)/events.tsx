import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DAYS = ['Mon 3', 'Tue 4', 'Wed 5', 'Thu 6', 'Fri 7', 'Sat 8', 'Sun 9'];

const EVENTS = [
  { id: '1', time: '8:00 AM', name: 'Saturday Morning Hike — Gunpowder Falls', location: 'Gunpowder Falls State Park, MD', attendees: 8, spots: null, type: 'hike', joined: false },
  { id: '2', time: '5:30 AM', name: 'Dawn Patrol — Bay Fishing Meet-up', location: 'Sandy Point State Park, MD', attendees: 12, spots: null, type: 'fish', joined: true },
  { id: '3', time: '9:00 AM', name: 'Beginners Kayak Outing — Wye River', location: 'Wye Island NRMA, MD', attendees: 5, spots: 10, type: 'kayak', joined: false },
  { id: '4', time: '7:00 AM', name: 'Trail Cleanup Volunteer Day — NCR Trail', location: 'Northern Central Railroad Trail, MD', attendees: 19, spots: 20, type: 'hike', joined: false, full: true },
];

const TYPE_COLORS: Record<string, string> = {
  hike: '#3a5f3a',
  fish: '#c8853a',
  kayak: '#3a6a9a',
};

export default function EventsScreen() {
  const [activeDay, setActiveDay] = useState('Thu 6');
  const [events, setEvents] = useState(EVENTS);

  function toggleJoin(id: string) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, joined: !e.joined } : e));
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>Central Maryland & Eastern Shore</Text>

        {/* Date Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
          {DAYS.map(day => (
            <TouchableOpacity key={day} onPress={() => setActiveDay(day)} style={[styles.dateChip, activeDay === day && styles.dateChipActive]}>
              <Text style={[styles.dayName, activeDay === day && styles.dayNameActive]}>{day.split(' ')[0]}</Text>
              <Text style={[styles.dayNum, activeDay === day && styles.dayNumActive]}>{day.split(' ')[1]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events */}
      <View style={styles.body}>
        <Text style={styles.dayLabel}>This Saturday</Text>
        {events.map(event => (
          <View key={event.id} style={styles.eventCard}>
            <View style={[styles.eventAccent, { backgroundColor: TYPE_COLORS[event.type] }]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventTime}>{event.time}</Text>
              <Text style={styles.eventName}>{event.name}</Text>
              <Text style={styles.eventLocation}>📍 {event.location}</Text>
              <View style={styles.eventBottom}>
                <Text style={styles.attendeeCount}>👥 {event.attendees}{event.spots ? `/${event.spots}` : ''} going</Text>
                <TouchableOpacity
                  onPress={() => !event.full && toggleJoin(event.id)}
                  style={[
                    styles.rsvpBtn,
                    event.joined && styles.rsvpJoined,
                    event.full && styles.rsvpFull,
                  ]}
                >
                  <Text style={[styles.rsvpText, event.joined && styles.rsvpTextJoined, event.full && styles.rsvpTextFull]}>
                    {event.full ? 'Waitlist' : event.joined ? 'Joined ✓' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
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
  dateChip: { width: 52, alignItems: 'center', paddingVertical: 8, borderRadius: 12 },
  dateChipActive: { backgroundColor: '#3a5f3a' },
  dayName: { fontSize: 10, fontWeight: '600', color: '#8e8e93', textTransform: 'uppercase', marginBottom: 2 },
  dayNameActive: { color: 'rgba(255,255,255,0.7)' },
  dayNum: { fontSize: 17, fontWeight: '700', color: '#2c2825' },
  dayNumActive: { color: 'white' },
  body: { padding: 16 },
  dayLabel: { fontWeight: '700', fontSize: 12, color: '#1a2e1a', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  eventCard: { backgroundColor: 'white', borderRadius: 16, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  eventAccent: { width: 4 },
  eventContent: { flex: 1, padding: 16 },
  eventTime: { fontSize: 12, fontWeight: '700', color: '#c8853a', marginBottom: 4 },
  eventName: { fontSize: 15, fontWeight: '700', color: '#2c2825', marginBottom: 4 },
  eventLocation: { fontSize: 13, color: '#6b6560', marginBottom: 12 },
  eventBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendeeCount: { fontSize: 12, color: '#8e8e93' },
  rsvpBtn: { backgroundColor: '#3a5f3a', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  rsvpJoined: { backgroundColor: 'rgba(58,95,58,0.12)' },
  rsvpFull: { backgroundColor: '#f2f2f7' },
  rsvpText: { fontSize: 13, fontWeight: '700', color: 'white' },
  rsvpTextJoined: { color: '#3a5f3a' },
  rsvpTextFull: { color: '#8e8e93' },
});
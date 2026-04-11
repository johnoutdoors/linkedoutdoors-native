import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const REGIONS = [
  { name: 'Chesapeake Bay', count: '1,247 posts', emoji: '🌊', color: '#2d5a3a' },
  { name: 'Appalachian Trail', count: '892 posts', emoji: '⛰️', color: '#5c4a2e' },
  { name: 'Delaware Coast', count: '634 posts', emoji: '🏖️', color: '#2a4a6a' },
  { name: 'Shenandoah Valley', count: '412 posts', emoji: '🌄', color: '#3a5f3a' },
];

const ACTIVITIES = [
  { name: 'Fishing', count: '3.2k posts', emoji: '🎣' },
  { name: 'Hiking', count: '2.8k posts', emoji: '🥾' },
  { name: 'Kayaking', count: '1.4k posts', emoji: '🛶' },
  { name: 'Mtn Biking', count: '980 posts', emoji: '🚴' },
];

const TRENDING = [
  { title: 'Spring Rockfish Run — Chesapeake Bay', meta: '142 posts this week · Bay Fishing' },
  { title: 'Trail Conditions After March Storms', meta: '98 posts this week · Hiking' },
  { title: 'Early Season Trout — DE/PA Streams', meta: '76 posts this week · Stream Fishing' },
  { title: 'Assateague Island Spring Camping', meta: '64 posts this week · Camping' },
];

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search locations, activities, people...</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Regions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Regions</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionRow}>
          {REGIONS.map(region => (
            <TouchableOpacity key={region.name} style={[styles.regionCard, { backgroundColor: region.color }]}>
              <Text style={styles.regionEmoji}>{region.emoji}</Text>
              <Text style={styles.regionName}>{region.name}</Text>
              <Text style={styles.regionCount}>{region.count}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Activities */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Activities</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>
        <View style={styles.activityGrid}>
          {ACTIVITIES.map(activity => (
            <TouchableOpacity key={activity.name} style={styles.activityItem}>
              <Text style={styles.activityEmoji}>{activity.emoji}</Text>
              <View>
                <Text style={styles.activityName}>{activity.name}</Text>
                <Text style={styles.activityCount}>{activity.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending */}
        <Text style={styles.sectionTitle}>Trending Now</Text>
        <View style={styles.trendingList}>
          {TRENDING.map((item, i) => (
            <TouchableOpacity key={item.title} style={styles.trendingItem}>
              <Text style={styles.trendingNum}>{i + 1}</Text>
              <View style={styles.trendingInfo}>
                <Text style={styles.trendingTitle}>{item.title}</Text>
                <Text style={styles.trendingMeta}>{item.meta}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: { backgroundColor: '#faf8f4', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontWeight: '700', fontSize: 28, color: '#1a2e1a', marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f2f2f7', borderRadius: 12, padding: 12, marginBottom: 4 },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { fontSize: 14, color: '#8e8e93' },
  body: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontWeight: '700', fontSize: 15, color: '#1a2e1a' },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#c8853a' },
  regionRow: { gap: 10, paddingBottom: 4, marginBottom: 24 },
  regionCard: { width: 185, height: 100, borderRadius: 14, padding: 12, justifyContent: 'flex-end' },
  regionEmoji: { position: 'absolute', bottom: 8, right: 10, fontSize: 18, opacity: 0.5 },
  regionName: { fontWeight: '700', fontSize: 14, color: 'white', lineHeight: 18 },
  regionCount: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  activityItem: { width: '45%', backgroundColor: 'white', borderRadius: 12, paddingVertical: 10, paddingLeft: 10, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, overflow: 'hidden' },
  activityEmoji: { fontSize: 28 },
  activityName: { fontWeight: '600', fontSize: 11, color: '#2c2825' },
  activityCount: { fontSize: 11, color: '#8e8e93' },
  trendingList: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  trendingItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea' },
  trendingNum: { fontWeight: '700', fontSize: 18, color: '#c8853a', width: 24, textAlign: 'center' },
  trendingInfo: { flex: 1 },
  trendingTitle: { fontWeight: '600', fontSize: 13, color: '#2c2825' },
  trendingMeta: { fontSize: 11, color: '#8e8e93', marginTop: 2 },
});
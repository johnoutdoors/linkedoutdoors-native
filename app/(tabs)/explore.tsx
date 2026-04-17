import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { ACTIVITIES } from '../../constants/activities';

const REGION_COLORS = ['#2d5a3a', '#2a4a6a', '#5c4a2e', '#3a5f3a', '#6b4c3b', '#1a3a5a'];
const REGION_EMOJIS: Record<string, string> = {
  'Maryland': '🦀',
  'Virginia': '🌄',
  'Delaware': '🏖️',
  'Pennsylvania': '⛰️',
  'West Virginia': '🌲',
};

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

type ActivityCount = { label: string; emoji: string; count: number };
type RegionCount = { name: string; count: number; color: string; emoji: string };
type TrendingItem = { tag: string; emoji: string; count: number };

export default function ExploreScreen() {
  const [activityCounts, setActivityCounts] = useState<ActivityCount[]>([]);
  const [regionCounts, setRegionCounts] = useState<RegionCount[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('activity_tag, location, created_at');

    if (!data) { setLoading(false); return; }

    // Activity counts (all time)
    const actMap: Record<string, number> = {};
    data.forEach(p => {
      if (p.activity_tag) actMap[p.activity_tag] = (actMap[p.activity_tag] ?? 0) + 1;
    });
    const acts = ACTIVITIES
      .map(a => ({ label: a.label, emoji: a.emoji, count: actMap[a.label] ?? 0 }))
      .sort((a, b) => b.count - a.count);
    setActivityCounts(acts);

    // Region counts — extract state from "Region, State" or just "State"
    const regionMap: Record<string, number> = {};
    data.forEach(p => {
      if (!p.location) return;
      const parts = p.location.split(', ');
      const state = parts[parts.length - 1];
      regionMap[state] = (regionMap[state] ?? 0) + 1;
    });
    const regions = Object.entries(regionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count], i) => ({
        name,
        count,
        color: REGION_COLORS[i % REGION_COLORS.length],
        emoji: REGION_EMOJIS[name] ?? '🌲',
      }));
    setRegionCounts(regions);

    // Trending — last 7 days by activity
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const trendMap: Record<string, number> = {};
    data.forEach(p => {
      if (p.activity_tag && p.created_at >= weekAgo) {
        trendMap[p.activity_tag] = (trendMap[p.activity_tag] ?? 0) + 1;
      }
    });
    // Fall back to all-time if nothing in the last 7 days
    const source = Object.keys(trendMap).length > 0 ? trendMap : actMap;
    const trend = Object.entries(source)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({
        tag,
        count,
        emoji: ACTIVITIES.find(a => a.label === tag)?.emoji ?? '🌿',
      }));
    setTrending(trend);

    setLoading(false);
  }

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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#3a5f3a" size="large" />
        </View>
      ) : (
        <View style={styles.body}>

          {/* Regions */}
          {regionCounts.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Regions</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionRow}>
                {regionCounts.map(region => (
                  <TouchableOpacity key={region.name} style={[styles.regionCard, { backgroundColor: region.color }]}>
                    <Text style={styles.regionEmoji}>{region.emoji}</Text>
                    <Text style={styles.regionName}>{region.name}</Text>
                    <Text style={styles.regionCount}>{formatCount(region.count)} {region.count === 1 ? 'post' : 'posts'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Activities */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activities</Text>
          </View>
          <View style={styles.activityGrid}>
            {activityCounts.map(activity => (
              <TouchableOpacity key={activity.label} style={styles.activityItem}>
                <Text style={styles.activityEmoji}>{activity.emoji}</Text>
                <View>
                  <Text style={styles.activityName}>{activity.label}</Text>
                  <Text style={styles.activityCount}>{formatCount(activity.count)} {activity.count === 1 ? 'post' : 'posts'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trending */}
          {trending.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Trending This Week</Text>
              <View style={styles.trendingList}>
                {trending.map((item, i) => (
                  <TouchableOpacity key={item.tag} style={styles.trendingItem}>
                    <Text style={styles.trendingNum}>{i + 1}</Text>
                    <Text style={styles.trendingEmoji}>{item.emoji}</Text>
                    <View style={styles.trendingInfo}>
                      <Text style={styles.trendingTitle}>{item.tag}</Text>
                      <Text style={styles.trendingMeta}>{formatCount(item.count)} {item.count === 1 ? 'post' : 'posts'} this week</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

        </View>
      )}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  body: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontWeight: '700', fontSize: 15, color: '#1a2e1a', marginBottom: 12 },
  regionRow: { gap: 10, paddingBottom: 4, marginBottom: 24 },
  regionCard: { width: 160, height: 90, borderRadius: 14, padding: 12, justifyContent: 'flex-end' },
  regionEmoji: { position: 'absolute', top: 10, right: 12, fontSize: 24 },
  regionName: { fontWeight: '700', fontSize: 14, color: 'white', lineHeight: 18 },
  regionCount: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  activityItem: { width: '47%', backgroundColor: 'white', borderRadius: 12, paddingVertical: 10, paddingLeft: 10, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  activityEmoji: { fontSize: 28 },
  activityName: { fontWeight: '600', fontSize: 13, color: '#2c2825' },
  activityCount: { fontSize: 11, color: '#8e8e93' },
  trendingList: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, marginBottom: 24 },
  trendingItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea' },
  trendingNum: { fontWeight: '700', fontSize: 18, color: '#c8853a', width: 24, textAlign: 'center' },
  trendingEmoji: { fontSize: 22 },
  trendingInfo: { flex: 1 },
  trendingTitle: { fontWeight: '600', fontSize: 14, color: '#2c2825' },
  trendingMeta: { fontSize: 11, color: '#8e8e93', marginTop: 2 },
});

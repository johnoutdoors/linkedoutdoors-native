import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateScreen() {
  const [postText, setPostText] = useState('');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity style={styles.postBtn}>
          <Text style={styles.postBtnText}>Post</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* User Row */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View>
            <Text style={styles.userName}>John D.</Text>
            <Text style={styles.userRegion}>Central MD · Pathfinder</Text>
          </View>
        </View>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder="What's happening out there? Share conditions, trip reports, questions..."
          placeholderTextColor="#8e8e93"
          multiline
          value={postText}
          onChangeText={setPostText}
        />

        {/* Tags */}
        <View style={styles.tags}>
          <TouchableOpacity style={styles.tagLocation}>
            <Text style={styles.tagText}>📍 Add Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tagActivity}>
            <Text style={styles.tagTextAmber}>🎯 Add Activity</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Strip */}
        <View style={styles.photoStrip}>
          <View style={styles.photoPlaceholder1}>
            <Text style={styles.photoEmoji}>🌅</Text>
            <TouchableOpacity style={styles.removePhoto}>
              <Text style={styles.removePhotoText}>✕</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addPhoto}>
            <Text style={styles.addPhotoIcon}>📷</Text>
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolItem}>
            <Text style={styles.toolEmoji}>📷</Text>
            <Text style={styles.toolLabel}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolItem}>
            <Text style={styles.toolEmoji}>📍</Text>
            <Text style={styles.toolLabel}>Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolItem}>
            <Text style={styles.toolEmoji}>🎯</Text>
            <Text style={styles.toolLabel}>Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolItem}>
            <Text style={styles.toolEmoji}>🎒</Text>
            <Text style={styles.toolLabel}>Gear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f4' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#e5e5ea' },
  cancel: { fontSize: 16, color: '#6b6560' },
  title: { fontSize: 16, fontWeight: '700', color: '#2c2825' },
  postBtn: { backgroundColor: '#3a5f3a', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 18 },
  postBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  body: { padding: 20 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#3a5f3a', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: '700', fontSize: 13 },
  userName: { fontWeight: '600', fontSize: 15, color: '#2c2825' },
  userRegion: { fontSize: 12, color: '#6b6560' },
  textInput: { fontSize: 16, lineHeight: 26, color: '#2c2825', minHeight: 120, marginBottom: 20, textAlignVertical: 'top' },
  tags: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tagLocation: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(58,95,58,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagActivity: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(200,133,58,0.12)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagText: { fontSize: 13, fontWeight: '600', color: '#3a5f3a' },
  tagTextAmber: { fontSize: 13, fontWeight: '600', color: '#c8853a' },
  photoStrip: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  photoPlaceholder1: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#5a8a5a', alignItems: 'center', justifyContent: 'center' },
  photoEmoji: { fontSize: 32 },
  addPhoto: { width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderColor: '#e5e5ea', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
 addPhotoText: { fontSize: 11, color: '#8e8e93', fontWeight: '500', textAlign: 'center' },
  removePhoto: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  removePhotoText: { color: 'white', fontSize: 10, fontWeight: '700' },
addPhotoIcon: { fontSize: 22, marginBottom: 2, marginTop: -8 },
  toolbar: { flexDirection: 'row', gap: 24, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: '#e5e5ea' },
  toolItem: { alignItems: 'center', gap: 4 },
  toolEmoji: { fontSize: 22 },
  toolLabel: { fontSize: 11, color: '#6b6560', fontWeight: '500' },
});
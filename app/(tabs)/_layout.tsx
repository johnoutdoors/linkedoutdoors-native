import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#3a5f3a',
      tabBarInactiveTintColor: '#8e8e93',
      tabBarStyle: {
        height: 84,
        paddingTop: 8,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopColor: 'rgba(0,0,0,0.1)',
        borderTopWidth: 0.5,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
      },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Feed',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
      }} />
      <Tabs.Screen name="explore" options={{
        title: 'Explore',
        tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
      }} />
      <Tabs.Screen name="create" options={{
        title: 'Post',
        tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
      }} />
      <Tabs.Screen name="events" options={{
        title: 'Events',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
import { StyleSheet, Text, View } from 'react-native';

export default function CreateScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Events — Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, color: '#6b6560', fontWeight: '600' },
});
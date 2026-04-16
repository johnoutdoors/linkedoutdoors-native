import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { LOCATIONS, STATES, formatLocation } from '../constants/locations';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

type LocationStep = 'state' | 'region';

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [fullName, setFullName] = useState('');
  const [showRealName, setShowRealName] = useState(false);
  const [locationState, setLocationState] = useState<string | null>(null);
  const [locationRegion, setLocationRegion] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationStep, setLocationStep] = useState<LocationStep>('state');
  const [pendingState, setPendingState] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const locationLabel = formatLocation(locationState, locationRegion);
  const canContinue = usernameStatus === 'available' && !!locationState && !isSaving;

  // Debounced username check
  useEffect(() => {
    if (!username) { setUsernameStatus('idle'); return; }
    if (!USERNAME_REGEX.test(username)) { setUsernameStatus('invalid'); return; }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user!.id)
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  function handleUsernameChange(text: string) {
    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
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
    setLocationState(pendingState);
    setLocationRegion(region);
    setShowLocationPicker(false);
  }

  async function handleContinue() {
    if (!canContinue) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({
      username,
      full_name: fullName.trim() || null,
      show_real_name: showRealName,
      location_state: locationState,
      location_region: locationRegion,
    }).eq('id', user!.id);

    if (error) {
      setIsSaving(false);
      return;
    }
    await refreshProfile();
    // _layout.tsx will redirect to /(tabs) once profile.username is set
  }

  function getUsernameIndicator() {
    switch (usernameStatus) {
      case 'checking': return <ActivityIndicator size="small" color="#8e8e93" />;
      case 'available': return <Text style={styles.statusAvailable}>✓ Available</Text>;
      case 'taken': return <Text style={styles.statusTaken}>✗ Already taken</Text>;
      case 'invalid': return <Text style={styles.statusInvalid}>3–20 chars, letters, numbers, underscores only</Text>;
      default: return null;
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>🌲</Text>
          </View>
          <Text style={styles.logo}>Linked<Text style={styles.logoAccent}>Outdoors</Text></Text>
          <Text style={styles.subtitle}>Let's set up your profile</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {/* Username */}
          <Text style={styles.label}>Username <Text style={styles.required}>*</Text></Text>
          <Text style={styles.hint}>This is how you'll appear to other members.</Text>
          <View style={styles.usernameRow}>
            <View style={styles.atSign}>
              <Text style={styles.atText}>@</Text>
            </View>
            <TextInput
              style={styles.usernameInput}
              placeholder="yourhandle"
              placeholderTextColor="#8e8e93"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
          </View>
          <View style={styles.statusRow}>{getUsernameIndicator()}</View>

          <View style={styles.divider} />

          {/* Home Region */}
          <Text style={styles.label}>Home Region <Text style={styles.required}>*</Text></Text>
          <Text style={styles.hint}>Where do you spend most of your time outdoors?</Text>
          <TouchableOpacity
            style={[styles.regionBtn, locationState && styles.regionBtnFilled]}
            onPress={openLocationPicker}
          >
            <Text style={[styles.regionBtnText, locationState && styles.regionBtnTextFilled]}>
              {locationLabel ?? '📍 Select your region'}
            </Text>
            {locationState && (
              <TouchableOpacity onPress={() => { setLocationState(null); setLocationRegion(null); }}>
                <Text style={styles.regionClear}>×</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Real Name (optional) */}
          <View style={styles.realNameHeader}>
            <View>
              <Text style={styles.label}>Real Name <Text style={styles.optional}>(optional)</Text></Text>
              <Text style={styles.hint}>Shown on your profile if you choose.</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, showRealName && styles.toggleOn]}
              onPress={() => setShowRealName(!showRealName)}
            >
              <View style={[styles.toggleThumb, showRealName && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>
          {showRealName && (
            <TextInput
              style={styles.input}
              placeholder="First name + last initial (e.g. John N.)"
              placeholderTextColor="#8e8e93"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          {isSaving
            ? <ActivityIndicator color="white" />
            : <Text style={styles.continueBtnText}>Get Started</Text>
          }
        </TouchableOpacity>

        <Text style={styles.footer}>You can update your profile anytime from the Profile tab.</Text>

      </ScrollView>

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
                <Text style={styles.modalTitle}>
                  Select Region <Text style={styles.modalOptional}>(optional)</Text>
                </Text>
                <TouchableOpacity style={styles.modalOption} onPress={() => selectRegion(null)}>
                  <Text style={styles.modalOptionText}>No specific region</Text>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2e1a' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 80 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(58,95,58,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(164,184,144,0.3)' },
  logoIconText: { fontSize: 28 },
  logo: { fontSize: 24, fontWeight: '900', color: '#faf8f4', marginBottom: 4 },
  logoAccent: { color: '#e0a85c' },
  subtitle: { fontSize: 14, color: '#a4b890' },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#2c2825', marginBottom: 2 },
  hint: { fontSize: 12, color: '#8e8e93', marginBottom: 10 },
  required: { color: '#c8853a' },
  optional: { fontWeight: '400', color: '#8e8e93' },
  usernameRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, backgroundColor: '#faf8f4', overflow: 'hidden' },
  atSign: { paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#f2f2f7', borderRightWidth: 1, borderRightColor: '#e5e5ea' },
  atText: { fontSize: 16, fontWeight: '700', color: '#3a5f3a' },
  usernameInput: { flex: 1, fontSize: 16, color: '#2c2825', paddingHorizontal: 12, paddingVertical: 14 },
  statusRow: { height: 20, marginTop: 6, marginBottom: 4 },
  statusAvailable: { fontSize: 12, color: '#3a5f3a', fontWeight: '600' },
  statusTaken: { fontSize: 12, color: '#c0392b', fontWeight: '600' },
  statusInvalid: { fontSize: 12, color: '#8e8e93' },
  divider: { height: 0.5, backgroundColor: '#e5e5ea', marginVertical: 20 },
  regionBtn: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#faf8f4' },
  regionBtnFilled: { borderColor: '#3a5f3a', backgroundColor: 'rgba(58,95,58,0.06)' },
  regionBtnText: { fontSize: 15, color: '#8e8e93' },
  regionBtnTextFilled: { color: '#3a5f3a', fontWeight: '600' },
  regionClear: { fontSize: 20, color: '#3a5f3a', paddingLeft: 8 },
  realNameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#e5e5ea', padding: 2, justifyContent: 'center', marginTop: 2 },
  toggleOn: { backgroundColor: '#3a5f3a' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  toggleThumbOn: { alignSelf: 'flex-end' },
  input: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 14, fontSize: 15, color: '#2c2825', backgroundColor: '#faf8f4', marginTop: 12 },
  continueBtn: { backgroundColor: '#c8853a', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 12, color: 'rgba(164,184,144,0.5)', lineHeight: 18 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44, maxHeight: '75%' },
  modalHandle: { width: 36, height: 4, backgroundColor: '#e5e5ea', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalBack: { marginBottom: 8 },
  modalBackText: { fontSize: 15, color: '#3a5f3a', fontWeight: '600' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#2c2825', marginBottom: 12 },
  modalOptional: { fontSize: 13, fontWeight: '400', color: '#8e8e93' },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#f2f2f7' },
  modalOptionSelected: { backgroundColor: 'rgba(58,95,58,0.05)', marginHorizontal: -24, paddingHorizontal: 24 },
  modalOptionText: { flex: 1, fontSize: 16, color: '#2c2825', fontWeight: '500' },
  modalOptionTextSelected: { color: '#3a5f3a', fontWeight: '700' },
  modalChevron: { fontSize: 20, color: '#c0c0c0' },
  checkmark: { fontSize: 16, color: '#3a5f3a', fontWeight: '700' },
});

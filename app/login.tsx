import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
      // Navigation is handled automatically by the auth guard in _layout.tsx
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Background decoration */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>🌲</Text>
          </View>
          <Text style={styles.logo}>Linked<Text style={styles.logoAccent}>Outdoors</Text></Text>
          <Text style={styles.tagline}>All the community. None of the noise.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isLogin ? 'Welcome back' : 'Join the community'}</Text>
          <Text style={styles.cardSubtitle}>{isLogin ? 'Sign in to your account' : 'Create your free account'}</Text>

          {/* Social Buttons */}
          <TouchableOpacity style={styles.socialBtn}>
            <Text style={styles.socialBtnIcon}>🍎</Text>
            <Text style={styles.socialBtnText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.socialBtn, styles.socialBtnGoogle]}>
            <Text style={styles.socialBtnIcon}>G</Text>
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#8e8e93"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#8e8e93"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />
          </View>

          {isLogin && (
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color="white" />
              : <Text style={styles.submitBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
            }
          </TouchableOpacity>

          {/* Toggle */}
          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setError(''); }} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>By continuing you agree to our Terms of Service and Privacy Policy</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2e1a' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 80 },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(58,95,58,0.3)', top: -50, right: -80 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(200,133,58,0.1)', bottom: 100, left: -60 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(58,95,58,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(164,184,144,0.3)' },
  logoIconText: { fontSize: 28 },
  logo: { fontSize: 24, fontWeight: '900', color: '#faf8f4', marginBottom: 6 },
  logoAccent: { color: '#e0a85c' },
  tagline: { fontSize: 13, color: '#a4b890', opacity: 0.7 },
  card: { backgroundColor: 'white', borderRadius: 24, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#2c2825', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#8e8e93', marginBottom: 24 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 14, padding: 14, marginBottom: 10 },
  socialBtnGoogle: { backgroundColor: '#f8f8f8' },
  socialBtnIcon: { fontSize: 16, fontWeight: '700', color: '#2c2825' },
  socialBtnText: { fontSize: 15, fontWeight: '600', color: '#2c2825' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: '#e5e5ea' },
  dividerText: { fontSize: 13, color: '#8e8e93' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#2c2825', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, padding: 14, fontSize: 15, color: '#2c2825', backgroundColor: '#faf8f4' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -6 },
  forgotPasswordText: { fontSize: 13, color: '#c8853a', fontWeight: '600' },
  errorText: { fontSize: 13, color: '#c0392b', marginBottom: 12, textAlign: 'center' },
  submitBtn: { backgroundColor: '#3a5f3a', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 16 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  toggle: { alignItems: 'center' },
  toggleText: { fontSize: 14, color: '#6b6560' },
  toggleLink: { color: '#3a5f3a', fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 11, color: 'rgba(164,184,144,0.4)', lineHeight: 16 },
});

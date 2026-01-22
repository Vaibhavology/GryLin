import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ScanLine, FolderOpen, Bell, Shield, Sparkles, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useAlertStore } from '../../stores/alertStore';
import { validateEmail, validatePassword } from '../../lib/validation';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();
  const { showAlert } = useAlertStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    const newErrors: { email?: string; password?: string } = {};
    
    if (!validateEmail(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 4 characters';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      showAlert(error?.message || 'Sign in failed', 'error');
    }
  };

  const fillDemo = () => {
    setEmail('test@gmail.com');
    setPassword('9900');
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>G</Text>
            </View>
            <View style={styles.logoBadge}>
              <Sparkles size={12} color="#FFF" fill="#FFF" />
            </View>
          </View>
          <Text style={styles.appName}>GryLin</Text>
          <Text style={styles.tagline}>Your AI Life Operating System</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#E8F0FE' }]}>
                <ScanLine size={18} color="#1A73E8" strokeWidth={2} />
              </View>
              <Text style={styles.featureText}>AI Scanner</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#E6F4EA' }]}>
                <FolderOpen size={18} color="#34A853" strokeWidth={2} />
              </View>
              <Text style={styles.featureText}>Smart Vault</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#FEF7E0' }]}>
                <Bell size={18} color="#EA8600" strokeWidth={2} />
              </View>
              <Text style={styles.featureText}>Alerts</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: '#F3E8FD' }]}>
                <Shield size={18} color="#A142F4" strokeWidth={2} />
              </View>
              <Text style={styles.featureText}>Scam Shield</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={[
            styles.inputContainer, 
            focusedInput === 'email' && styles.inputFocused,
            errors.email && styles.inputError
          ]}>
            <Mail size={20} color={focusedInput === 'email' ? '#1A73E8' : '#80868B'} strokeWidth={2} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#80868B"
              value={email}
              onChangeText={(text) => { setEmail(text); setErrors(e => ({ ...e, email: undefined })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View style={[
            styles.inputContainer,
            focusedInput === 'password' && styles.inputFocused,
            errors.password && styles.inputError
          ]}>
            <Lock size={20} color={focusedInput === 'password' ? '#1A73E8' : '#80868B'} strokeWidth={2} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#80868B"
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors(e => ({ ...e, password: undefined })); }}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
              {showPassword ? (
                <EyeOff size={20} color="#80868B" strokeWidth={2} />
              ) : (
                <Eye size={20} color="#80868B" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity
            style={[styles.signInBtn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.signInText}>Sign in</Text>
                <ArrowRight size={20} color="#FFF" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Demo */}
        <View style={styles.demoSection}>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Demo Account</Text>
            <View style={styles.divider} />
          </View>
          <TouchableOpacity style={styles.demoBtn} onPress={fillDemo} activeOpacity={0.7}>
            <Text style={styles.demoBtnText}>Use test@gmail.com / 9900</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>By signing in, you agree to our Terms of Service</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '600',
    color: '#FFF',
  },
  logoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#A142F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F8F9FA',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#202124',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#5F6368',
    marginTop: 6,
  },
  featuresCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5F6368',
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#1A73E8',
    backgroundColor: '#FFF',
  },
  inputError: {
    borderColor: '#EA4335',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#202124',
  },
  errorText: {
    fontSize: 12,
    color: '#EA4335',
    marginLeft: 4,
    marginTop: -8,
  },
  signInBtn: {
    flexDirection: 'row',
    backgroundColor: '#1A73E8',
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  signInText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  demoSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8EAED',
  },
  dividerText: {
    fontSize: 12,
    color: '#80868B',
    marginHorizontal: 16,
  },
  demoBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A73E8',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#80868B',
    marginTop: 32,
  },
});

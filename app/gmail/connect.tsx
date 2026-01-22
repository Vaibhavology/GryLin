import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Shield, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useGmailStore } from '../../stores/gmailStore';
import { useAlertStore } from '../../stores/alertStore';
import { authenticateWithGoogle, isGmailOAuthAvailable, getGmailAvailabilityMessage } from '../../lib/gmail';
import { AccountType } from '../../types';
import { Colors, Spacing, Radius, Font, Shadow } from '../../constants/theme';

export default function GmailConnectScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addAccount, accounts } = useGmailStore();
  const { showAlert } = useAlertStore();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedType, setSelectedType] = useState<AccountType>('personal');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userId = user?.id || '';
  const canAddMore = accounts.length < 3;
  
  // Check if Gmail OAuth is available (not in Expo Go)
  const gmailAvailable = isGmailOAuthAvailable();
  const availabilityMessage = getGmailAvailabilityMessage();

  const accountTypes: { type: AccountType; label: string; description: string }[] = [
    { type: 'personal', label: 'Personal', description: 'Your personal Gmail account' },
    { type: 'work', label: 'Work', description: 'Your work or company email' },
    { type: 'business', label: 'Business', description: 'Your business Gmail account' },
  ];

  const handleConnect = async () => {
    if (!userId) {
      showAlert('Please sign in first', 'error');
      return;
    }
    if (!canAddMore) {
      showAlert('Maximum 3 accounts allowed', 'warning');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('idle');
    setErrorMessage(null);

    try {
      const authResult = await authenticateWithGoogle();
      await addAccount(userId, authResult, selectedType);
      setConnectionStatus('success');
      showAlert('Gmail account connected successfully!', 'success');
      setTimeout(() => router.back(), 1500);
    } catch (error) {
      setConnectionStatus('error');
      const message = error instanceof Error ? error.message : 'Failed to connect Gmail';
      setErrorMessage(message);
      
      // Show more detailed error for redirect URI issues
      if (message.includes('redirect_uri') || message.includes('Redirect URI')) {
        showAlert('OAuth setup required. Check console for instructions.', 'error');
      } else {
        showAlert(message, 'error');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Gmail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Expo Go Warning Banner */}
        {!gmailAvailable && (
          <View style={styles.warningBanner}>
            <AlertTriangle size={24} color={Colors.orange} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Development Build Required</Text>
              <Text style={styles.warningText}>
                Gmail connection is not available in Expo Go due to Google OAuth restrictions.
              </Text>
              <Text style={styles.warningInstructions}>
                To test Gmail integration:{'\n'}
                • Run: npx expo prebuild{'\n'}
                • Then: npx expo run:android{'\n'}
                {'\n'}
                Or create an EAS build:{'\n'}
                • eas build --profile development
              </Text>
            </View>
          </View>
        )}

        <View style={styles.iconSection}>
          <View style={styles.gmailIcon}>
            <Mail size={40} color="#EA4335" />
          </View>
          <Text style={styles.title}>Link Your Gmail</Text>
          <Text style={styles.subtitle}>
            GryLin will automatically extract bills, receipts, and important documents from your emails.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Type</Text>
          {accountTypes.map((item) => (
            <TouchableOpacity
              key={item.type}
              onPress={() => setSelectedType(item.type)}
              style={[
                styles.typeOption,
                selectedType === item.type && styles.typeOptionSelected,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.typeContent}>
                <Text style={styles.typeLabel}>{item.label}</Text>
                <Text style={styles.typeDescription}>{item.description}</Text>
              </View>
              {selectedType === item.type && (
                <CheckCircle size={24} color={Colors.blue} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.privacyCard}>
          <Shield size={24} color={Colors.green} />
          <View style={styles.privacyContent}>
            <Text style={styles.privacyTitle}>Your Privacy is Protected</Text>
            <Text style={styles.privacyText}>
              We only read transactional emails (bills, receipts). Personal messages are never accessed.
            </Text>
          </View>
        </View>

        {connectionStatus === 'success' && (
          <View style={styles.successCard}>
            <CheckCircle size={24} color={Colors.green} />
            <Text style={styles.successText}>Successfully connected! Redirecting...</Text>
          </View>
        )}

        {connectionStatus === 'error' && errorMessage && (
          <View style={styles.errorCard}>
            <AlertCircle size={24} color={Colors.red} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleConnect}
          disabled={isConnecting || !canAddMore || connectionStatus === 'success' || !gmailAvailable}
          style={[
            styles.connectButton,
            (!canAddMore || connectionStatus === 'success' || !gmailAvailable) && styles.connectButtonDisabled,
          ]}
          activeOpacity={0.8}
        >
          {isConnecting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Mail size={20} color={Colors.white} />
              <Text style={styles.connectButtonText}>
                {!gmailAvailable 
                  ? 'Requires Development Build' 
                  : canAddMore 
                    ? 'Connect with Google' 
                    : 'Maximum accounts reached'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.accountCount}>{accounts.length}/3 accounts connected</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Font.lg,
    fontWeight: Font.medium,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  warningContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  warningTitle: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: '#E65100',
    marginBottom: Spacing.xs,
  },
  warningText: {
    fontSize: Font.sm,
    color: '#E65100',
    marginBottom: Spacing.sm,
  },
  warningInstructions: {
    fontSize: Font.xs,
    color: '#BF360C',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  gmailIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Font.xxl,
    fontWeight: Font.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Font.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  typeOptionSelected: {
    borderColor: Colors.blue,
    backgroundColor: Colors.blueLight,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
  },
  typeDescription: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.greenLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xxl,
  },
  privacyContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  privacyTitle: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.green,
    marginBottom: Spacing.xs,
  },
  privacyText: {
    fontSize: Font.sm,
    color: Colors.green,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  successText: {
    marginLeft: Spacing.md,
    fontSize: Font.md,
    color: Colors.green,
    fontWeight: Font.medium,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.redLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    marginLeft: Spacing.md,
    fontSize: Font.md,
    color: Colors.red,
    flex: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA4335',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    ...Shadow.md,
  },
  connectButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.7,
  },
  connectButtonText: {
    marginLeft: Spacing.sm,
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.white,
  },
  accountCount: {
    fontSize: Font.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});

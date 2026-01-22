import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Mail, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useGmailStore, SyncStatus } from '../../stores/gmailStore';
import { useAlertStore } from '../../stores/alertStore';
import { GmailAccountCard } from '../../components/GmailAccountCard';
import { Colors, Spacing, Radius, Font, Shadow } from '../../constants/theme';

export default function GmailAccountsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    accounts, fetchAccounts, removeAccount, syncEmails, syncAllAccounts,
    isSyncing, isLoading, getAccountStatus,
  } = useGmailStore();
  const { showAlert } = useAlertStore();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

  const userId = user?.id || '';
  const canAddMore = accounts.length < 3;

  const loadAccounts = useCallback(async () => {
    if (!userId) return;
    try {
      await fetchAccounts(userId);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  }, [userId, fetchAccounts]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAccounts();
    setIsRefreshing(false);
  }, [loadAccounts]);

  const handleSync = async (accountId: string) => {
    setSyncingAccountId(accountId);
    try {
      await syncEmails(accountId);
      showAlert('Emails synced successfully!', 'success');
    } catch (error) {
      showAlert('Failed to sync emails', 'error');
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      await syncAllAccounts();
      showAlert('All accounts synced!', 'success');
    } catch (error) {
      showAlert('Failed to sync some accounts', 'error');
    }
  };

  const handleRemove = (accountId: string, email: string) => {
    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove ${email}? Items extracted from this account will remain.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeAccount(accountId);
              showAlert('Account removed', 'success');
            } catch (error) {
              showAlert('Failed to remove account', 'error');
            }
          },
        },
      ]
    );
  };

  const getStatus = (accountId: string): SyncStatus => {
    if (syncingAccountId === accountId || (isSyncing && !syncingAccountId)) {
      return 'syncing';
    }
    return getAccountStatus(accountId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gmail Accounts</Text>
        {accounts.length > 0 ? (
          <TouchableOpacity onPress={handleSyncAll} disabled={isSyncing} style={styles.syncButton}>
            <RefreshCw size={22} color={isSyncing ? Colors.textTertiary : Colors.blue} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.blue]} />}
      >
        <Text style={styles.accountCount}>{accounts.length}/3 accounts linked</Text>

        {accounts.length > 0 ? (
          accounts.map((account) => (
            <GmailAccountCard
              key={account.id}
              account={account}
              syncStatus={getStatus(account.id)}
              onSync={() => handleSync(account.id)}
              onRemove={() => handleRemove(account.id, account.email)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Mail size={40} color="#EA4335" />
            </View>
            <Text style={styles.emptyTitle}>No Gmail Accounts</Text>
            <Text style={styles.emptyText}>
              Connect your Gmail to automatically extract bills and receipts from your emails.
            </Text>
          </View>
        )}

        {canAddMore && (
          <TouchableOpacity
            onPress={() => router.push('/gmail/connect')}
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add Gmail Account</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            • GryLin scans your inbox for transactional emails{'\n'}
            • Bills, receipts, and alerts are automatically extracted{'\n'}
            • Personal messages are never read or stored{'\n'}
            • Sync manually or let GryLin check periodically
          </Text>
        </View>
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
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  accountCount: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Font.lg,
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Font.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.lg,
    ...Shadow.md,
  },
  addButtonText: {
    marginLeft: Spacing.sm,
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: Colors.blueLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.xxl,
  },
  infoTitle: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.blue,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Font.sm,
    color: Colors.blue,
    lineHeight: 20,
  },
});

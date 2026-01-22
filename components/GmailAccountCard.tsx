import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Mail, RefreshCw, Trash2, CheckCircle, AlertCircle } from 'lucide-react-native';
import { EmailAccount, AccountType } from '../types';
import { Colors, Spacing, Radius, Font, Shadow } from '../constants/theme';

interface GmailAccountCardProps {
  account: EmailAccount;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  onSync?: () => void;
  onRemove?: () => void;
}

const accountTypeLabels: Record<AccountType, { label: string; color: string }> = {
  personal: { label: 'Personal', color: Colors.blue },
  work: { label: 'Work', color: Colors.purple },
  business: { label: 'Business', color: Colors.green },
};

export function GmailAccountCard({
  account,
  syncStatus = 'idle',
  onSync,
  onRemove,
}: GmailAccountCardProps) {
  const typeConfig = accountTypeLabels[account.account_type];

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never synced';
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Mail size={24} color="#EA4335" />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.email} numberOfLines={1}>{account.email}</Text>
            <View style={[styles.typeBadge, { backgroundColor: `${typeConfig.color}15` }]}>
              <Text style={[styles.typeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            {syncStatus === 'syncing' ? (
              <ActivityIndicator size="small" color={Colors.blue} />
            ) : syncStatus === 'success' ? (
              <CheckCircle size={14} color={Colors.green} />
            ) : syncStatus === 'error' ? (
              <AlertCircle size={14} color={Colors.red} />
            ) : null}
            <Text style={styles.statusText}>
              {syncStatus === 'syncing' ? 'Syncing...' : `Last sync: ${formatLastSync(account.last_sync_at)}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onSync}
          disabled={syncStatus === 'syncing'}
          style={[styles.syncButton, syncStatus === 'syncing' && styles.syncButtonDisabled]}
          activeOpacity={0.7}
        >
          <RefreshCw size={16} color={syncStatus === 'syncing' ? Colors.textTertiary : Colors.blue} />
          <Text style={[styles.syncText, syncStatus === 'syncing' && styles.syncTextDisabled]}>
            Sync Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onRemove} style={styles.removeButton} activeOpacity={0.7}>
          <Trash2 size={16} color={Colors.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  email: {
    flex: 1,
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginLeft: Spacing.sm,
  },
  typeText: {
    fontSize: Font.xs,
    fontWeight: Font.medium,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  syncButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.blueLight,
    borderRadius: Radius.md,
  },
  syncButtonDisabled: {
    backgroundColor: Colors.surfaceVariant,
  },
  syncText: {
    marginLeft: Spacing.sm,
    fontWeight: Font.medium,
    color: Colors.blue,
  },
  syncTextDisabled: {
    color: Colors.textTertiary,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
  },
});

export default GmailAccountCard;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, AlertTriangle, Clock, Calendar, X } from 'lucide-react-native';
import { GuardianAlert, GuardianAlertType } from '../types';
import { Colors, Spacing, Radius, Font, Shadow } from '../constants/theme';

interface AlertCardProps {
  alert: GuardianAlert;
  itemTitle?: string;
  onPress?: () => void;
  onDismiss?: () => void;
}

const alertConfig: Record<GuardianAlertType, {
  icon: typeof Bell;
  color: string;
  bgColor: string;
  label: string;
}> = {
  overdue: {
    icon: AlertTriangle,
    color: Colors.red,
    bgColor: Colors.redLight,
    label: 'Overdue',
  },
  deadline_1day: {
    icon: Clock,
    color: Colors.yellow,
    bgColor: Colors.yellowLight,
    label: 'Due Tomorrow',
  },
  deadline_7day: {
    icon: Calendar,
    color: Colors.blue,
    bgColor: Colors.blueLight,
    label: 'Due This Week',
  },
  scam_warning: {
    icon: AlertTriangle,
    color: Colors.red,
    bgColor: Colors.redLight,
    label: 'Scam Warning',
  },
};

export function AlertCard({ alert, itemTitle, onPress, onDismiss }: AlertCardProps) {
  const config = alertConfig[alert.alert_type];
  const Icon = config.icon;
  const triggerDate = new Date(alert.trigger_date);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} overdue`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, { backgroundColor: config.bgColor }]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
        <Icon size={20} color={config.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
          {onDismiss && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              style={styles.dismissButton}
            >
              <X size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        {itemTitle && (
          <Text style={styles.title} numberOfLines={1}>{itemTitle}</Text>
        )}
        <Text style={styles.date}>{formatDate(triggerDate)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Shadow.card,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xl,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Font.sm,
    fontWeight: Font.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dismissButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Font.lg,
    fontWeight: Font.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  date: {
    fontSize: Font.md,
    color: Colors.textSecondary,
  },
});

export default AlertCard;

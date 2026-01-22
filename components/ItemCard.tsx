import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Wallet, GraduationCap, ShoppingBag, HeartPulse, FileText, AlertTriangle, Briefcase, Calendar } from 'lucide-react-native';
import { Item, ItemStatus, ItemCategory } from '../types';
import { Colors, Spacing, Radius, Font, Shadow } from '../constants/theme';
import { isOverdue, getDaysUntilDue } from '../lib/validation';

interface ItemCardProps {
  item: Item;
  onPress?: (item: Item) => void;
  onStatusChange?: (itemId: string, status: ItemStatus) => void;
}

const categoryIcons: Record<ItemCategory, React.ComponentType<{ size: number; color: string }>> = {
  Finance: Wallet,
  Education: GraduationCap,
  Shopping: ShoppingBag,
  Health: HeartPulse,
  Career: Briefcase,
  Other: FileText,
};

const categoryColors: Record<ItemCategory, string> = {
  Finance: Colors.blue,
  Education: Colors.purple,
  Shopping: Colors.yellow,
  Health: Colors.green,
  Career: Colors.red,
  Other: Colors.textTertiary,
};

const statusStyles = {
  new: { bg: Colors.blueLight, text: Colors.blue },
  paid: { bg: Colors.greenLight, text: Colors.green },
  archived: { bg: Colors.surfaceVariant, text: Colors.textTertiary },
};

export function ItemCard({ item, onPress }: ItemCardProps) {
  const Icon = categoryIcons[item.category] || FileText;
  const iconColor = categoryColors[item.category] || categoryColors.Other;
  const statusStyle = statusStyles[item.status] || statusStyles.new;
  const overdue = item.due_date ? isOverdue(item.due_date) : false;
  const daysUntil = item.due_date ? getDaysUntilDue(item.due_date) : null;

  const formatDueDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDueDateColor = () => {
    if (overdue) return Colors.red;
    if (daysUntil !== null && daysUntil <= 3) return Colors.yellow;
    return Colors.textTertiary;
  };

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Icon size={24} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          
          {item.is_scam ? (
            <View style={styles.scamBadge}>
              <AlertTriangle size={10} color={Colors.red} />
              <Text style={styles.scamText}>Scam</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {item.summary && item.summary[0] && (
          <Text style={styles.summary} numberOfLines={1}>{item.summary[0]}</Text>
        )}

        <View style={styles.metaRow}>
          {item.amount && (
            <Text style={styles.amount}>₹{item.amount.toFixed(0)}</Text>
          )}
          {item.due_date && (
            <View style={styles.dueDateContainer}>
              <Calendar size={12} color={getDueDateColor()} />
              <Text style={[styles.dueDate, { color: getDueDateColor() }]}>
                {overdue ? 'Overdue' : formatDueDate(item.due_date)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: Colors.surfaceTint,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xl,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: Font.lg,
    fontWeight: Font.medium,
    color: Colors.textPrimary,
  },
  scamBadge: {
    backgroundColor: Colors.redLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.button,
    marginLeft: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scamText: {
    fontSize: Font.sm,
    color: Colors.red,
    fontWeight: Font.medium,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.button,
    marginLeft: Spacing.md,
  },
  statusText: {
    fontSize: Font.sm,
    fontWeight: Font.medium,
  },
  summary: {
    fontSize: Font.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  amount: {
    fontSize: Font.lg,
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dueDate: {
    fontSize: Font.md,
    fontWeight: Font.medium,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Folder } from 'lucide-react-native';
import { LifeStack } from '../types';
import { Colors, Spacing, Radius, Font, Shadow } from '../constants/theme';

interface LifeStackCardProps {
  stack: LifeStack;
  onPress?: () => void;
}

export function LifeStackCard({ stack, onPress }: LifeStackCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${stack.color}20` }]}>
        <Folder size={24} color={stack.color} />
      </View>

      <Text style={styles.name} numberOfLines={1}>{stack.name}</Text>
      <Text style={styles.count}>
        {stack.item_count || 0} item{(stack.item_count || 0) !== 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  name: {
    fontSize: Font.lg,
    fontWeight: Font.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  count: {
    fontSize: Font.md,
    color: Colors.textSecondary,
  },
});

export default LifeStackCard;

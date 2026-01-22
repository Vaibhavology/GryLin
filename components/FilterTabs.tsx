import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../constants/theme';

interface FilterTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function FilterTabs({ tabs, activeTab, onTabChange }: FilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ 
        paddingHorizontal: spacing['2xl'],
        gap: 10,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        
        return (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            style={({ pressed }) => ({
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: borderRadius.full,
              backgroundColor: isActive ? colors.primary : colors.surface,
              borderWidth: isActive ? 0 : 1,
              borderColor: colors.border,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <Text style={{
              ...typography.sm,
              color: isActive ? colors.surface : colors.subtext,
            }}>
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

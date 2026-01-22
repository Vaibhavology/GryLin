import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react-native';
import { colors, typography, borderRadius, spacing } from '../constants/theme';

interface BriefCardProps {
  title?: string;
  bullets: string[];
  onViewAll?: () => void;
}

export function BriefCard({ 
  title = 'Morning Brief', 
  bullets, 
  onViewAll 
}: BriefCardProps) {
  return (
    <View style={{
      backgroundColor: colors.aiLight,
      borderRadius: borderRadius['2xl'],
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: '#DDD6FE',
    }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            backgroundColor: colors.ai,
            padding: 8,
            borderRadius: borderRadius.full,
            marginRight: 10,
          }}>
            <Sparkles size={16} color={colors.surface} />
          </View>
          <Text style={{ ...typography.bodySemibold, color: colors.ai }}>
            {title}
          </Text>
        </View>
        
        {onViewAll && (
          <Pressable
            onPress={onViewAll}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ ...typography.sm, color: colors.ai, marginRight: 4 }}>
              View All
            </Text>
            <ChevronRight size={16} color={colors.ai} />
          </Pressable>
        )}
      </View>

      {/* Bullets */}
      {bullets.map((bullet, index) => (
        <View key={index} style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={{ color: colors.ai, marginRight: 10, fontSize: 14 }}>•</Text>
          <Text style={{ ...typography.body, color: '#6D28D9', flex: 1 }}>
            {bullet}
          </Text>
        </View>
      ))}
    </View>
  );
}

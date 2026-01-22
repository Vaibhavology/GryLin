import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Sparkles, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, typography, borderRadius, shadows, spacing } from '../constants/theme';
import { QualityIndicator } from './QualityIndicator';

interface CameraOverlayProps {
  onCapture: () => void;
  isProcessing?: boolean;
  processingText?: string;
  qualityScore?: number;
  qualityFeedback?: string;
}

export function CameraOverlay({
  onCapture,
  isProcessing = false,
  processingText = 'Analyzing...',
  qualityScore,
  qualityFeedback,
}: CameraOverlayProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Top Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: borderRadius.full,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={22} color={colors.surface} />
        </TouchableOpacity>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: borderRadius.full,
        }}>
          <Sparkles size={16} color={colors.ai} />
          <Text style={{ ...typography.sm, color: colors.surface, marginLeft: 8 }}>
            AI Scanner
          </Text>
        </View>

        <View style={{ width: 44 }} />
      </View>

      {/* Center Frame */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Document Frame */}
        <View style={{
          width: '85%',
          aspectRatio: 0.7,
          borderWidth: 3,
          borderColor: colors.primary,
          borderRadius: borderRadius.xl,
          position: 'relative',
        }}>
          {/* Corner Accents */}
          <View style={{ position: 'absolute', top: -3, left: -3, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.primary, borderTopLeftRadius: borderRadius.lg }} />
          <View style={{ position: 'absolute', top: -3, right: -3, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.primary, borderTopRightRadius: borderRadius.lg }} />
          <View style={{ position: 'absolute', bottom: -3, left: -3, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.primary, borderBottomLeftRadius: borderRadius.lg }} />
          <View style={{ position: 'absolute', bottom: -3, right: -3, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.primary, borderBottomRightRadius: borderRadius.lg }} />

          {/* Processing Overlay */}
          {isProcessing && (
            <View style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                backgroundColor: colors.aiLight,
                padding: 20,
                borderRadius: borderRadius.full,
                marginBottom: 16,
              }}>
                <ActivityIndicator size="large" color={colors.ai} />
              </View>
              <Text style={{ ...typography.bodySemibold, color: colors.surface }}>
                {processingText}
              </Text>
              <Text style={{ ...typography.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                AI is analyzing your document
              </Text>
            </View>
          )}
        </View>

        {/* Quality Indicator */}
        {!isProcessing && qualityScore !== undefined && (
          <View style={{ marginTop: 20 }}>
            <QualityIndicator score={qualityScore} feedback={qualityFeedback} />
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={{
        paddingHorizontal: spacing['2xl'],
        paddingBottom: spacing['3xl'],
        alignItems: 'center',
      }}>
        {/* Instructions */}
        <View style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: borderRadius.full,
          marginBottom: 24,
        }}>
          <Text style={{ ...typography.sm, color: colors.surface, textAlign: 'center' }}>
            Position document within the frame
          </Text>
        </View>

        {/* Capture Button */}
        <Pressable
          onPress={onCapture}
          disabled={isProcessing}
          style={({ pressed }) => ({
            width: 80,
            height: 80,
            borderRadius: borderRadius.full,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: colors.primary,
            opacity: isProcessing ? 0.5 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
            ...shadows.elevated,
          })}
        >
          <View style={{
            width: 60,
            height: 60,
            borderRadius: borderRadius.full,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Camera size={28} color={colors.surface} />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

import { StyleSheet } from 'react-native';

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Folder } from 'lucide-react-native';
import { VaultFolder } from '../types';
import { colors, typography, borderRadius, shadows, spacing } from '../constants/theme';

interface FolderGridProps {
  folders: VaultFolder[];
  onFolderPress: (folder: VaultFolder) => void;
}

export function FolderGrid({ folders, onFolderPress }: FolderGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {folders.map((folder) => (
        <Pressable
          key={folder.id}
          onPress={() => onFolderPress(folder)}
          style={({ pressed }) => ({
            width: '47%',
            backgroundColor: colors.surface,
            borderRadius: borderRadius['2xl'],
            padding: spacing.lg,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            transform: [{ scale: pressed ? 0.95 : 1 }],
            ...shadows.card,
          })}
        >
          <View style={{
            width: 52,
            height: 52,
            borderRadius: borderRadius.full,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
          }}>
            <Folder size={26} color={colors.primary} />
          </View>
          <Text style={{ 
            ...typography.bodySemibold, 
            color: colors.secondary, 
            textAlign: 'center' 
          }}>
            {folder.name}
          </Text>
          {folder.item_count !== undefined && (
            <Text style={{ ...typography.sm, color: colors.subtext, marginTop: 4 }}>
              {folder.item_count} file{folder.item_count !== 1 ? 's' : ''}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

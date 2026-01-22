import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Folder, Home, Heart, Briefcase, GraduationCap,
  Plane, Car, Baby, Gift, X, Plus,
} from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useLifeStackStore } from '../../stores/lifeStackStore';
import { useAlertStore } from '../../stores/alertStore';
import { Colors, Spacing, Radius, Font, Shadow } from '../../constants/theme';

const ICONS = [
  { name: 'folder', icon: Folder },
  { name: 'home', icon: Home },
  { name: 'heart', icon: Heart },
  { name: 'briefcase', icon: Briefcase },
  { name: 'graduation-cap', icon: GraduationCap },
  { name: 'plane', icon: Plane },
  { name: 'car', icon: Car },
  { name: 'baby', icon: Baby },
  { name: 'gift', icon: Gift },
];

const COLORS = [
  Colors.blue, Colors.purple, '#EC4899', Colors.red,
  '#F97316', Colors.yellow, Colors.green, '#14B8A6', '#6366F1',
];

export default function CreateLifeStackScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createStack } = useLifeStackStore();
  const { showAlert } = useAlertStore();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const userId = user?.id || '';

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showAlert('Please enter a name for your Life Stack', 'warning');
      return;
    }
    if (!userId) {
      showAlert('Please sign in first', 'error');
      return;
    }

    setIsCreating(true);
    try {
      await createStack(userId, name.trim(), selectedIcon, selectedColor, keywords);
      showAlert('Life Stack created!', 'success');
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create Life Stack';
      showAlert(message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const SelectedIconComponent = ICONS.find((i) => i.name === selectedIcon)?.icon || Folder;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Life Stack</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.preview}>
          <View style={[styles.previewIcon, { backgroundColor: `${selectedColor}20` }]}>
            <SelectedIconComponent size={40} color={selectedColor} />
          </View>
          <Text style={styles.previewName}>{name || 'New Life Stack'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Wedding Plans, House Renovation"
            placeholderTextColor={Colors.textTertiary}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((item) => {
              const IconComponent = item.icon;
              const isSelected = selectedIcon === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => setSelectedIcon(item.name)}
                  style={[
                    styles.iconOption,
                    isSelected && { backgroundColor: `${selectedColor}20`, borderColor: selectedColor },
                  ]}
                >
                  <IconComponent size={24} color={isSelected ? selectedColor : Colors.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                ]}
              >
                {selectedColor === color && <View style={styles.colorCheck} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Auto-Route Keywords</Text>
          <Text style={styles.hint}>Items containing these keywords will be automatically added</Text>
          
          <View style={styles.keywordInputRow}>
            <TextInput
              value={keywordInput}
              onChangeText={setKeywordInput}
              onSubmitEditing={handleAddKeyword}
              placeholder="Add keyword..."
              placeholderTextColor={Colors.textTertiary}
              style={styles.keywordInput}
            />
            <TouchableOpacity onPress={handleAddKeyword} style={[styles.addKeywordButton, { backgroundColor: selectedColor }]}>
              <Plus size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.keywordsList}>
            {keywords.map((keyword) => (
              <View key={keyword} style={[styles.keywordTag, { backgroundColor: `${selectedColor}15` }]}>
                <Text style={[styles.keywordText, { color: selectedColor }]}>{keyword}</Text>
                <TouchableOpacity onPress={() => handleRemoveKeyword(keyword)}>
                  <X size={14} color={selectedColor} />
                </TouchableOpacity>
              </View>
            ))}
            {keywords.length === 0 && (
              <Text style={styles.noKeywords}>No keywords added yet</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={isCreating || !name.trim()}
          style={[styles.createButton, !name.trim() && styles.createButtonDisabled]}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create Life Stack</Text>
          )}
        </TouchableOpacity>
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
  preview: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  previewName: {
    fontSize: Font.xl,
    fontWeight: Font.bold,
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  label: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  hint: {
    fontSize: Font.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Font.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.textPrimary,
  },
  colorCheck: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
  },
  keywordInputRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  keywordInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Font.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  addKeywordButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  keywordTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  keywordText: {
    fontSize: Font.sm,
    marginRight: Spacing.sm,
  },
  noKeywords: {
    fontSize: Font.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: Colors.blue,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    ...Shadow.md,
  },
  createButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  createButtonText: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.white,
  },
});

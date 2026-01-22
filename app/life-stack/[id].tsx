import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft, Folder, Home, Heart, Briefcase, GraduationCap,
  Plane, Car, Baby, Gift, FileText, ChevronRight, Edit2, Trash2, X, Plus,
} from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useLifeStackStore } from '../../stores/lifeStackStore';
import { useItemsStore } from '../../stores/itemsStore';
import { useAlertStore } from '../../stores/alertStore';
import { Item, ItemCategory } from '../../types';
import { Colors, Spacing, Radius, Font, Shadow } from '../../constants/theme';

const ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  folder: Folder, home: Home, heart: Heart, briefcase: Briefcase,
  'graduation-cap': GraduationCap, plane: Plane, car: Car, baby: Baby, gift: Gift,
};

export default function LifeStackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { stacks, getStackItems, updateStack, deleteStack } = useLifeStackStore();
  const { selectItem } = useItemsStore();
  const { showAlert } = useAlertStore();

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editKeywords, setEditKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const stack = stacks.find((s) => s.id === id);
  const IconComponent = stack ? (ICONS[stack.icon] || Folder) : Folder;

  const loadItems = useCallback(async () => {
    if (!id) return;
    try {
      const stackItems = await getStackItems(id);
      setItems(stackItems);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id, getStackItems]);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    if (stack) {
      setEditName(stack.name);
      setEditKeywords(stack.keywords);
    }
  }, [stack]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  }, [loadItems]);

  const handleItemPress = (item: Item) => {
    selectItem(item);
    router.push(`/item/${item.id}`);
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !editKeywords.includes(trimmed)) {
      setEditKeywords([...editKeywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setEditKeywords(editKeywords.filter((k) => k !== keyword));
  };

  const handleSaveEdit = async () => {
    if (!id || !editName.trim()) return;
    try {
      await updateStack(id, { name: editName.trim(), keywords: editKeywords });
      showAlert('Life Stack updated!', 'success');
      setIsEditing(false);
    } catch (error) {
      showAlert('Failed to update', 'error');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Life Stack',
      `Are you sure you want to delete "${stack?.name}"? Items in this stack will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStack(id!);
              showAlert('Life Stack deleted', 'success');
              router.back();
            } catch (error) {
              showAlert('Failed to delete', 'error');
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: ItemCategory) => {
    const colorMap: Record<ItemCategory, string> = {
      Finance: Colors.blue, Shopping: Colors.yellow, Health: Colors.green,
      Education: Colors.purple, Career: Colors.red, Other: Colors.textTertiary,
    };
    return colorMap[category] || colorMap.Other;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!stack) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Life Stack not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.notFoundLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stack.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.headerButton}>
            <Edit2 size={20} color={Colors.blue} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Trash2 size={20} color={Colors.red} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.blue]} />}
      >
        <View style={styles.stackHeader}>
          <View style={[styles.stackIcon, { backgroundColor: `${stack.color}20` }]}>
            <IconComponent size={40} color={stack.color} />
          </View>
          
          {isEditing ? (
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.editNameInput}
            />
          ) : (
            <Text style={styles.stackName}>{stack.name}</Text>
          )}
          <Text style={styles.stackCount}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
        </View>

        {isEditing && (
          <View style={styles.editSection}>
            <Text style={styles.editLabel}>Auto-Route Keywords</Text>
            <View style={styles.keywordInputRow}>
              <TextInput
                value={keywordInput}
                onChangeText={setKeywordInput}
                onSubmitEditing={handleAddKeyword}
                placeholder="Add keyword..."
                placeholderTextColor={Colors.textTertiary}
                style={styles.keywordInput}
              />
              <TouchableOpacity onPress={handleAddKeyword} style={[styles.addKeywordButton, { backgroundColor: stack.color }]}>
                <Plus size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.keywordsList}>
              {editKeywords.map((keyword) => (
                <View key={keyword} style={[styles.keywordTag, { backgroundColor: `${stack.color}15` }]}>
                  <Text style={[styles.keywordText, { color: stack.color }]}>{keyword}</Text>
                  <TouchableOpacity onPress={() => handleRemoveKeyword(keyword)}>
                    <X size={12} color={stack.color} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={handleSaveEdit} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isEditing && stack.keywords.length > 0 && (
          <View style={styles.keywordsDisplay}>
            <Text style={styles.keywordsLabel}>Auto-routing keywords:</Text>
            <View style={styles.keywordsList}>
              {stack.keywords.map((keyword) => (
                <View key={keyword} style={[styles.keywordTag, { backgroundColor: `${stack.color}15` }]}>
                  <Text style={[styles.keywordText, { color: stack.color }]}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Items</Text>
        {items.length > 0 ? (
          items.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => handleItemPress(item)} style={styles.itemCard} activeOpacity={0.7}>
              <View style={[styles.itemIcon, { backgroundColor: `${getCategoryColor(item.category)}15` }]}>
                <FileText size={22} color={getCategoryColor(item.category)} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.itemMeta}>
                  {item.amount && <Text style={styles.itemAmount}>₹{item.amount.toFixed(0)}</Text>}
                  {item.due_date && <Text style={styles.itemDate}>Due {formatDate(item.due_date)}</Text>}
                </View>
              </View>
              <ChevronRight size={20} color={Colors.border} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <FileText size={40} color={Colors.border} />
            <Text style={styles.emptyTitle}>No items in this stack</Text>
            <Text style={styles.emptyText}>Items matching your keywords will appear here automatically</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    color: Colors.textTertiary,
  },
  notFoundLink: {
    color: Colors.blue,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    fontSize: Font.lg,
    fontWeight: Font.medium,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
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
  stackHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  stackIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  stackName: {
    fontSize: Font.xl,
    fontWeight: Font.bold,
    color: Colors.textPrimary,
  },
  editNameInput: {
    fontSize: Font.xl,
    fontWeight: Font.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 200,
  },
  stackCount: {
    fontSize: Font.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  editSection: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xxl,
    ...Shadow.sm,
  },
  editLabel: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  keywordInputRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  keywordInput: {
    flex: 1,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: Font.md,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  addKeywordButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keywordsDisplay: {
    marginBottom: Spacing.xxl,
  },
  keywordsLabel: {
    fontSize: Font.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  keywordTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  keywordText: {
    fontSize: Font.sm,
    marginRight: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.blue,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.white,
  },
  sectionTitle: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.sm,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemTitle: {
    fontSize: Font.md,
    fontWeight: Font.semibold,
    color: Colors.textPrimary,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  itemAmount: {
    fontSize: Font.sm,
    fontWeight: Font.medium,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  itemDate: {
    fontSize: Font.sm,
    color: Colors.textTertiary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    ...Shadow.sm,
  },
  emptyTitle: {
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: Font.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});

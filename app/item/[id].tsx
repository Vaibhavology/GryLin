import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Tag,
  FileText,
  AlertTriangle,
  Check,
  Trash2,
  Archive,
  Share2,
  Clock,
  Folder,
  MoreVertical,
} from 'lucide-react-native';
import { useItemsStore } from '../../stores/itemsStore';
import { useAlertStore } from '../../stores/alertStore';
import { useAuthStore } from '../../stores/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Category colors
const CATEGORY_COLORS: Record<string, { bg: string; text: string; light: string }> = {
  Finance: { bg: '#1A73E8', text: '#FFF', light: '#E8F0FE' },
  Health: { bg: '#34A853', text: '#FFF', light: '#E6F4EA' },
  Shopping: { bg: '#EA8600', text: '#FFF', light: '#FEF7E0' },
  Education: { bg: '#A142F4', text: '#FFF', light: '#F3E8FD' },
  Career: { bg: '#EA4335', text: '#FFF', light: '#FCE8E6' },
  Other: { bg: '#5F6368', text: '#FFF', light: '#F1F3F4' },
};

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, selectedItem, selectItem, markAsPaid, archiveItem, removeItem, folders } = useItemsStore();
  const { showAlert } = useAlertStore();
  const { user } = useAuthStore();
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const item = selectedItem || items.find((i) => i.id === id);
  const folder = item?.folder_id ? folders.find(f => f.id === item.folder_id) : null;
  const catColors = CATEGORY_COLORS[item?.category || 'Other'] || CATEGORY_COLORS.Other;

  useEffect(() => {
    if (item?.image_url) {
      // For local file:// URIs or HTTP URLs, use directly
      if (item.image_url.startsWith('file://') || item.image_url.startsWith('http')) {
        setImageUrl(item.image_url);
      }
    }
  }, [item?.image_url]);

  useEffect(() => {
    return () => { selectItem(null); };
  }, []);

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.notFound}>
          <FileText size={64} color="#D1D5DB" strokeWidth={1.5} />
          <Text style={styles.notFoundTitle}>Document not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.notFoundBtn}>
            <Text style={styles.notFoundBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatAmount = (amount: number | null): string => {
    if (amount === null) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && item.status !== 'paid';
  const daysUntilDue = item.due_date 
    ? Math.ceil((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      await markAsPaid(item.id);
      showAlert('Marked as paid!', 'success');
    } catch {
      showAlert('Failed to update', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    setIsProcessing(true);
    try {
      await archiveItem(item.id);
      showAlert('Archived', 'success');
      router.back();
    } catch {
      showAlert('Failed to archive', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Document', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsProcessing(true);
          try {
            await removeItem(item.id);
            showAlert('Deleted', 'success');
            router.back();
          } catch {
            showAlert('Failed to delete', 'error');
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const getStatusInfo = () => {
    if (item.status === 'paid') return { label: 'Paid', color: '#22C55E', bg: '#DCFCE7' };
    if (item.status === 'archived') return { label: 'Archived', color: '#6B7280', bg: '#F3F4F6' };
    if (isOverdue) return { label: 'Overdue', color: '#DC2626', bg: '#FEE2E2' };
    return { label: 'Active', color: '#1A73E8', bg: '#DBEAFE' };
  };

  const status = getStatusInfo();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Document</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <MoreVertical size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Document Image */}
        {imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
            <View style={styles.imageOverlay}>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Scam Warning */}
        {item.is_scam && (
          <View style={styles.scamBanner}>
            <AlertTriangle size={20} color="#DC2626" strokeWidth={2} />
            <View style={styles.scamContent}>
              <Text style={styles.scamTitle}>Potential Scam Detected</Text>
              <Text style={styles.scamText}>Verify this document before taking action</Text>
            </View>
          </View>
        )}

        {/* Main Info Card */}
        <View style={styles.mainCard}>
          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>
          
          {/* Category & Folder */}
          <View style={styles.tagsRow}>
            <View style={[styles.categoryTag, { backgroundColor: catColors.light }]}>
              <Tag size={14} color={catColors.bg} strokeWidth={2} />
              <Text style={[styles.categoryText, { color: catColors.bg }]}>{item.category}</Text>
            </View>
            {folder && (
              <View style={styles.folderTag}>
                <Folder size={14} color="#6B7280" strokeWidth={2} />
                <Text style={styles.folderText}>{folder.name}</Text>
              </View>
            )}
          </View>

          {/* Amount & Due Date */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#E8F0FE' }]}>
                <IndianRupee size={20} color="#1A73E8" strokeWidth={2} />
              </View>
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={styles.infoValue}>{formatAmount(item.amount)}</Text>
            </View>
            
            <View style={styles.infoDivider} />
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: isOverdue ? '#FEE2E2' : '#FEF3C7' }]}>
                <Calendar size={20} color={isOverdue ? '#DC2626' : '#D97706'} strokeWidth={2} />
              </View>
              <Text style={styles.infoLabel}>
                {item.due_date ? (isOverdue ? 'Overdue' : 'Due Date') : 'Valid Until'}
              </Text>
              <Text style={[styles.infoValue, isOverdue && { color: '#DC2626' }]}>
                {formatDate(item.due_date)}
              </Text>
              {daysUntilDue !== null && !isOverdue && daysUntilDue > 0 && (
                <Text style={styles.daysLeft}>{daysUntilDue} days left</Text>
              )}
            </View>
          </View>
        </View>

        {/* Summary Card */}
        {item.summary && item.summary.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Key Details</Text>
            {item.summary.map((point, index) => (
              <View key={index} style={styles.summaryItem}>
                <View style={styles.summaryBullet} />
                <Text style={styles.summaryText}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created</Text>
            <Text style={styles.metaValue}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Source</Text>
            <Text style={styles.metaValue}>
              {item.source_type === 'scan' ? 'Camera Scan' : 
               item.source_type === 'email' ? 'Email' : 'Manual'}
            </Text>
          </View>
          {item.risk_score > 0 && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Risk Score</Text>
              <Text style={[styles.metaValue, { color: '#DC2626' }]}>{item.risk_score}/100</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {item.status !== 'paid' && item.amount && (
            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleMarkAsPaid}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Check size={20} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.primaryBtnText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={styles.secondaryBtn} 
              onPress={handleArchive}
              disabled={isProcessing}
            >
              <Archive size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.secondaryBtnText}>Archive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryBtn, styles.deleteBtn]} 
              onPress={handleDelete}
              disabled={isProcessing}
            >
              <Trash2 size={18} color="#DC2626" strokeWidth={2} />
              <Text style={[styles.secondaryBtnText, { color: '#DC2626' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  notFoundBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1A73E8',
    borderRadius: 12,
  },
  notFoundBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  moreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scamBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  scamContent: {
    marginLeft: 12,
    flex: 1,
  },
  scamTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  scamText: {
    fontSize: 13,
    color: '#B91C1C',
    marginTop: 2,
  },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  folderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  folderText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  daysLeft: {
    fontSize: 12,
    color: '#D97706',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A73E8',
    marginTop: 7,
    marginRight: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  metaCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metaLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  deleteBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
});

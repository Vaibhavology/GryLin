import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { X, Check, AlertTriangle, FileText, Calendar, Wallet, Tag, Sparkles, Shield, FolderOpen, Bell } from 'lucide-react-native';
import { DocumentAnalysis } from '../types';

interface ReviewModalProps {
  visible: boolean;
  analysis: DocumentAnalysis | null;
  autoFolderName?: string | null;
  hasAlert?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ReviewModal({ visible, analysis, autoFolderName, hasAlert, onConfirm, onCancel }: ReviewModalProps) {
  if (!analysis) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not detected';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  // Check if alert will be created (has due date)
  const willCreateAlert = !!analysis.due_date;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Sparkles size={18} color="#A142F4" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.headerTitle}>AI Analysis Complete</Text>
                <Text style={styles.headerSubtitle}>Review extracted information</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel} activeOpacity={0.7}>
              <X size={20} color="#5F6368" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Scam Warning */}
            {analysis.is_scam && (
              <View style={styles.warningCard}>
                <View style={styles.warningIconWrap}>
                  <Shield size={20} color="#EA4335" strokeWidth={2} />
                </View>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Potential Scam Detected</Text>
                  <Text style={styles.warningText}>This document shows signs of fraudulent activity. Please verify before saving.</Text>
                  {analysis.risk_score && (
                    <View style={styles.riskBadge}>
                      <Text style={styles.riskText}>Risk Score: {analysis.risk_score}/100</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Auto-Actions Info */}
            {(autoFolderName || willCreateAlert) && (
              <View style={styles.autoActionsCard}>
                <Text style={styles.autoActionsTitle}>🤖 Auto-Actions</Text>
                {autoFolderName && (
                  <View style={styles.autoActionItem}>
                    <FolderOpen size={16} color="#1A73E8" strokeWidth={2} />
                    <Text style={styles.autoActionText}>
                      Will save to <Text style={styles.autoActionHighlight}>{autoFolderName}</Text> folder
                    </Text>
                  </View>
                )}
                {willCreateAlert && (
                  <View style={styles.autoActionItem}>
                    <Bell size={16} color="#EA8600" strokeWidth={2} />
                    <Text style={styles.autoActionText}>
                      Reminder will be set for <Text style={styles.autoActionHighlight}>{formatDate(analysis.due_date)}</Text>
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Title Card */}
            <View style={styles.mainCard}>
              <View style={styles.titleSection}>
                <View style={styles.titleIconWrap}>
                  <FileText size={24} color="#1A73E8" strokeWidth={2} />
                </View>
                <Text style={styles.documentTitle}>{analysis.title}</Text>
              </View>

              {/* Category */}
              <View style={styles.categoryRow}>
                <Tag size={16} color="#5F6368" strokeWidth={2} />
                <Text style={styles.categoryLabel}>Category</Text>
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{analysis.category}</Text>
                </View>
              </View>
            </View>

            {/* Amount & Date */}
            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <View style={[styles.infoIconWrap, { backgroundColor: '#E6F4EA' }]}>
                  <Wallet size={18} color="#34A853" strokeWidth={2} />
                </View>
                <Text style={styles.infoLabel}>Amount</Text>
                <Text style={styles.infoValue}>
                  {analysis.amount ? `₹${analysis.amount.toLocaleString()}` : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoCard}>
                <View style={[styles.infoIconWrap, { backgroundColor: willCreateAlert ? '#FEF7E0' : '#F1F3F4' }]}>
                  <Calendar size={18} color={willCreateAlert ? '#EA8600' : '#5F6368'} strokeWidth={2} />
                </View>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={[styles.infoValue, willCreateAlert && styles.infoValueHighlight]}>
                  {formatDate(analysis.due_date)}
                </Text>
              </View>
            </View>

            {/* Summary */}
            {analysis.summary_bullets?.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Key Points</Text>
                {analysis.summary_bullets.map((bullet, index) => (
                  <View key={index} style={styles.summaryItem}>
                    <View style={styles.summaryDot} />
                    <Text style={styles.summaryText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm} activeOpacity={0.85}>
              <Check size={18} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.confirmText}>Save Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E8EAED',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3E8FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#202124',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#5F6368',
    marginTop: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FCE8E6',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },
  warningIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EA4335',
  },
  warningText: {
    fontSize: 13,
    color: '#C62828',
    marginTop: 4,
    lineHeight: 18,
  },
  riskBadge: {
    backgroundColor: '#EA4335',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  mainCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  titleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#202124',
    lineHeight: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#5F6368',
    flex: 1,
  },
  categoryChip: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A73E8',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
  },
  infoValueHighlight: {
    color: '#EA8600',
  },
  autoActionsCard: {
    backgroundColor: '#E8F0FE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C2D9FC',
  },
  autoActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
    marginBottom: 12,
  },
  autoActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  autoActionText: {
    fontSize: 13,
    color: '#3C4043',
    flex: 1,
  },
  autoActionHighlight: {
    fontWeight: '600',
    color: '#1A73E8',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A73E8',
    marginTop: 6,
    marginRight: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#5F6368',
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EAED',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5F6368',
  },
  confirmButton: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1A73E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});

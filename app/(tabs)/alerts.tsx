import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { AlertTriangle, Clock, CheckCircle2, Calendar } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useItemsStore } from '../../stores/itemsStore';
import { useGuardianStore } from '../../stores/guardianStore';
import { GuardianAlert } from '../../types';

export default function AlertsScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { items, fetchItems, selectItem } = useItemsStore();
  const { alerts, fetchAlerts, checkDeadlines, dismissAlert, getAlertsByUrgency, isMonitoring } = useGuardianStore();
  
  const userId = user?.id || '';
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchItems(userId).catch(() => {});
      fetchAlerts(userId).catch(() => {});
    }
  }, [userId]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await Promise.all([
      fetchItems(userId).catch(() => {}),
      fetchAlerts(userId).catch(() => {}),
    ]);
    setIsRefreshing(false);
  }, [userId, fetchItems, fetchAlerts]);

  const groupedAlerts = getAlertsByUrgency();
  const activeAlerts = alerts.filter((a) => !a.is_dismissed);
  const dismissedAlerts = alerts.filter((a) => a.is_dismissed);

  const getItemTitle = (itemId: string): string => items.find((i) => i.id === itemId)?.title || 'Unknown';
  const getItemAmount = (itemId: string): number | null => items.find((i) => i.id === itemId)?.amount || null;

  const handleAlertPress = (alert: GuardianAlert) => {
    const item = items.find((i) => i.id === alert.item_id);
    if (item) { 
      selectItem(item); 
      router.push(`/item/${item.id}`); 
    }
  };

  const handleDismiss = async (alertId: string) => {
    try { 
      await dismissAlert(alertId); 
    } catch {}
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  const getUrgencyStyle = (alert: GuardianAlert) => {
    const date = new Date(alert.trigger_date);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return { color: '#EA4335', bg: '#FCE8E6', Icon: AlertTriangle };
    if (diff === 0) return { color: '#EA8600', bg: '#FEF7E0', Icon: Clock };
    return { color: '#4285F4', bg: '#E8F0FE', Icon: Calendar };
  };

  const renderAlertCard = (alert: GuardianAlert) => {
    const amount = getItemAmount(alert.item_id);
    const style = getUrgencyStyle(alert);
    const Icon = style.Icon;
    
    return (
      <TouchableOpacity key={alert.id} style={styles.alertCard} onPress={() => handleAlertPress(alert)}>
        <View style={[styles.alertIcon, { backgroundColor: style.bg }]}>
          <Icon size={20} color={style.color} />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle} numberOfLines={1}>{getItemTitle(alert.item_id)}</Text>
          <Text style={[styles.alertDue, { color: style.color }]}>{formatDueDate(alert.trigger_date)}</Text>
        </View>
        {amount && <Text style={styles.alertAmount}>₹{amount.toLocaleString()}</Text>}
        <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDismiss(alert.id)}>
          <CheckCircle2 size={24} color="#34A853" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        {activeAlerts.length > 0 && (
          <Text style={styles.headerSubtitle}>{activeAlerts.length} pending</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
          {activeAlerts.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'active' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'active' && styles.tabBadgeTextActive]}>
                {activeAlerts.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing || isMonitoring} onRefresh={onRefresh} colors={['#4285F4']} />}
      >
        {activeTab === 'active' ? (
          <>
            {groupedAlerts.overdue.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overdue</Text>
                {groupedAlerts.overdue.map(renderAlertCard)}
              </View>
            )}
            {groupedAlerts.today.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today</Text>
                {groupedAlerts.today.map(renderAlertCard)}
              </View>
            )}
            {groupedAlerts.thisWeek.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>This Week</Text>
                {groupedAlerts.thisWeek.map(renderAlertCard)}
              </View>
            )}
            {groupedAlerts.later.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Later</Text>
                {groupedAlerts.later.map(renderAlertCard)}
              </View>
            )}
            
            {activeAlerts.length === 0 && (
              <View style={styles.emptyState}>
                <CheckCircle2 size={64} color="#34A853" />
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptyText}>No pending alerts</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {dismissedAlerts.length > 0 ? (
              <View style={styles.completedList}>
                {dismissedAlerts.map((alert) => (
                  <View key={alert.id} style={styles.completedItem}>
                    <CheckCircle2 size={20} color="#34A853" />
                    <Text style={styles.completedTitle} numberOfLines={1}>{getItemTitle(alert.item_id)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Clock size={64} color="#80868B" />
                <Text style={styles.emptyTitle}>No completed items</Text>
              </View>
            )}
          </>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '600', color: '#202124' },
  headerSubtitle: { fontSize: 14, color: '#80868B', marginTop: 2 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  tab: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: '#FFF',
    gap: 8,
  },
  tabActive: { backgroundColor: '#4285F4' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#5F6368' },
  tabTextActive: { color: '#FFF' },
  tabBadge: { backgroundColor: '#E8EAED', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeText: { fontSize: 12, fontWeight: '600', color: '#5F6368' },
  tabBadgeTextActive: { color: '#FFF' },
  scrollContent: { paddingHorizontal: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#5F6368', marginBottom: 10 },
  alertCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 14, 
    padding: 14, 
    marginBottom: 10,
  },
  alertIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertContent: { flex: 1, marginLeft: 12 },
  alertTitle: { fontSize: 15, fontWeight: '500', color: '#202124', marginBottom: 2 },
  alertDue: { fontSize: 13, fontWeight: '500' },
  alertAmount: { fontSize: 14, fontWeight: '600', color: '#202124', marginRight: 10 },
  dismissBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#202124', marginTop: 20, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#5F6368' },
  completedList: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' },
  completedItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  completedTitle: { flex: 1, fontSize: 15, color: '#202124' },
});

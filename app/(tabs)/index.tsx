import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Platform, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, ChevronRight, Sparkles, TrendingUp, Clock, FolderOpen, User, Plus, ArrowUpRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useItemsStore } from '../../stores/itemsStore';
import { useGuardianStore } from '../../stores/guardianStore';
import { Item, ItemCategory } from '../../types';
import { categoryColors } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FILTER_TABS: (ItemCategory | 'All')[] = ['All', 'Finance', 'Shopping', 'Health', 'Education'];

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { items, folders, fetchItems, fetchFolders, selectItem } = useItemsStore();
  const { alerts, fetchAlerts, checkDeadlines } = useGuardianStore();
  const userId = user?.id || '';
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ItemCategory | 'All'>('All');

  useEffect(() => {
    if (userId) {
      fetchItems(userId).catch(() => {});
      fetchFolders(userId).catch(() => {});
      fetchAlerts(userId).catch(() => {});
    }
  }, [userId]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await Promise.all([
      fetchItems(userId).catch(() => {}),
      fetchFolders(userId).catch(() => {}),
      fetchAlerts(userId).catch(() => {}),
      checkDeadlines(userId).catch(() => {}),
    ]);
    setIsRefreshing(false);
  }, [userId]);

  const filteredItems = useMemo(() => {
    let filtered = items.filter(i => i.status !== 'archived');
    if (activeFilter !== 'All') filtered = filtered.filter(i => i.category === activeFilter);
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [items, activeFilter]);

  const stats = useMemo(() => {
    const activeAlerts = alerts.filter(a => !a.is_dismissed);
    const totalAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0);
    return { docs: items.length, alerts: activeAlerts.length, folders: folders.length, amount: totalAmount };
  }, [items, alerts, folders]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleItemPress = (item: Item) => { selectItem(item); router.push('/item/' + item.id); };
  const goToProfile = () => router.push('/(tabs)/profile');
  const goToScan = () => router.push('/(tabs)/scan');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#1A73E8']} tintColor="#1A73E8" />}>
        
        {/* Premium Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{firstName} </Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={goToProfile} activeOpacity={0.8}>
            <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.avatarGradient}>
              <User size={20} color="#FFF" strokeWidth={2} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Cards Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <LinearGradient colors={['#1A73E8', '#4285F4']} style={styles.statGradient}>
              <View style={styles.statIconWrap}><FileText size={20} color="#FFF" strokeWidth={2} /></View>
              <Text style={styles.statValueLight}>{stats.docs}</Text>
              <Text style={styles.statLabelLight}>Documents</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}><Clock size={18} color="#D97706" strokeWidth={2} /></View>
            <Text style={styles.statValue}>{stats.alerts}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}><FolderOpen size={18} color="#16A34A" strokeWidth={2} /></View>
            <Text style={styles.statValue}>{stats.folders}</Text>
            <Text style={styles.statLabel}>Folders</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F3E8FF' }]}><TrendingUp size={18} color="#9333EA" strokeWidth={2} /></View>
            <Text style={styles.statValue}>{stats.amount > 0 ? (stats.amount/1000).toFixed(0)+'K' : '0'}</Text>
            <Text style={styles.statLabel}>Total ₹</Text>
          </View>
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionMain} onPress={goToScan} activeOpacity={0.9}>
            <LinearGradient colors={['#1A73E8', '#4285F4']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.quickActionGradient}>
              <View style={styles.quickActionIcon}><Plus size={24} color="#FFF" strokeWidth={2.5} /></View>
              <View style={styles.quickActionContent}>
                <Text style={styles.quickActionTitle}>Scan Document</Text>
                <Text style={styles.quickActionSub}>AI-powered extraction</Text>
              </View>
              <ArrowUpRight size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* AI Insights Card */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightIconWrap}><Sparkles size={18} color="#9333EA" strokeWidth={2} /></View>
            <Text style={styles.insightTitle}>AI Insights</Text>
            <View style={styles.insightBadge}><Text style={styles.insightBadgeText}>Smart</Text></View>
          </View>
          <Text style={styles.insightText}>
            {stats.alerts > 0 ? ' ' + stats.alerts + ' items need your attention' : ' All caught up! No pending actions'}
          </Text>
          {stats.docs > 0 && <Text style={styles.insightSubtext}> {stats.docs} documents organized across {stats.folders} folders</Text>}
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} style={styles.filterContainer}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity key={tab} style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]} onPress={() => setActiveFilter(tab)} activeOpacity={0.7}>
              <Text style={[styles.filterText, activeFilter === tab && styles.filterTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recent Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/vault')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </View>
          
          {filteredItems.length > 0 ? (
            <View style={styles.docList}>
              {filteredItems.slice(0, 8).map((item, index) => {
                const catColor = categoryColors[item.category] || categoryColors.Other;
                return (
                  <TouchableOpacity key={item.id} style={[styles.docItem, index === filteredItems.slice(0,8).length-1 && {borderBottomWidth:0}]} onPress={() => handleItemPress(item)} activeOpacity={0.6}>
                    <View style={[styles.docIcon, { backgroundColor: catColor.light }]}>
                      <FileText size={20} color={catColor.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.docContent}>
                      <Text style={styles.docTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.docMeta} numberOfLines={1}>{item.category} {item.amount ? ' ₹'+item.amount.toLocaleString() : ''}</Text>
                    </View>
                    <ChevronRight size={18} color="#C4C4C4" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><FileText size={48} color="#D1D5DB" strokeWidth={1.5} /></View>
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptyText}>Scan your first document to get started</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={goToScan} activeOpacity={0.85}>
                <Plus size={18} color="#FFF" strokeWidth={2.5} /><Text style={styles.emptyBtnText}>Scan Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 60 : 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  headerLeft: {},
  greeting: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  userName: { fontSize: 26, fontWeight: '700', color: '#0F172A', marginTop: 2, letterSpacing: -0.5 },
  avatarBtn: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  avatarGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsScroll: { paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { width: 100, backgroundColor: '#FFF', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statCardPrimary: { width: 110, padding: 0, overflow: 'hidden' },
  statGradient: { flex: 1, width: '100%', padding: 16, alignItems: 'center', borderRadius: 20 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  statValueLight: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2, fontWeight: '500' },
  statLabelLight: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '500' },
  quickActions: { paddingHorizontal: 20, marginBottom: 20 },
  quickActionMain: { borderRadius: 20, overflow: 'hidden', shadowColor: '#1A73E8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  quickActionGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  quickActionIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  quickActionContent: { flex: 1 },
  quickActionTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  quickActionSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  insightCard: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  insightIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A', flex: 1 },
  insightBadge: { backgroundColor: '#F3E8FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  insightBadgeText: { fontSize: 11, fontWeight: '600', color: '#9333EA' },
  insightText: { fontSize: 15, color: '#334155', lineHeight: 22 },
  insightSubtext: { fontSize: 13, color: '#64748B', marginTop: 8 },
  filterContainer: { marginBottom: 16 },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  filterTab: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterTabActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  filterText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFF' },
  section: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#1A73E8' },
  docList: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  docItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  docIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  docContent: { flex: 1, marginLeft: 14 },
  docTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  docMeta: { fontSize: 13, color: '#64748B', marginTop: 3 },
  emptyState: { alignItems: 'center', paddingVertical: 48, backgroundColor: '#FFF', borderRadius: 20 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0F172A' },
  emptyText: { fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A73E8', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, gap: 8 },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});

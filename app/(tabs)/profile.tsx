import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Shield, HelpCircle, LogOut, ChevronRight, Lock, FileText, Settings, Info, Star, Moon } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useItemsStore } from '../../stores/itemsStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, isLoading, updateNotificationSettings } = useAuthStore();
  const { items, reset: resetItems } = useItemsStore();
  
  const userName = profile?.full_name || 'User';
  const userEmail = profile?.email || user?.email || '';
  const [pushEnabled, setPushEnabled] = useState(profile?.push_notifications_enabled ?? true);

  const handlePushToggle = async (value: boolean) => {
    setPushEnabled(value);
    try {
      await updateNotificationSettings({ 
        push_notifications_enabled: value, 
        reminder_7day_enabled: value, 
        reminder_1day_enabled: value 
      });
    } catch {
      setPushEnabled(!value);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out', 
      'Are you sure you want to sign out?', 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign out', 
          style: 'destructive', 
          onPress: async () => { 
            await signOut(); 
            resetItems(); 
            router.replace('/(auth)/login'); 
          } 
        },
      ]
    );
  };

  const totalDocs = items.length;
  const completedDocs = items.filter(i => i.status === 'paid').length;
  const pendingDocs = items.filter(i => i.status === 'new').length;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
            <Settings size={22} color="#5F6368" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(userName)}</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Star size={12} color="#FFF" fill="#FFF" />
            </View>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalDocs}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#34A853' }]}>{completedDocs}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EA8600' }]}>{pendingDocs}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>
        <View style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#FEF7E0' }]}>
              <Bell size={18} color="#EA8600" strokeWidth={2} />
            </View>
            <Text style={styles.menuTitle}>Push Notifications</Text>
            <Switch 
              value={pushEnabled} 
              onValueChange={handlePushToggle} 
              trackColor={{ false: '#E0E0E0', true: '#A8DAB5' }} 
              thumbColor={pushEnabled ? '#34A853' : '#FAFAFA'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.6}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#E8F0FE' }]}>
              <Moon size={18} color="#1A73E8" strokeWidth={2} />
            </View>
            <Text style={styles.menuTitle}>Dark Mode</Text>
            <View style={styles.menuBadge}>
              <Text style={styles.menuBadgeText}>Coming soon</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Security</Text>
        </View>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.6}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#E6F4EA' }]}>
              <Lock size={18} color="#34A853" strokeWidth={2} />
            </View>
            <Text style={styles.menuTitle}>Change Password</Text>
            <ChevronRight size={20} color="#BDC1C6" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.6}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#E8F0FE' }]}>
              <Shield size={18} color="#1A73E8" strokeWidth={2} />
            </View>
            <Text style={styles.menuTitle}>Privacy Settings</Text>
            <ChevronRight size={20} color="#BDC1C6" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Support</Text>
        </View>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.6}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#F3E8FD' }]}>
              <HelpCircle size={18} color="#A142F4" strokeWidth={2} />
            </View>
            <Text style={styles.menuTitle}>Help Center</Text>
            <ChevronRight size={20} color="#BDC1C6" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.6}>
            <View style={[styles.menuIconWrap, { backgroundColor: '#E8F0FE' }]}>
              <Info size={18} color="#1A73E8" strokeWidth={2} />
            </View>
            <Text style={styles.menuTitle}>About GryLin</Text>
            <ChevronRight size={20} color="#BDC1C6" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity 
          style={styles.signOutBtn} 
          onPress={handleSignOut} 
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#EA4335" strokeWidth={2} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA',
  },
  scrollContent: { 
    paddingBottom: 20,
  },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '600', 
    color: '#202124',
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: { 
    marginHorizontal: 20, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#1A73E8', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  avatarText: { 
    fontSize: 28, 
    fontWeight: '600', 
    color: '#FFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FBBC04',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  userName: { 
    fontSize: 22, 
    fontWeight: '600', 
    color: '#202124',
    marginBottom: 4,
  },
  userEmail: { 
    fontSize: 14, 
    color: '#5F6368',
    marginBottom: 20,
  },
  statsRow: { 
    flexDirection: 'row', 
    backgroundColor: '#F8F9FA', 
    borderRadius: 14, 
    padding: 16,
    width: '100%',
  },
  statItem: { 
    flex: 1, 
    alignItems: 'center',
  },
  statValue: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#1A73E8',
    marginBottom: 2,
  },
  statLabel: { 
    fontSize: 12, 
    color: '#5F6368',
  },
  statDivider: { 
    width: 1, 
    backgroundColor: '#E8EAED', 
    marginVertical: 4,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6368',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: { 
    marginHorizontal: 20, 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    gap: 14,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '500', 
    color: '#202124',
  },
  menuBadge: {
    backgroundColor: '#F1F3F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5F6368',
  },
  menuDivider: { 
    height: 1, 
    backgroundColor: '#F1F3F4', 
    marginLeft: 70,
  },
  signOutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginHorizontal: 20, 
    padding: 16, 
    borderRadius: 16, 
    backgroundColor: '#FFF', 
    gap: 10,
    borderWidth: 1,
    borderColor: '#FCE8E6',
    marginBottom: 16,
  },
  signOutText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#EA4335',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#80868B',
  },
});

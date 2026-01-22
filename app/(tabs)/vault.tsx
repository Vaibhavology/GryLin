import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Modal, Pressable, Alert, Dimensions, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, X, FileText, Plus, Folder, FolderPlus, MoreVertical, ArrowLeft, Trash2, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '../../stores/authStore';
import { useItemsStore } from '../../stores/itemsStore';
import { useAlertStore } from '../../stores/alertStore';
import { Item, VaultFolder } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FOLDER_COLORS = [
  { bg: '#E6F0FF', icon: '#0066FF' },
  { bg: '#D1FAE5', icon: '#10B981' },
  { bg: '#FFEDD5', icon: '#F97316' },
  { bg: '#EDE9FE', icon: '#8B5CF6' },
  { bg: '#FCE7F3', icon: '#EC4899' },
  { bg: '#CCFBF1', icon: '#14B8A6' },
];

export default function VaultScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, folders, fetchItems, fetchFolders, selectItem, addFolder, removeFolder } = useItemsStore();
  const { showAlert } = useAlertStore();
  const userId = user?.id || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState<VaultFolder | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (userId) { fetchItems(userId).catch(() => {}); fetchFolders(userId).catch(() => {}); }
      return () => { setCurrentFolderId(null); setSearchQuery(''); };
    }, [userId])
  );

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    await Promise.all([fetchItems(userId).catch(() => {}), fetchFolders(userId).catch(() => {})]);
    setIsRefreshing(false);
  }, [userId]);

  const unfiledCount = useMemo(() => items.filter(i => !i.folder_id).length, [items]);

  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    if (currentFolderId === 'unfiled') return { id: 'unfiled', name: 'Unfiled', user_id: userId, created_at: '', item_count: unfiledCount } as VaultFolder;
    return folders.find(f => f.id === currentFolderId) || null;
  }, [currentFolderId, folders, userId, unfiledCount]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (currentFolderId === 'unfiled') result = items.filter(i => !i.folder_id);
    else if (currentFolderId) result = items.filter(i => i.folder_id === currentFolderId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [items, currentFolderId, searchQuery]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !userId) return;
    try {
      await addFolder(newFolderName.trim(), userId);
      showAlert('Folder created', 'success');
      setNewFolderName(''); setShowCreateFolder(false);
      await fetchFolders(userId);
    } catch { showAlert('Failed to create folder', 'error'); }
  };

  const handleDeleteFolder = () => {
    if (!showFolderMenu) return;
    Alert.alert('Delete Folder', 'Delete this folder?', [
      { text: 'Cancel', style: 'cancel', onPress: () => setShowFolderMenu(null) },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await removeFolder(showFolderMenu.id);
          showAlert('Folder deleted', 'success');
          if (currentFolderId === showFolderMenu.id) setCurrentFolderId(null);
          setShowFolderMenu(null);
          if (userId) await fetchFolders(userId);
        } catch { showAlert('Failed to delete', 'error'); }
      }},
    ]);
  };

  const handleItemPress = (item: Item) => { selectItem(item); router.push('/item/' + item.id); };
  const getFolderColor = (i: number) => FOLDER_COLORS[i % FOLDER_COLORS.length];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {currentFolderId ? (
          <View style={styles.folderHeader}>
            <TouchableOpacity onPress={() => setCurrentFolderId(null)} style={styles.backBtn}>
              <ArrowLeft size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{currentFolder?.name}</Text>
              <Text style={styles.headerSub}>{filteredItems.length} files</Text>
            </View>
          </View>
        ) : (
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Vault</Text>
            <Text style={styles.headerSub}>{folders.length} folders</Text>
          </View>
        )}
        <View style={styles.headerActions}>
          {!currentFolderId && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowCreateFolder(true)}>
              <FolderPlus size={22} color="#64748B" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/scan')}>
            <Plus size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={20} color="#94A3B8" />
          <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor="#94A3B8" value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color="#94A3B8" /></TouchableOpacity>}
        </View>
      </View>

      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#0066FF']} />}>
        {!currentFolderId && !searchQuery && (
          <View style={styles.section}>
            {folders.length === 0 && unfiledCount === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}><Folder size={56} color="#CBD5E1" /></View>
                <Text style={styles.emptyTitle}>Your vault is empty</Text>
                <Text style={styles.emptyText}>Scan documents to organize them</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/scan')}>
                  <Text style={styles.emptyBtnText}>Scan Document</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {folders.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Folders</Text>
                    <View style={styles.grid}>
                      {folders.map((folder, i) => {
                        const c = getFolderColor(i);
                        return (
                          <TouchableOpacity key={folder.id} style={styles.folderCard} onPress={() => setCurrentFolderId(folder.id)}>
                            <View style={[styles.folderIcon, { backgroundColor: c.bg }]}><Folder size={26} color={c.icon} /></View>
                            <Text style={styles.folderName} numberOfLines={1}>{folder.name}</Text>
                            <Text style={styles.folderCount}>{folder.item_count || 0} files</Text>
                            <TouchableOpacity style={styles.menuBtn} onPress={() => setShowFolderMenu(folder)}><MoreVertical size={18} color="#94A3B8" /></TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
                {unfiledCount > 0 && (
                  <TouchableOpacity style={styles.unfiledCard} onPress={() => setCurrentFolderId('unfiled')}>
                    <View style={styles.unfiledIcon}><FileText size={22} color="#64748B" /></View>
                    <View style={styles.unfiledInfo}><Text style={styles.unfiledName}>Unfiled</Text><Text style={styles.unfiledCount}>{unfiledCount} files</Text></View>
                    <ChevronRight size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}

        {(currentFolderId || searchQuery) && (
          <View style={styles.section}>
            {filteredItems.length === 0 ? (
              <View style={styles.emptyFiles}><FileText size={48} color="#CBD5E1" /><Text style={styles.emptyFilesText}>{searchQuery ? 'No results' : 'No files'}</Text></View>
            ) : (
              filteredItems.map((item, index) => (
                <TouchableOpacity key={item.id} style={styles.fileRow} onPress={() => handleItemPress(item)}>
                  <View style={styles.fileIcon}><FileText size={22} color="#0066FF" /></View>
                  <View style={styles.fileInfo}><Text style={styles.fileName} numberOfLines={1}>{item.title}</Text><Text style={styles.fileMeta}>{item.category}</Text></View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showCreateFolder} transparent animationType="fade" onRequestClose={() => setShowCreateFolder(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowCreateFolder(false)}>
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput style={styles.modalInput} placeholder="Folder name" placeholderTextColor="#94A3B8" value={newFolderName} onChangeText={setNewFolderName} autoFocus />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => { setShowCreateFolder(false); setNewFolderName(''); }}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.createBtn, !newFolderName.trim() && { opacity: 0.5 }]} onPress={handleCreateFolder} disabled={!newFolderName.trim()}><Text style={styles.createText}>Create</Text></TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={!!showFolderMenu} transparent animationType="fade" onRequestClose={() => setShowFolderMenu(null)}>
        <Pressable style={styles.overlay} onPress={() => setShowFolderMenu(null)}>
          <View style={styles.menuModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.menuTitle}>{showFolderMenu?.name}</Text>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteFolder}><Trash2 size={20} color="#EF4444" /><Text style={styles.menuDanger}>Delete</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setShowFolderMenu(null)}><Text style={styles.menuCancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingBottom: 16 },
  folderHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0066FF', alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: 20, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, fontSize: 16, color: '#0F172A', padding: 0 },
  content: { flex: 1 },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 16, textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingVertical: 64, backgroundColor: '#FFF', borderRadius: 24 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#64748B', marginBottom: 28 },
  emptyBtn: { backgroundColor: '#0066FF', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 16 },
  emptyBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 },
  folderCard: { width: (SCREEN_WIDTH - 54) / 2, backgroundColor: '#FFF', borderRadius: 20, padding: 18, elevation: 2 },
  folderIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  folderName: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  folderCount: { fontSize: 13, color: '#64748B' },
  menuBtn: { position: 'absolute', top: 12, right: 12, padding: 4 },
  unfiledCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 24, elevation: 2 },
  unfiledIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  unfiledInfo: { flex: 1 },
  unfiledName: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  unfiledCount: { fontSize: 13, color: '#64748B' },
  fileRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderRadius: 16, marginBottom: 8 },
  fileIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#E6F0FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  fileMeta: { fontSize: 13, color: '#64748B' },
  emptyFiles: { alignItems: 'center', paddingVertical: 64 },
  emptyFilesText: { fontSize: 16, color: '#64748B', marginTop: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#FFF', borderRadius: 24, padding: 28, width: SCREEN_WIDTH - 48 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 24 },
  modalInput: { backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, color: '#0F172A', marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#64748B', padding: 14 },
  createBtn: { backgroundColor: '#0066FF', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  createText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  menuModal: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: SCREEN_WIDTH - 80 },
  menuTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  menuDanger: { fontSize: 16, color: '#EF4444', fontWeight: '600' },
  menuCancel: { alignItems: 'center', paddingVertical: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  menuCancelText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
});

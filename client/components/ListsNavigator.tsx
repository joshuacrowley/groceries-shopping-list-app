import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import PhosphorIcon from './PhosphorIcon';
import { router } from 'expo-router';
import { useTable, useValue, useSetValueCallback, useRowIds } from 'tinybase/ui-react';
import TodoListItem from '@/components/TodoListItem';
import ListCreationOptionsModal from './ListCreationOptionsModal';
import { LIST_TYPE } from '@/stores/schema';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ListsNavigatorProps {
  isMobile?: boolean;
  onCreateList?: () => void; // Deprecated - keeping for backward compatibility
}

const ListsNavigator: React.FC<ListsNavigatorProps> = ({
  isMobile = true,
  onCreateList,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Theme colors
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0';
  const filterBgColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5';
  const emptyStateColor = isDark ? 'rgba(255, 255, 255, 0.5)' : '#9E9E9E';
  const filterTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : '#616161';
  const fabBgColor = isDark ? '#1976D2' : '#2196F3';
  const modalBgColor = useThemeColor({}, 'background');
  const modalOverlayColor = isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)';
  const selectedFilterBgColor = isDark ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD';
  const selectedFilterTextColor = isDark ? '#64B5F6' : '#2196F3';
  const filterOptionTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : '#424242';
  
  // Get data from TinyBase
  const listTable = useTable('lists');
  const listIds = useRowIds('lists') || [];
  
  // Get and set primary/secondary lists
  const primaryListId = useValue('primaryList', 'deskStore');
  const secondaryListId = useValue('secondaryList', 'deskStore');
  const showSecondary = useValue('showSecondary', 'deskStore') || false;
  
  const setPrimaryList = useSetValueCallback(
    'primaryList',
    (id) => id,
    [],
    'deskStore'
  );
  
  const setSecondaryList = useSetValueCallback(
    'secondaryList',
    (id) => id,
    [],
    'deskStore'
  );
  
  const setShowSecondary = useSetValueCallback(
    'showSecondary',
    (value) => value,
    [],
    'deskStore'
  );
  
  // Get and set list type filter
  const listType = useValue('listType', 'tempStore') || 'All';
  const setListType = useSetValueCallback(
    'listType',
    (newListType) => newListType,
    [],
    'tempStore'
  );
  
  // Handle list item click
  const handleListClick = useCallback(
    (id) => {
      if (showSecondary) {
        if (id === primaryListId || id === secondaryListId) {
          // Swap primary and secondary
          setPrimaryList(secondaryListId);
          setSecondaryList(primaryListId);
        } else {
          // Set as secondary list
          setSecondaryList(id);
        }
      } else {
        // Set as primary list
        setPrimaryList(id);
        
        // Navigate to list screen
        router.push(`/(index)/list/${id}`);
      }
    },
    [showSecondary, primaryListId, secondaryListId, setPrimaryList, setSecondaryList]
  );
  
  // Handle swap between primary and secondary
  const handleSwap = useCallback(
    (id) => {
      if (id === primaryListId) {
        setPrimaryList(secondaryListId);
        setSecondaryList(primaryListId);
      } else if (id === secondaryListId) {
        setSecondaryList(primaryListId);
        setPrimaryList(secondaryListId);
      }
    },
    [primaryListId, secondaryListId, setPrimaryList, setSecondaryList]
  );
  
  // Function to filter lists by type
  const getFilteredLists = useCallback(() => {
    // Filter out Offload type lists first
    const filteredLists = Object.entries(listTable || {}).filter(
      ([_, list]) => list.type !== 'Offload'
    );
    
    if (listType === 'All') {
      return filteredLists;
    }
    
    return filteredLists.filter(
      ([_, list]) => list.type === listType
    );
  }, [listTable, listType]);
  
  // Scroll to selected list
  useEffect(() => {
    // Implementation would depend on having refs for each list item
    // This is simplified for now
  }, [primaryListId]);
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Lists</Text>
        <View style={styles.actions}>
          <Pressable 
            style={styles.actionButton}
            onPress={() => setIsFilterOpen(true)}
          >
            <PhosphorIcon name="Filter" size={20} color={iconColor} weight="bold" />
          </Pressable>
          <Pressable 
            style={styles.actionButton}
            onPress={() => {
              console.log('Header plus button pressed - opening modal');
              setIsCreateModalOpen(true);
            }}
          >
            <PhosphorIcon name="Plus" size={20} color={iconColor} weight="bold" />
          </Pressable>
        </View>
      </View>
      
      {/* Filter indicator */}
      {listType !== 'All' && (
        <View style={[styles.filterIndicator, { backgroundColor: filterBgColor, borderBottomColor: borderColor }]}>
          <Text style={[styles.filterText, { color: filterTextColor }]}>Filtered by: {listType}</Text>
          <Pressable onPress={() => setListType('All')}>
            <PhosphorIcon name="X" size={16} color={filterTextColor} weight="bold" />
          </Pressable>
        </View>
      )}
      
      {/* Lists */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {getFilteredLists().map(([id, list]) => (
          <TodoListItem
            key={id}
            id={id}
            onPress={handleListClick}
            onSwap={handleSwap}
            isSelected={id === primaryListId || id === secondaryListId}
            isPrimary={id === primaryListId}
            isSecondary={id === secondaryListId}
            showSecondary={showSecondary}
          />
        ))}
        
        {getFilteredLists().length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: emptyStateColor }]}>
              {listType === 'All' 
                ? 'No lists found. Create your first list!'
                : `No ${listType} lists found.`
              }
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Create List Button (Mobile) */}
      {isMobile && (
        <TouchableOpacity 
          style={[styles.fabButton, { backgroundColor: fabBgColor }]}
          onPress={() => {
            console.log('FAB plus button pressed - opening modal');
            setIsCreateModalOpen(true);
          }}
        >
          <PhosphorIcon name="Plus" size={24} color="#FFFFFF" weight="bold" />
        </TouchableOpacity>
      )}
      
      {/* Filter Modal */}
      <Modal
        visible={isFilterOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <Pressable 
          style={[styles.modalOverlay, { backgroundColor: modalOverlayColor }]}
          onPress={() => setIsFilterOpen(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: modalBgColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Filter Lists</Text>
              <Pressable onPress={() => setIsFilterOpen(false)}>
                <PhosphorIcon name="X" size={20} color={iconColor} weight="bold" />
              </Pressable>
            </View>
            
            <Pressable 
              style={[styles.filterOption, listType === 'All' && { backgroundColor: selectedFilterBgColor }]}
              onPress={() => {
                setListType('All');
                setIsFilterOpen(false);
              }}
            >
              <Text style={[{ color: filterOptionTextColor }, listType === 'All' && { color: selectedFilterTextColor, fontWeight: '600' }]}>All Lists</Text>
            </Pressable>
            
            {LIST_TYPE.map((type) => (
              <Pressable 
                key={type}
                style={[styles.filterOption, listType === type && { backgroundColor: selectedFilterBgColor }]}
                onPress={() => {
                  setListType(type);
                  setIsFilterOpen(false);
                }}
              >
                <Text style={[{ color: filterOptionTextColor }, listType === type && { color: selectedFilterTextColor, fontWeight: '600' }]}>{type}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* List Creation Options Modal */}
      <ListCreationOptionsModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  filterText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fabButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 8,
    width: '80%',
    maxWidth: 320,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  selectedFilter: {
    backgroundColor: '#E3F2FD',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#424242',
  },
  selectedFilterText: {
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default ListsNavigator;
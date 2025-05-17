import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
import * as PhosphorIcons from 'phosphor-react-native';
import PhosphorIcon from './PhosphorIcon';

interface IconSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
}

const IconSelector: React.FC<IconSelectorProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get all icon names from PhosphorIcons
  const [iconNames, setIconNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadIcons = () => {
      try {
        const names = Object.keys(PhosphorIcons).filter(
          name => 
            // Only include actual icon components
            typeof PhosphorIcons[name as keyof typeof PhosphorIcons] === 'function' && 
            // Skip non-icon exports
            !['Icon', 'createIcon', 'default', 'Provider', 'IconProps', 'IconWeight', 'IconBase'].includes(name)
        );
        setIconNames(names);
      } catch (error) {
        console.error('Error loading icon names:', error);
        setIconNames(['List', 'CheckCircle', 'WarningCircle', 'Info', 'Plus']);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadIcons();
  }, []);
  
  // Filter icons based on search query
  const filteredIcons = iconNames.filter(name => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const renderIconGrid = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading icons...</Text>
        </View>
      );
    }
    
    if (filteredIcons.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No icons found matching "{searchQuery}"</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.grid}>
        {filteredIcons.slice(0, 100).map(name => (
          <Pressable 
            key={name} 
            style={styles.iconItem}
            onPress={() => {
              onSelectIcon(name);
              onClose();
            }}
          >
            <View style={styles.iconWrapper}>
              <PhosphorIcon 
                name={name}
                size={24} 
                color='#424242' 
                weight='regular' 
              />
            </View>
            <Text style={styles.iconName} numberOfLines={1}>
              {name}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select an Icon</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <PhosphorIcon name="X" size={24} color="#212121" weight="bold" />
            </Pressable>
          </View>
          
          <View style={styles.searchContainer}>
            <PhosphorIcon name="MagnifyingGlass" size={20} color="#757575" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search icons..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9E9E9E"
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <PhosphorIcon name="X" size={16} color="#757575" />
              </Pressable>
            ) : null}
          </View>
          
          <Text style={styles.resultsText}>
            {filteredIcons.length} icons found
            {filteredIcons.length > 100 ? ' (showing first 100)' : ''}
          </Text>
          
          <ScrollView style={styles.scrollView}>
            {renderIconGrid()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    height: '80%',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#212121',
  },
  resultsText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 4,
  },
  iconName: {
    fontSize: 10,
    color: '#757575',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
});

export default IconSelector;
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRow } from 'tinybase/ui-react';
import PhosphorIcon from './PhosphorIcon';

const ListItem = ({ listId, onPress }) => {
  const list = useRow('lists', listId);
  
  if (!list) return null;
  
  const bgColorMap = {
    blue: '#E3F2FD',
    green: '#E8F5E9',
    red: '#FFEBEE',
    yellow: '#FFF8E1',
    purple: '#F3E5F5',
  };
  
  const bgColor = bgColorMap[list.backgroundColour || 'blue'];
  
  return (
    <Pressable 
      style={[styles.listItem, { backgroundColor: bgColor }]}
      onPress={() => onPress(listId)}
    >
      <View style={styles.listIcon}>
        <PhosphorIcon name={list.icon || 'ClipboardText'} size={24} color="#212121" />
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{list.name}</Text>
        <Text style={styles.listPurpose}>{list.purpose || 'No description'}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#757575" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listIcon: {
    marginRight: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  listPurpose: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
});

export default ListItem;
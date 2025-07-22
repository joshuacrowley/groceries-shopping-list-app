import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRow, useLocalRowIds } from 'tinybase/ui-react';
import PhosphorIcon from './PhosphorIcon';
import { 
  chakraColors, 
  typography, 
  spacing, 
  radii, 
  shadows 
} from '@/constants/Colors';

const ListItem = ({ listId, onPress }) => {
  const list = useRow('lists', listId);
  const todoIds = useLocalRowIds('todoList', listId);
  const todoCount = todoIds?.length || 0;
  
  if (!list) return null;
  
  // Chakra UI color mappings for backgrounds
  const bgColorMap = {
    blue: chakraColors.blue[50],
    green: chakraColors.green[50], 
    red: chakraColors.red[50],
    yellow: chakraColors.yellow[50],
    purple: chakraColors.purple[50],
    teal: chakraColors.teal[50],
    gray: chakraColors.gray[50],
    orange: chakraColors.orange[50],
    pink: chakraColors.pink[50],
    cyan: chakraColors.cyan[50],
  };
  
  // Border colors for selected state
  const borderColorMap = {
    blue: chakraColors.blue[500],
    green: chakraColors.green[500],
    red: chakraColors.red[500], 
    yellow: chakraColors.yellow[500],
    purple: chakraColors.purple[500],
    teal: chakraColors.teal[500],
    gray: chakraColors.gray[500],
    orange: chakraColors.orange[500],
    pink: chakraColors.pink[500],
    cyan: chakraColors.cyan[500],
  };
  
  const bgColor = bgColorMap[list.backgroundColour] || chakraColors.blue[50];
  const borderColor = borderColorMap[list.backgroundColour] || chakraColors.blue[500];
  
  return (
    <Pressable 
      style={[styles.listItem, { backgroundColor: bgColor }]}
      onPress={() => onPress(listId)}
    >
      <View style={[styles.listIconContainer, { backgroundColor: borderColor }]}>
        <PhosphorIcon 
          name={list.icon || 'ClipboardText'} 
          size={24} 
          color={chakraColors.white} 
        />
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{list.name}</Text>
      </View>
      <View style={styles.rightSection}>
        <View style={styles.todoCountBadge}>
          <Text style={styles.todoCountText}>{todoCount}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={chakraColors.gray[400]} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4], // 16px
    borderRadius: radii.xl, // 12px
    marginBottom: spacing[3], // 12px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listIconContainer: {
    marginRight: spacing[3], // 12px
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listName: {
    fontSize: typography.fontSizes.lg, // 18px
    fontWeight: typography.fontWeights.bold,
    color: chakraColors.gray[800],
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2], // 8px
  },
  todoCountBadge: {
    backgroundColor: chakraColors.gray[100],
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[2], // 8px
    borderRadius: radii.lg, // 8px
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoCountText: {
    fontSize: typography.fontSizes.md, // 16px
    fontWeight: typography.fontWeights.bold,
    color: chakraColors.gray[700],
  },
});

export default ListItem;
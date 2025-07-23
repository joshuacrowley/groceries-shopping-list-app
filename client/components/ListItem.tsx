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
import { useColorScheme } from '@/hooks/useColorScheme';

const ListItem = ({ listId, onPress }) => {
  const list = useRow('lists', listId);
  const todoIds = useLocalRowIds('todoList', listId);
  const todoCount = todoIds?.length || 0;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  if (!list) return null;
  
  // Chakra UI color mappings for backgrounds - adjusted for dark mode
  const bgColorMap = {
    blue: isDark ? 'rgba(66, 153, 225, 0.15)' : chakraColors.blue[50],
    green: isDark ? 'rgba(72, 187, 120, 0.15)' : chakraColors.green[50], 
    red: isDark ? 'rgba(245, 101, 101, 0.15)' : chakraColors.red[50],
    yellow: isDark ? 'rgba(236, 201, 75, 0.15)' : chakraColors.yellow[50],
    purple: isDark ? 'rgba(159, 122, 234, 0.15)' : chakraColors.purple[50],
    teal: isDark ? 'rgba(56, 178, 172, 0.15)' : chakraColors.teal[50],
    gray: isDark ? 'rgba(160, 174, 192, 0.15)' : chakraColors.gray[50],
    orange: isDark ? 'rgba(237, 137, 54, 0.15)' : chakraColors.orange[50],
    pink: isDark ? 'rgba(237, 100, 166, 0.15)' : chakraColors.pink[50],
    cyan: isDark ? 'rgba(0, 188, 212, 0.15)' : chakraColors.cyan[50],
  };
  
  // Border colors for selected state - slightly adjusted for dark mode
  const borderColorMap = {
    blue: isDark ? chakraColors.blue[400] : chakraColors.blue[500],
    green: isDark ? chakraColors.green[400] : chakraColors.green[500],
    red: isDark ? chakraColors.red[400] : chakraColors.red[500], 
    yellow: isDark ? chakraColors.yellow[400] : chakraColors.yellow[500],
    purple: isDark ? chakraColors.purple[400] : chakraColors.purple[500],
    teal: isDark ? chakraColors.teal[400] : chakraColors.teal[500],
    gray: isDark ? chakraColors.gray[400] : chakraColors.gray[500],
    orange: isDark ? chakraColors.orange[400] : chakraColors.orange[500],
    pink: isDark ? chakraColors.pink[400] : chakraColors.pink[500],
    cyan: isDark ? chakraColors.cyan[400] : chakraColors.cyan[500],
  };
  
  const bgColor = bgColorMap[list.backgroundColour as keyof typeof bgColorMap] || (isDark ? 'rgba(66, 153, 225, 0.15)' : chakraColors.blue[50]);
  const borderColor = borderColorMap[list.backgroundColour as keyof typeof borderColorMap] || (isDark ? chakraColors.blue[400] : chakraColors.blue[500]);
  const textColor = isDark ? chakraColors.gray[100] : chakraColors.gray[800];
  const countBadgeBg = isDark ? 'rgba(255, 255, 255, 0.1)' : chakraColors.gray[100];
  const countTextColor = isDark ? chakraColors.gray[300] : chakraColors.gray[700];
  const chevronColor = isDark ? chakraColors.gray[500] : chakraColors.gray[400];
  const shadowColor = isDark ? 'transparent' : '#000';
  
  return (
    <Pressable 
      style={[styles.listItem, { backgroundColor: bgColor, shadowColor }]}
      onPress={() => onPress(listId)}
    >
      <View style={[styles.listIconContainer, { backgroundColor: borderColor }]}>
        <PhosphorIcon 
          name={(list.icon || 'ClipboardText') as string} 
          size={24} 
          color={chakraColors.white} 
        />
      </View>
      <View style={styles.listInfo}>
        <Text style={[styles.listName, { color: textColor }]}>{list.name}</Text>
      </View>
      <View style={styles.rightSection}>
        <View style={[styles.todoCountBadge, { backgroundColor: countBadgeBg }]}>
          <Text style={[styles.todoCountText, { color: countTextColor }]}>{todoCount}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={chevronColor} />
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
    fontWeight: typography.fontWeights.bold as any,
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
    fontWeight: typography.fontWeights.bold as any,
    color: chakraColors.gray[700],
  },
});

export default ListItem;
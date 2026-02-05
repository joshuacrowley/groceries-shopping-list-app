import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRow, useLocalRowIds } from 'tinybase/ui-react';
import PhosphorIcon from './PhosphorIcon';
import { chakraColors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Brand colors matching ListCard
const BRAND_COLORS = {
  blue: '#3B82F6',
  green: '#22C55E',
  red: '#EF4444',
  yellow: '#F59E0B',
  purple: '#8B5CF6',
  teal: '#14B8A6',
  orange: '#F97316',
  pink: '#EC4899',
  cyan: '#06B6D4',
  gray: '#6B7280',
};

const ListItem = ({ listId, onPress }) => {
  const list = useRow('lists', listId);
  const todoIds = useLocalRowIds('todoList', listId);
  const todoCount = todoIds?.length || 0;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  if (!list) return null;
  
  const iconBgColor = BRAND_COLORS[list.backgroundColour as keyof typeof BRAND_COLORS] || BRAND_COLORS.blue;
  const bgColor = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const countTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const chevronColor = isDark ? '#6B7280' : '#9CA3AF';
  
  // Check if icon is an emoji or a Phosphor icon name
  const iconValue = String(list.icon || '');
  const isEmoji = iconValue && /^\p{Emoji}/u.test(iconValue);
  const isProbablyIconName = iconValue && /^[A-Z][a-zA-Z]+$/.test(iconValue);
  const iconName = isProbablyIconName ? iconValue : (isEmoji ? null : 'ListChecks');
  
  return (
    <Pressable 
      style={[styles.listItem, { backgroundColor: bgColor }]}
      onPress={() => onPress(listId)}
    >
      <View style={[styles.listIconContainer, { backgroundColor: iconBgColor }]}>
        {isEmoji ? (
          <Text style={styles.emojiIcon}>{iconValue}</Text>
        ) : (
          <PhosphorIcon 
            name={iconName as string} 
            size={16} 
            color="#FFFFFF"
          />
        )}
      </View>
      <View style={styles.listInfo}>
        <Text style={[styles.listName, { color: textColor }]}>{list.name}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={[styles.todoCountText, { color: countTextColor }]}>{todoCount}</Text>
        <Feather name="chevron-right" size={16} color={chevronColor} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  listIconContainer: {
    marginRight: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 16,
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listName: {
    fontSize: 16,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todoCountText: {
    fontSize: 15,
    fontWeight: '400',
    minWidth: 20,
    textAlign: 'right',
  },
});

export default ListItem;
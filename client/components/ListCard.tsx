import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRow, useLocalRowIds } from 'tinybase/ui-react';
import PhosphorIcon from './PhosphorIcon';
import { appleBlue, appleGreen, appleRed } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export const CARD_WIDTH = 0; // Not used for vertical
export const CARD_MARGIN = 0; // Not used for vertical

// Brand-inspired accent colors
const BRAND_COLORS = {
  blue: '#3B82F6',    // Vibrant blue
  green: '#22C55E',   // Fresh green
  red: '#EF4444',     // Warm red
  yellow: '#F59E0B',  // Amber/gold
  purple: '#8B5CF6',  // Rich purple
  teal: '#14B8A6',    // Teal
  orange: '#F97316',  // Orange
  pink: '#EC4899',    // Pink
  cyan: '#06B6D4',    // Cyan
  gray: '#6B7280',    // Gray
};

const ListCard = ({ listId, onPress }) => {
  const list = useRow('lists', listId);
  const todoIds = useLocalRowIds('todoList', listId);
  const todoCount = todoIds?.length || 0;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  if (!list) return null;
  
  const accentColor = BRAND_COLORS[list.backgroundColour as keyof typeof BRAND_COLORS] || BRAND_COLORS.blue;
  const cardBg = isDark ? '#1F2937' : '#FFFFFF';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';
  const chevronColor = isDark ? '#6B7280' : '#9CA3AF';
  
  // Check if icon is an emoji or a Phosphor icon name
  // Emojis are typically short unicode sequences, icon names are PascalCase strings
  const iconValue = String(list.icon || '');
  const isEmoji = iconValue && /^\p{Emoji}/u.test(iconValue);
  const isProbablyIconName = iconValue && /^[A-Z][a-zA-Z]+$/.test(iconValue);
  const iconName = isProbablyIconName ? iconValue : (isEmoji ? null : 'ListChecks');
  
  return (
    <Pressable 
      style={[styles.card, { backgroundColor: cardBg }]}
      onPress={() => onPress(listId)}
    >
      {/* Left: Icon */}
      <View style={[styles.iconContainer, { backgroundColor: accentColor }]}>
        {isEmoji ? (
          <Text style={styles.emojiIcon}>{iconValue}</Text>
        ) : (
          <PhosphorIcon 
            name={iconName as string} 
            size={22} 
            color="#FFFFFF"
          />
        )}
      </View>
      
      {/* Center: Content */}
      <View style={styles.cardContent}>
        <Text style={[styles.listName, { color: textColor }]} numberOfLines={1}>
          {list.name}
        </Text>
        <Text style={[styles.listMeta, { color: subtextColor }]}>
          {todoCount} {todoCount === 1 ? 'item' : 'items'} · {list.type || 'Home'}
        </Text>
      </View>
      
      {/* Right: Chevron */}
      <Feather name="chevron-right" size={20} color={chevronColor} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  listName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  listMeta: {
    fontSize: 14,
    marginTop: 2,
  },
});

export default ListCard;

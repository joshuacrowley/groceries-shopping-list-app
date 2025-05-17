import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import DynamicIcon from './DynamicIcon';
import { useLocalRowIds, useRow } from 'tinybase/ui-react';

interface TodoListItemProps {
  id: string;
  onPress: (id: string) => void;
  isSelected?: boolean;
  isPrimary?: boolean;
  isSecondary?: boolean;
  showSecondary?: boolean;
  onSwap?: (id: string) => void;
}

const TodoListItem: React.FC<TodoListItemProps> = ({
  id,
  onPress,
  isSelected = false,
  isPrimary = false,
  isSecondary = false,
  showSecondary = false,
  onSwap,
}) => {
  const list = useRow('lists', id);
  const todoIds = useLocalRowIds('todoList', id) || [];
  const [todoCount, setTodoCount] = useState(todoIds.length);
  const [isPressed, setIsPressed] = useState(false);
  const countAnimation = useState(new Animated.Value(1))[0];
  
  // Update count with animation when todoIds changes
  useEffect(() => {
    if (todoIds.length !== todoCount) {
      // Animation sequence
      Animated.sequence([
        Animated.timing(countAnimation, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(countAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
      
      setTodoCount(todoIds.length);
    }
  }, [todoIds.length, todoCount]);
  
  if (!list) return null;
  
  // Get appropriate background color and icon based on list type
  const colorMap = {
    blue: { bg: '#E3F2FD', border: '#2196F3', text: '#1976D2' },
    green: { bg: '#E8F5E9', border: '#4CAF50', text: '#388E3C' },
    red: { bg: '#FFEBEE', border: '#F44336', text: '#D32F2F' },
    yellow: { bg: '#FFF8E1', border: '#FFC107', text: '#FFA000' },
    purple: { bg: '#F3E5F5', border: '#9C27B0', text: '#7B1FA2' },
  };
  
  // Map list types to default icons if not specified
  const typeToIconMap = {
    'Shopping': 'ShoppingCart',
    'Today': 'CalendarCheck',
    'Recipes': 'CookingPot',
    'Meals': 'ForkKnife',
    'Weekend': 'Sunglasses',
    'Info': 'Info',
    'General': 'ClipboardText'
  };
  
  const colors = colorMap[list.backgroundColour || 'blue'];
  const defaultIcon = typeToIconMap[list.type] || 'ClipboardText';
  
  // Render indicator for primary/secondary status
  const renderIndicator = () => {
    if (!showSecondary) return null;
    
    const indicatorStyle = [
      styles.indicator,
      { backgroundColor: isPrimary ? '#2196F3' : (isSecondary ? '#4CAF50' : '#E0E0E0') }
    ];
    
    if (isPrimary || isSecondary) {
      return (
        <Pressable 
          style={indicatorStyle}
          onPress={(e) => {
            e.stopPropagation();
            if (onSwap) onSwap(id);
          }}
        >
          <Text style={styles.indicatorText}>
            {isPrimary ? 'L' : 'R'}
          </Text>
        </Pressable>
      );
    }
    
    return null;
  };
  
  return (
    <Pressable
      style={[
        styles.container,
        { 
          backgroundColor: isSelected ? colors.bg : '#FFFFFF',
          borderColor: isSelected ? colors.border : '#E0E0E0',
        },
        isPressed && styles.pressed
      ]}
      onPress={() => onPress(id)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
          {list.icon ? (
            <Text style={styles.icon}>{list.icon}</Text>
          ) : list.iconName ? (
            <DynamicIcon 
              iconName={list.iconName} 
              size={24} 
              color={colors.text} 
              weight="regular"
            />
          ) : (
            <DynamicIcon 
              iconName={defaultIcon} 
              size={24} 
              color={colors.text} 
              weight="regular"
            />
          )}
        </View>
        
        <View style={styles.textContainer}>
          <Text 
            style={styles.title} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {list.name}
          </Text>
          {list.purpose ? (
            <Text 
              style={styles.subtitle} 
              numberOfLines={1} 
              ellipsizeMode="tail"
            >
              {list.purpose}
            </Text>
          ) : null}
        </View>
        
        {renderIndicator()}
        
        <Animated.View style={[
          styles.countContainer,
          { transform: [{ scale: countAnimation }] }
        ]}>
          <Text style={styles.countText}>{todoCount}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  indicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  countContainer: {
    backgroundColor: '#F5F5F5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
});

export default TodoListItem;
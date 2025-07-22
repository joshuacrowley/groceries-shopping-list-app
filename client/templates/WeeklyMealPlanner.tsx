import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  useStore,
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useTable,
} from 'tinybase/ui-react';
import { Feather } from '@expo/vector-icons';
import PhosphorIcon from '@/components/PhosphorIcon';
import { 
  chakraColors, 
  typography, 
  spacing, 
  radii, 
  shadows 
} from '@/constants/Colors';

const { width } = Dimensions.get('window');

// Chakra UI compatible color mappings - matching web version exactly
const COLORS = {
  lightMint: chakraColors.teal[50], // Very light teal for badges
  white: chakraColors.white,
  darkGray: chakraColors.teal[800], // Darker teal text to match web
  mediumGray: chakraColors.gray[500],
  lightGray: chakraColors.gray[200],
  teal: chakraColors.teal[300],
  darkTeal: chakraColors.teal[500],
  red: chakraColors.red[500],
  background: chakraColors.teal[50], // Light teal background like web
  inputBg: chakraColors.white,
  containerBg: chakraColors.teal[50], // Main container background
  badgeText: chakraColors.teal[600], // Darker teal for badge text
};

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday', 
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const MEAL_TYPES = {
  A: 'BREAKFAST',
  B: 'LUNCH', 
  C: 'DINNER',
  D: 'SNACK',
  E: 'OTHER',
};

const MEAL_ICONS = {
  A: 'Coffee',
  B: 'ForkKnife',
  C: 'CookingPot', 
  D: 'Hamburger',
  E: 'ForkKnife',
};

interface MealItemProps {
  id: string;
}

const MealItem: React.FC<MealItemProps> = ({ id }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const mealData = useRow('todos', id);
  const updateMeal = useSetRowCallback(
    'todos',
    id,
    (updates) => ({
      ...mealData,
      category: mealData?.category || 'Monday',
      ...updates
    }),
    [mealData]
  );
  const deleteMeal = useDelRowCallback('todos', id);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleToggleDone = useCallback(() => {
    updateMeal({ done: !mealData?.done });
  }, [updateMeal, mealData?.done]);

  if (!mealData) return null;

  const opacity = mealData.done ? 0.6 : 1;
  const iconName = MEAL_ICONS[mealData.type as keyof typeof MEAL_ICONS] || 'ForkKnife';
  const mealTypeName = MEAL_TYPES[mealData.type as keyof typeof MEAL_TYPES] || 'OTHER';

  return (
    <View style={[styles.mealContainer, { opacity }]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealLeft}>
          <PhosphorIcon name={iconName} size={20} color={COLORS.darkGray} />
          <Text style={styles.mealText}>{mealData.text}</Text>
        </View>
        
        <View style={styles.mealRight}>
          <View style={styles.mealTypeBadge}>
            <Text style={styles.mealTypeText}>{mealTypeName}</Text>
          </View>
          <Pressable onPress={handleToggleDone} style={styles.checkbox}>
            <Feather 
              name={mealData.done ? 'check-square' : 'square'} 
              size={18} 
              color={mealData.done ? COLORS.darkTeal : COLORS.mediumGray} 
            />
          </Pressable>
          <Pressable onPress={toggleExpanded} style={styles.expandButton}>
            <Feather 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={18} 
              color={COLORS.mediumGray} 
            />
          </Pressable>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.fieldLabel}>Notes:</Text>
          <TextInput
            value={mealData.notes || ''}
            onChangeText={(notes) => updateMeal({ notes })}
            placeholder="Add notes..."
            style={styles.notesInput}
            multiline
            numberOfLines={3}
            placeholderTextColor={COLORS.mediumGray}
          />
          <Pressable onPress={deleteMeal} style={styles.deleteButton}>
            <Feather name="trash-2" size={16} color={COLORS.white} />
            <Text style={styles.deleteButtonText}>Delete Meal</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

interface WeeklyMealPlannerProps {
  listId?: string;
}

const WeeklyMealPlanner: React.FC<WeeklyMealPlannerProps> = ({ 
  listId = 'meal-plan-list' 
}) => {
  const [newMeal, setNewMeal] = useState({ 
    text: '', 
    type: 'A', 
    category: 'Monday' 
  });
  
  const todosTable = useTable('todos');
  const todoIds = useLocalRowIds('todoList', listId) || [];
  const listData = useRow('lists', listId);

  const { mealsByDay, totalMeals } = useMemo(() => {
    const grouped = DAYS_OF_WEEK.reduce<Record<string, Record<string, string[]>>>((acc, day) => {
      acc[day] = {
        A: [], // Breakfast
        B: [], // Lunch  
        C: [], // Dinner
        D: [], // Snack
        E: [], // Other
      };
      return acc;
    }, {});

    let total = 0;

    todoIds.forEach((id) => {
      const meal = todosTable?.[id];
      if (meal) {
        total++;
        const category = DAYS_OF_WEEK.includes(meal.category as string) 
          ? meal.category as string 
          : 'Monday';
        const mealType = meal.type || 'A';
        grouped[category][mealType].push(id);
      }
    });

    return { mealsByDay: grouped, totalMeals: total };
  }, [todoIds, todosTable]);

  const addMeal = useAddRowCallback(
    'todos',
    (meal: typeof newMeal) => ({
      text: meal.text,
      type: meal.type,
      category: DAYS_OF_WEEK.includes(meal.category) ? meal.category : 'Monday',
      list: listId,
      done: false,
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewMeal({ text: '', type: 'A', category: 'Monday' });
      }
    }
  );

  const handleAddMeal = useCallback(() => {
    if (newMeal.text.trim() !== '') {
      addMeal(newMeal);
    }
  }, [addMeal, newMeal]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Meals</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>{totalMeals} MEALS</Text>
          </View>
        </View>

        <View style={styles.addMealSection}>
          <TextInput
            value={newMeal.text}
            onChangeText={(text) => setNewMeal({ ...newMeal, text })}
            placeholder="Meal name"
            style={styles.mealNameInput}
            placeholderTextColor={COLORS.mediumGray}
          />
          <View style={styles.dropdownsRow}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {MEAL_TYPES[newMeal.type as keyof typeof MEAL_TYPES]}
              </Text>
              <Feather name="chevron-down" size={16} color={COLORS.mediumGray} />
            </View>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>{newMeal.category}</Text>
              <Feather name="chevron-down" size={16} color={COLORS.mediumGray} />
            </View>
            <Pressable onPress={handleAddMeal} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {DAYS_OF_WEEK.map((day, index) => {
          const dayMeals = mealsByDay[day] || {};
          const hasAnyMeals = Object.values(dayMeals).some(meals => meals.length > 0);
          
          return (
            <View key={day} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayNumber}>{index + 1}</Text>
                <Text style={styles.dayName}>{day}</Text>
              </View>
              <View style={styles.mealsList}>
                {Object.entries(MEAL_TYPES).map(([typeKey, typeName]) => {
                  const mealsOfType = dayMeals[typeKey] || [];
                  if (mealsOfType.length === 0) return null;
                  
                  return (
                    <View key={`${day}-${typeKey}`} style={styles.mealTypeSection}>
                      {mealsOfType.map((id) => (
                        <MealItem key={id} id={id} />
                      ))}
                    </View>
                  );
                })}
              </View>
              {index < DAYS_OF_WEEK.length - 1 && <View style={styles.dayDivider} />}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    padding: spacing[5], // 20px - matching web padding
    backgroundColor: COLORS.containerBg,
    borderRadius: radii.lg, // 8px
    margin: spacing[4], // 16px margin around container
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6], // 24px
  },
  title: {
    fontSize: typography.fontSizes['2xl'], // 24px
    fontWeight: typography.fontWeights.bold,
    color: COLORS.darkGray,
  },
  totalBadge: {
    backgroundColor: COLORS.lightMint,
    paddingHorizontal: spacing[4], // 16px
    paddingVertical: spacing[2], // 8px
    borderRadius: radii.md, // 6px
  },
  totalText: {
    color: COLORS.badgeText,
    fontWeight: typography.fontWeights.semibold,
    fontSize: typography.fontSizes.sm, // 14px
  },
  addMealSection: {
    backgroundColor: COLORS.white,
    borderRadius: radii.xl, // 12px
    padding: spacing[4], // 16px
    marginBottom: spacing[6], // 24px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealNameInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: radii.md, // 6px
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[3], // 12px
    fontSize: typography.fontSizes.md, // 16px
    color: COLORS.darkGray,
    marginBottom: spacing[3], // 12px
    backgroundColor: COLORS.inputBg,
  },
  dropdownsRow: {
    flexDirection: 'row',
    gap: spacing[3], // 12px
    alignItems: 'center',
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: radii.md, // 6px
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[3], // 12px
    backgroundColor: COLORS.inputBg,
  },
  dropdownText: {
    fontSize: typography.fontSizes.sm, // 14px
    color: COLORS.darkGray,
  },
  addButton: {
    backgroundColor: COLORS.darkTeal,
    paddingHorizontal: spacing[6], // 24px
    paddingVertical: spacing[3], // 12px
    borderRadius: radii.md, // 6px
    minWidth: 80,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: typography.fontWeights.semibold,
    fontSize: typography.fontSizes.md, // 16px
  },
  daySection: {
    marginBottom: spacing[6], // 24px
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3], // 12px
  },
  dayNumber: {
    fontSize: typography.fontSizes.xl, // 20px
    fontWeight: typography.fontWeights.bold,
    color: COLORS.darkGray,
    width: 32,
    textAlign: 'center',
  },
  dayName: {
    fontSize: typography.fontSizes.xl, // 20px
    fontWeight: typography.fontWeights.bold,
    color: COLORS.darkGray,
    marginLeft: spacing[3], // 12px
  },
  mealsList: {
    gap: spacing[2], // 8px
  },
  mealTypeSection: {
    gap: spacing[2], // 8px within each meal type
  },
  mealContainer: {
    backgroundColor: COLORS.white,
    borderRadius: radii.xl, // 12px
    padding: spacing[4], // 16px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealText: {
    fontSize: typography.fontSizes.md, // 16px
    fontWeight: typography.fontWeights.semibold,
    color: COLORS.darkGray,
    marginLeft: spacing[2], // 8px
  },
  mealRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2], // 8px
  },
  mealTypeBadge: {
    backgroundColor: COLORS.lightMint,
    paddingHorizontal: spacing[2], // 8px
    paddingVertical: spacing[1], // 4px
    borderRadius: radii.sm, // 2px
  },
  mealTypeText: {
    fontSize: typography.fontSizes.xs, // 12px
    fontWeight: typography.fontWeights.semibold,
    color: COLORS.badgeText,
  },
  checkbox: {
    padding: spacing[1], // 4px
  },
  expandButton: {
    padding: spacing[1], // 4px
  },
  expandedContent: {
    marginTop: spacing[3], // 12px
    paddingTop: spacing[3], // 12px
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.sm, // 14px
    fontWeight: typography.fontWeights.semibold,
    color: COLORS.darkGray,
    marginBottom: spacing[2], // 8px
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: radii.md, // 6px
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[3], // 12px
    fontSize: typography.fontSizes.sm, // 14px
    color: COLORS.darkGray,
    backgroundColor: COLORS.inputBg,
    textAlignVertical: 'top',
    marginBottom: spacing[3], // 12px
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red,
    paddingHorizontal: spacing[4], // 16px
    paddingVertical: spacing[2], // 8px
    borderRadius: radii.sm, // 2px
    alignSelf: 'flex-start',
    gap: spacing[2], // 8px
  },
  deleteButtonText: {
    color: COLORS.white,
    fontWeight: typography.fontWeights.semibold,
    fontSize: typography.fontSizes.sm, // 14px
  },
  dayDivider: {
    height: 1,
    backgroundColor: chakraColors.teal[200],
    marginTop: spacing[4], // 16px
    marginHorizontal: 0,
  },
});

export default WeeklyMealPlanner;
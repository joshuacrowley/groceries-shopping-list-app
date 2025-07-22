import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
  useCreateQueries,
  useResultCell,
  useTable,
} from 'tinybase/ui-react';
import { createQueries } from 'tinybase';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import PhosphorIcon from '@/components/PhosphorIcon';
import { 
  chakraColors, 
  typography, 
  spacing, 
  radii, 
  shadows 
} from '@/constants/Colors';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { name: 'Fruits & Vegetables', icon: 'Orange' },
  { name: 'Dairy & Eggs', icon: 'Egg' },
  { name: 'Meat & Seafood', icon: 'Fish' },
  { name: 'Bakery', icon: 'Bread' },
  { name: 'Pantry', icon: 'Package' },
  { name: 'Frozen Foods', icon: 'Snowflake' },
  { name: 'Beverages', icon: 'Coffee' },
  { name: 'Household', icon: 'House' },
  { name: 'Other', icon: 'Question' },
];

// Chakra UI compatible color mappings - matching web version exactly
const COLORS = {
  lightGreen: chakraColors.green[50], // Very light green background
  white: chakraColors.white,
  darkGray: chakraColors.green[800], // Darker green text to match web
  mediumGray: chakraColors.gray[500],
  lightGray: chakraColors.gray[200],
  red: chakraColors.red[500],
  green: chakraColors.green[500],
  background: chakraColors.green[50], // Light green background like web
  inputBg: chakraColors.white,
  containerBg: chakraColors.green[50], // Main container background
  badgeGreen: chakraColors.green[100], // Light green for selected categories
  badgeText: chakraColors.green[600], // Darker green for badge text
};

interface GroceryItemProps {
  id: string;
}

const GroceryItem: React.FC<GroceryItemProps> = ({ id }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState('Other');
  
  const itemData = useRow('todos', id);

  const updateItem = useSetRowCallback(
    'todos',
    id,
    (updates) => ({ ...itemData, ...updates }),
    [itemData]
  );

  const deleteItem = useDelRowCallback('todos', id);

  useEffect(() => {
    if (itemData) {
      setNotes(String(itemData.notes || ''));
      setAmount(String(itemData.amount || 0));
      setCategory(String(itemData.category || 'Other'));
    }
  }, [itemData]);

  const handleDoneToggle = useCallback(() => {
    updateItem({ done: !Boolean(itemData?.done) });
  }, [updateItem, itemData?.done]);

  const handleNotesChange = useCallback((text: string) => {
    setNotes(text);
    updateItem({ notes: text });
  }, [updateItem]);

  const handleAmountChange = useCallback((text: string) => {
    setAmount(text);
    const numValue = parseFloat(text) || 0;
    updateItem({ amount: numValue });
  }, [updateItem]);

  const handleCategoryChange = useCallback((newCategory: string) => {
    setCategory(newCategory);
    updateItem({ category: newCategory });
  }, [updateItem]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const hasNotes = notes.trim().length > 0;
  const opacity = Boolean(itemData?.done) ? 0.6 : 1;

  return (
    <View style={[styles.itemContainer, { opacity }]}>
      <View style={styles.itemHeader}>
        <Pressable onPress={handleDoneToggle} style={styles.checkbox}>
          <Feather 
            name={Boolean(itemData?.done) ? 'check-square' : 'square'} 
            size={20} 
            color={Boolean(itemData?.done) ? COLORS.green : COLORS.mediumGray} 
          />
        </Pressable>
        
        <View style={styles.itemContent}>
          <Text 
            style={[
              styles.itemText,
              Boolean(itemData?.done) && styles.strikethrough
            ]}
          >
            {String(itemData?.text || '')}
          </Text>
          {hasNotes && (
            <Text 
              style={[
                styles.itemNotes, 
                Boolean(itemData?.done) && styles.strikethrough
              ]}
              numberOfLines={1}
            >
              {notes}
            </Text>
          )}
        </View>

        <View style={styles.itemActions}>
          <Text style={styles.itemAmount}>
            ${Number(itemData?.amount || 0).toFixed(2)}
          </Text>
          <Pressable onPress={toggleExpanded} style={styles.expandButton}>
            <Feather 
              name={isExpanded ? 'chevron-down' : 'chevron-right'} 
              size={20} 
              color={COLORS.mediumGray} 
            />
          </Pressable>
          <Pressable onPress={deleteItem} style={styles.deleteButton}>
            <Feather name="trash-2" size={18} color={COLORS.red} />
          </Pressable>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedRow}>
            <View style={styles.expandedField}>
              <Text style={styles.fieldLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelector}>
                  {CATEGORIES.map(({ name }) => (
                    <Pressable
                      key={name}
                      onPress={() => handleCategoryChange(name)}
                      style={[
                        styles.categoryOption,
                        category === name && styles.selectedCategory
                      ]}
                    >
                      <Text style={[
                        styles.categoryText,
                        category === name && styles.selectedCategoryText
                      ]}>
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <View style={styles.expandedRow}>
            <View style={styles.expandedField}>
              <Text style={styles.fieldLabel}>Price:</Text>
              <View style={styles.priceInput}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                />
              </View>
            </View>
          </View>

          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Notes:</Text>
            <TextInput
              value={notes}
              onChangeText={handleNotesChange}
              placeholder="Add notes about this item..."
              multiline
              numberOfLines={2}
              style={styles.notesInput}
            />
          </View>
        </View>
      )}
    </View>
  );
};

interface CategoryGroupProps {
  category: { name: string; icon: string };
  items: string[];
  isOpen: boolean;
  onToggle: () => void;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({ 
  category, 
  items, 
  isOpen, 
  onToggle 
}) => {

  return (
    <View style={styles.categoryGroup}>
      <Pressable 
        onPress={onToggle} 
        style={styles.categoryHeader}
      >
        <View style={styles.categoryInfo}>
          <PhosphorIcon name={category.icon} size={24} color={COLORS.darkGray} />
          <Text style={styles.categoryName}>
            {category.name}
          </Text>
        </View>
        <View style={styles.categoryMeta}>
          <Text style={styles.categoryCount}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
          <Feather 
            name={isOpen ? 'chevron-down' : 'chevron-right'} 
            size={20} 
            color={COLORS.mediumGray} 
          />
        </View>
      </Pressable>
      
      {isOpen && (
        <View style={styles.categoryItems}>
          {items.map((id) => (
            <GroceryItem key={id} id={id} />
          ))}
        </View>
      )}
    </View>
  );
};

interface ShoppingListv2Props {
  listId: string;
}

const ShoppingListv2: React.FC<ShoppingListv2Props> = ({ listId }) => {
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [openCategories, setOpenCategories] = useState(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {})
  );

  const todosTable = useTable('todos');
  const todoIds = useLocalRowIds('todoList', listId) || [];
  const listData = useRow('lists', listId);
  const store = useStore();


  const { categorizedItems, uncategorizedItems } = useMemo(() => {
    return todoIds.reduce(
      (acc, id) => {
        const item = todosTable?.[id];
        if (item) {
          const category = String(item.category || 'Other');
          const categoryExists = CATEGORIES.some(cat => cat.name === category);
          if (categoryExists) {
            if (!acc.categorizedItems[category]) {
              acc.categorizedItems[category] = [];
            }
            acc.categorizedItems[category].push(id);
          } else {
            acc.uncategorizedItems.push(id);
          }
        }
        return acc;
      },
      { categorizedItems: {}, uncategorizedItems: [] }
    );
  }, [todoIds, todosTable]);

  const addItem = useAddRowCallback(
    'todos',
    (text: string) => ({
      text: text.trim(),
      amount: 0,
      category: selectedCategory,
      list: listId,
      done: false,
      notes: '',
    }),
    [listId, selectedCategory],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewItem('');
        setSelectedCategory(CATEGORIES[0].name);
      }
    }
  );

  const handleAddItem = useCallback(() => {
    if (newItem.trim() !== '') {
      addItem(newItem);
    }
  }, [addItem, newItem]);

  const queries = useCreateQueries(store, (store) => {
    return createQueries(store).setQueryDefinition(
      'totalAmount',
      'todos',
      ({ select, where, group }) => {
        select('amount');
        where('list', listId);
        where('done', false);
        group('amount', 'sum').as('total');
      }
    );
  });

  const totalAmountCell = useResultCell('totalAmount', '0', 'total', queries);
  const totalAmount = Number(totalAmountCell) || 0;

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const handleCopyList = useCallback(async () => {
    const activeItems = todoIds.filter(id => !store.getCell('todos', id, 'done'));
    if (activeItems.length === 0) {
      Alert.alert('Info', 'List is empty or all items are done');
      return;
    }

    const listContent = activeItems.map(id => {
      const item = store.getRow('todos', id);
      if (item) {
        const itemText = String(item.text || '');
        const itemAmount = Number(item.amount || 0) > 0 ? `$${Number(item.amount).toFixed(2)}` : '';
        const itemNotes = typeof item.notes === 'string' && item.notes ? ` (${item.notes})` : '';
        return `- ${itemText}${itemAmount ? ` - ${itemAmount}` : ''}${itemNotes}`;
      }
      return '';
    }).filter(Boolean).join('\n');

    try {
      await Clipboard.setStringAsync(listContent);
      Alert.alert('Success', 'List copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy list: ', err);
      Alert.alert('Error', 'Failed to copy list');
    }
  }, [todoIds, store]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <PhosphorIcon 
              name={String(listData?.icon || 'Handbag')} 
              size={32} 
              color={COLORS.darkGray} 
              weight="fill" 
            />
            <Text style={styles.listTitle}>
              {String(listData?.name || 'Shopping')}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Text style={styles.totalAmount}>
              Total: ${totalAmount.toFixed(2)}
            </Text>
            <Pressable onPress={handleCopyList} style={styles.copyButton}>
              <PhosphorIcon name="ClipboardText" size={20} color={COLORS.mediumGray} />
            </Pressable>
          </View>
        </View>

        <View style={styles.addItemSection}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Add a new item"
            style={styles.addItemInput}
            placeholderTextColor={COLORS.mediumGray}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categorySelector}>
              {CATEGORIES.map(({ name }) => (
                <Pressable
                  key={name}
                  onPress={() => setSelectedCategory(name)}
                  style={[
                    styles.categoryOption,
                    selectedCategory === name && styles.selectedCategory
                  ]}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === name && styles.selectedCategoryText
                  ]}>
                    {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable onPress={handleAddItem} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.categoriesList}>
          {CATEGORIES.map((category) => {
            const items = categorizedItems[category.name] || [];
            return items.length > 0 ? (
              <CategoryGroup
                key={category.name}
                category={category}
                items={items}
                isOpen={openCategories[category.name]}
                onToggle={() => toggleCategory(category.name)}
              />
            ) : null;
          })}
          
          {uncategorizedItems.length > 0 && (
            <CategoryGroup
              key="Other"
              category={CATEGORIES[CATEGORIES.length - 1]}
              items={uncategorizedItems}
              isOpen={openCategories['Other']}
              onToggle={() => toggleCategory('Other')}
            />
          )}
        </View>

        {todoIds.length === 0 && (
          <Text style={styles.emptyMessage}>
            Your grocery list is empty. Start adding items!
          </Text>
        )}
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
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listTitle: {
    fontSize: typography.fontSizes['2xl'], // 24px
    fontWeight: typography.fontWeights.bold,
    marginLeft: spacing[3], // 12px
    color: COLORS.darkGray,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: typography.fontSizes.xl, // 20px
    fontWeight: typography.fontWeights.bold,
    marginRight: spacing[3], // 12px
    color: COLORS.darkGray,
  },
  copyButton: {
    padding: spacing[2], // 8px
  },
  addItemSection: {
    backgroundColor: COLORS.white,
    padding: spacing[4], // 16px
    borderRadius: radii.xl, // 12px
    marginBottom: spacing[6], // 24px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addItemInput: {
    paddingVertical: spacing[3], // 12px
    paddingHorizontal: spacing[4], // 16px
    fontSize: typography.fontSizes.md, // 16px
    marginBottom: spacing[3], // 12px
    backgroundColor: COLORS.inputBg,
    borderRadius: radii.md, // 6px
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    color: COLORS.darkGray,
  },
  categorySelector: {
    flexDirection: 'row',
    marginBottom: spacing[3], // 12px
    gap: spacing[2], // 8px
  },
  categoryOption: {
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[2], // 8px
    borderRadius: radii.full, // 20px
    backgroundColor: COLORS.lightGray,
  },
  selectedCategory: {
    backgroundColor: COLORS.badgeGreen,
  },
  categoryText: {
    fontSize: typography.fontSizes.sm, // 14px
    color: COLORS.darkGray,
  },
  selectedCategoryText: {
    color: COLORS.badgeText,
    fontWeight: typography.fontWeights.semibold,
  },
  addButton: {
    backgroundColor: COLORS.green,
    paddingVertical: spacing[3], // 12px
    paddingHorizontal: spacing[8], // 32px
    borderRadius: radii.md, // 6px
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: typography.fontWeights.bold,
    fontSize: typography.fontSizes.md, // 16px
  },
  categoriesList: {
    gap: spacing[2], // 8px
  },
  categoryGroup: {
    marginBottom: spacing[2], // 8px
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4], // 16px
    backgroundColor: COLORS.white,
    borderRadius: radii.xl, // 12px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontWeight: typography.fontWeights.semibold,
    marginLeft: spacing[3], // 12px
    fontSize: typography.fontSizes.lg, // 18px
    color: COLORS.darkGray,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    fontSize: typography.fontSizes.sm, // 14px
    marginRight: spacing[2], // 8px
    color: COLORS.mediumGray,
  },
  categoryItems: {
    marginTop: spacing[2], // 8px
    gap: spacing[2], // 8px
  },
  itemContainer: {
    backgroundColor: COLORS.white,
    borderRadius: radii.xl, // 12px
    padding: spacing[4], // 16px
    marginBottom: spacing[2], // 8px
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    padding: spacing[1], // 4px
    marginRight: spacing[3], // 12px
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: typography.fontSizes.md, // 16px
    fontWeight: typography.fontWeights.medium,
    color: COLORS.darkGray,
  },
  itemNotes: {
    fontSize: typography.fontSizes.xs, // 12px
    color: COLORS.mediumGray,
    marginTop: spacing[1], // 4px
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1], // 4px
  },
  itemAmount: {
    fontSize: typography.fontSizes.md, // 16px
    marginRight: spacing[2], // 8px
    fontWeight: typography.fontWeights.semibold,
    color: COLORS.darkGray,
  },
  expandButton: {
    padding: spacing[1], // 4px
  },
  deleteButton: {
    padding: spacing[1], // 4px
  },
  expandedContent: {
    marginTop: spacing[3], // 12px
    padding: spacing[4], // 16px
    backgroundColor: chakraColors.gray[50],
    borderRadius: radii.md, // 6px
    gap: spacing[3], // 12px
  },
  expandedRow: {
    flexDirection: 'row',
    gap: spacing[3], // 12px
  },
  expandedField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.sm, // 14px
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing[2], // 8px
    color: COLORS.darkGray,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: radii.sm, // 4px
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    paddingHorizontal: spacing[3], // 12px
    paddingVertical: spacing[2], // 8px
  },
  dollarSign: {
    fontSize: typography.fontSizes.md, // 16px
    marginRight: spacing[1], // 4px
    color: COLORS.darkGray,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.fontSizes.md, // 16px
    color: COLORS.darkGray,
  },
  notesInput: {
    backgroundColor: COLORS.white,
    borderRadius: radii.sm, // 4px
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    padding: spacing[3], // 12px
    fontSize: typography.fontSizes.sm, // 14px
    textAlignVertical: 'top',
    color: COLORS.darkGray,
  },
  emptyMessage: {
    fontSize: typography.fontSizes.md, // 16px
    color: COLORS.mediumGray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing[8], // 32px
  },
});

export default ShoppingListv2;
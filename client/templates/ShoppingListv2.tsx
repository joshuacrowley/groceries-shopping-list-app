import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
  useCreateQueries,
  useResultCell,
} from "tinybase/ui-react";
import { createQueries } from "tinybase";
import * as Clipboard from "expo-clipboard";
import {
  Orange,
  Egg,
  Fish,
  Bread,
  Package,
  Snowflake,
  Coffee,
  House,
  Question,
  CaretDown,
  CaretRight,
  Trash,
  ClipboardText,
  Plus,
  ShoppingCart,
} from "phosphor-react-native";

const CATEGORIES = [
  { name: "Fruits & Vegetables", Icon: Orange },
  { name: "Dairy & Eggs", Icon: Egg },
  { name: "Meat & Seafood", Icon: Fish },
  { name: "Bakery", Icon: Bread },
  { name: "Pantry", Icon: Package },
  { name: "Frozen Foods", Icon: Snowflake },
  { name: "Beverages", Icon: Coffee },
  { name: "Household", Icon: House },
  { name: "Other", Icon: Question },
];

const GroceryItem = memo(({ id }: { id: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemData = useRow("todos", id);
  const store = useStore();

  const deleteItem = useDelRowCallback("todos", id);

  const handleDoneToggle = useCallback(() => {
    store?.setCell("todos", id, "done", !itemData?.done);
  }, [store, id, itemData?.done]);

  const handleNotesChange = useCallback(
    (text: string) => {
      store?.setCell("todos", id, "notes", text);
    },
    [store, id]
  );

  const handleAmountChange = useCallback(
    (text: string) => {
      const numValue = parseFloat(text) || 0;
      store?.setCell("todos", id, "amount", numValue);
    },
    [store, id]
  );

  const handleCategoryChange = useCallback(
    (newCategory: string) => {
      store?.setCell("todos", id, "category", newCategory);
    },
    [store, id]
  );

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Item", "Remove this item from your list?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
    ]);
  }, [deleteItem]);

  if (!itemData) return null;

  const hasNotes =
    typeof itemData.notes === "string" && itemData.notes.trim().length > 0;

  return (
    <View style={[styles.itemContainer, { opacity: itemData.done ? 0.6 : 1 }]}>
      <View style={styles.itemHeader}>
        <Pressable onPress={handleDoneToggle} style={styles.checkbox}>
          <View
            style={[
              styles.checkboxBox,
              itemData.done && styles.checkboxChecked,
            ]}
          >
            {itemData.done ? (
              <Text style={styles.checkboxMark}>✓</Text>
            ) : null}
          </View>
        </Pressable>

        <View style={styles.itemContent}>
          <Text
            style={[
              styles.itemText,
              itemData.done && styles.strikethrough,
            ]}
          >
            {String(itemData.text || "")}
          </Text>
          {hasNotes && (
            <Text
              style={[styles.itemNotes, itemData.done && styles.strikethrough]}
              numberOfLines={1}
            >
              {String(itemData.notes)}
            </Text>
          )}
        </View>

        <View style={styles.itemActions}>
          <Text style={styles.itemAmount}>
            ${Number(itemData.amount || 0).toFixed(2)}
          </Text>
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.expandButton}
          >
            {isExpanded ? (
              <CaretDown size={20} color="#718096" />
            ) : (
              <CaretRight size={20} color="#718096" />
            )}
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Trash size={18} color="#E53E3E" weight="bold" />
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
                        String(itemData.category || "Other") === name &&
                          styles.selectedCategory,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          String(itemData.category || "Other") === name &&
                            styles.selectedCategoryText,
                        ]}
                      >
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
                  value={String(itemData.amount || 0)}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                />
              </View>
            </View>
          </View>

          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Notes (recipe, brand, etc.):</Text>
            <TextInput
              value={String(itemData.notes || "")}
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
});
GroceryItem.displayName = "GroceryItem";

const CategoryGroup = memo(
  ({
    category,
    items,
    isOpen,
    onToggle,
  }: {
    category: { name: string; Icon: React.ComponentType<any> };
    items: string[];
    isOpen: boolean;
    onToggle: () => void;
  }) => {
    const { Icon } = category;

    return (
      <View style={styles.categoryGroup}>
        <Pressable onPress={onToggle} style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <Icon size={24} color="#22543D" />
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
          <View style={styles.categoryMeta}>
            <Text style={styles.categoryCount}>
              {items.length} {items.length === 1 ? "item" : "items"}
            </Text>
            {isOpen ? (
              <CaretDown size={20} color="#718096" />
            ) : (
              <CaretRight size={20} color="#718096" />
            )}
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
  }
);
CategoryGroup.displayName = "CategoryGroup";

export default function ShoppingListv2({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {})
  );

  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const store = useStore();

  const { categorizedItems, uncategorizedItems } = useMemo(() => {
    return todoIds.reduce(
      (acc, id) => {
        const cat = String(
          store?.getCell("todos", id, "category") || "Other"
        );
        const categoryExists = CATEGORIES.some((c) => c.name === cat);
        if (categoryExists) {
          if (!acc.categorizedItems[cat]) acc.categorizedItems[cat] = [];
          acc.categorizedItems[cat].push(id);
        } else {
          acc.uncategorizedItems.push(id);
        }
        return acc;
      },
      {
        categorizedItems: {} as Record<string, string[]>,
        uncategorizedItems: [] as string[],
      }
    );
  }, [todoIds, store]);

  const addItem = useAddRowCallback(
    "todos",
    (text: string) => ({
      text: text.trim(),
      amount: 0,
      category: selectedCategory,
      list: listId,
      done: false,
      notes: "",
    }),
    [listId, selectedCategory],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewItem("");
      }
    }
  );

  const handleAddItem = useCallback(() => {
    if (newItem.trim() !== "") {
      addItem(newItem);
    }
  }, [addItem, newItem]);

  const queries = useCreateQueries(store, (store) => {
    return createQueries(store).setQueryDefinition(
      "totalAmount",
      "todos",
      ({ select, where, group }) => {
        select("amount");
        where("list", listId);
        where("done", false);
        group("amount", "sum").as("total");
      }
    );
  });

  const totalAmountCell = useResultCell("totalAmount", "0", "total", queries);
  const totalAmount = Number(totalAmountCell) || 0;

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const handleCopyList = useCallback(async () => {
    const activeItems = todoIds.filter(
      (id) => !store?.getCell("todos", id, "done")
    );
    if (activeItems.length === 0) {
      Alert.alert("Info", "List is empty or all items are done");
      return;
    }

    const listContent = activeItems
      .map((id) => {
        const item = store?.getRow("todos", id);
        if (item) {
          const itemText = String(item.text || "");
          const itemAmount =
            Number(item.amount || 0) > 0
              ? `$${Number(item.amount).toFixed(2)}`
              : "";
          const itemNotes =
            typeof item.notes === "string" && item.notes
              ? ` (${item.notes})`
              : "";
          return `- ${itemText}${itemAmount ? ` - ${itemAmount}` : ""}${itemNotes}`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");

    try {
      await Clipboard.setStringAsync(listContent);
      Alert.alert("Success", "List copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy list: ", err);
      Alert.alert("Error", "Failed to copy list");
    }
  }, [todoIds, store]);

  const progressLabel = useMemo(() => {
    const count = todoIds.length;
    if (count === 0) return "Time to start shopping!";
    if (count <= 5) return "Quick shop today";
    if (count <= 15) return "Good haul coming up";
    if (count <= 25) return "Big shop energy!";
    return "Stocking up the pantry!";
  }, [todoIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <ShoppingCart size={32} color="#22543D" weight="fill" />
            <View>
              <Text style={styles.listTitle}>
                {String(listData?.name || "Shopping")}
              </Text>
              <Text style={styles.progressLabel}>{progressLabel}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.totalBadge}>
              <Text style={styles.totalAmount}>
                ${totalAmount.toFixed(2)}
              </Text>
            </View>
            <Pressable onPress={handleCopyList} style={styles.copyButton}>
              <ClipboardText size={20} color="#718096" weight="bold" />
            </Pressable>
          </View>
        </View>

        <View style={styles.addItemSection}>
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            onSubmitEditing={handleAddItem}
            placeholder="Add a new item"
            style={styles.addItemInput}
            placeholderTextColor="#A0AEC0"
            returnKeyType="done"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categorySelector}>
              {CATEGORIES.map(({ name }) => (
                <Pressable
                  key={name}
                  onPress={() => setSelectedCategory(name)}
                  style={[
                    styles.categoryOption,
                    selectedCategory === name && styles.selectedCategory,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === name && styles.selectedCategoryText,
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable onPress={handleAddItem} style={styles.addButton}>
            <Plus size={18} color="#FFFFFF" weight="bold" />
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
              isOpen={openCategories["Other"]}
              onToggle={() => toggleCategory("Other")}
            />
          )}
        </View>

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <ShoppingCart size={48} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>Your list is empty!</Text>
            <Text style={styles.emptySubtitle}>
              Add items above to start building your shopping list
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0FFF4",
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#22543D",
  },
  progressLabel: {
    fontSize: 12,
    color: "#38A169",
    fontStyle: "italic",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalBadge: {
    backgroundColor: "#C6F6D5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22543D",
  },
  copyButton: {
    padding: 8,
  },
  addItemSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  addItemInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#2D3748",
  },
  categorySelector: {
    flexDirection: "row",
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  selectedCategory: {
    backgroundColor: "#C6F6D5",
  },
  categoryText: {
    fontSize: 13,
    color: "#4A5568",
  },
  selectedCategoryText: {
    color: "#22543D",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#38A169",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  categoriesList: {
    gap: 8,
  },
  categoryGroup: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#C6F6D5",
    borderRadius: 8,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#22543D",
  },
  categoryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: "500",
    color: "#22543D",
  },
  categoryItems: {
    marginTop: 4,
    gap: 4,
  },
  itemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#38A169",
    borderColor: "#38A169",
  },
  checkboxMark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
  },
  itemNotes: {
    fontSize: 12,
    color: "#718096",
    marginTop: 2,
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D3748",
    marginRight: 4,
  },
  expandButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  expandedContent: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
    gap: 12,
  },
  expandedRow: {
    gap: 8,
  },
  expandedField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#4A5568",
  },
  priceInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dollarSign: {
    fontSize: 16,
    marginRight: 4,
    color: "#2D3748",
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: "#2D3748",
  },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
    color: "#2D3748",
    minHeight: 60,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#22543D",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#38A169",
    textAlign: "center",
    maxWidth: 280,
  },
});

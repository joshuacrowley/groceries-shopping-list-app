import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
} from "tinybase/ui-react";
import {
  Trash,
  CaretDown,
  CaretRight,
  Orange,
  Egg,
  Fish,
  Bread,
  Package,
  Snowflake,
  Coffee,
  House,
  Question,
  ClipboardText,
} from "phosphor-react-native";
import * as Clipboard from "expo-clipboard";

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
  const [expanded, setExpanded] = useState(false);
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const hasNotes =
    typeof itemData.notes === "string" && itemData.notes.trim().length > 0;

  const handleToggle = () => {
    store?.setCell("todos", id, "done", !isDone);
  };

  const handleDelete = () => {
    Alert.alert("Delete", "Delete this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
    ]);
  };

  const handleCategoryChange = (cat: string) => {
    store?.setCell("todos", id, "category", cat);
  };

  const handleNotesChange = (text: string) => {
    store?.setCell("todos", id, "notes", text);
  };

  const handleAmountChange = (text: string) => {
    const val = parseFloat(text);
    store?.setCell("todos", id, "amount", isNaN(val) ? 0 : val);
  };

  return (
    <View style={[styles.itemContainer, isDone && styles.itemDone]}>
      <View style={styles.itemRow}>
        <Pressable onPress={handleToggle} style={styles.checkbox}>
          <View
            style={[styles.checkboxInner, isDone && styles.checkboxChecked]}
          >
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>
        <View style={styles.itemTextContainer}>
          <Text style={[styles.itemText, isDone && styles.itemTextDone]}>
            {String(itemData.text || "")}
          </Text>
          {hasNotes && (
            <Text
              style={[styles.itemNotes, isDone && styles.itemTextDone]}
              numberOfLines={1}
            >
              {String(itemData.notes)}
            </Text>
          )}
        </View>
        <Text style={styles.itemPrice}>
          ${Number(itemData.amount || 0).toFixed(2)}
        </Text>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
          {expanded ? (
            <CaretDown size={18} color="#718096" />
          ) : (
            <CaretRight size={18} color="#718096" />
          )}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={18} color="#E53E3E" weight="bold" />
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailsRow}>
            <View style={styles.detailHalf}>
              <Text style={styles.detailLabel}>Category:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {CATEGORIES.map(({ name }) => (
                  <Pressable
                    key={name}
                    onPress={() => handleCategoryChange(name)}
                    style={[
                      styles.categoryChip,
                      String(itemData.category || "Other") === name &&
                        styles.categoryChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        String(itemData.category || "Other") === name &&
                          styles.categoryChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.detailHalf}>
              <Text style={styles.detailLabel}>Price:</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={String(Number(itemData.amount || 0).toFixed(2))}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          <Text style={styles.detailLabel}>Notes:</Text>
          <TextInput
            style={styles.notesInput}
            value={String(itemData.notes || "")}
            onChangeText={handleNotesChange}
            placeholder="Add notes about this item..."
            placeholderTextColor="#A0AEC0"
            multiline
            numberOfLines={2}
          />
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
    category: (typeof CATEGORIES)[0];
    items: string[];
    isOpen: boolean;
    onToggle: () => void;
  }) => {
    const IconComponent = category.Icon;

    return (
      <View style={styles.categoryGroup}>
        <Pressable onPress={onToggle} style={styles.categoryHeader}>
          <View style={styles.categoryHeaderLeft}>
            <IconComponent size={22} color="#38A169" />
            <Text style={styles.categoryTitle}>{category.name}</Text>
          </View>
          <View style={styles.categoryHeaderRight}>
            <Text style={styles.categoryCount}>
              {items.length} {items.length === 1 ? "item" : "items"}
            </Text>
            {isOpen ? (
              <CaretDown size={18} color="#38A169" />
            ) : (
              <CaretRight size={18} color="#38A169" />
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
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {} as Record<string, boolean>)
  );

  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const store = useStore();

  const { categorizedItems, uncategorizedItems } = useMemo(() => {
    return todoIds.reduce(
      (acc, id) => {
        const cat = String(store?.getCell("todos", id, "category") || "Other");
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

  const totalAmount = useMemo(() => {
    return todoIds.reduce((sum, id) => {
      const done = store?.getCell("todos", id, "done");
      if (!done) {
        const amount = Number(store?.getCell("todos", id, "amount") || 0);
        return sum + amount;
      }
      return sum;
    }, 0);
  }, [todoIds, store]);

  const progressLabel = useMemo(() => {
    const count = todoIds.length;
    if (count === 0) return "Time to start shopping! 🛒";
    if (count <= 5) return "Quick shop today 🧺";
    if (count <= 15) return "Good haul coming up 🛍️";
    if (count <= 25) return "Big shop energy! 💪";
    return "Stocking up the pantry! 🏪";
  }, [todoIds.length]);

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const handleAddItem = useCallback(() => {
    if (newItem.trim() !== "") {
      addItem(newItem);
    }
  }, [addItem, newItem]);

  const handleCopyList = useCallback(async () => {
    if (!store) return;
    const activeItems = todoIds.filter(
      (id) => !store.getCell("todos", id, "done")
    );
    if (activeItems.length === 0) {
      Alert.alert("Info", "List is empty or all items are done");
      return;
    }

    const listContent = activeItems
      .map((id) => {
        const item = store.getRow("todos", id);
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
      Alert.alert("Copied!", "List copied to clipboard");
    } catch (err) {
      Alert.alert("Error", "Failed to copy list");
    }
  }, [todoIds, store]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.listTitle}>
              {String(listData?.name || "Shopping")}
            </Text>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>
                ${totalAmount.toFixed(2)}
              </Text>
            </View>
            <Pressable onPress={handleCopyList} style={styles.iconBtn}>
              <ClipboardText size={22} color="#38A169" weight="bold" />
            </Pressable>
          </View>
        </View>

        {/* Add Item */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Add a new item"
            placeholderTextColor="#A0AEC0"
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <Pressable
            onPress={() => setShowCategoryPicker(true)}
            style={styles.categoryPickerBtn}
          >
            <Text style={styles.categoryPickerText} numberOfLines={1}>
              {selectedCategory}
            </Text>
            <CaretDown size={14} color="#718096" />
          </Pressable>
          <Pressable onPress={handleAddItem} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowCategoryPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              {CATEGORIES.map(({ name, Icon }) => (
                <Pressable
                  key={name}
                  onPress={() => {
                    setSelectedCategory(name);
                    setShowCategoryPicker(false);
                  }}
                  style={[
                    styles.modalOption,
                    selectedCategory === name && styles.modalOptionActive,
                  ]}
                >
                  <Icon
                    size={20}
                    color={selectedCategory === name ? "#38A169" : "#718096"}
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedCategory === name && styles.modalOptionTextActive,
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Items by Category */}
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

        {/* Empty State */}
        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛒</Text>
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
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#276749",
  },
  progressLabel: {
    fontSize: 12,
    color: "#48BB78",
    fontStyle: "italic",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalBadge: {
    backgroundColor: "#C6F6D5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  totalBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#276749",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  addInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#2D3748",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    maxWidth: 130,
  },
  categoryPickerText: {
    fontSize: 13,
    color: "#4A5568",
    marginRight: 4,
  },
  addButton: {
    backgroundColor: "#38A169",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  categoryGroup: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#C6F6D5",
    borderRadius: 8,
    padding: 10,
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryTitle: {
    fontWeight: "bold",
    color: "#276749",
    fontSize: 15,
  },
  categoryHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: "500",
    color: "#276749",
  },
  categoryItems: {
    marginTop: 4,
    gap: 4,
  },
  itemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemDone: {
    opacity: 0.6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 8,
  },
  checkbox: {
    padding: 4,
  },
  checkboxInner: {
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
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    color: "#2D3748",
  },
  itemTextDone: {
    textDecorationLine: "line-through",
    color: "#A0AEC0",
  },
  itemNotes: {
    fontSize: 12,
    color: "#718096",
  },
  itemPrice: {
    fontSize: 13,
    color: "#2D3748",
    fontWeight: "500",
  },
  iconBtn: {
    padding: 6,
  },
  detailsContainer: {
    backgroundColor: "#F7FAFC",
    padding: 12,
    gap: 8,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 12,
  },
  detailHalf: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4A5568",
    marginBottom: 4,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#EDF2F7",
    marginRight: 6,
  },
  categoryChipActive: {
    backgroundColor: "#38A169",
  },
  categoryChipText: {
    fontSize: 12,
    color: "#4A5568",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dollarSign: {
    paddingHorizontal: 8,
    fontSize: 14,
    color: "#718096",
    fontWeight: "500",
  },
  priceInput: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 14,
    color: "#2D3748",
  },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#2D3748",
    minHeight: 50,
    textAlignVertical: "top",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#276749",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#48BB78",
    textAlign: "center",
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 12,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionActive: {
    backgroundColor: "#F0FFF4",
  },
  modalOptionText: {
    fontSize: 15,
    color: "#4A5568",
  },
  modalOptionTextActive: {
    color: "#38A169",
    fontWeight: "600",
  },
});

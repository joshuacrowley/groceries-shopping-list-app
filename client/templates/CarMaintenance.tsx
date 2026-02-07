import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import {
  useLocalRowIds,
  useRow,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
} from "tinybase/ui-react";
import {
  Trash,
  CaretDown,
  CaretUp,
  Car,
  Wrench,
  Drop,
  GearSix,
} from "phosphor-react-native";

const CATEGORIES = [
  { name: "Service", emoji: "🔧", color: "#3182CE" },
  { name: "Repair", emoji: "🛠️", color: "#E53E3E" },
  { name: "Clean", emoji: "🧽", color: "#00B5D8" },
  { name: "Errand", emoji: "📋", color: "#ED8936" },
  { name: "Upgrade", emoji: "⚡", color: "#805AD5" },
];

const CATEGORY_MAP = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.name] = c;
    return acc;
  },
  {} as Record<string, (typeof CATEGORIES)[0]>
);

const CarItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const catInfo = CATEGORY_MAP[String(itemData.category)] || CATEGORIES[0];
  const hasNotes =
    typeof itemData.notes === "string" && itemData.notes.trim().length > 0;
  const hasDate =
    typeof itemData.date === "string" &&
    (itemData.date as string).trim().length > 0;

  const handleToggle = () => {
    store?.setCell("todos", id, "done", !isDone);
  };

  const handleDelete = () => {
    Alert.alert("Delete", "Remove this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
    ]);
  };

  return (
    <View
      style={[
        styles.itemCard,
        { borderLeftColor: isDone ? "#CBD5E0" : catInfo.color },
        isDone && styles.itemDone,
      ]}
    >
      <View style={styles.itemRow}>
        <Pressable onPress={handleToggle} style={styles.checkbox}>
          <View
            style={[styles.checkboxInner, isDone && styles.checkboxChecked]}
          >
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>
        <Text style={styles.itemEmoji}>
          {String(itemData.emoji || catInfo.emoji)}
        </Text>
        <View style={styles.itemInfo}>
          <View style={styles.itemTitleRow}>
            <Text
              style={[styles.itemText, isDone && styles.itemTextDone]}
              numberOfLines={1}
            >
              {String(itemData.text || "")}
            </Text>
            <View
              style={[styles.categoryBadge, { backgroundColor: catInfo.color + "20" }]}
            >
              <Text style={[styles.categoryBadgeText, { color: catInfo.color }]}>
                {catInfo.name}
              </Text>
            </View>
          </View>
          {hasDate && (
            <Text style={styles.itemDate}>{String(itemData.date)}</Text>
          )}
          {hasNotes && (
            <Text
              style={[styles.itemNotes, isDone && styles.itemTextDone]}
              numberOfLines={2}
            >
              {String(itemData.notes)}
            </Text>
          )}
        </View>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={18} color="#E53E3E" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
});
CarItem.displayName = "CarItem";

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
    return (
      <View style={styles.categoryGroup}>
        <Pressable
          onPress={onToggle}
          style={[
            styles.categoryHeader,
            { backgroundColor: category.color + "15" },
          ]}
        >
          <View style={styles.categoryHeaderLeft}>
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            <Text style={[styles.categoryTitle, { color: category.color }]}>
              {category.name}
            </Text>
          </View>
          <View style={styles.categoryHeaderRight}>
            <View
              style={[
                styles.categoryCountBadge,
                { backgroundColor: category.color + "20" },
              ]}
            >
              <Text
                style={[styles.categoryCountText, { color: category.color }]}
              >
                {items.length}
              </Text>
            </View>
            {isOpen ? (
              <CaretUp size={14} color={category.color} />
            ) : (
              <CaretDown size={14} color={category.color} />
            )}
          </View>
        </Pressable>
        {isOpen && (
          <View style={styles.categoryItems}>
            {items.map((id) => (
              <CarItem key={id} id={id} />
            ))}
          </View>
        )}
      </View>
    );
  }
);
CategoryGroup.displayName = "CategoryGroup";

export default function CarMaintenance({ listId }: { listId: string }) {
  const [newTodo, setNewTodo] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDate, setNewDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [showDetails, setShowDetails] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    CATEGORIES.reduce(
      (acc, cat) => ({ ...acc, [cat.name]: true }),
      {} as Record<string, boolean>
    )
  );

  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const categorizedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const cat = String(store?.getCell("todos", id, "category") || "Service");
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(id);
    });
    return grouped;
  }, [todoIds, store]);

  const doneCount = useMemo(() => {
    return todoIds.filter((id) => Boolean(store?.getCell("todos", id, "done"))).length;
  }, [todoIds, store]);

  const progress =
    todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const readinessLabel = useMemo(() => {
    if (todoIds.length === 0) return "Add tasks to keep your ride in shape";
    if (progress === 100) return "Road ready! 🚗";
    if (progress >= 75) return "Almost serviced 🔧";
    if (progress >= 50) return "Under the hood 🛠️";
    if (progress >= 25) return "Time for a tune-up 🔩";
    return "Engine's warming up 🏁";
  }, [progress, todoIds.length]);

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({
      text: data.text?.trim() || "",
      category: data.category || selectedCategory,
      emoji:
        data.emoji ||
        CATEGORY_MAP[data.category || selectedCategory]?.emoji ||
        "🔧",
      notes: data.notes || "",
      date: data.date || "",
      done: false,
      list: listId,
    }),
    [listId, selectedCategory]
  );

  const handleAdd = useCallback(() => {
    if (newTodo.trim()) {
      addItem({
        text: newTodo.trim(),
        category: selectedCategory,
        notes: newNotes.trim(),
        date: newDate,
      });
      setNewTodo("");
      setNewNotes("");
      setNewDate("");
      setShowDetails(false);
    }
  }, [newTodo, newNotes, newDate, selectedCategory, addItem]);

  const toggleCategory = useCallback((cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Car size={28} color="#FFFFFF" weight="fill" />
            <View>
              <Text style={styles.listTitle}>
                {String(listData?.name || "Car Maintenance")}
              </Text>
              <Text style={styles.progressLabel}>{readinessLabel}</Text>
            </View>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>
              {doneCount}/{todoIds.length} done
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        {/* Add Item */}
        <View style={styles.addCard}>
          <Pressable
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            style={styles.categoryPickerBtn}
          >
            <Text style={styles.categoryPickerText}>
              {CATEGORY_MAP[selectedCategory]?.emoji} {selectedCategory}
            </Text>
            <CaretDown size={12} color="#718096" />
          </Pressable>

          {showCategoryPicker && (
            <View style={styles.categoryPickerDropdown}>
              {CATEGORIES.map(({ name, emoji }) => (
                <Pressable
                  key={name}
                  onPress={() => {
                    setSelectedCategory(name);
                    setShowCategoryPicker(false);
                  }}
                  style={[
                    styles.categoryPickerOption,
                    selectedCategory === name && styles.categoryPickerOptionActive,
                  ]}
                >
                  <Text style={styles.categoryPickerOptionText}>
                    {emoji} {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.addInputRow}>
            <TextInput
              style={styles.addInput}
              value={newTodo}
              onChangeText={setNewTodo}
              placeholder="Add maintenance task..."
              placeholderTextColor="#A0AEC0"
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable onPress={handleAdd} style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => setShowDetails(!showDetails)}
            style={styles.detailsToggle}
          >
            <Text style={styles.detailsToggleText}>Add details & due date</Text>
            {showDetails ? (
              <CaretUp size={12} color="#3182CE" />
            ) : (
              <CaretDown size={12} color="#3182CE" />
            )}
          </Pressable>

          {showDetails && (
            <View style={styles.detailsForm}>
              <TextInput
                style={styles.detailInput}
                value={newDate}
                onChangeText={setNewDate}
                placeholder="Due date (e.g. March 2026)"
                placeholderTextColor="#A0AEC0"
              />
              <TextInput
                style={[styles.detailInput, { minHeight: 50, textAlignVertical: "top" }]}
                value={newNotes}
                onChangeText={setNewNotes}
                placeholder="Notes or details..."
                placeholderTextColor="#A0AEC0"
                multiline
              />
            </View>
          )}
        </View>

        {/* Category Groups */}
        {CATEGORIES.map((category) => {
          const items = categorizedItems[category.name] || [];
          if (items.length === 0) return null;
          return (
            <CategoryGroup
              key={category.name}
              category={category}
              items={items}
              isOpen={openCategories[category.name]}
              onToggle={() => toggleCategory(category.name)}
            />
          );
        })}

        {/* Empty State */}
        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🚗</Text>
            <Text style={styles.emptyTitle}>No car tasks yet</Text>
            <Text style={styles.emptySubtitle}>
              Add maintenance tasks to keep your ride running smooth
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2C3E50" },
  content: { padding: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#FFFFFF" },
  progressLabel: { fontSize: 12, color: "#90CDF4", fontStyle: "italic", marginTop: 2 },
  progressBadge: {
    backgroundColor: "#3182CE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  progressBadgeText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#63B3ED",
  },
  addCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  categoryPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  categoryPickerText: { fontSize: 13, color: "#4A5568" },
  categoryPickerDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  categoryPickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryPickerOptionActive: { backgroundColor: "#EBF8FF" },
  categoryPickerOptionText: { fontSize: 14, color: "#4A5568" },
  addInputRow: { flexDirection: "row", gap: 8 },
  addInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#2D3748",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addButton: {
    backgroundColor: "#3182CE",
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailsToggleText: { fontSize: 12, color: "#3182CE" },
  detailsForm: { gap: 8 },
  detailInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#2D3748",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryGroup: { marginBottom: 8 },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 12,
  },
  categoryHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryEmoji: { fontSize: 16 },
  categoryTitle: { fontWeight: "bold", fontSize: 14 },
  categoryHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  categoryCountBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  categoryCountText: { fontSize: 12, fontWeight: "600" },
  categoryItems: { marginTop: 4, gap: 4, paddingLeft: 4 },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    overflow: "hidden",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemDone: { opacity: 0.55 },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  checkbox: { padding: 4 },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#3182CE", borderColor: "#3182CE" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  itemEmoji: { fontSize: 20 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748", flex: 1 },
  itemTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  categoryBadgeText: { fontSize: 10, fontWeight: "600" },
  itemDate: { fontSize: 11, color: "#718096", fontWeight: "500", marginTop: 2 },
  itemNotes: { fontSize: 11, color: "#718096", fontStyle: "italic", marginTop: 2 },
  iconBtn: { padding: 6 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  emptySubtitle: {
    fontSize: 14,
    color: "#90CDF4",
    textAlign: "center",
    maxWidth: 280,
  },
});

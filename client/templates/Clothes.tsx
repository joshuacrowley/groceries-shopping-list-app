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
import { Trash, CaretDown, CaretUp } from "phosphor-react-native";

const CATEGORIES = [
  { name: "Need", emoji: "🛍️", color: "#ED64A6" },
  { name: "Mend", emoji: "🧵", color: "#ED8936" },
  { name: "Wash", emoji: "🫧", color: "#3182CE" },
  { name: "Donate", emoji: "💝", color: "#38A169" },
  { name: "Outfit", emoji: "👗", color: "#805AD5" },
];

const CATEGORY_MAP = CATEGORIES.reduce(
  (acc, c) => { acc[c.name] = c; return acc; },
  {} as Record<string, (typeof CATEGORIES)[0]>
);

const ClothesItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const catInfo = CATEGORY_MAP[String(itemData.category)] || CATEGORIES[0];
  const hasNotes = typeof itemData.notes === "string" && itemData.notes.trim().length > 0;

  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
    ]);
  };

  return (
    <View style={[styles.itemCard, { borderLeftColor: isDone ? "#CBD5E0" : catInfo.color }, isDone && styles.itemDone]}>
      <View style={styles.itemRow}>
        <Pressable onPress={handleToggle} style={styles.checkbox}>
          <View style={[styles.checkboxInner, isDone && styles.checkboxChecked]}>
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>
        <Text style={styles.itemEmoji}>{String(itemData.emoji || catInfo.emoji)}</Text>
        <View style={styles.itemInfo}>
          <View style={styles.itemTitleRow}>
            <Text style={[styles.itemText, isDone && styles.itemTextDone]} numberOfLines={1}>
              {String(itemData.text || "")}
            </Text>
            <View style={[styles.badge, { backgroundColor: catInfo.color + "20" }]}>
              <Text style={[styles.badgeText, { color: catInfo.color }]}>{catInfo.name}</Text>
            </View>
          </View>
          {hasNotes && (
            <Text style={[styles.itemNotes, isDone && styles.itemTextDone]} numberOfLines={2}>
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
ClothesItem.displayName = "ClothesItem";

const CategoryGroup = memo(({ category, items, isOpen, onToggle }: {
  category: (typeof CATEGORIES)[0]; items: string[]; isOpen: boolean; onToggle: () => void;
}) => (
  <View style={styles.categoryGroup}>
    <Pressable onPress={onToggle} style={[styles.categoryHeader, { backgroundColor: category.color + "15" }]}>
      <View style={styles.categoryHeaderLeft}>
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        <Text style={[styles.categoryTitle, { color: category.color }]}>{category.name}</Text>
      </View>
      <View style={styles.categoryHeaderRight}>
        <View style={[styles.countBadge, { backgroundColor: category.color + "20" }]}>
          <Text style={[styles.countText, { color: category.color }]}>{items.length}</Text>
        </View>
        {isOpen ? <CaretUp size={14} color={category.color} /> : <CaretDown size={14} color={category.color} />}
      </View>
    </Pressable>
    {isOpen && (
      <View style={styles.categoryItems}>
        {items.map((id) => <ClothesItem key={id} id={id} />)}
      </View>
    )}
  </View>
));
CategoryGroup.displayName = "CategoryGroup";

export default function Clothes({ listId }: { listId: string }) {
  const [newTodo, setNewTodo] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [showNotes, setShowNotes] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {} as Record<string, boolean>)
  );

  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const categorizedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const cat = String(store?.getCell("todos", id, "category") || "Need");
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(id);
    });
    return grouped;
  }, [todoIds, store]);

  const doneCount = useMemo(() =>
    todoIds.filter((id) => Boolean(store?.getCell("todos", id, "done"))).length,
  [todoIds, store]);

  const progress = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const readinessLabel = useMemo(() => {
    if (todoIds.length === 0) return "Add items to organize your wardrobe";
    if (progress === 100) return "Wardrobe sorted! 👗";
    if (progress >= 75) return "Almost organized 👠";
    if (progress >= 50) return "Styling in progress 👔";
    return "Time to get styling 💅";
  }, [progress, todoIds.length]);

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({
      text: data.text?.trim() || "",
      category: data.category || selectedCategory,
      emoji: CATEGORY_MAP[data.category || selectedCategory]?.emoji || "👗",
      notes: data.notes || "",
      done: false,
      list: listId,
    }),
    [listId, selectedCategory]
  );

  const handleAdd = useCallback(() => {
    if (newTodo.trim()) {
      addItem({ text: newTodo.trim(), category: selectedCategory, notes: newNotes.trim() });
      setNewTodo(""); setNewNotes(""); setShowNotes(false);
    }
  }, [newTodo, newNotes, selectedCategory, addItem]);

  const toggleCategory = useCallback((cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.listTitle}>{String(listData?.name || "Wardrobe")}</Text>
            <Text style={styles.progressLabel}>{readinessLabel}</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{doneCount}/{todoIds.length} sorted</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.addCard}>
          <Pressable onPress={() => setShowCategoryPicker(!showCategoryPicker)} style={styles.categoryPickerBtn}>
            <Text style={styles.categoryPickerText}>
              {CATEGORY_MAP[selectedCategory]?.emoji} {selectedCategory}
            </Text>
            <CaretDown size={12} color="#718096" />
          </Pressable>

          {showCategoryPicker && (
            <View style={styles.pickerDropdown}>
              {CATEGORIES.map(({ name, emoji }) => (
                <Pressable key={name} onPress={() => { setSelectedCategory(name); setShowCategoryPicker(false); }}
                  style={[styles.pickerOption, selectedCategory === name && styles.pickerOptionActive]}>
                  <Text style={styles.pickerOptionText}>{emoji} {name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.addInputRow}>
            <TextInput style={styles.addInput} value={newTodo} onChangeText={setNewTodo}
              placeholder="Add clothing item..." placeholderTextColor="#A0AEC0"
              onSubmitEditing={handleAdd} returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addButton}>
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => setShowNotes(!showNotes)} style={styles.notesToggle}>
            <Text style={styles.notesToggleText}>✨ Add notes</Text>
            {showNotes ? <CaretUp size={10} color="#ED64A6" /> : <CaretDown size={10} color="#ED64A6" />}
          </Pressable>

          {showNotes && (
            <TextInput style={styles.notesInput} value={newNotes} onChangeText={setNewNotes}
              placeholder="Size, color, where to buy..." placeholderTextColor="#A0AEC0" multiline />
          )}
        </View>

        {CATEGORIES.map((category) => {
          const items = categorizedItems[category.name] || [];
          if (items.length === 0) return null;
          return <CategoryGroup key={category.name} category={category} items={items}
            isOpen={openCategories[category.name]} onToggle={() => toggleCategory(category.name)} />;
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👗</Text>
            <Text style={styles.emptyTitle}>Your wardrobe list is empty</Text>
            <Text style={styles.emptySubtitle}>Add clothes to buy, mend, wash, or plan outfits</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCE4EC" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#880E4F" },
  progressLabel: { fontSize: 12, color: "#EC407A", fontStyle: "italic", marginTop: 2 },
  progressBadge: { backgroundColor: "#F48FB1", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  progressBadgeText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  progressTrack: { height: 8, backgroundColor: "#F8BBD0", borderRadius: 4, overflow: "hidden", marginBottom: 16 },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#EC407A" },
  addCard: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, padding: 12, marginBottom: 16, gap: 8 },
  categoryPickerBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#FCE4EC", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignSelf: "flex-start", gap: 6 },
  categoryPickerText: { fontSize: 13, color: "#4A5568" },
  pickerDropdown: { backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 10 },
  pickerOptionActive: { backgroundColor: "#FCE4EC" },
  pickerOptionText: { fontSize: 14, color: "#4A5568" },
  addInputRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: "#2D3748", borderWidth: 1, borderColor: "#F8BBD0" },
  addButton: { backgroundColor: "#EC407A", borderRadius: 8, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  addButtonText: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
  notesToggle: { flexDirection: "row", alignItems: "center", gap: 4 },
  notesToggleText: { fontSize: 12, color: "#EC407A" },
  notesInput: { backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: "#2D3748", borderWidth: 1, borderColor: "#F8BBD0", minHeight: 50, textAlignVertical: "top" },
  categoryGroup: { marginBottom: 8 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 10, padding: 10, paddingHorizontal: 12 },
  categoryHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryEmoji: { fontSize: 16 },
  categoryTitle: { fontWeight: "bold", fontSize: 14 },
  categoryHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countText: { fontSize: 12, fontWeight: "600" },
  categoryItems: { marginTop: 4, gap: 4, paddingLeft: 4 },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 10, overflow: "hidden", borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemDone: { opacity: 0.55 },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  checkbox: { padding: 4 },
  checkboxInner: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#EC407A", borderColor: "#EC407A" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  itemEmoji: { fontSize: 20 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748", flex: 1 },
  itemTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  itemNotes: { fontSize: 11, color: "#718096", fontStyle: "italic", marginTop: 2 },
  iconBtn: { padding: 6 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#880E4F" },
  emptySubtitle: { fontSize: 14, color: "#EC407A", textAlign: "center", maxWidth: 280 },
});

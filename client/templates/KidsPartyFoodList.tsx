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
  useStore,
  useLocalRowIds,
  useRow,
  useDelRowCallback,
  useAddRowCallback,
} from "tinybase/ui-react";
import { Trash, CaretDown, CaretUp, Star } from "phosphor-react-native";

const PREP_TYPES: Record<string, string> = {
  A: "Store Bought",
  B: "Homemade",
  C: "Needs Heating",
  D: "Needs Refrigeration",
  E: "Ready to Serve",
};

const CATEGORIES = [
  { name: "Sweet", emoji: "🍰" },
  { name: "Savory", emoji: "🍕" },
  { name: "Drinks", emoji: "☕" },
  { name: "Main Dishes", emoji: "🍴" },
  { name: "Snacks", emoji: "🍔" },
];

const FOOD_EMOJIS = [
  "🍕", "🍔", "🍦", "🧁", "🍰", "🍪", "🍩", "🍫", "🍭", "🍬",
  "🥨", "🥪", "🌭", "🧃", "🥤", "🍿", "🍉", "🍇", "🍓", "🥗",
];

const FoodItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const foodData = useRow("todos", id);
  const store = useStore();
  const deleteFood = useDelRowCallback("todos", id);

  if (!foodData) return null;

  const isDone = Boolean(foodData.done);
  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteFood },
    ]);
  };

  const rating = Number(foodData.fiveStarRating || 0);
  const handleRating = (v: number) => store?.setCell("todos", id, "fiveStarRating", v);

  return (
    <View style={[styles.itemCard, isDone && styles.itemDone]}>
      <View style={styles.itemRow}>
        <Text style={styles.itemEmoji}>{String(foodData.emoji || "🍽️")}</Text>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, isDone && styles.itemTitleDone]} numberOfLines={1}>
            {String(foodData.text || "")}
          </Text>
          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: "#BEE3F8" }]}>
              <Text style={[styles.tagText, { color: "#2B6CB0" }]}>{String(foodData.email || "Unassigned")}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: "#E9D8FD" }]}>
              <Text style={[styles.tagText, { color: "#6B46C1" }]}>{String(foodData.category || "Snacks")}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: "#FEEBC8" }]}>
              <Text style={[styles.tagText, { color: "#C05621" }]}>{PREP_TYPES[String(foodData.type)] || "Ready to Serve"}</Text>
            </View>
          </View>
        </View>
        <View style={styles.itemRight}>
          <Pressable onPress={handleToggle} style={styles.checkbox}>
            <View style={[styles.checkboxInner, isDone && styles.checkboxChecked]}>
              {isDone && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </Pressable>
          <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
            {expanded ? <CaretUp size={16} color="#D53F8C" /> : <CaretDown size={16} color="#D53F8C" />}
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.iconBtn}>
            <Trash size={16} color="#E53E3E" />
          </Pressable>
        </View>
      </View>

      {expanded && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Who's bringing:</Text>
          <TextInput style={styles.detailInput} value={String(foodData.email || "")}
            onChangeText={(t) => store?.setCell("todos", id, "email", t)}
            placeholder="Name" placeholderTextColor="#A0AEC0" />

          <Text style={styles.detailLabel}>Category:</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map(({ name, emoji }) => (
              <Pressable key={name} onPress={() => store?.setCell("todos", id, "category", name)}
                style={[styles.chip, String(foodData.category) === name && styles.chipActive]}>
                <Text style={styles.chipText}>{emoji} {name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.detailLabel}>Preparation:</Text>
          <View style={styles.chipRow}>
            {Object.entries(PREP_TYPES).map(([key, value]) => (
              <Pressable key={key} onPress={() => store?.setCell("todos", id, "type", key)}
                style={[styles.chip, String(foodData.type) === key && styles.chipActive]}>
                <Text style={styles.chipText}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.detailLabel}>Quantity:</Text>
          <TextInput style={styles.detailInput} value={String(foodData.number || 0)}
            onChangeText={(t) => store?.setCell("todos", id, "number", parseInt(t, 10) || 0)}
            keyboardType="number-pad" />

          <Text style={styles.detailLabel}>Rating:</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((v) => (
              <Pressable key={v} onPress={() => handleRating(v)}>
                <Star size={20} weight={v <= rating ? "fill" : "regular"} color={v <= rating ? "#FFD700" : "#CBD5E0"} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.detailLabel}>Notes:</Text>
          <TextInput style={[styles.detailInput, { minHeight: 60, textAlignVertical: "top" }]}
            value={String(foodData.notes || "")}
            onChangeText={(t) => store?.setCell("todos", id, "notes", t)}
            placeholder="Special instructions" placeholderTextColor="#A0AEC0" multiline />
        </View>
      )}
    </View>
  );
});
FoodItem.displayName = "FoodItem";

const CategoryGroup = memo(({ category, items, isOpen, onToggle }: {
  category: (typeof CATEGORIES)[0]; items: string[]; isOpen: boolean; onToggle: () => void;
}) => (
  <View style={styles.categoryGroup}>
    <Pressable onPress={onToggle} style={styles.categoryHeader}>
      <View style={styles.categoryHeaderLeft}>
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        <Text style={styles.categoryTitle}>{category.name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>
      {isOpen ? <CaretDown size={16} color="#D53F8C" /> : <CaretUp size={16} color="#D53F8C" />}
    </Pressable>
    {isOpen && (
      <View style={styles.categoryItems}>
        {items.map((id) => <FoodItem key={id} id={id} />)}
      </View>
    )}
  </View>
));
CategoryGroup.displayName = "CategoryGroup";

export default function KidsPartyFoodList({ listId }: { listId: string }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFood, setNewFood] = useState({
    text: "", emoji: "🍽️", email: "", type: "E", category: "Snacks", number: "1", notes: "",
  });
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {} as Record<string, boolean>)
  );

  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addFood = useAddRowCallback(
    "todos",
    (food: any) => ({
      text: food.text.trim(),
      emoji: food.emoji,
      email: food.email,
      type: food.type,
      category: food.category,
      number: parseInt(food.number, 10) || 1,
      notes: food.notes,
      list: listId,
      done: false,
      fiveStarRating: 3,
    }),
    [listId]
  );

  const groupedItems = useMemo(() => {
    return todoIds.reduce((acc: Record<string, string[]>, id) => {
      const item = store?.getRow("todos", id);
      if (item) {
        const cat = String(item.category || "Snacks");
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(id);
      }
      return acc;
    }, {});
  }, [todoIds, store]);

  const toggleCategory = useCallback((cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const handleAddSubmit = () => {
    if (newFood.text.trim()) {
      addFood(newFood);
      setNewFood({ text: "", emoji: "🍽️", email: "", type: "E", category: "Snacks", number: "1", notes: "" });
      setShowAddModal(false);
    }
  };

  const progressLabel = useMemo(() => {
    if (todoIds.length === 0) return "Let's plan some party food! 🎈";
    if (todoIds.length <= 5) return "Menu coming together 🍕";
    return "Party food sorted! 🥳";
  }, [todoIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.listTitle}>{String(listData?.name || "Kids Party Food Planner")}</Text>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{todoIds.length} items</Text>
          </View>
        </View>

        <Pressable onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Food Item</Text>
        </Pressable>

        {CATEGORIES.map((category) => {
          const items = groupedItems[category.name] || [];
          if (items.length === 0) return null;
          return <CategoryGroup key={category.name} category={category} items={items}
            isOpen={openCategories[category.name]} onToggle={() => toggleCategory(category.name)} />;
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎂</Text>
            <Text style={styles.emptyTitle}>No party food yet!</Text>
            <Text style={styles.emptySubtitle}>Add items to start planning your party menu</Text>
          </View>
        )}
      </View>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Add New Party Food Item</Text>

              <View style={styles.emojiRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {FOOD_EMOJIS.map((e) => (
                    <Pressable key={e} onPress={() => setNewFood({ ...newFood, emoji: e })}
                      style={[styles.emojiOption, newFood.emoji === e && styles.emojiOptionActive]}>
                      <Text style={styles.emojiText}>{e}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <TextInput style={styles.modalInput} value={newFood.text}
                onChangeText={(t) => setNewFood({ ...newFood, text: t })}
                placeholder="Food item name" placeholderTextColor="#A0AEC0" />
              <TextInput style={styles.modalInput} value={newFood.email}
                onChangeText={(t) => setNewFood({ ...newFood, email: t })}
                placeholder="Who's bringing this?" placeholderTextColor="#A0AEC0" />
              <TextInput style={styles.modalInput} value={newFood.number}
                onChangeText={(t) => setNewFood({ ...newFood, number: t })}
                placeholder="Quantity" placeholderTextColor="#A0AEC0" keyboardType="number-pad" />
              <TextInput style={[styles.modalInput, { minHeight: 60, textAlignVertical: "top" }]}
                value={newFood.notes} onChangeText={(t) => setNewFood({ ...newFood, notes: t })}
                placeholder="Notes" placeholderTextColor="#A0AEC0" multiline />

              <View style={styles.modalButtons}>
                <Pressable onPress={handleAddSubmit} style={styles.modalSubmit}>
                  <Text style={styles.modalSubmitText}>Add Food Item</Text>
                </Pressable>
                <Pressable onPress={() => setShowAddModal(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F7" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#97266D" },
  progressLabel: { fontSize: 12, color: "#D53F8C", fontStyle: "italic", marginTop: 2 },
  headerBadge: { backgroundColor: "#FED7E2", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  headerBadgeText: { fontSize: 13, fontWeight: "600", color: "#97266D" },
  addButton: { backgroundColor: "#D53F8C", borderRadius: 8, padding: 12, alignItems: "center", marginBottom: 16 },
  addButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  categoryGroup: { marginBottom: 8 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFF0F5", borderRadius: 8, padding: 10 },
  categoryHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryEmoji: { fontSize: 18 },
  categoryTitle: { fontWeight: "bold", color: "#97266D", fontSize: 15 },
  countBadge: { backgroundColor: "#D53F8C", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countText: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  categoryItems: { marginTop: 4, gap: 4 },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 8, marginBottom: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemDone: { opacity: 0.7 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", padding: 10, gap: 8 },
  itemEmoji: { fontSize: 22, marginTop: 2 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: "bold", color: "#2D3748" },
  itemTitleDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: "600" },
  itemRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  checkbox: { padding: 2 },
  checkboxInner: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#38A169", borderColor: "#38A169" },
  checkmark: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  iconBtn: { padding: 4 },
  detailsSection: { backgroundColor: "#FFF5F7", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#FED7E2" },
  detailLabel: { fontSize: 12, fontWeight: "bold", color: "#97266D" },
  detailInput: { backgroundColor: "#FFFFFF", borderRadius: 6, borderWidth: 1, borderColor: "#FED7E2", paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: "#EDF2F7" },
  chipActive: { backgroundColor: "#D53F8C" },
  chipText: { fontSize: 12, color: "#4A5568" },
  starsRow: { flexDirection: "row", gap: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#97266D" },
  emptySubtitle: { fontSize: 14, color: "#D53F8C", textAlign: "center", maxWidth: 280 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalScroll: { maxHeight: "80%", width: "90%" },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#97266D" },
  emojiRow: { marginBottom: 4 },
  emojiOption: { padding: 6, borderRadius: 8, borderWidth: 2, borderColor: "transparent", marginRight: 4 },
  emojiOptionActive: { backgroundColor: "#FED7E2", borderColor: "#D53F8C" },
  emojiText: { fontSize: 24 },
  modalInput: { backgroundColor: "#F7FAFC", borderRadius: 8, borderWidth: 1, borderColor: "#FED7E2", paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalSubmit: { flex: 1, backgroundColor: "#D53F8C", borderRadius: 8, padding: 12, alignItems: "center" },
  modalSubmitText: { color: "#FFFFFF", fontWeight: "bold" },
  modalCancel: { flex: 1, backgroundColor: "#EDF2F7", borderRadius: 8, padding: 12, alignItems: "center" },
  modalCancelText: { color: "#4A5568", fontWeight: "500" },
});

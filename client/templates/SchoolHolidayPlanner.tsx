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
  useDelRowCallback,
  useAddRowCallback,
  useStore,
} from "tinybase/ui-react";
import { Trash, CaretDown, CaretUp } from "phosphor-react-native";

const CATEGORIES = [
  { name: "Outdoors", emoji: "☀️" },
  { name: "Creative", emoji: "🎨" },
  { name: "Social", emoji: "👥" },
  { name: "Learning", emoji: "📚" },
  { name: "Travel", emoji: "✈️" },
  { name: "Home", emoji: "🏠" },
  { name: "Other", emoji: "📋" },
];

const ActivityItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const isDone = Boolean(itemData.done);

  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this activity?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
    ]);
  };

  return (
    <View style={[styles.itemCard, isDone && styles.itemDone]}>
      <View style={styles.itemRow}>
        <Pressable onPress={handleToggle} style={styles.checkbox}>
          <View style={[styles.checkboxInner, isDone && styles.checkboxChecked]}>
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>
        <Text style={styles.itemEmoji}>{String(itemData.emoji || "🌴")}</Text>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemText, isDone && styles.itemTextDone]} numberOfLines={1}>{String(itemData.text || "")}</Text>
          {itemData.date && <Text style={styles.itemDate}>{String(itemData.date)}</Text>}
        </View>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
          {expanded ? <CaretUp size={16} color="#38A169" /> : <CaretDown size={16} color="#38A169" />}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={16} color="#E53E3E" />
        </Pressable>
      </View>
      {expanded && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Date:</Text>
          <TextInput style={styles.detailInput} value={String(itemData.date || "")}
            onChangeText={(t) => store?.setCell("todos", id, "date", t)} placeholder="YYYY-MM-DD" placeholderTextColor="#A0AEC0" />
          <Text style={styles.detailLabel}>Notes:</Text>
          <TextInput style={[styles.detailInput, { minHeight: 50, textAlignVertical: "top" }]}
            value={String(itemData.notes || "")} onChangeText={(t) => store?.setCell("todos", id, "notes", t)}
            placeholder="Details..." placeholderTextColor="#A0AEC0" multiline />
        </View>
      )}
    </View>
  );
});
ActivityItem.displayName = "ActivityItem";

export default function SchoolHolidayPlanner({ listId }: { listId: string }) {
  const [newActivity, setNewActivity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Outdoors");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addActivity = useAddRowCallback(
    "todos",
    (text: string) => ({
      text: text.trim(),
      category: selectedCategory,
      emoji: CATEGORIES.find((c) => c.name === selectedCategory)?.emoji || "🌴",
      list: listId,
      done: false,
      date: "",
      notes: "",
    }),
    [listId, selectedCategory],
    undefined,
    (rowId) => { if (rowId) setNewActivity(""); }
  );

  const handleAdd = useCallback(() => {
    if (newActivity.trim()) addActivity(newActivity);
  }, [addActivity, newActivity]);

  const progressLabel = useMemo(() => {
    if (todoIds.length === 0) return "Plan some holiday fun! ☀️";
    if (todoIds.length <= 5) return "Holiday ideas brewing 🌴";
    return "Packed holiday ahead! 🎉";
  }, [todoIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.listTitle}>{String(listData?.name || "School Holiday Planner")}</Text>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{todoIds.length} activities</Text>
          </View>
        </View>

        <Pressable onPress={() => setShowCategoryPicker(!showCategoryPicker)} style={styles.categoryPickerBtn}>
          <Text style={styles.categoryPickerText}>
            {CATEGORIES.find((c) => c.name === selectedCategory)?.emoji} {selectedCategory}
          </Text>
          <CaretDown size={14} color="#718096" />
        </Pressable>
        {showCategoryPicker && (
          <View style={styles.pickerDropdown}>
            {CATEGORIES.map(({ name, emoji }) => (
              <Pressable key={name} onPress={() => { setSelectedCategory(name); setShowCategoryPicker(false); }}
                style={[styles.pickerOption, selectedCategory === name && styles.pickerOptionActive]}>
                <Text>{emoji} {name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.addRow}>
          <TextInput style={styles.addInput} value={newActivity} onChangeText={setNewActivity}
            placeholder="Add holiday activity..." placeholderTextColor="#A0AEC0"
            onSubmitEditing={handleAdd} returnKeyType="done" />
          <Pressable onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {todoIds.map((id) => <ActivityItem key={id} id={id} />)}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌴</Text>
            <Text style={styles.emptyTitle}>No holiday plans yet!</Text>
            <Text style={styles.emptySubtitle}>Add activities to make the most of the holidays</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FFF4" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#276749" },
  progressLabel: { fontSize: 12, color: "#38A169", fontStyle: "italic", marginTop: 2 },
  countBadge: { backgroundColor: "#C6F6D5", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  countBadgeText: { fontSize: 13, fontWeight: "600", color: "#276749" },
  categoryPickerBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#C6F6D5", marginBottom: 8, gap: 6, alignSelf: "flex-start" },
  categoryPickerText: { fontSize: 14, color: "#4A5568" },
  pickerDropdown: { backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#C6F6D5", overflow: "hidden", marginBottom: 8 },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 10 },
  pickerOptionActive: { backgroundColor: "#F0FFF4" },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  addInput: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#2D3748", borderWidth: 1, borderColor: "#C6F6D5" },
  addButton: { backgroundColor: "#38A169", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 8, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemDone: { opacity: 0.6 },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 6 },
  checkbox: { padding: 4 },
  checkboxInner: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#38A169", borderColor: "#38A169" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  itemEmoji: { fontSize: 18 },
  itemInfo: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  itemTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemDate: { fontSize: 11, color: "#718096", marginTop: 2 },
  iconBtn: { padding: 4 },
  detailsSection: { backgroundColor: "#F0FFF4", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#C6F6D5" },
  detailLabel: { fontSize: 13, fontWeight: "500", color: "#276749" },
  detailInput: { backgroundColor: "#FFFFFF", borderRadius: 6, borderWidth: 1, borderColor: "#C6F6D5", paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#276749" },
  emptySubtitle: { fontSize: 14, color: "#38A169", textAlign: "center", maxWidth: 280 },
});

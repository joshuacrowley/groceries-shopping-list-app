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

const LOCATIONS = [
  { name: "Garden", emoji: "🌳" },
  { name: "Outside House", emoji: "🏠" },
  { name: "Kitchen", emoji: "🍳" },
  { name: "Living Areas", emoji: "🛋️" },
  { name: "Office", emoji: "💼" },
  { name: "Other", emoji: "🏡" },
];

const MaintenanceItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this task?", [
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
        <View style={styles.itemInfo}>
          <Text style={[styles.itemText, isDone && styles.itemTextDone]}>{String(itemData.text || "")}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{String(itemData.category || "Other")}</Text>
        </View>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
          {expanded ? <CaretUp size={18} color="#D69E2E" /> : <CaretDown size={18} color="#D69E2E" />}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={18} color="#E53E3E" />
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Item:</Text>
          <TextInput style={styles.detailInput} value={String(itemData.url || "")}
            onChangeText={(t) => store?.setCell("todos", id, "url", t)}
            placeholder="e.g., spa, oven, deck" placeholderTextColor="#A0AEC0" />
          <Text style={styles.detailLabel}>Details:</Text>
          <TextInput style={[styles.detailInput, { minHeight: 60, textAlignVertical: "top" }]}
            value={String(itemData.notes || "")}
            onChangeText={(t) => store?.setCell("todos", id, "notes", t)}
            placeholder="Details about the task" placeholderTextColor="#A0AEC0" multiline />
          <Text style={styles.detailLabel}>Due Date:</Text>
          <TextInput style={styles.detailInput} value={String(itemData.date || "")}
            onChangeText={(t) => store?.setCell("todos", id, "date", t)}
            placeholder="YYYY-MM-DD" placeholderTextColor="#A0AEC0" />
        </View>
      )}
    </View>
  );
});
MaintenanceItem.displayName = "MaintenanceItem";

const CategorySection = memo(({ location, items, isOpen, onToggle }: {
  location: (typeof LOCATIONS)[0]; items: string[]; isOpen: boolean; onToggle: () => void;
}) => (
  <View style={styles.categoryGroup}>
    <Pressable onPress={onToggle} style={styles.categoryHeader}>
      <View style={styles.categoryHeaderLeft}>
        <Text style={styles.categoryEmoji}>{location.emoji}</Text>
        <Text style={styles.categoryTitle}>{location.name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>
      {isOpen ? <CaretDown size={16} color="#D69E2E" /> : <CaretUp size={16} color="#D69E2E" />}
    </Pressable>
    {isOpen && (
      <View style={styles.categoryItems}>
        {items.map((id) => <MaintenanceItem key={id} id={id} />)}
      </View>
    )}
  </View>
));
CategorySection.displayName = "CategorySection";

export default function HomeMaintenanceList({ listId }: { listId: string }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ text: "", category: LOCATIONS[0].name, url: "", notes: "", date: "" });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    LOCATIONS.reduce((acc, loc) => ({ ...acc, [loc.name]: true }), {} as Record<string, boolean>)
  );

  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const store = useStore();

  const addTask = useAddRowCallback(
    "todos",
    (task: any) => ({
      text: task.text.trim(),
      category: task.category,
      url: task.url,
      notes: task.notes,
      date: task.date,
      list: listId,
      done: false,
    }),
    [listId]
  );

  const groupedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const item = store?.getRow("todos", id);
      if (item) {
        const cat = String(item.category || "Other");
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(id);
      }
    });
    return grouped;
  }, [todoIds, store]);

  const toggleCategory = useCallback((cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  const handleAddSubmit = () => {
    if (newTask.text.trim()) {
      addTask(newTask);
      setNewTask({ text: "", category: LOCATIONS[0].name, url: "", notes: "", date: "" });
      setShowAddModal(false);
    }
  };

  const progressLabel = useMemo(() => {
    if (todoIds.length === 0) return "Track home tasks! 🏠";
    if (todoIds.length <= 3) return "A few things to do 🔧";
    return "On top of maintenance! 🏡";
  }, [todoIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.listTitle}>{String(listData?.name || "Home Maintenance")}</Text>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
          </View>
          <Text style={styles.taskCount}>Tasks: {todoIds.length}</Text>
        </View>

        <Pressable onPress={() => setShowAddModal(true)} style={styles.addTaskButton}>
          <Text style={styles.addTaskButtonText}>+ Add Maintenance Task</Text>
        </Pressable>

        {LOCATIONS.map((location) => {
          const items = groupedItems[location.name] || [];
          if (items.length === 0) return null;
          return (
            <CategorySection key={location.name} location={location} items={items}
              isOpen={openCategories[location.name]} onToggle={() => toggleCategory(location.name)} />
          );
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏠</Text>
            <Text style={styles.emptyTitle}>No maintenance tasks yet</Text>
            <Text style={styles.emptySubtitle}>Add home tasks to stay on top of repairs and upkeep</Text>
          </View>
        )}
      </View>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Add Maintenance Task</Text>
            <TextInput style={styles.modalInput} value={newTask.text}
              onChangeText={(t) => setNewTask({ ...newTask, text: t })} placeholder="Task name" placeholderTextColor="#A0AEC0" />

            <Pressable onPress={() => setShowCategoryPicker(!showCategoryPicker)} style={styles.categoryPickerBtn}>
              <Text style={styles.categoryPickerText}>{newTask.category}</Text>
              <CaretDown size={14} color="#718096" />
            </Pressable>
            {showCategoryPicker && (
              <View style={styles.pickerDropdown}>
                {LOCATIONS.map(({ name, emoji }) => (
                  <Pressable key={name} onPress={() => { setNewTask({ ...newTask, category: name }); setShowCategoryPicker(false); }}
                    style={[styles.pickerOption, newTask.category === name && styles.pickerOptionActive]}>
                    <Text>{emoji} {name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <TextInput style={styles.modalInput} value={newTask.url}
              onChangeText={(t) => setNewTask({ ...newTask, url: t })} placeholder="Item (e.g., spa, oven)" placeholderTextColor="#A0AEC0" />
            <TextInput style={[styles.modalInput, { minHeight: 60, textAlignVertical: "top" }]} value={newTask.notes}
              onChangeText={(t) => setNewTask({ ...newTask, notes: t })} placeholder="Details" placeholderTextColor="#A0AEC0" multiline />
            <TextInput style={styles.modalInput} value={newTask.date}
              onChangeText={(t) => setNewTask({ ...newTask, date: t })} placeholder="Due date (YYYY-MM-DD)" placeholderTextColor="#A0AEC0" />

            <View style={styles.modalButtons}>
              <Pressable onPress={handleAddSubmit} style={styles.modalSubmit}>
                <Text style={styles.modalSubmitText}>Add Task</Text>
              </Pressable>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FEFCBF" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#744210" },
  progressLabel: { fontSize: 12, color: "#D69E2E", fontStyle: "italic", marginTop: 2 },
  taskCount: { fontSize: 14, fontWeight: "bold", color: "#744210" },
  addTaskButton: { backgroundColor: "#D69E2E", borderRadius: 8, padding: 12, alignItems: "center", marginBottom: 16 },
  addTaskButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  categoryGroup: { marginBottom: 8 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FEFCBF", borderRadius: 8, padding: 10 },
  categoryHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryEmoji: { fontSize: 20 },
  categoryTitle: { fontWeight: "bold", color: "#744210", fontSize: 15 },
  countBadge: { backgroundColor: "#ECC94B", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countText: { fontSize: 12, fontWeight: "600", color: "#744210" },
  categoryItems: { marginTop: 4, gap: 4 },
  itemCard: { backgroundColor: "#FFFFF0", borderRadius: 8, marginBottom: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemDone: { opacity: 0.6 },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  checkbox: { padding: 4 },
  checkboxInner: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#D69E2E", borderColor: "#D69E2E" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  itemInfo: { flex: 1 },
  itemText: { fontSize: 15, fontWeight: "600", color: "#744210" },
  itemTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  categoryBadge: { backgroundColor: "#ECC94B", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  categoryBadgeText: { fontSize: 10, fontWeight: "600", color: "#744210" },
  iconBtn: { padding: 6 },
  detailsSection: { backgroundColor: "#FFFFF0", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#ECC94B" },
  detailLabel: { fontSize: 13, fontWeight: "bold", color: "#744210" },
  detailInput: { backgroundColor: "#FFFFFF", borderRadius: 6, borderWidth: 1, borderColor: "#ECC94B", paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#744210" },
  emptySubtitle: { fontSize: 14, color: "#D69E2E", textAlign: "center", maxWidth: 280 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFFFF0", borderRadius: 12, padding: 20, width: 320, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#744210", marginBottom: 4 },
  modalInput: { backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#ECC94B", paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  categoryPickerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#ECC94B" },
  categoryPickerText: { fontSize: 14, color: "#4A5568" },
  pickerDropdown: { backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#ECC94B", overflow: "hidden" },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 10 },
  pickerOptionActive: { backgroundColor: "#FEFCBF" },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalSubmit: { flex: 1, backgroundColor: "#D69E2E", borderRadius: 8, padding: 12, alignItems: "center" },
  modalSubmitText: { color: "#FFFFFF", fontWeight: "bold" },
  modalCancel: { flex: 1, backgroundColor: "#EDF2F7", borderRadius: 8, padding: 12, alignItems: "center" },
  modalCancelText: { color: "#4A5568", fontWeight: "500" },
});

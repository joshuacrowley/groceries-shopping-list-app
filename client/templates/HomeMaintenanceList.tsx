import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, Modal, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CaretDown, CaretRight, HouseLine } from "phosphor-react-native";

const LOCATIONS = [
  { name: "Garden", emoji: "🌳" },
  { name: "Outside House", emoji: "🏠" },
  { name: "Kitchen", emoji: "🍳" },
  { name: "Living Areas", emoji: "🛋️" },
  { name: "Office", emoji: "💼" },
  { name: "Other", emoji: "🔧" },
];

const MaintenanceItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const category = String(itemData.category || "Other");

  return (
    <View style={[styles.item, { opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: "#D69E2E", borderColor: "#D69E2E" }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        {itemData.date ? <Text style={styles.itemDate}>📅 {String(itemData.date)}</Text> : null}
        {itemData.notes ? <Text style={styles.itemNotes} numberOfLines={2}>{String(itemData.notes)}</Text> : null}
      </View>
      <View style={[styles.catBadge, { backgroundColor: "#D69E2E20" }]}>
        <Text style={[styles.catBadgeText, { color: "#D69E2E" }]}>{category}</Text>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function HomeMaintenanceList({ listId }: { listId: string }) {
  const [newTask, setNewTask] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0].name);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(LOCATIONS.reduce((acc, c) => ({ ...acc, [c.name]: true }), {}));
  const [showModal, setShowModal] = useState(false);
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const groupedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const cat = String(store?.getCell("todos", id, "category") || "Other");
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(id);
    });
    return grouped;
  }, [todoIds, store]);

  const addTask = useAddRowCallback(
    "todos",
    (data: any) => ({ text: data.text?.trim() || "", category: data.category || selectedLocation, notes: "", date: "", url: "", list: listId, done: false }),
    [listId, selectedLocation]
  );

  const handleAdd = useCallback(() => {
    if (newTask.trim()) { addTask({ text: newTask.trim(), category: selectedLocation }); setNewTask(""); }
  }, [newTask, selectedLocation, addTask]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <HouseLine size={32} color="#975A16" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "Home Maintenance")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Track home tasks! 🏠" : todoIds.length <= 3 ? "A few things to do 🔧" : "On top of maintenance! 🏡"}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{todoIds.length}</Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.catRow}>{LOCATIONS.map(({ name, emoji }) => (
              <Pressable key={name} onPress={() => setSelectedLocation(name)} style={[styles.catChip, selectedLocation === name && styles.catChipSelected]}>
                <Text style={[styles.catChipText, selectedLocation === name && styles.catChipTextSelected]}>{emoji} {name}</Text>
              </Pressable>
            ))}</View>
          </ScrollView>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add maintenance task..." value={newTask} onChangeText={setNewTask} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {LOCATIONS.map((loc) => {
          const items = groupedItems[loc.name] || [];
          if (items.length === 0) return null;
          const isOpen = openCategories[loc.name] !== false;
          return (
            <View key={loc.name} style={styles.catSection}>
              <Pressable onPress={() => setOpenCategories((p) => ({ ...p, [loc.name]: !isOpen }))} style={styles.catHeader}>
                <Text style={styles.catName}>{loc.emoji} {loc.name}</Text>
                <View style={styles.catMeta}>
                  <View style={styles.countBadge}><Text style={styles.countText}>{items.length}</Text></View>
                  {isOpen ? <CaretDown size={14} color="#975A16" /> : <CaretRight size={14} color="#975A16" />}
                </View>
              </Pressable>
              {isOpen && <View style={styles.catItems}>{items.map((id) => <MaintenanceItem key={id} id={id} />)}</View>}
            </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFF0" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#975A16" },
  subtitle: { fontSize: 12, color: "#D69E2E", fontStyle: "italic" },
  headerBadge: { backgroundColor: "#FEFCBF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#975A16", fontWeight: "600", fontSize: 13 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  catRow: { flexDirection: "row", gap: 6 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#FEFCBF", borderWidth: 1, borderColor: "#ECC94B" },
  catChipSelected: { backgroundColor: "#ECC94B", borderColor: "#D69E2E" },
  catChipText: { fontSize: 12, color: "#975A16" },
  catChipTextSelected: { color: "#744210", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#ECC94B", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#D69E2E", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  catSection: { marginBottom: 8 },
  catHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8, backgroundColor: "#FEFCBF" },
  catName: { fontSize: 14, fontWeight: "bold", color: "#975A16" },
  catMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  countBadge: { backgroundColor: "#ECC94B30", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 11, fontWeight: "600", color: "#975A16" },
  catItems: { gap: 4, marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFF0", borderRadius: 8, padding: 10, gap: 8 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#ECC94B", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "600", color: "#744210" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemDate: { fontSize: 11, color: "#D69E2E", marginTop: 2 },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  catBadgeText: { fontSize: 10, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#975A16" },
  emptySubtitle: { fontSize: 14, color: "#D69E2E", textAlign: "center", maxWidth: 280 },
});

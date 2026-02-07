import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CaretDown, CaretRight } from "phosphor-react-native";

const CATEGORIES = [
  { name: "Wash", emoji: "🫧", color: "#0BC5EA" },
  { name: "Dry", emoji: "☀️", color: "#ECC94B" },
  { name: "Fold", emoji: "👕", color: "#319795" },
  { name: "Iron", emoji: "♨️", color: "#DD6B20" },
  { name: "Put Away", emoji: "🗄️", color: "#805AD5" },
];

const LaundryItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const cat = CATEGORIES.find((c) => c.name === String(itemData.category)) || CATEGORIES[0];

  return (
    <View style={[styles.item, { borderLeftColor: isDone ? "#CBD5E0" : cat.color, opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: cat.color, borderColor: cat.color }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <Text style={styles.emoji}>{String(itemData.emoji || cat.emoji)}</Text>
      <View style={styles.itemContent}>
        <View style={styles.itemRow}>
          <Text style={[styles.itemText, isDone && styles.strikethrough]} numberOfLines={1}>{String(itemData.text || "")}</Text>
          <View style={[styles.catBadge, { backgroundColor: cat.color + "20" }]}>
            <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.name}</Text>
          </View>
        </View>
        {itemData.notes ? <Text style={[styles.itemNotes, isDone && styles.strikethrough]} numberOfLines={2}>{String(itemData.notes)}</Text> : null}
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function LaundryTracker({ listId }: { listId: string }) {
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(CATEGORIES.reduce((acc, c) => ({ ...acc, [c.name]: true }), {}));
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const categorizedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => { const cat = String(store?.getCell("todos", id, "category") || "Wash"); if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(id); });
    return grouped;
  }, [todoIds, store]);

  const doneCount = useMemo(() => todoIds.filter((id) => Boolean(store?.getCell("todos", id, "done"))).length, [todoIds, store]);
  const progress = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const addItem = useAddRowCallback("todos", (data: any) => ({ text: data.text?.trim() || "", category: data.category || selectedCategory, emoji: CATEGORIES.find(c => c.name === (data.category || selectedCategory))?.emoji || "🧺", notes: "", done: false, list: listId }), [listId, selectedCategory]);

  const handleAdd = useCallback(() => { if (newTodo.trim()) { addItem({ text: newTodo.trim(), category: selectedCategory }); setNewTodo(""); } }, [newTodo, selectedCategory, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 28 }}>🧺</Text>
            <View>
              <Text style={styles.title}>{String(listData?.name || "Laundry Tracker")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Add loads to track your laundry" : progress === 100 ? "All clean! 🧺" : progress >= 50 ? "Spinning away 🌀" : "Time to start sorting 🧦"}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{doneCount}/{todoIds.length}</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>

        <View style={styles.addSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.catRow}>{CATEGORIES.map(({ name, emoji }) => (
              <Pressable key={name} onPress={() => setSelectedCategory(name)} style={[styles.catChip, selectedCategory === name && styles.catChipSelected]}>
                <Text style={[styles.catChipText, selectedCategory === name && styles.catChipTextSelected]}>{emoji} {name}</Text>
              </Pressable>
            ))}</View>
          </ScrollView>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add laundry item..." value={newTodo} onChangeText={setNewTodo} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {CATEGORIES.map((cat) => {
          const items = categorizedItems[cat.name] || [];
          if (items.length === 0) return null;
          const isOpen = openCategories[cat.name] !== false;
          return (
            <View key={cat.name} style={styles.catSection}>
              <Pressable onPress={() => setOpenCategories((p) => ({ ...p, [cat.name]: !isOpen }))} style={[styles.catHeader, { backgroundColor: cat.color + "20" }]}>
                <Text style={[styles.catName, { color: cat.color }]}>{cat.emoji} {cat.name}</Text>
                <View style={styles.catMeta}>
                  <View style={[styles.countBadge, { backgroundColor: cat.color + "30" }]}><Text style={[styles.countText, { color: cat.color }]}>{items.length}</Text></View>
                  {isOpen ? <CaretDown size={14} color={cat.color} /> : <CaretRight size={14} color={cat.color} />}
                </View>
              </Pressable>
              {isOpen && <View style={styles.catItems}>{items.map((id) => <LaundryItem key={id} id={id} />)}</View>}
            </View>
          );
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧺</Text>
            <Text style={styles.emptyTitle}>No laundry to track</Text>
            <Text style={styles.emptySubtitle}>Add loads and items to stay on top of your laundry game</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F7FA" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#00838F" },
  subtitle: { fontSize: 12, color: "#0097A7", fontStyle: "italic" },
  headerBadge: { backgroundColor: "#B2EBF2", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#00838F", fontWeight: "600", fontSize: 14 },
  progressBar: { height: 8, backgroundColor: "#B2EBF2", borderRadius: 4, overflow: "hidden", marginBottom: 16 },
  progressFill: { height: "100%", backgroundColor: "#00BCD4", borderRadius: 4 },
  addSection: { backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10 },
  catRow: { flexDirection: "row", gap: 6 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#E0F7FA", borderWidth: 1, borderColor: "#B2EBF2" },
  catChipSelected: { backgroundColor: "#80DEEA", borderColor: "#00BCD4" },
  catChipText: { fontSize: 12, color: "#4A5568" },
  catChipTextSelected: { color: "#006064", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#B2EBF2", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#00BCD4", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  catSection: { marginBottom: 8 },
  catHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8 },
  catName: { fontSize: 14, fontWeight: "bold" },
  catMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 11, fontWeight: "600" },
  catItems: { gap: 4, marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, borderLeftWidth: 4, gap: 8 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 18 },
  itemContent: { flex: 1 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748", flex: 1 },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  catBadgeText: { fontSize: 10, fontWeight: "600" },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#00838F" },
  emptySubtitle: { fontSize: 14, color: "#0097A7", textAlign: "center", maxWidth: 280 },
});

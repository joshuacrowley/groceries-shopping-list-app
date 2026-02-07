import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CaretDown, CaretRight, GraduationCap } from "phosphor-react-native";

const CATEGORIES = [
  { value: "term-dates", label: "Term Dates", color: "#805AD5" },
  { value: "pupil-free", label: "Pupil-Free", color: "#DD6B20" },
  { value: "sports", label: "Sports", color: "#38A169" },
  { value: "excursions", label: "Excursions", color: "#3182CE" },
  { value: "conferences", label: "Parent-Teacher", color: "#D53F8C" },
  { value: "assignments", label: "Assignments", color: "#E53E3E" },
  { value: "other", label: "Other", color: "#718096" },
];

const SchoolItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const cat = CATEGORIES.find((c) => c.value === String(itemData.category)) || CATEGORIES[6];

  return (
    <View style={[styles.item, { borderLeftColor: isDone ? "#CBD5E0" : cat.color, opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: cat.color, borderColor: cat.color }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        {itemData.date ? <Text style={styles.itemDate}>📅 {String(itemData.date)}</Text> : null}
        {itemData.notes ? <Text style={styles.itemNotes} numberOfLines={1}>{String(itemData.notes)}</Text> : null}
      </View>
      <View style={[styles.catBadge, { backgroundColor: cat.color + "20" }]}>
        <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.label}</Text>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function SchoolCalendarTodo({ listId }: { listId: string }) {
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].value);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(CATEGORIES.reduce((acc, c) => ({ ...acc, [c.value]: true }), {}));
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const categorizedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => { const cat = String(store?.getCell("todos", id, "category") || "other"); if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(id); });
    return grouped;
  }, [todoIds, store]);

  const addItem = useAddRowCallback("todos", (data: any) => ({ text: data.text?.trim() || "", category: data.category || selectedCategory, notes: "", date: "", done: false, list: listId }), [listId, selectedCategory]);

  const handleAdd = useCallback(() => { if (newTodo.trim()) { addItem({ text: newTodo.trim(), category: selectedCategory }); setNewTodo(""); } }, [newTodo, selectedCategory, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <GraduationCap size={28} color="#553C9A" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "School Calendar")}</Text>
              <Text style={styles.subtitle}>{todoIds.length} events tracked</Text>
            </View>
          </View>
        </View>

        <View style={styles.addSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.catRow}>{CATEGORIES.map(({ value, label }) => (
              <Pressable key={value} onPress={() => setSelectedCategory(value)} style={[styles.catChip, selectedCategory === value && styles.catChipSelected]}>
                <Text style={[styles.catChipText, selectedCategory === value && styles.catChipTextSelected]}>{label}</Text>
              </Pressable>
            ))}</View>
          </ScrollView>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add school event..." value={newTodo} onChangeText={setNewTodo} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {CATEGORIES.map((cat) => {
          const items = categorizedItems[cat.value] || [];
          if (items.length === 0) return null;
          const isOpen = openCategories[cat.value] !== false;
          return (
            <View key={cat.value} style={styles.catSection}>
              <Pressable onPress={() => setOpenCategories((p) => ({ ...p, [cat.value]: !isOpen }))} style={[styles.catHeader, { backgroundColor: cat.color + "20" }]}>
                <Text style={[styles.catName, { color: cat.color }]}>{cat.label}</Text>
                <View style={styles.catMeta}>
                  <View style={[styles.countBadge, { backgroundColor: cat.color + "30" }]}><Text style={[styles.countText, { color: cat.color }]}>{items.length}</Text></View>
                  {isOpen ? <CaretDown size={14} color={cat.color} /> : <CaretRight size={14} color={cat.color} />}
                </View>
              </Pressable>
              {isOpen && <View style={styles.catItems}>{items.map((id) => <SchoolItem key={id} id={id} />)}</View>}
            </View>
          );
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎓</Text>
            <Text style={styles.emptyTitle}>No school events yet</Text>
            <Text style={styles.emptySubtitle}>Add term dates, sports days, and more</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF5FF" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#553C9A" },
  subtitle: { fontSize: 12, color: "#805AD5", fontStyle: "italic" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  catRow: { flexDirection: "row", gap: 6 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#F3E8FF", borderWidth: 1, borderColor: "#D6BCFA" },
  catChipSelected: { backgroundColor: "#D6BCFA", borderColor: "#805AD5" },
  catChipText: { fontSize: 11, color: "#4A5568" },
  catChipTextSelected: { color: "#553C9A", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#D6BCFA", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#805AD5", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
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
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemDate: { fontSize: 11, color: "#805AD5", marginTop: 2 },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  catBadgeText: { fontSize: 10, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#553C9A" },
  emptySubtitle: { fontSize: 14, color: "#805AD5", textAlign: "center", maxWidth: 280 },
});

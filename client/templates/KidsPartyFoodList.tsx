import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CaretDown, CaretRight } from "phosphor-react-native";

const CATEGORIES = [
  { name: "Sweet", emoji: "🍰", color: "#D53F8C" },
  { name: "Savory", emoji: "🍕", color: "#DD6B20" },
  { name: "Drinks", emoji: "☕", color: "#805AD5" },
  { name: "Main Dishes", emoji: "🍽️", color: "#3182CE" },
  { name: "Snacks", emoji: "🍔", color: "#38A169" },
];

const FoodItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const cat = CATEGORIES.find((c) => c.name === String(itemData.category)) || CATEGORIES[4];

  return (
    <View style={[styles.item, { opacity: isDone ? 0.6 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: "#38A169", borderColor: "#38A169" }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <Text style={styles.emoji}>{String(itemData.emoji || "🍽️")}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        <View style={styles.tagRow}>
          {itemData.email ? <Text style={styles.tagText}>👤 {String(itemData.email)}</Text> : null}
          {Number(itemData.number) > 0 ? <Text style={styles.tagText}>🔢 Qty: {itemData.number}</Text> : null}
        </View>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function KidsPartyFoodList({ listId }: { listId: string }) {
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[4].name);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(CATEGORIES.reduce((acc, c) => ({ ...acc, [c.name]: true }), {}));
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const groupedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => { const cat = String(store?.getCell("todos", id, "category") || "Snacks"); if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(id); });
    return grouped;
  }, [todoIds, store]);

  const addItem = useAddRowCallback("todos", (data: any) => ({ text: data.text?.trim() || "", category: data.category || selectedCategory, emoji: "🍽️", notes: "", done: false, list: listId, number: 1, email: "", type: "E" }), [listId, selectedCategory]);

  const handleAdd = useCallback(() => { if (newTodo.trim()) { addItem({ text: newTodo.trim(), category: selectedCategory }); setNewTodo(""); } }, [newTodo, selectedCategory, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 28 }}>🎂</Text>
            <View>
              <Text style={styles.title}>{String(listData?.name || "Kids Party Food")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Let's plan some party food! 🎈" : todoIds.length <= 5 ? "Menu coming together 🍕" : "Party food sorted! 🥳"}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{todoIds.length}</Text>
          </View>
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
            <TextInput style={styles.addInput} placeholder="Add food item..." value={newTodo} onChangeText={setNewTodo} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {CATEGORIES.map((cat) => {
          const items = groupedItems[cat.name] || [];
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
              {isOpen && <View style={styles.catItems}>{items.map((id) => <FoodItem key={id} id={id} />)}</View>}
            </View>
          );
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎂</Text>
            <Text style={styles.emptyTitle}>No party food yet!</Text>
            <Text style={styles.emptySubtitle}>Add items to start planning your party menu</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F7" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#D53F8C" },
  subtitle: { fontSize: 12, color: "#ED64A6", fontStyle: "italic" },
  headerBadge: { backgroundColor: "#FBB6CE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#D53F8C", fontWeight: "600", fontSize: 13 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  catRow: { flexDirection: "row", gap: 6 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#FFF0F5", borderWidth: 1, borderColor: "#FBB6CE" },
  catChipSelected: { backgroundColor: "#FBB6CE", borderColor: "#D53F8C" },
  catChipText: { fontSize: 12, color: "#4A5568" },
  catChipTextSelected: { color: "#D53F8C", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#FBB6CE", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#D53F8C", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  catSection: { marginBottom: 8 },
  catHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8 },
  catName: { fontSize: 14, fontWeight: "bold" },
  catMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 11, fontWeight: "600" },
  catItems: { gap: 4, marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, gap: 8 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 18 },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "600", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  tagText: { fontSize: 11, color: "#718096" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#D53F8C" },
  emptySubtitle: { fontSize: 14, color: "#ED64A6", textAlign: "center", maxWidth: 280 },
});

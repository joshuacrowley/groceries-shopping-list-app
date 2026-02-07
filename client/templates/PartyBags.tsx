import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CaretDown, CaretRight } from "phosphor-react-native";

const CATEGORIES = [
  { name: "Sweets", emoji: "🍬", color: "#D53F8C" },
  { name: "Toys", emoji: "🎁", color: "#3182CE" },
  { name: "Decorations", emoji: "🎈", color: "#805AD5" },
  { name: "Other", emoji: "📦", color: "#718096" },
];

const PartyBagItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const cat = CATEGORIES.find((c) => c.name === String(itemData.category)) || CATEGORIES[3];

  return (
    <View style={[styles.item, { opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: cat.color, borderColor: cat.color }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <Text style={styles.emoji}>{String(itemData.emoji || cat.emoji)}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        {Number(itemData.number) > 0 ? <Text style={styles.itemNotes}>Qty: {itemData.number}</Text> : null}
      </View>
      <View style={[styles.catBadge, { backgroundColor: cat.color + "20" }]}>
        <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.name}</Text>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function PartyBags({ listId }: { listId: string }) {
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addItem = useAddRowCallback("todos", (data: any) => ({ text: data.text?.trim() || "", category: data.category || selectedCategory, emoji: CATEGORIES.find(c => c.name === (data.category || selectedCategory))?.emoji || "🎁", notes: "", done: false, list: listId, number: 1 }), [listId, selectedCategory]);

  const handleAdd = useCallback(() => { if (newTodo.trim()) { addItem({ text: newTodo.trim(), category: selectedCategory }); setNewTodo(""); } }, [newTodo, selectedCategory, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 28 }}>🎉</Text>
            <View>
              <Text style={styles.title}>{String(listData?.name || "Party Bags")}</Text>
              <Text style={styles.subtitle}>{todoIds.length === 0 ? "Plan your party bags! 🎈" : "Party bags coming together! 🎊"}</Text>
            </View>
          </View>
          <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{todoIds.length}</Text></View>
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
            <TextInput style={styles.addInput} placeholder="Add party bag item..." value={newTodo} onChangeText={setNewTodo} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {todoIds.map((id) => <PartyBagItem key={id} id={id} />)}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>No party bag items yet!</Text>
            <Text style={styles.emptySubtitle}>Add sweets, toys, and treats for your party bags</Text>
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
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, marginBottom: 6, gap: 8 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 18 },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  catBadgeText: { fontSize: 10, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#D53F8C" },
  emptySubtitle: { fontSize: 14, color: "#ED64A6", textAlign: "center", maxWidth: 280 },
});

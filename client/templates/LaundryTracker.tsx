import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, TShirt } from "phosphor-react-native";

const STAGES = [
  { name: "To Wash", emoji: "🧺", color: "#3182CE" },
  { name: "Washing", emoji: "🌊", color: "#0BC5EA" },
  { name: "Drying", emoji: "☀️", color: "#ECC94B" },
  { name: "To Fold", emoji: "👕", color: "#DD6B20" },
  { name: "Done", emoji: "✅", color: "#38A169" },
];

const LaundryItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const stage = STAGES.find((s) => s.name === String(itemData.category)) || STAGES[0];
  return (
    <View style={[styles.item, { borderLeftColor: stage.color, opacity: isDone ? 0.5 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)}><View style={[styles.cbox, isDone && { backgroundColor: stage.color, borderColor: stage.color }]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View></Pressable>
      <Text style={styles.emoji}>{stage.emoji}</Text>
      <View style={styles.itemContent}><Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text || "")}</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.stageRow}>{STAGES.map((s) => (<Pressable key={s.name} onPress={() => store?.setCell("todos", id, "category", s.name)} style={[styles.stageChip, String(itemData.category) === s.name && { backgroundColor: s.color + "20", borderColor: s.color }]}><Text style={[styles.stageText, String(itemData.category) === s.name && { color: s.color }]}>{s.emoji}</Text></Pressable>))}</View></ScrollView>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function LaundryTracker({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const addItem = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), category: "To Wash", done: false, list: listId }), [listId]);
  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem(newItem); setNewItem(""); } }, [addItem, newItem]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><TShirt size={32} color="#3182CE" weight="fill" /><Text style={styles.title}>{String(listData?.name || "Laundry Tracker")}</Text></View>
      <View style={styles.legend}>{STAGES.map((s) => (<View key={s.name} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: s.color }]} /><Text style={styles.legendText}>{s.emoji} {s.name}</Text></View>))}</View>
      <View style={styles.addSection}><View style={styles.addRow}><TextInput style={styles.addInput} placeholder="Add laundry load..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable></View></View>
      <View style={styles.list}>{todoIds.map((id) => <LaundryItem key={id} id={id} />)}</View>
      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>🧺</Text><Text style={styles.emptyT}>No laundry loads tracked</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EBF8FF" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }, title: { fontSize: 24, fontWeight: "bold", color: "#2B6CB0" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 4 }, legendDot: { width: 8, height: 8, borderRadius: 4 }, legendText: { fontSize: 11, color: "#4A5568" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#3182CE", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  list: { gap: 8 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, borderLeftWidth: 4, gap: 6, flexWrap: "wrap" },
  cbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" }, chk: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  emoji: { fontSize: 16 }, itemContent: { flex: 1, minWidth: 80 }, itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" },
  stageRow: { flexDirection: "row", gap: 4 }, stageChip: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" }, stageText: { fontSize: 12 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#2B6CB0" },
});

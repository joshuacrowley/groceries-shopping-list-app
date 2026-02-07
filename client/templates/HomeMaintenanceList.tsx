import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, House, CaretDown, CaretRight } from "phosphor-react-native";

const CATEGORIES = [
  { name: "Plumbing", emoji: "🔧", color: "#3182CE" },
  { name: "Electrical", emoji: "⚡", color: "#ECC94B" },
  { name: "Garden", emoji: "🌿", color: "#38A169" },
  { name: "Painting", emoji: "🎨", color: "#ED64A6" },
  { name: "Appliances", emoji: "🏠", color: "#805AD5" },
  { name: "Other", emoji: "📋", color: "#718096" },
];

const MaintenanceItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const cat = CATEGORIES.find((c) => c.name === String(itemData.category)) || CATEGORIES[5];
  return (
    <View style={[styles.item, { borderLeftColor: isDone ? "#CBD5E0" : cat.color, opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)}><View style={[styles.cbox, isDone && { backgroundColor: cat.color, borderColor: cat.color }]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View></Pressable>
      <View style={styles.itemContent}><Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text || "")}</Text>{itemData.date ? <Text style={styles.dateText}>Due: {String(itemData.date)}</Text> : null}{itemData.notes ? <Text style={styles.notes} numberOfLines={1}>{String(itemData.notes)}</Text> : null}</View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function HomeMaintenanceList({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0].name);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(CATEGORIES.reduce((a, c) => ({ ...a, [c.name]: true }), {}));
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const categorized = useMemo(() => { const g: Record<string, string[]> = {}; todoIds.forEach((id) => { const c = String(store?.getCell("todos", id, "category") || "Other"); if (!g[c]) g[c] = []; g[c].push(id); }); return g; }, [todoIds, store]);
  const addItem = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), category: selectedCat, done: false, list: listId, notes: "" }), [listId, selectedCat]);
  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem(newItem); setNewItem(""); } }, [addItem, newItem]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><House size={32} color="#2D3748" weight="fill" /><Text style={styles.title}>{String(listData?.name || "Home Maintenance")}</Text></View>
      <View style={styles.addSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.catRow}>{CATEGORIES.map(({ name, emoji }) => (<Pressable key={name} onPress={() => setSelectedCat(name)} style={[styles.catChip, selectedCat === name && styles.catChipSel]}><Text style={[styles.catChipText, selectedCat === name && styles.catChipTextSel]}>{emoji} {name}</Text></Pressable>))}</View></ScrollView>
        <View style={styles.addRow}><TextInput style={styles.addInput} placeholder="Add maintenance task..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable></View>
      </View>
      {CATEGORIES.map((cat) => { const items = categorized[cat.name] || []; if (!items.length) return null; const isOpen = openCats[cat.name] !== false; return (<View key={cat.name} style={styles.section}><Pressable onPress={() => setOpenCats((p) => ({ ...p, [cat.name]: !isOpen }))} style={[styles.secH, { backgroundColor: cat.color + "15" }]}><Text style={[styles.secN, { color: cat.color }]}>{cat.emoji} {cat.name}</Text><View style={styles.secM}><Text style={[styles.secC, { color: cat.color }]}>{items.length}</Text>{isOpen ? <CaretDown size={14} color={cat.color} /> : <CaretRight size={14} color={cat.color} />}</View></Pressable>{isOpen && <View style={styles.secI}>{items.map((id) => <MaintenanceItem key={id} id={id} />)}</View>}</View>); })}
      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>🏠</Text><Text style={styles.emptyT}>No maintenance tasks</Text><Text style={styles.emptyS}>Add tasks to keep your home in great shape</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFC" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }, title: { fontSize: 24, fontWeight: "bold", color: "#2D3748" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  catRow: { flexDirection: "row", gap: 6 }, catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7", borderWidth: 1, borderColor: "#E2E8F0" }, catChipSel: { backgroundColor: "#BEE3F8", borderColor: "#3182CE" }, catChipText: { fontSize: 12, color: "#4A5568" }, catChipTextSel: { color: "#2B6CB0", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#3182CE", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  section: { marginBottom: 8 }, secH: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8 }, secN: { fontSize: 14, fontWeight: "bold" }, secM: { flexDirection: "row", alignItems: "center", gap: 6 }, secC: { fontSize: 12, fontWeight: "600" }, secI: { gap: 4, marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, borderLeftWidth: 4, gap: 8 },
  cbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" }, chk: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemContent: { flex: 1 }, itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" }, dateText: { fontSize: 11, color: "#718096", marginTop: 2 }, notes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#2D3748" }, emptyS: { fontSize: 14, color: "#718096", textAlign: "center", maxWidth: 280 },
});

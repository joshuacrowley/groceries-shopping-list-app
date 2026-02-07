import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, Broom, CaretDown, CaretRight } from "phosphor-react-native";

const ROOMS = [
  { name: "Kitchen", emoji: "🍳", color: "#DD6B20" },
  { name: "Living Room", emoji: "🛋️", color: "#3182CE" },
  { name: "Bedroom", emoji: "🛏️", color: "#805AD5" },
  { name: "Bathroom", emoji: "🚿", color: "#0BC5EA" },
  { name: "Kids Room", emoji: "🧸", color: "#ED64A6" },
  { name: "Garden", emoji: "🌿", color: "#38A169" },
  { name: "Other", emoji: "🏠", color: "#718096" },
];

const TidyItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  return (
    <View style={[styles.item, { opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)}><View style={[styles.cbox, isDone && styles.cboxDone]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View></Pressable>
      <View style={styles.itemContent}><Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text || "")}</Text></View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function TidyUp({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0].name);
  const [openRooms, setOpenRooms] = useState<Record<string, boolean>>(ROOMS.reduce((a, r) => ({ ...a, [r.name]: true }), {}));
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const categorized = useMemo(() => { const g: Record<string, string[]> = {}; todoIds.forEach((id) => { const c = String(store?.getCell("todos", id, "category") || "Other"); if (!g[c]) g[c] = []; g[c].push(id); }); return g; }, [todoIds, store]);
  const doneCount = useMemo(() => { let c = 0; todoIds.forEach((id) => { if (store?.getCell("todos", id, "done")) c++; }); return c; }, [todoIds, store]);
  const progressPct = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;
  const addItem = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), category: selectedRoom, done: false, list: listId }), [listId, selectedRoom]);
  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem(newItem); setNewItem(""); } }, [addItem, newItem]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><Broom size={28} color="#805AD5" weight="fill" /><View><Text style={styles.title}>{String(listData?.name || "Tidy Up")}</Text><Text style={styles.subtitle}>{progressPct}% done</Text></View>{todoIds.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{doneCount}/{todoIds.length}</Text></View>}</View>
      {todoIds.length > 0 && <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressPct}%` }]} /></View>}
      <View style={styles.addSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.roomRow}>{ROOMS.map(({ name, emoji }) => (<Pressable key={name} onPress={() => setSelectedRoom(name)} style={[styles.roomChip, selectedRoom === name && styles.roomChipSel]}><Text style={[styles.roomChipText, selectedRoom === name && styles.roomChipTextSel]}>{emoji} {name}</Text></Pressable>))}</View></ScrollView>
        <View style={styles.addRow}><TextInput style={styles.addInput} placeholder="Add cleaning task..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable></View>
      </View>
      {ROOMS.map((room) => { const items = categorized[room.name] || []; if (!items.length) return null; const isOpen = openRooms[room.name] !== false; return (<View key={room.name} style={styles.section}><Pressable onPress={() => setOpenRooms((p) => ({ ...p, [room.name]: !isOpen }))} style={[styles.secH, { backgroundColor: room.color + "15" }]}><Text style={[styles.secN, { color: room.color }]}>{room.emoji} {room.name}</Text><View style={styles.secM}><Text style={[styles.secC, { color: room.color }]}>{items.length}</Text>{isOpen ? <CaretDown size={14} color={room.color} /> : <CaretRight size={14} color={room.color} />}</View></Pressable>{isOpen && <View style={styles.secI}>{items.map((id) => <TidyItem key={id} id={id} />)}</View>}</View>); })}
      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>🧹</Text><Text style={styles.emptyT}>All tidy!</Text><Text style={styles.emptyS}>Add cleaning tasks room by room</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF5FF" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }, title: { fontSize: 22, fontWeight: "bold", color: "#553C9A" }, subtitle: { fontSize: 12, color: "#805AD5", fontStyle: "italic" },
  badge: { marginLeft: "auto", backgroundColor: "#E9D8FD", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }, badgeText: { fontSize: 13, fontWeight: "600", color: "#553C9A" },
  progressTrack: { height: 6, backgroundColor: "#EDF2F7", borderRadius: 3, marginBottom: 16, overflow: "hidden" }, progressFill: { height: "100%", backgroundColor: "#805AD5", borderRadius: 3 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  roomRow: { flexDirection: "row", gap: 6 }, roomChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7", borderWidth: 1, borderColor: "#E2E8F0" }, roomChipSel: { backgroundColor: "#E9D8FD", borderColor: "#805AD5" }, roomChipText: { fontSize: 12, color: "#4A5568" }, roomChipTextSel: { color: "#553C9A", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#805AD5", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  section: { marginBottom: 8 }, secH: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8 }, secN: { fontSize: 14, fontWeight: "bold" }, secM: { flexDirection: "row", alignItems: "center", gap: 6 }, secC: { fontSize: 12, fontWeight: "600" }, secI: { gap: 4, marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, gap: 8 },
  cbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#805AD5", alignItems: "center", justifyContent: "center" }, cboxDone: { backgroundColor: "#805AD5" }, chk: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemContent: { flex: 1 }, itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#553C9A" }, emptyS: { fontSize: 14, color: "#718096", textAlign: "center" },
});

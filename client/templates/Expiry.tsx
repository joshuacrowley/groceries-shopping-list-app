import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, Timer, CaretDown, CaretRight } from "phosphor-react-native";

const LOCATIONS = [
  { name: "Fridge", emoji: "🧊", color: "#4299E1" },
  { name: "Freezer", emoji: "❄️", color: "#805AD5" },
  { name: "Pantry", emoji: "🏪", color: "#DD6B20" },
];

const ExpiryItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const daysLeft = useMemo(() => { if (!itemData.date) return null; const d = Math.ceil((new Date(String(itemData.date)).getTime() - Date.now()) / 86400000); return d; }, [itemData.date]);
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 3;
  return (
    <View style={[styles.item, { borderLeftColor: isExpired ? "#E53E3E" : isExpiringSoon ? "#ECC94B" : "#38A169", opacity: isDone ? 0.5 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)}><View style={[styles.cbox, isDone && styles.cboxDone]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View></Pressable>
      <Text style={styles.emoji}>{String(itemData.emoji || "🥫")}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text || "")}</Text>
        {itemData.date ? <Text style={styles.dateText}>Expires: {String(itemData.date)}</Text> : null}
      </View>
      {daysLeft !== null && <View style={[styles.daysBadge, { backgroundColor: isExpired ? "#FED7D7" : isExpiringSoon ? "#FEFCBF" : "#C6F6D5" }]}><Text style={[styles.daysText, { color: isExpired ? "#E53E3E" : isExpiringSoon ? "#D69E2E" : "#38A169" }]}>{isExpired ? "Expired" : `${daysLeft}d`}</Text></View>}
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function Expiry({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const [newDate, setNewDate] = useState("");
  const [selectedLoc, setSelectedLoc] = useState(LOCATIONS[0].name);
  const [openLocs, setOpenLocs] = useState<Record<string, boolean>>(LOCATIONS.reduce((a, l) => ({ ...a, [l.name]: true }), {}));
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const categorized = useMemo(() => { const g: Record<string, string[]> = {}; todoIds.forEach((id) => { const c = String(store?.getCell("todos", id, "category") || "Pantry"); if (!g[c]) g[c] = []; g[c].push(id); }); return g; }, [todoIds, store]);
  const addItem = useAddRowCallback("todos", (data: any) => ({ text: data.text.trim(), date: data.date, category: selectedLoc, emoji: "🥫", done: false, list: listId }), [listId, selectedLoc]);
  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem({ text: newItem, date: newDate }); setNewItem(""); setNewDate(""); } }, [addItem, newItem, newDate]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><Timer size={32} color="#DD6B20" weight="fill" /><View><Text style={styles.title}>{String(listData?.name || "Expiry Tracker")}</Text></View></View>
      <View style={styles.addSection}>
        <View style={styles.locRow}>{LOCATIONS.map((l) => (<Pressable key={l.name} onPress={() => setSelectedLoc(l.name)} style={[styles.locChip, selectedLoc === l.name && { backgroundColor: l.color + "20", borderColor: l.color }]}><Text style={[styles.locText, selectedLoc === l.name && { color: l.color }]}>{l.emoji} {l.name}</Text></Pressable>))}</View>
        <TextInput style={styles.input} placeholder="Item name" value={newItem} onChangeText={setNewItem} placeholderTextColor="#A0AEC0" />
        <TextInput style={styles.input} placeholder="Expiry date (YYYY-MM-DD)" value={newDate} onChangeText={setNewDate} placeholderTextColor="#A0AEC0" />
        <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={16} color="#FFF" weight="bold" /><Text style={styles.addBtnText}>Add</Text></Pressable>
      </View>
      {LOCATIONS.map((loc) => { const items = categorized[loc.name] || []; if (!items.length) return null; const isOpen = openLocs[loc.name] !== false; return (<View key={loc.name} style={styles.section}><Pressable onPress={() => setOpenLocs((p) => ({ ...p, [loc.name]: !isOpen }))} style={[styles.secH, { backgroundColor: loc.color + "15" }]}><Text style={[styles.secN, { color: loc.color }]}>{loc.emoji} {loc.name}</Text><View style={styles.secM}><Text style={[styles.secC, { color: loc.color }]}>{items.length}</Text>{isOpen ? <CaretDown size={14} color={loc.color} /> : <CaretRight size={14} color={loc.color} />}</View></Pressable>{isOpen && <View style={styles.secI}>{items.map((id) => <ExpiryItem key={id} id={id} />)}</View>}</View>); })}
      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>🥫</Text><Text style={styles.emptyT}>Nothing tracked yet</Text><Text style={styles.emptyS}>Add items and their expiry dates</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFAF0" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }, title: { fontSize: 24, fontWeight: "bold", color: "#C05621" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  locRow: { flexDirection: "row", gap: 8 }, locChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7", borderWidth: 1, borderColor: "#E2E8F0" }, locText: { fontSize: 13, color: "#4A5568" },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#DD6B20", paddingVertical: 10, borderRadius: 8, gap: 6 }, addBtnText: { color: "#FFF", fontWeight: "600" },
  section: { marginBottom: 8 }, secH: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8 }, secN: { fontSize: 14, fontWeight: "bold" }, secM: { flexDirection: "row", alignItems: "center", gap: 6 }, secC: { fontSize: 12, fontWeight: "600" }, secI: { gap: 4, marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, borderLeftWidth: 4, gap: 8 },
  cbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" }, cboxDone: { backgroundColor: "#38A169", borderColor: "#38A169" }, chk: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 18 }, itemContent: { flex: 1 }, itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" }, dateText: { fontSize: 11, color: "#718096", marginTop: 2 },
  daysBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }, daysText: { fontSize: 11, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#C05621" }, emptyS: { fontSize: 14, color: "#718096", textAlign: "center" },
});

import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, Van } from "phosphor-react-native";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const RosterItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  return (
    <View style={styles.item}>
      <Text style={styles.emoji}>{String(itemData.emoji || "👤")}</Text>
      <View style={styles.itemContent}><Text style={styles.itemText}>{String(itemData.text || "")}</Text>{itemData.time ? <Text style={styles.timeText}>{String(itemData.time)}</Text> : null}{itemData.notes ? <Text style={styles.notes}>{String(itemData.notes)}</Text> : null}</View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function SchoolPickupRoster({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const grouped = useMemo(() => { const g: Record<string, string[]> = {}; DAYS.forEach((d) => (g[d] = [])); todoIds.forEach((id) => { const c = String(store?.getCell("todos", id, "category") || "Monday"); const d = DAYS.includes(c) ? c : "Monday"; g[d].push(id); }); return g; }, [todoIds, store]);
  const addItem = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), category: selectedDay, emoji: "👤", done: false, list: listId, time: "", notes: "" }), [listId, selectedDay]);
  const handleAdd = useCallback(() => { if (newName.trim()) { addItem(newName); setNewName(""); } }, [addItem, newName]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><Van size={32} color="#DD6B20" weight="fill" /><Text style={styles.title}>{String(listData?.name || "Pickup Roster")}</Text></View>
      <View style={styles.addSection}>
        <View style={styles.dayRow}>{DAYS.map((d) => (<Pressable key={d} onPress={() => setSelectedDay(d)} style={[styles.dayChip, selectedDay === d && styles.dayChipSel]}><Text style={[styles.dayText, selectedDay === d && styles.dayTextSel]}>{d.slice(0, 3)}</Text></Pressable>))}</View>
        <View style={styles.addRow}><TextInput style={styles.addInput} placeholder="Add person..." value={newName} onChangeText={setNewName} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable></View>
      </View>
      {DAYS.map((day) => (<View key={day} style={styles.daySection}><Text style={styles.dayTitle}>{day}</Text><View style={styles.items}>{(grouped[day] || []).map((id) => <RosterItem key={id} id={id} />)}{(grouped[day] || []).length === 0 && <Text style={styles.emptyDay}>No one assigned</Text>}</View></View>))}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFAF0" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }, title: { fontSize: 24, fontWeight: "bold", color: "#C05621" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  dayRow: { flexDirection: "row", gap: 6 }, dayChip: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: "#EDF2F7", alignItems: "center" }, dayChipSel: { backgroundColor: "#FEEBC8" }, dayText: { fontSize: 13, color: "#4A5568" }, dayTextSel: { color: "#C05621", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#DD6B20", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  daySection: { marginBottom: 16 }, dayTitle: { fontSize: 18, fontWeight: "bold", color: "#C05621", marginBottom: 6 }, items: { gap: 4, paddingLeft: 8 }, emptyDay: { fontSize: 13, color: "#A0AEC0", fontStyle: "italic", paddingVertical: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, gap: 8 },
  emoji: { fontSize: 20 }, itemContent: { flex: 1 }, itemText: { fontSize: 15, fontWeight: "600", color: "#2D3748" }, timeText: { fontSize: 11, color: "#718096", marginTop: 2 }, notes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
});

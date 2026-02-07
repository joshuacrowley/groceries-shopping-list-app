import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, Calendar } from "phosphor-react-native";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const CalendarItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  return (
    <View style={[styles.item, { opacity: isDone ? 0.6 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)}><View style={[styles.cbox, isDone && styles.cboxDone]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View></Pressable>
      <View style={styles.itemContent}><Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text || "")}</Text>{itemData.time ? <Text style={styles.timeText}>{String(itemData.time)}</Text> : null}</View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function SchoolCalendarTodo({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const grouped = useMemo(() => { const g: Record<string, string[]> = {}; DAYS.forEach((d) => (g[d] = [])); todoIds.forEach((id) => { const c = String(store?.getCell("todos", id, "category") || "Monday"); const d = DAYS.includes(c) ? c : "Monday"; g[d].push(id); }); return g; }, [todoIds, store]);
  const addItem = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), category: selectedDay, done: false, list: listId, time: "" }), [listId, selectedDay]);
  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem(newItem); setNewItem(""); } }, [addItem, newItem]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><Calendar size={32} color="#3182CE" weight="fill" /><Text style={styles.title}>{String(listData?.name || "School Timetable")}</Text></View>
      <View style={styles.addSection}>
        <View style={styles.dayRow}>{DAYS.map((d) => (<Pressable key={d} onPress={() => setSelectedDay(d)} style={[styles.dayChip, selectedDay === d && styles.dayChipSel]}><Text style={[styles.dayText, selectedDay === d && styles.dayTextSel]}>{d.slice(0, 3)}</Text></Pressable>))}</View>
        <View style={styles.addRow}><TextInput style={styles.addInput} placeholder="Add class or activity..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable></View>
      </View>
      {DAYS.map((day) => (<View key={day} style={styles.daySection}><Text style={styles.dayTitle}>{day}</Text><View style={styles.items}>{(grouped[day] || []).map((id) => <CalendarItem key={id} id={id} />)}{(grouped[day] || []).length === 0 && <Text style={styles.emptyDay}>No classes</Text>}</View></View>))}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EBF8FF" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }, title: { fontSize: 24, fontWeight: "bold", color: "#2B6CB0" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  dayRow: { flexDirection: "row", gap: 6 }, dayChip: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: "#EDF2F7", alignItems: "center" }, dayChipSel: { backgroundColor: "#BEE3F8" }, dayText: { fontSize: 13, color: "#4A5568" }, dayTextSel: { color: "#2B6CB0", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#3182CE", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  daySection: { marginBottom: 16 }, dayTitle: { fontSize: 18, fontWeight: "bold", color: "#2B6CB0", marginBottom: 6 }, items: { gap: 4, paddingLeft: 8 }, emptyDay: { fontSize: 13, color: "#A0AEC0", fontStyle: "italic", paddingVertical: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, gap: 8 },
  cbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#3182CE", alignItems: "center", justifyContent: "center" }, cboxDone: { backgroundColor: "#3182CE" }, chk: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemContent: { flex: 1 }, itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" }, timeText: { fontSize: 11, color: "#718096", marginTop: 2 },
});

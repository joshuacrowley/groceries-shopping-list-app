import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, Users } from "phosphor-react-native";

const RSVP_STATUS = [
  { name: "Pending", emoji: "⏳", color: "#ECC94B" },
  { name: "Accepted", emoji: "✅", color: "#38A169" },
  { name: "Declined", emoji: "❌", color: "#E53E3E" },
  { name: "Maybe", emoji: "🤔", color: "#DD6B20" },
];

const GuestItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const status = RSVP_STATUS.find((s) => s.name === String(itemData.category)) || RSVP_STATUS[0];
  return (
    <View style={styles.item}>
      <Text style={styles.emoji}>{String(itemData.emoji || "👤")}</Text>
      <View style={styles.itemContent}><Text style={styles.itemText}>{String(itemData.text || "")}</Text>{itemData.email ? <Text style={styles.emailText}>{String(itemData.email)}</Text> : null}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.statusRow}>{RSVP_STATUS.map((s) => (<Pressable key={s.name} onPress={() => store?.setCell("todos", id, "category", s.name)} style={[styles.statusChip, String(itemData.category) === s.name && { backgroundColor: s.color + "20", borderColor: s.color }]}><Text style={[styles.statusText, String(itemData.category) === s.name && { color: s.color }]}>{s.emoji}</Text></Pressable>))}</View></ScrollView>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function PartyGuestList({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const counts = useMemo(() => { const c: Record<string, number> = {}; RSVP_STATUS.forEach((s) => (c[s.name] = 0)); todoIds.forEach((id) => { const cat = String(store?.getCell("todos", id, "category") || "Pending"); if (c[cat] !== undefined) c[cat]++; else c.Pending++; }); return c; }, [todoIds, store]);
  const addGuest = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), category: "Pending", emoji: "👤", done: false, list: listId, email: "" }), [listId]);
  const handleAdd = useCallback(() => { if (newName.trim()) { addGuest(newName); setNewName(""); } }, [addGuest, newName]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><Users size={32} color="#805AD5" weight="fill" /><View><Text style={styles.title}>{String(listData?.name || "Guest List")}</Text><Text style={styles.subtitle}>{todoIds.length} guests</Text></View></View>
      <View style={styles.statsRow}>{RSVP_STATUS.map((s) => (<View key={s.name} style={[styles.stat, { backgroundColor: s.color + "15" }]}><Text style={styles.statEmoji}>{s.emoji}</Text><Text style={[styles.statCount, { color: s.color }]}>{counts[s.name] || 0}</Text><Text style={[styles.statLabel, { color: s.color }]}>{s.name}</Text></View>))}</View>
      <View style={styles.addSection}><View style={styles.addRow}><TextInput style={styles.addInput} placeholder="Add guest name..." value={newName} onChangeText={setNewName} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable></View></View>
      <View style={styles.list}>{todoIds.map((id) => <GuestItem key={id} id={id} />)}</View>
      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>🎉</Text><Text style={styles.emptyT}>No guests added yet</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF5FF" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }, title: { fontSize: 24, fontWeight: "bold", color: "#553C9A" }, subtitle: { fontSize: 12, color: "#805AD5" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 }, stat: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8 }, statEmoji: { fontSize: 16 }, statCount: { fontSize: 18, fontWeight: "bold" }, statLabel: { fontSize: 10, fontWeight: "600" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#805AD5", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  list: { gap: 8 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, gap: 8 },
  emoji: { fontSize: 20 }, itemContent: { flex: 1 }, itemText: { fontSize: 15, fontWeight: "600", color: "#2D3748" }, emailText: { fontSize: 11, color: "#718096", marginTop: 2 },
  statusRow: { flexDirection: "row", gap: 4 }, statusChip: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" }, statusText: { fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#553C9A" },
});

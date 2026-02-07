import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, Check, X } from "phosphor-react-native";

const GuestItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const guests = Number(itemData.number) || 1;

  return (
    <View style={[styles.item, { borderLeftColor: isDone ? "#38A169" : "#E2E8F0" }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.rsvpBtn}>
        {isDone ? <Check size={18} color="#38A169" weight="bold" /> : <X size={18} color="#A0AEC0" />}
      </Pressable>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{String(itemData.text || "")}</Text>
        {itemData.email ? <Text style={styles.itemEmail}>📧 {String(itemData.email)}</Text> : null}
        {itemData.notes ? <Text style={styles.itemNotes} numberOfLines={1}>{String(itemData.notes)}</Text> : null}
      </View>
      <View style={[styles.guestBadge, { backgroundColor: isDone ? "#C6F6D530" : "#E2E8F020" }]}>
        <Text style={[styles.guestText, { color: isDone ? "#38A169" : "#718096" }]}>👥 {guests}</Text>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function PartyGuestList({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const confirmedCount = useMemo(() => todoIds.filter((id) => Boolean(store?.getCell("todos", id, "done"))).length, [todoIds, store]);

  const addGuest = useAddRowCallback(
    "todos",
    (data: any) => ({ text: data.text?.trim() || "", list: listId, done: false, number: 1, email: "", notes: "" }),
    [listId]
  );

  const handleAdd = useCallback(() => { if (newName.trim()) { addGuest({ text: newName.trim() }); setNewName(""); } }, [newName, addGuest]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 28 }}>🎉</Text>
            <View>
              <Text style={styles.title}>{String(listData?.name || "Guest List")}</Text>
              <Text style={styles.subtitle}>{todoIds.length === 0 ? "Add your first guest!" : `${confirmedCount}/${todoIds.length} confirmed`}</Text>
            </View>
          </View>
          <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{todoIds.length}</Text></View>
        </View>

        <View style={styles.addSection}>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add guest name..." value={newName} onChangeText={setNewName} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {todoIds.map((id) => <GuestItem key={id} id={id} />)}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>No guests yet!</Text>
            <Text style={styles.emptySubtitle}>Start adding guests to your party list</Text>
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
  headerBadge: { backgroundColor: "#D6BCFA", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#553C9A", fontWeight: "600", fontSize: 13 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#D6BCFA", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#805AD5", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, marginBottom: 6, gap: 8, borderLeftWidth: 4 },
  rsvpBtn: { padding: 4, width: 30, alignItems: "center" },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "600", color: "#2D3748" },
  itemEmail: { fontSize: 11, color: "#805AD5", marginTop: 2 },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  guestBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  guestText: { fontSize: 11, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#553C9A" },
  emptySubtitle: { fontSize: 14, color: "#805AD5", textAlign: "center", maxWidth: 280 },
});

import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus } from "phosphor-react-native";

const OffloadItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;

  return (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemText}>{String(itemData.text || "")}</Text>
        {itemData.notes ? <Text style={styles.itemNotes} numberOfLines={2}>{String(itemData.notes)}</Text> : null}
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function OffloadList({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({ text: data.text?.trim() || "", notes: "", list: listId, done: false, number: todoIds.length }),
    [listId, todoIds.length]
  );

  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem({ text: newItem.trim() }); setNewItem(""); } }, [newItem, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 28 }}>📋</Text>
            <View>
              <Text style={styles.title}>{String(listData?.name || "List")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Ready to brainstorm? 💭" : todoIds.length <= 3 ? "A few ideas brewing ☕" : "Solid agenda taking shape 📋"}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{todoIds.length}</Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add a new item..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {todoIds.map((id) => <OffloadItem key={id} id={id} />)}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No talking points yet</Text>
            <Text style={styles.emptySubtitle}>Add items to build your agenda</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EBF4FF" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2B6CB0" },
  subtitle: { fontSize: 12, color: "#4299E1", fontStyle: "italic" },
  headerBadge: { backgroundColor: "#BEE3F8", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#2B6CB0", fontWeight: "600", fontSize: 13 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#BEE3F8", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#3182CE", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 12, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: "#E2E8F0", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  itemContent: { flex: 1 },
  itemText: { fontSize: 15, fontWeight: "500", color: "#2D3748" },
  itemNotes: { fontSize: 12, color: "#718096", marginTop: 4 },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#2B6CB0" },
  emptySubtitle: { fontSize: 14, color: "#4299E1", textAlign: "center", maxWidth: 280 },
});

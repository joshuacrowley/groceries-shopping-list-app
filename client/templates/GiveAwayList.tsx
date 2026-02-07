import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Gift, Plus } from "phosphor-react-native";

const GiveAwayItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const hasEmail = Boolean(itemData.email);

  return (
    <View style={[styles.item, { opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: "#38A169", borderColor: "#38A169" }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        {itemData.notes ? <Text style={styles.itemNotes} numberOfLines={2}>{String(itemData.notes)}</Text> : null}
        {hasEmail ? <Text style={styles.itemEmail}>📧 {String(itemData.email)}</Text> : null}
      </View>
      {hasEmail ? (
        <View style={[styles.badge, { backgroundColor: "#3182CE20" }]}>
          <Text style={[styles.badgeText, { color: "#3182CE" }]}>Assigned</Text>
        </View>
      ) : (
        <View style={[styles.badge, { backgroundColor: "#38A16920" }]}>
          <Text style={[styles.badgeText, { color: "#38A169" }]}>Available</Text>
        </View>
      )}
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function GiveAwayList({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({ text: data.text?.trim() || "", list: listId, done: false, type: "A", notes: "", email: "" }),
    [listId]
  );

  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem({ text: newItem.trim() }); setNewItem(""); } }, [newItem, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Gift size={32} color="#319795" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "Give Away List")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Ready to declutter? 📦" : todoIds.length <= 3 ? "Sorting things out 🧹" : "Declutter champion! ✨"}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{todoIds.length}</Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add item to give away..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {todoIds.map((id) => <GiveAwayItem key={id} id={id} />)}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>Nothing to rehome yet</Text>
            <Text style={styles.emptySubtitle}>Add items you'd like to give away, sell, or donate</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E6FFFA" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#234E52" },
  subtitle: { fontSize: 12, color: "#319795", fontStyle: "italic" },
  headerBadge: { backgroundColor: "#B2F5EA", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#234E52", fontWeight: "600", fontSize: 13 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#B2F5EA", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#319795", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, marginBottom: 6, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  itemEmail: { fontSize: 11, color: "#3182CE", marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#234E52" },
  emptySubtitle: { fontSize: 14, color: "#319795", textAlign: "center", maxWidth: 280 },
});

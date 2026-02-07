import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus } from "phosphor-react-native";

const LOCATIONS = ["Refrigerator", "Freezer"];

const LeftoverItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const dateStr = String(itemData.date || "");
  const location = String(itemData.type || "Refrigerator");

  const { statusLabel, statusColor } = useMemo(() => {
    if (!dateStr) return { statusLabel: "No Date", statusColor: "#718096" };
    const today = new Date();
    const expDate = new Date(dateStr);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { statusLabel: "Expired", statusColor: "#E53E3E" };
    if (diffDays <= 2) return { statusLabel: "Eat ASAP!", statusColor: "#E53E3E" };
    if (diffDays <= 5) return { statusLabel: "Eat Soon", statusColor: "#ED8936" };
    return { statusLabel: `${diffDays} days`, statusColor: "#38A169" };
  }, [dateStr]);

  return (
    <View style={[styles.item, { borderLeftColor: statusColor, opacity: isDone ? 0.6 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: "#319795", borderColor: "#319795" }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        {dateStr ? <Text style={styles.itemDate}>Exp: {dateStr}</Text> : null}
        {itemData.notes ? <Text style={styles.itemNotes} numberOfLines={1}>{String(itemData.notes)}</Text> : null}
      </View>
      <View style={[styles.locationBadge, { backgroundColor: location === "Freezer" ? "#3182CE20" : "#31979520" }]}>
        <Text style={{ fontSize: 12 }}>{location === "Freezer" ? "❄️" : "🧊"}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function Leftovers({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const [location, setLocation] = useState("Refrigerator");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const groupedItems = useMemo(() => {
    const grouped: Record<string, string[]> = { Refrigerator: [], Freezer: [] };
    todoIds.forEach((id) => {
      const loc = String(store?.getCell("todos", id, "type") || "Refrigerator");
      if (grouped[loc]) grouped[loc].push(id);
      else grouped["Refrigerator"].push(id);
    });
    return grouped;
  }, [todoIds, store]);

  const getDefaultDate = useCallback((loc: string) => {
    const d = new Date();
    d.setDate(d.getDate() + (loc === "Refrigerator" ? 4 : 60));
    return d.toISOString().split("T")[0];
  }, []);

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({ text: data.text?.trim() || "", done: false, list: listId, date: getDefaultDate(location), type: location, category: "Individual", number: 1, notes: "" }),
    [listId, location]
  );

  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem({ text: newItem.trim() }); setNewItem(""); } }, [newItem, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 28 }}>🧊</Text>
            <View>
              <Text style={styles.title}>{String(listData?.name || "Leftovers Tracker")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "No leftovers to track! 🧹" : todoIds.length <= 3 ? "A few things to use up 🥡" : "Fridge is well stocked! 🧊"}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{todoIds.length}</Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <View style={styles.locRow}>
            {LOCATIONS.map((loc) => (
              <Pressable key={loc} onPress={() => setLocation(loc)} style={[styles.locChip, location === loc && styles.locChipSelected]}>
                <Text style={[styles.locChipText, location === loc && styles.locChipTextSelected]}>
                  {loc === "Freezer" ? "❄️" : "🧊"} {loc}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add a leftover item..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {LOCATIONS.map((loc) => {
          const items = groupedItems[loc] || [];
          return (
            <View key={loc} style={styles.locSection}>
              <View style={styles.locHeader}>
                <Text style={styles.locTitle}>{loc === "Freezer" ? "❄️" : "🧊"} {loc} ({items.length})</Text>
              </View>
              {items.map((id) => <LeftoverItem key={id} id={id} />)}
              {items.length === 0 && <Text style={styles.locEmpty}>No items in {loc.toLowerCase()}</Text>}
            </View>
          );
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧊</Text>
            <Text style={styles.emptyTitle}>No leftovers to track</Text>
            <Text style={styles.emptySubtitle}>Add items when you have leftovers to track their freshness</Text>
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  title: { fontSize: 24, fontWeight: "bold", color: "#234E52" },
  subtitle: { fontSize: 12, color: "#319795", fontStyle: "italic" },
  headerBadge: { backgroundColor: "#B2F5EA", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#234E52", fontWeight: "600", fontSize: 13 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  locRow: { flexDirection: "row", gap: 8 },
  locChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#E6FFFA", borderWidth: 1, borderColor: "#B2F5EA" },
  locChipSelected: { backgroundColor: "#81E6D9", borderColor: "#319795" },
  locChipText: { fontSize: 13, color: "#4A5568" },
  locChipTextSelected: { color: "#234E52", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#B2F5EA", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#319795", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  locSection: { marginBottom: 12 },
  locHeader: { backgroundColor: "#319795", borderRadius: 8, padding: 8, marginBottom: 6 },
  locTitle: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  locEmpty: { fontSize: 13, color: "#718096", fontStyle: "italic", textAlign: "center", paddingVertical: 8 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 4, gap: 8, borderWidth: 1, borderColor: "#B2F5EA" },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemDate: { fontSize: 11, color: "#718096", marginTop: 2 },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  locationBadge: { padding: 4, borderRadius: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#234E52" },
  emptySubtitle: { fontSize: 14, color: "#319795", textAlign: "center", maxWidth: 280 },
});

import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import {
  useLocalRowIds,
  useRow,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
} from "tinybase/ui-react";
import { Trash, CaretDown, CaretUp, Gift } from "phosphor-react-native";

const GiveAwayItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const todoData = useRow("todos", id);
  const store = useStore();
  const deleteTodo = useDelRowCallback("todos", id);

  if (!todoData) return null;

  const isDone = Boolean(todoData.done);

  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteTodo },
    ]);
  };

  return (
    <View style={[styles.itemCard, isDone && styles.itemDone]}>
      <View style={styles.itemRow}>
        <Pressable onPress={handleToggle} style={styles.checkbox}>
          <View style={[styles.checkboxInner, isDone && styles.checkboxChecked]}>
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>
        <Text style={[styles.itemText, isDone && styles.itemTextDone]} numberOfLines={1}>
          {String(todoData.text || "")}
        </Text>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
          {expanded ? <CaretUp size={18} color="#319795" /> : <CaretDown size={18} color="#319795" />}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={18} color="#E53E3E" />
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Description / Notes:</Text>
          <TextInput
            style={styles.detailInput}
            value={String(todoData.notes || "")}
            onChangeText={(text) => store?.setCell("todos", id, "notes", text)}
            placeholder="Item description"
            placeholderTextColor="#A0AEC0"
            multiline
          />
          <Text style={styles.detailLabel}>Recipient's email:</Text>
          <TextInput
            style={styles.detailInput}
            value={String(todoData.email || "")}
            onChangeText={(text) => store?.setCell("todos", id, "email", text)}
            placeholder="Recipient's email"
            placeholderTextColor="#A0AEC0"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      )}
    </View>
  );
});
GiveAwayItem.displayName = "GiveAwayItem";

export default function GiveAwayList({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const store = useStore();
  const listData = useRow("lists", listId);
  const itemIds = useLocalRowIds("todoList", listId) || [];

  const addItem = useAddRowCallback(
    "todos",
    (text: string) => ({
      text: text.trim(),
      list: listId,
      done: false,
      type: "A",
      notes: "",
      email: "",
    }),
    [listId],
    undefined,
    (rowId) => { if (rowId) setNewItem(""); }
  );

  const handleAdd = useCallback(() => {
    if (newItem.trim()) addItem(newItem);
  }, [addItem, newItem]);

  const { availableItems, assignedItems } = useMemo(() => {
    const available: string[] = [];
    const assigned: string[] = [];
    itemIds.forEach((id) => {
      const email = store?.getCell("todos", id, "email");
      if (email) assigned.push(id);
      else available.push(id);
    });
    return { availableItems: available, assignedItems: assigned };
  }, [itemIds, store]);

  const progressLabel = useMemo(() => {
    if (itemIds.length === 0) return "Ready to declutter? 📦";
    if (itemIds.length <= 3) return "Sorting things out 🧹";
    return "Declutter champion! ✨";
  }, [itemIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Gift size={28} color="#319795" weight="fill" />
            <View>
              <Text style={styles.listTitle}>{String(listData?.name || "Give Away List")}</Text>
              <Text style={styles.progressLabel}>{progressLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.addRow}>
          <TextInput style={styles.addInput} value={newItem} onChangeText={setNewItem}
            placeholder="Add a new item" placeholderTextColor="#A0AEC0"
            onSubmitEditing={handleAdd} returnKeyType="done" />
          <Pressable onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {availableItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Items</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{availableItems.length}</Text>
              </View>
            </View>
            {availableItems.map((id) => <GiveAwayItem key={id} id={id} />)}
          </View>
        )}

        {assignedItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Assigned Items</Text>
              <View style={[styles.sectionBadge, { backgroundColor: "#BEE3F8" }]}>
                <Text style={[styles.sectionBadgeText, { color: "#2B6CB0" }]}>{assignedItems.length}</Text>
              </View>
            </View>
            {assignedItems.map((id) => <GiveAwayItem key={id} id={id} />)}
          </View>
        )}

        {itemIds.length === 0 && (
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
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#234E52" },
  progressLabel: { fontSize: 12, color: "#319795", fontStyle: "italic", marginTop: 2 },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  addInput: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#2D3748", borderWidth: 1, borderColor: "#B2F5EA" },
  addButton: { backgroundColor: "#319795", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#234E52" },
  sectionBadge: { backgroundColor: "#C6F6D5", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  sectionBadgeText: { fontSize: 12, fontWeight: "600", color: "#276749" },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 8, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemDone: { opacity: 0.6 },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  checkbox: { padding: 4 },
  checkboxInner: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#38A169", borderColor: "#38A169" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  itemText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#2D3748" },
  itemTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  iconBtn: { padding: 6 },
  detailsSection: { backgroundColor: "#F7FAFC", padding: 12, gap: 8 },
  detailLabel: { fontSize: 13, fontWeight: "500", color: "#4A5568" },
  detailInput: { backgroundColor: "#FFFFFF", borderRadius: 6, borderWidth: 1, borderColor: "#E2E8F0", paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#234E52" },
  emptySubtitle: { fontSize: 14, color: "#319795", textAlign: "center", maxWidth: 280 },
});

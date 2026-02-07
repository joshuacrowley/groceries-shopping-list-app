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
import { Trash, CaretDown, CaretUp } from "phosphor-react-native";

const TYPES = ["Dry Goods", "Canned/Jarred", "Refrigerated", "Frozen", "Spices/Seasonings"];

const PantryItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const isDone = Boolean(itemData.done);

  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
    ]);
  };

  const daysUntilExpiration = useMemo(() => {
    if (!itemData.date) return null;
    const today = new Date();
    const expDate = new Date(String(itemData.date));
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [itemData.date]);

  const expirationStatus = useMemo(() => {
    if (daysUntilExpiration === null) return "none";
    if (daysUntilExpiration < 0) return "expired";
    if (daysUntilExpiration <= 7) return "soon";
    return "good";
  }, [daysUntilExpiration]);

  const statusConfig = {
    expired: { color: "#E53E3E", bg: "#FED7D7", label: "Expired", emoji: "😵" },
    soon: { color: "#DD6B20", bg: "#FEEBC8", label: "Expiring Soon", emoji: "😰" },
    good: { color: "#38A169", bg: "#C6F6D5", label: "Good", emoji: "😊" },
    none: { color: "#718096", bg: "#EDF2F7", label: "No Date", emoji: "" },
  };

  const status = statusConfig[expirationStatus];
  const borderLeftColor = status.color;

  return (
    <View style={[styles.itemCard, { borderLeftColor }]}>
      <View style={styles.itemRow}>
        <Pressable onPress={handleToggle} style={styles.checkbox}>
          <View style={[styles.checkboxInner, isDone && styles.checkboxChecked]}>
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>
        <Text style={[styles.itemText, isDone && styles.itemTextDone]} numberOfLines={1}>
          {String(itemData.text || "")}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          {status.emoji ? <Text style={styles.statusEmoji}>{status.emoji}</Text> : null}
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
          {expanded ? <CaretUp size={18} color="#ED8936" /> : <CaretDown size={18} color="#ED8936" />}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={18} color="#E53E3E" />
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expiration Date:</Text>
            <TextInput
              style={styles.detailInput}
              value={String(itemData.date || "")}
              onChangeText={(text) => store?.setCell("todos", id, "date", text)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#A0AEC0"
            />
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <View style={styles.typeChips}>
              {TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => store?.setCell("todos", id, "type", type)}
                  style={[styles.typeChip, String(itemData.type || "Dry Goods") === type && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipText, String(itemData.type || "Dry Goods") === type && styles.typeChipTextActive]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <TextInput
              style={styles.detailInput}
              value={String(itemData.notes || "")}
              onChangeText={(text) => store?.setCell("todos", id, "notes", text)}
              placeholder="Additional notes"
              placeholderTextColor="#A0AEC0"
            />
          </View>
        </View>
      )}
    </View>
  );
});
PantryItem.displayName = "PantryItem";

export default function Expiry({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const itemIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addItem = useAddRowCallback(
    "todos",
    (text: string) => ({
      text: text.trim(),
      done: false,
      list: listId,
      date: "",
      type: "Dry Goods",
      notes: "",
    }),
    [listId],
    undefined,
    (rowId) => { if (rowId) setNewItem(""); }
  );

  const handleAdd = useCallback(() => {
    if (newItem.trim()) addItem(newItem);
  }, [addItem, newItem]);

  const progressLabel = useMemo(() => {
    if (itemIds.length === 0) return "Track what's in your pantry! 🏪";
    if (itemIds.length <= 5) return "A few items to watch 👀";
    if (itemIds.length <= 15) return "Good pantry awareness 📦";
    return "Pantry pro status! 🏆";
  }, [itemIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.listTitle}>{String(listData?.name || "Pantry Inventory")}</Text>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {itemIds.length} {itemIds.length === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>

        <View style={styles.addRow}>
          <TextInput style={styles.addInput} value={newItem} onChangeText={setNewItem}
            placeholder="Add a new pantry item" placeholderTextColor="#A0AEC0"
            onSubmitEditing={handleAdd} returnKeyType="done" />
          <Pressable onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {itemIds.map((id) => <PantryItem key={id} id={id} />)}

        {itemIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🫙</Text>
            <Text style={styles.emptyTitle}>Your pantry tracker is empty</Text>
            <Text style={styles.emptySubtitle}>Add items above to start tracking expiration dates</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFAF0" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#C05621" },
  progressLabel: { fontSize: 12, color: "#DD6B20", fontStyle: "italic", marginTop: 2 },
  countBadge: { backgroundColor: "#FEEBC8", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  countBadgeText: { fontSize: 13, fontWeight: "600", color: "#C05621" },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  addInput: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#2D3748", borderWidth: 1, borderColor: "#FEEBC8" },
  addButton: { backgroundColor: "#ED8936", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 8, marginBottom: 8, borderLeftWidth: 4, borderWidth: 1, borderColor: "#FEEBC8", overflow: "hidden" },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  checkbox: { padding: 4 },
  checkboxInner: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#38A169", borderColor: "#38A169" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  itemText: { flex: 1, fontSize: 15, color: "#2D3748" },
  itemTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, gap: 4 },
  statusEmoji: { fontSize: 14 },
  statusText: { fontSize: 11, fontWeight: "600" },
  iconBtn: { padding: 6 },
  detailsSection: { backgroundColor: "#FFFAF0", padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: "#FEEBC8" },
  detailRow: { gap: 4 },
  detailLabel: { fontSize: 13, fontWeight: "500", color: "#C05621" },
  detailInput: { backgroundColor: "#FFFFFF", borderRadius: 6, borderWidth: 1, borderColor: "#FEEBC8", paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  typeChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: "#EDF2F7" },
  typeChipActive: { backgroundColor: "#ED8936" },
  typeChipText: { fontSize: 12, color: "#4A5568" },
  typeChipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#C05621" },
  emptySubtitle: { fontSize: 14, color: "#DD6B20", textAlign: "center", maxWidth: 280 },
});

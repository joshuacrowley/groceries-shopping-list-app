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
  useStore,
  useLocalRowIds,
  useRow,
  useDelRowCallback,
  useAddRowCallback,
} from "tinybase/ui-react";
import { Trash, CaretDown, CaretUp, CreditCard } from "phosphor-react-native";

const FREQUENCIES: Record<string, number> = {
  Monthly: 12,
  Yearly: 1,
  Weekly: 52,
  Daily: 365,
};

const SubscriptionItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const amount = Number(itemData.amount || 0);
  const freq = String(itemData.category || "Monthly");
  const annualCost = amount * (FREQUENCIES[freq] || 12);

  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this subscription?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
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
        <Text style={styles.itemEmoji}>{String(itemData.emoji || "💳")}</Text>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemText, isDone && styles.itemTextDone]} numberOfLines={1}>{String(itemData.text || "")}</Text>
          <Text style={styles.itemFreq}>{freq} · ${amount.toFixed(2)}</Text>
        </View>
        <Text style={styles.annualCost}>${annualCost.toFixed(0)}/yr</Text>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
          {expanded ? <CaretUp size={16} color="#3182CE" /> : <CaretDown size={16} color="#3182CE" />}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={16} color="#E53E3E" />
        </Pressable>
      </View>
      {expanded && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <TextInput style={styles.detailInput} value={String(amount)}
            onChangeText={(t) => store?.setCell("todos", id, "amount", parseFloat(t) || 0)}
            keyboardType="decimal-pad" />
          <Text style={styles.detailLabel}>Frequency:</Text>
          <View style={styles.chipRow}>
            {Object.keys(FREQUENCIES).map((f) => (
              <Pressable key={f} onPress={() => store?.setCell("todos", id, "category", f)}
                style={[styles.chip, freq === f && styles.chipActive]}>
                <Text style={[styles.chipText, freq === f && styles.chipTextActive]}>{f}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.detailLabel}>Renewal Date:</Text>
          <TextInput style={styles.detailInput} value={String(itemData.date || "")}
            onChangeText={(t) => store?.setCell("todos", id, "date", t)} placeholder="YYYY-MM-DD" placeholderTextColor="#A0AEC0" />
          <Text style={styles.detailLabel}>Notes:</Text>
          <TextInput style={[styles.detailInput, { minHeight: 50, textAlignVertical: "top" }]}
            value={String(itemData.notes || "")} onChangeText={(t) => store?.setCell("todos", id, "notes", t)}
            placeholder="Account details..." placeholderTextColor="#A0AEC0" multiline />
        </View>
      )}
    </View>
  );
});
SubscriptionItem.displayName = "SubscriptionItem";

export default function SubscriptionTracker({ listId }: { listId: string }) {
  const [newSub, setNewSub] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addSub = useAddRowCallback(
    "todos",
    (text: string) => ({
      text: text.trim(),
      amount: 0,
      category: "Monthly",
      emoji: "💳",
      list: listId,
      done: false,
      date: "",
      notes: "",
    }),
    [listId],
    undefined,
    (rowId) => { if (rowId) setNewSub(""); }
  );

  const handleAdd = useCallback(() => {
    if (newSub.trim()) addSub(newSub);
  }, [addSub, newSub]);

  const totalMonthly = useMemo(() => {
    return todoIds.reduce((sum, id) => {
      if (store?.getCell("todos", id, "done")) return sum;
      const amount = Number(store?.getCell("todos", id, "amount") || 0);
      const freq = String(store?.getCell("todos", id, "category") || "Monthly");
      const monthly = (amount * (FREQUENCIES[freq] || 12)) / 12;
      return sum + monthly;
    }, 0);
  }, [todoIds, store]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <CreditCard size={26} color="#3182CE" weight="fill" />
            <View>
              <Text style={styles.listTitle}>{String(listData?.name || "Subscriptions")}</Text>
              <Text style={styles.progressLabel}>Track your recurring costs 💸</Text>
            </View>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>${totalMonthly.toFixed(0)}/mo</Text>
          </View>
        </View>

        <View style={styles.addRow}>
          <TextInput style={styles.addInput} value={newSub} onChangeText={setNewSub}
            placeholder="Add subscription..." placeholderTextColor="#A0AEC0"
            onSubmitEditing={handleAdd} returnKeyType="done" />
          <Pressable onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {todoIds.map((id) => <SubscriptionItem key={id} id={id} />)}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💳</Text>
            <Text style={styles.emptyTitle}>No subscriptions tracked</Text>
            <Text style={styles.emptySubtitle}>Add your recurring subscriptions to see where your money goes</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EBF8FF" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  listTitle: { fontSize: 20, fontWeight: "bold", color: "#2A4365" },
  progressLabel: { fontSize: 12, color: "#3182CE", marginTop: 2 },
  totalBadge: { backgroundColor: "#BEE3F8", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  totalBadgeText: { fontSize: 15, fontWeight: "bold", color: "#2A4365" },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  addInput: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#2D3748", borderWidth: 1, borderColor: "#BEE3F8" },
  addButton: { backgroundColor: "#3182CE", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 8, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemDone: { opacity: 0.55 },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  checkbox: { padding: 4 },
  checkboxInner: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#3182CE", borderColor: "#3182CE" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  itemEmoji: { fontSize: 20 },
  itemInfo: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "600", color: "#2D3748" },
  itemTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemFreq: { fontSize: 11, color: "#718096", marginTop: 2 },
  annualCost: { fontSize: 12, fontWeight: "600", color: "#3182CE" },
  iconBtn: { padding: 4 },
  detailsSection: { backgroundColor: "#EBF8FF", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#BEE3F8" },
  detailLabel: { fontSize: 13, fontWeight: "500", color: "#2A4365" },
  detailInput: { backgroundColor: "#FFFFFF", borderRadius: 6, borderWidth: 1, borderColor: "#BEE3F8", paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7" },
  chipActive: { backgroundColor: "#3182CE" },
  chipText: { fontSize: 12, color: "#4A5568" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#2A4365" },
  emptySubtitle: { fontSize: 14, color: "#3182CE", textAlign: "center", maxWidth: 280 },
});

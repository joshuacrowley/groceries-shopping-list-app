import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CreditCard } from "phosphor-react-native";

const SubscriptionItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const amount = Number(itemData.amount) || 0;
  const freq = String(itemData.category || "Monthly");

  return (
    <View style={[styles.item, { opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: "#38A169", borderColor: "#38A169" }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.amountText}>${amount.toFixed(2)}</Text>
          <View style={styles.freqBadge}><Text style={styles.freqText}>{freq}</Text></View>
        </View>
        {itemData.date ? <Text style={styles.dateText}>Next: {String(itemData.date)}</Text> : null}
        {itemData.notes ? <Text style={styles.notesText} numberOfLines={1}>{String(itemData.notes)}</Text> : null}
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function SubscriptionTracker({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const totalMonthly = useMemo(() => {
    let total = 0;
    todoIds.forEach((id) => {
      if (!store?.getCell("todos", id, "done")) {
        const amount = Number(store?.getCell("todos", id, "amount")) || 0;
        const freq = String(store?.getCell("todos", id, "category") || "Monthly");
        if (freq === "Yearly") total += amount / 12;
        else if (freq === "Weekly") total += amount * 4.33;
        else total += amount;
      }
    });
    return total;
  }, [todoIds, store]);

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({ text: data.text?.trim() || "", amount: parseFloat(data.amount) || 0, category: "Monthly", date: "", notes: "", done: false, list: listId }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newName.trim()) { addItem({ text: newName.trim(), amount: newAmount }); setNewName(""); setNewAmount(""); }
  }, [newName, newAmount, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CreditCard size={28} color="#2B6CB0" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "Subscriptions")}</Text>
              <Text style={styles.subtitle}>{todoIds.length} subscriptions</Text>
            </View>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>${totalMonthly.toFixed(2)}/mo</Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <View style={styles.addRow}>
            <TextInput style={[styles.addInput, { flex: 2 }]} placeholder="Service name" value={newName} onChangeText={setNewName} placeholderTextColor="#A0AEC0" returnKeyType="next" />
            <TextInput style={[styles.addInput, { flex: 1 }]} placeholder="$" value={newAmount} onChangeText={setNewAmount} keyboardType="decimal-pad" placeholderTextColor="#A0AEC0" returnKeyType="done" onSubmitEditing={handleAdd} />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {todoIds.map((id) => <SubscriptionItem key={id} id={id} />)}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💳</Text>
            <Text style={styles.emptyTitle}>No subscriptions tracked</Text>
            <Text style={styles.emptySubtitle}>Add your subscriptions to track monthly spending</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EBF8FF" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2B6CB0" },
  subtitle: { fontSize: 12, color: "#4299E1", fontStyle: "italic" },
  totalBadge: { backgroundColor: "#2B6CB0", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  totalText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { borderWidth: 1, borderColor: "#BEE3F8", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#3182CE", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 12, marginBottom: 6, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemContent: { flex: 1 },
  itemText: { fontSize: 15, fontWeight: "600", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  amountText: { fontSize: 14, fontWeight: "bold", color: "#2B6CB0" },
  freqBadge: { backgroundColor: "#BEE3F8", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  freqText: { fontSize: 10, color: "#2B6CB0", fontWeight: "600" },
  dateText: { fontSize: 11, color: "#718096", marginTop: 2 },
  notesText: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#2B6CB0" },
  emptySubtitle: { fontSize: 14, color: "#4299E1", textAlign: "center", maxWidth: 280 },
});

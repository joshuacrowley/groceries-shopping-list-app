import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useSetRowCallback, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, CaretDown, CaretUp, CreditCard } from "phosphor-react-native";

const TYPES = ["Monthly", "Yearly", "Weekly", "Daily"];
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

  const handleDelete = () => {
    Alert.alert("Delete", "Delete this subscription?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
    ]);
  };

  const typeIndex = parseInt(itemData.type as string) - 1;
  const typeLabel = TYPES[typeIndex] || "Monthly";
  const amount = typeof itemData.amount === "number" ? itemData.amount : 0;

  return (
    <View style={styles.subCard}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.subHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subName}>{itemData.text as string}</Text>
        </View>
        <View style={styles.subRight}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeLabel}</Text>
          </View>
          <Text style={styles.subAmount}>${amount.toFixed(2)}</Text>
          {expanded ? <CaretUp size={18} color="#718096" /> : <CaretDown size={18} color="#718096" />}
        </View>
      </Pressable>
      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.editInput}
            value={itemData.text as string}
            onChangeText={(t) => store?.setCell("todos", id, "text", t)}
          />
          <Text style={styles.fieldLabel}>Billing Period</Text>
          <View style={styles.typeOptions}>
            {TYPES.map((type, index) => (
              <Pressable
                key={type}
                style={[styles.typeOption, parseInt(itemData.type as string) === index + 1 && styles.typeOptionActive]}
                onPress={() => store?.setCell("todos", id, "type", String(index + 1))}
              >
                <Text style={[styles.typeOptionText, parseInt(itemData.type as string) === index + 1 && styles.typeOptionActiveText]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Amount ($)</Text>
          <TextInput
            style={styles.editInput}
            value={String(amount)}
            onChangeText={(t) => {
              const parsed = parseFloat(t);
              if (!isNaN(parsed)) store?.setCell("todos", id, "amount", parsed);
            }}
            keyboardType="decimal-pad"
          />
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Trash size={16} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});
SubscriptionItem.displayName = "SubscriptionItem";

export default function SubscriptionTracker({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("1");
  const [newAmount, setNewAmount] = useState("");
  const [totalInterval, setTotalInterval] = useState("Monthly");

  const store = useStore();
  const itemIds = useLocalRowIds("todoList", listId) || [];

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({
      text: data.text.trim(),
      type: data.type,
      amount: data.amount,
      list: listId,
      done: false,
    }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newName.trim()) {
      addItem({ text: newName, type: newType, amount: parseFloat(newAmount) || 0 });
      setNewName("");
      setNewAmount("");
      setNewType("1");
    }
  }, [addItem, newName, newType, newAmount]);

  const totalMonthly = useMemo(() => {
    let total = 0;
    itemIds.forEach((id) => {
      const item = store?.getRow("todos", id);
      if (!item) return;
      const freq = FREQUENCIES[TYPES[parseInt(item.type as string) - 1]] || 12;
      total += ((item.amount as number) * freq) / 12;
    });
    return total;
  }, [itemIds, store]);

  const getTotalForInterval = (interval: string) => {
    const multiplier = (FREQUENCIES[interval] || 12) / 12;
    return totalMonthly * multiplier;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <CreditCard size={28} color="#6B46C1" weight="fill" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Subscription Tracker</Text>
          <Text style={styles.subtitle}>
            {itemIds.length === 0 ? "Track your subscriptions! 💳" : `${itemIds.length} subscriptions`}
          </Text>
        </View>
      </View>

      {/* Add Form */}
      <View style={styles.addForm}>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="Product name"
          placeholderTextColor="#A0AEC0"
        />
        <View style={styles.typeOptions}>
          {TYPES.map((type, index) => (
            <Pressable
              key={type}
              style={[styles.typeOption, newType === String(index + 1) && styles.typeOptionActive]}
              onPress={() => setNewType(String(index + 1))}
            >
              <Text style={[styles.typeOptionText, newType === String(index + 1) && styles.typeOptionActiveText]}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={newAmount}
          onChangeText={setNewAmount}
          placeholder="$ Amount"
          placeholderTextColor="#A0AEC0"
          keyboardType="decimal-pad"
        />
        <Pressable onPress={handleAdd} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Subscription</Text>
        </Pressable>
      </View>

      {/* Subscriptions List */}
      <View style={styles.listSection}>
        {itemIds.map((id) => (
          <SubscriptionItem key={id} id={id} />
        ))}
      </View>

      {/* Empty State */}
      {itemIds.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💳</Text>
          <Text style={styles.emptyTitle}>No subscriptions tracked</Text>
          <Text style={styles.emptySubtitle}>Add your subscriptions to keep on top of recurring costs</Text>
        </View>
      )}

      {/* Totals */}
      <View style={styles.totalCard}>
        <View style={styles.totalHeader}>
          <Text style={styles.totalLabel}>Total:</Text>
          <View style={styles.intervalOptions}>
            {Object.keys(FREQUENCIES).map((interval) => (
              <Pressable
                key={interval}
                style={[styles.intervalOption, totalInterval === interval && styles.intervalOptionActive]}
                onPress={() => setTotalInterval(interval)}
              >
                <Text style={[styles.intervalOptionText, totalInterval === interval && styles.intervalOptionActiveText]}>
                  {interval}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={styles.totalAmount}>${getTotalForInterval(totalInterval).toFixed(2)}</Text>
        <Text style={styles.totalPeriod}>Per {totalInterval}</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF5FF" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: "#553C9A" },
  subtitle: { fontSize: 13, color: "#805AD5" },
  addForm: { paddingHorizontal: 16, gap: 8 },
  input: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 12, fontSize: 14, color: "#2D3748", borderWidth: 1, borderColor: "#E9D8FD" },
  typeOptions: { flexDirection: "row", gap: 6 },
  typeOption: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: "#E9D8FD" },
  typeOptionActive: { backgroundColor: "#805AD5", borderColor: "#805AD5" },
  typeOptionText: { fontSize: 12, color: "#553C9A", fontWeight: "600" },
  typeOptionActiveText: { color: "#FFFFFF" },
  addButton: { backgroundColor: "#805AD5", borderRadius: 8, padding: 14, alignItems: "center" },
  addButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  listSection: { paddingHorizontal: 16, marginTop: 16 },
  subCard: { backgroundColor: "#FFFFFF", borderRadius: 10, marginBottom: 8, overflow: "hidden", borderWidth: 1, borderColor: "#E9D8FD" },
  subHeader: { flexDirection: "row", alignItems: "center", padding: 14 },
  subName: { fontSize: 15, fontWeight: "bold", color: "#2D3748" },
  subRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: { backgroundColor: "#E9D8FD", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 11, color: "#553C9A", fontWeight: "600" },
  subAmount: { fontSize: 15, fontWeight: "bold", color: "#2D3748" },
  expandedContent: { padding: 14, paddingTop: 0, gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#4A5568", marginTop: 4 },
  editInput: { backgroundColor: "#F7FAFC", borderRadius: 8, padding: 10, fontSize: 14, color: "#2D3748", borderWidth: 1, borderColor: "#E2E8F0" },
  deleteButton: { flexDirection: "row", backgroundColor: "#E53E3E", borderRadius: 8, padding: 10, alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 },
  deleteButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#553C9A" },
  emptySubtitle: { fontSize: 13, color: "#805AD5", textAlign: "center", maxWidth: 260, marginTop: 4 },
  totalCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: "#E9D8FD", borderRadius: 12, padding: 16 },
  totalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontWeight: "bold", color: "#553C9A" },
  intervalOptions: { flexDirection: "row", gap: 4 },
  intervalOption: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#F3E8FF" },
  intervalOptionActive: { backgroundColor: "#805AD5" },
  intervalOptionText: { fontSize: 11, color: "#553C9A" },
  intervalOptionActiveText: { color: "#FFFFFF" },
  totalAmount: { fontSize: 28, fontWeight: "bold", color: "#553C9A", marginTop: 8 },
  totalPeriod: { fontSize: 13, color: "#805AD5", marginTop: 2 },
});

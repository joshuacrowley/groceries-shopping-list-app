import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, CreditCard, CaretDown, CaretRight } from "phosphor-react-native";

const TYPES = ["Monthly", "Yearly", "Weekly", "Daily"];
const FREQUENCIES: Record<string, number> = {
  Monthly: 12,
  Yearly: 1,
  Weekly: 52,
  Daily: 365,
};

const SubscriptionItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  const [expanded, setExpanded] = useState(false);

  if (!itemData) return null;

  const typeIndex = parseInt(String(itemData.type || "1"), 10) - 1;
  const typeName = TYPES[typeIndex] || "Monthly";
  const amount = Number(itemData.amount || 0);

  return (
    <View style={styles.item}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.itemHeader}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemText}>{String(itemData.text || "")}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeName}</Text>
          </View>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.amountText}>${amount.toFixed(2)}</Text>
          {expanded ? (
            <CaretDown size={16} color="#718096" />
          ) : (
            <CaretRight size={16} color="#718096" />
          )}
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.expandedSection}>
          {itemData.notes ? (
            <Text style={styles.notesText}>{String(itemData.notes)}</Text>
          ) : null}
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>Annual cost:</Text>
            <Text style={styles.expandedValue}>
              ${(amount * (FREQUENCIES[typeName] || 12)).toFixed(2)}
            </Text>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert("Delete", "Remove this subscription?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: deleteItem },
              ])
            }
            style={styles.deleteRow}
          >
            <Trash size={16} color="#E53E3E" weight="bold" />
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});

export default function SubscriptionTracker({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState("1"); // Monthly
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const totalMonthly = useMemo(() => {
    let total = 0;
    todoIds.forEach((id) => {
      const item = store?.getRow("todos", id);
      if (!item) return;
      const typeIdx = parseInt(String(item.type || "1"), 10) - 1;
      const freq = FREQUENCIES[TYPES[typeIdx] || "Monthly"] || 12;
      total += (Number(item.amount || 0) * freq) / 12;
    });
    return total;
  }, [todoIds, store]);

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({
      text: data.text?.trim() || "",
      type: data.type || "1",
      amount: data.amount || 0,
      notes: "",
      emoji: "💳",
      category: "",
      done: false,
      list: listId,
    }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newName.trim()) {
      addItem({
        text: newName.trim(),
        type: newType,
        amount: parseFloat(newAmount) || 0,
      });
      setNewName("");
      setNewAmount("");
    }
  }, [newName, newAmount, newType, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CreditCard size={28} color="#805AD5" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "Subscription Tracker")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0
                  ? "Track your subscriptions! 💳"
                  : `${todoIds.length} subscription${todoIds.length === 1 ? "" : "s"} tracked`}
              </Text>
            </View>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{todoIds.length}</Text>
          </View>
        </View>

        {/* Total summary */}
        {todoIds.length > 0 && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Monthly Total</Text>
            <Text style={styles.totalAmount}>${totalMonthly.toFixed(2)}</Text>
            <Text style={styles.totalSub}>
              ${(totalMonthly * 12).toFixed(2)}/year
            </Text>
          </View>
        )}

        {/* Add form */}
        <View style={styles.addSection}>
          <TextInput
            style={styles.addInput}
            placeholder="Subscription name"
            value={newName}
            onChangeText={setNewName}
            placeholderTextColor="#A0AEC0"
          />
          <View style={styles.addRow}>
            <TextInput
              style={[styles.addInput, { flex: 1 }]}
              placeholder="Amount ($)"
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#A0AEC0"
            />
            <View style={styles.typeSelector}>
              {TYPES.map((type, idx) => (
                <Pressable
                  key={type}
                  onPress={() => setNewType(String(idx + 1))}
                  style={[
                    styles.typeOption,
                    newType === String(idx + 1) && styles.typeOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      newType === String(idx + 1) && styles.typeOptionTextActive,
                    ]}
                  >
                    {type.charAt(0)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable onPress={handleAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>Add Subscription</Text>
          </Pressable>
        </View>

        {/* Items */}
        {todoIds.map((id) => (
          <SubscriptionItem key={id} id={id} />
        ))}

        {/* Empty state */}
        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💳</Text>
            <Text style={styles.emptyTitle}>No subscriptions tracked</Text>
            <Text style={styles.emptySubtitle}>
              Add your subscriptions to keep on top of recurring costs
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF5FF" },
  content: { padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: "#553C9A" },
  subtitle: { fontSize: 12, color: "#805AD5", fontStyle: "italic" },
  countBadge: {
    backgroundColor: "#805AD520",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: { color: "#553C9A", fontWeight: "600", fontSize: 13 },
  totalCard: {
    backgroundColor: "#805AD5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  totalLabel: { color: "#E9D8FD", fontSize: 12, fontWeight: "500" },
  totalAmount: { color: "#FFF", fontSize: 28, fontWeight: "bold", marginTop: 4 },
  totalSub: { color: "#D6BCFA", fontSize: 12, marginTop: 2 },
  addSection: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2D3748",
  },
  addRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  typeSelector: { flexDirection: "row", gap: 4 },
  typeOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EDF2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  typeOptionActive: { backgroundColor: "#805AD5" },
  typeOptionText: { fontSize: 12, fontWeight: "600", color: "#718096" },
  typeOptionTextActive: { color: "#FFF" },
  addBtn: {
    backgroundColor: "#805AD5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  addBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  item: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  typeBadge: {
    backgroundColor: "#805AD520",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: { fontSize: 10, color: "#805AD5", fontWeight: "600" },
  itemRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  amountText: { fontSize: 14, fontWeight: "bold", color: "#2D3748" },
  expandedSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
    gap: 8,
    paddingTop: 8,
  },
  notesText: { fontSize: 12, color: "#718096", fontStyle: "italic" },
  expandedRow: { flexDirection: "row", justifyContent: "space-between" },
  expandedLabel: { fontSize: 12, color: "#718096" },
  expandedValue: { fontSize: 12, fontWeight: "600", color: "#553C9A" },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 4,
  },
  deleteText: { fontSize: 12, color: "#E53E3E", fontWeight: "500" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#553C9A" },
  emptySubtitle: {
    fontSize: 14,
    color: "#805AD5",
    textAlign: "center",
    maxWidth: 280,
  },
});

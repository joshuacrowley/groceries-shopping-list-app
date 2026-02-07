import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CreditCard } from "phosphor-react-native";

const SubItem = memo(({ id }: { id: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const amount = Number(itemData.amount || 0);
  return (
    <View style={[styles.item, { opacity: isDone ? 0.6 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)}><View style={[styles.cbox, isDone && styles.cboxDone]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View></Pressable>
      <Text style={styles.emoji}>{String(itemData.emoji || "💳")}</Text>
      <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text || "")}</Text>
        {itemData.date ? <Text style={styles.dateText}>Renews: {String(itemData.date)}</Text> : null}
        {itemData.category ? <Text style={styles.catText}>{String(itemData.category)}</Text> : null}
      </Pressable>
      <Text style={styles.amountText}>${amount.toFixed(2)}</Text>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
      {isExpanded && (
        <View style={styles.expanded}>
          <Text style={styles.fieldLabel}>Amount/month:</Text>
          <TextInput style={styles.fieldInput} defaultValue={String(amount)} onEndEditing={(e) => store?.setCell("todos", id, "amount", parseFloat(e.nativeEvent.text) || 0)} keyboardType="decimal-pad" />
          <Text style={styles.fieldLabel}>Renewal date:</Text>
          <TextInput style={styles.fieldInput} defaultValue={String(itemData.date || "")} onEndEditing={(e) => store?.setCell("todos", id, "date", e.nativeEvent.text)} placeholder="YYYY-MM-DD" />
          <Text style={styles.fieldLabel}>Category:</Text>
          <TextInput style={styles.fieldInput} defaultValue={String(itemData.category || "")} onEndEditing={(e) => store?.setCell("todos", id, "category", e.nativeEvent.text)} placeholder="Entertainment, Utility..." />
        </View>
      )}
    </View>
  );
});

export default function SubscriptionTracker({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const totalMonthly = useMemo(() => { let total = 0; todoIds.forEach((id) => { if (!store?.getCell("todos", id, "done")) total += Number(store?.getCell("todos", id, "amount") || 0); }); return total; }, [todoIds, store]);
  const addItem = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), emoji: "💳", amount: 0, done: false, list: listId, date: "", category: "" }), [listId]);
  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem(newItem); setNewItem(""); } }, [addItem, newItem]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><CreditCard size={32} color="#38A169" weight="fill" /><View><Text style={styles.title}>{String(listData?.name || "Subscriptions")}</Text><Text style={styles.subtitle}>${totalMonthly.toFixed(2)}/month</Text></View></View>
      <View style={styles.addSection}><View style={styles.addRow}><TextInput style={styles.addInput} placeholder="Add subscription..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable></View></View>
      <View style={styles.list}>{todoIds.map((id) => <SubItem key={id} id={id} />)}</View>
      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>💳</Text><Text style={styles.emptyT}>No subscriptions tracked</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FFF4" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }, title: { fontSize: 24, fontWeight: "bold", color: "#22543D" }, subtitle: { fontSize: 14, color: "#38A169", fontWeight: "600" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#38A169", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  list: { gap: 8 },
  item: { backgroundColor: "#FFF", borderRadius: 10, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  cbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#38A169", alignItems: "center", justifyContent: "center" }, cboxDone: { backgroundColor: "#38A169" }, chk: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 20 }, itemContent: { flex: 1, minWidth: 120 }, itemText: { fontSize: 15, fontWeight: "600", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" }, dateText: { fontSize: 11, color: "#718096", marginTop: 2 }, catText: { fontSize: 11, color: "#805AD5", marginTop: 2 },
  amountText: { fontSize: 16, fontWeight: "bold", color: "#38A169" },
  expanded: { width: "100%", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EDF2F7", gap: 8, marginTop: 8 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#4A5568" }, fieldInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#22543D" },
});

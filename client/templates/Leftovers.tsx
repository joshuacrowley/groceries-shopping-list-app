import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, Hamburger } from "phosphor-react-native";

const LeftoverItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const daysOld = useMemo(() => { if (!itemData.date) return null; return Math.ceil((Date.now() - new Date(String(itemData.date)).getTime()) / 86400000); }, [itemData.date]);
  const isOld = daysOld !== null && daysOld > 3;
  return (
    <View style={[styles.item, { borderLeftColor: isOld ? "#E53E3E" : "#38A169", opacity: isDone ? 0.5 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)}><View style={[styles.cbox, isDone && styles.cboxDone]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View></Pressable>
      <Text style={styles.emoji}>{String(itemData.emoji || "🥡")}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text || "")}</Text>
        {itemData.date ? <Text style={styles.dateText}>Stored: {String(itemData.date)}</Text> : null}
        {daysOld !== null ? <Text style={[styles.ageText, { color: isOld ? "#E53E3E" : "#38A169" }]}>{isOld ? `⚠️ ${daysOld} days old` : `${daysOld} day${daysOld !== 1 ? "s" : ""} old`}</Text> : null}
        {itemData.notes ? <Text style={styles.notes}>{String(itemData.notes)}</Text> : null}
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function Leftovers({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const addItem = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), emoji: "🥡", date: new Date().toISOString().split("T")[0], done: false, list: listId, notes: "", category: "Fridge" }), [listId]);
  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem(newItem); setNewItem(""); } }, [addItem, newItem]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><Hamburger size={32} color="#DD6B20" weight="fill" /><View><Text style={styles.title}>{String(listData?.name || "Leftovers")}</Text><Text style={styles.subtitle}>{todoIds.length} items stored</Text></View></View>
      <View style={styles.addSection}><View style={styles.addRow}><TextInput style={styles.addInput} placeholder="Add leftover..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable></View></View>
      <View style={styles.list}>{todoIds.map((id) => <LeftoverItem key={id} id={id} />)}</View>
      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>🥡</Text><Text style={styles.emptyT}>No leftovers tracked</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFAF0" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }, title: { fontSize: 24, fontWeight: "bold", color: "#C05621" }, subtitle: { fontSize: 12, color: "#DD6B20", fontStyle: "italic" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#DD6B20", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  list: { gap: 8 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, borderLeftWidth: 4, gap: 8 },
  cbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#DD6B20", alignItems: "center", justifyContent: "center" }, cboxDone: { backgroundColor: "#DD6B20" }, chk: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 18 }, itemContent: { flex: 1 }, itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" }, dateText: { fontSize: 11, color: "#718096", marginTop: 2 }, ageText: { fontSize: 11, fontWeight: "600", marginTop: 2 }, notes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#C05621" },
});

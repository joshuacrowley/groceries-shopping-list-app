import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, Heart, Star } from "phosphor-react-native";

const DateItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const rating = Number(itemData.fiveStarRating || 0);
  return (
    <View style={[styles.item, { opacity: isDone ? 0.6 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.cbox, isDone && styles.cboxDone]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View>
      </Pressable>
      <Text style={styles.emoji}>{String(itemData.emoji || "💑")}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text || "")}</Text>
        {itemData.notes ? <Text style={styles.notes} numberOfLines={1}>{String(itemData.notes)}</Text> : null}
        <View style={styles.stars}>{[1, 2, 3, 4, 5].map((s) => (<Pressable key={s} onPress={() => store?.setCell("todos", id, "fiveStarRating", s)}><Star size={16} color="#ECC94B" weight={s <= rating ? "fill" : "regular"} /></Pressable>))}</View>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.btn}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function DateNightList({ listId }: { listId: string }) {
  const [newIdea, setNewIdea] = useState("");
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const addIdea = useAddRowCallback("todos", (text: string) => ({ text: text.trim(), emoji: "💑", done: false, list: listId, notes: "", fiveStarRating: 0 }), [listId]);
  const handleAdd = useCallback(() => { if (newIdea.trim()) { addIdea(newIdea); setNewIdea(""); } }, [addIdea, newIdea]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><Heart size={32} color="#E53E3E" weight="fill" /><View><Text style={styles.title}>{String(listData?.name || "Date Night Ideas")}</Text><Text style={styles.subtitle}>{todoIds.length} ideas</Text></View></View>
      <View style={styles.addSection}><TextInput style={styles.input} placeholder="Add a date night idea..." value={newIdea} onChangeText={setNewIdea} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={16} color="#FFF" weight="bold" /><Text style={styles.addBtnText}>Add</Text></Pressable></View>
      <View style={styles.list}>{todoIds.map((id) => <DateItem key={id} id={id} />)}</View>
      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>💕</Text><Text style={styles.emptyT}>No date night ideas yet</Text><Text style={styles.emptyS}>Add fun ideas for your next date night</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F5" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }, title: { fontSize: 24, fontWeight: "bold", color: "#C53030" }, subtitle: { fontSize: 12, color: "#E53E3E", fontStyle: "italic" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#E53E3E", paddingVertical: 10, borderRadius: 8, gap: 6 }, addBtnText: { color: "#FFF", fontWeight: "600" },
  list: { gap: 8 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 10, padding: 12, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  checkbox: {}, cbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#E53E3E", alignItems: "center", justifyContent: "center" }, cboxDone: { backgroundColor: "#E53E3E" }, chk: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 22 }, itemContent: { flex: 1 }, itemText: { fontSize: 15, fontWeight: "600", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" }, notes: { fontSize: 12, color: "#718096", marginTop: 2 },
  stars: { flexDirection: "row", gap: 2, marginTop: 4 }, btn: { padding: 4 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#C53030" }, emptyS: { fontSize: 14, color: "#718096", textAlign: "center" },
});

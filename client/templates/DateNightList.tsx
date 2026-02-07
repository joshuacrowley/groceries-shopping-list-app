import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Heart, Star, Plus } from "phosphor-react-native";

const EMOJI_OPTIONS = ["❤️", "🍷", "🍽️", "🎬", "🎮", "🍿", "🎨", "🌃", "🎢", "🏖️", "🥂", "💃", "🎭", "🎪", "🌹"];
const FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "unscheduled", label: "Ideas" },
];

const DateNightItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const rating = Number(itemData.fiveStarRating) || 0;

  return (
    <View style={[styles.item, { opacity: isDone ? 0.65 : 1, backgroundColor: isDone ? "#FFF5F7" : "#FFF" }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: "#D53F8C", borderColor: "#D53F8C" }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <Text style={styles.emoji}>{String(itemData.emoji || "❤️")}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        {itemData.date ? <Text style={styles.itemDate}>{String(itemData.date)}</Text> : null}
        {itemData.streetAddress ? <Text style={styles.itemNotes} numberOfLines={1}>📍 {String(itemData.streetAddress)}</Text> : null}
        {Number(itemData.amount) > 0 ? <Text style={styles.itemNotes}>💰 ${Number(itemData.amount).toFixed(0)}</Text> : null}
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((v) => (
            <Pressable key={v} onPress={() => store?.setCell("todos", id, "fiveStarRating", v)}>
              <Star size={14} color={v <= rating ? "#ECC94B" : "#CBD5E0"} weight={v <= rating ? "fill" : "regular"} />
            </Pressable>
          ))}
        </View>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function DateNightList({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [filter, setFilter] = useState("all");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const filteredIds = useMemo(() => {
    return [...todoIds].filter((id) => {
      const todo = store?.getRow("todos", id);
      if (!todo) return false;
      const ds = String(todo.date || "");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      switch (filter) {
        case "upcoming":
          if (!ds) return false;
          try { return new Date(ds) >= today; } catch { return false; }
        case "past":
          if (!ds) return false;
          try { return new Date(ds) < today; } catch { return false; }
        case "unscheduled":
          return !ds;
        default:
          return true;
      }
    });
  }, [todoIds, store, filter]);

  const addTodo = useAddRowCallback(
    "todos",
    (data: any) => ({
      list: listId,
      text: data.text?.trim() || "",
      emoji: EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)],
      notes: "",
      done: false,
      fiveStarRating: 3,
      amount: 0,
      streetAddress: "",
      date: "",
    }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newName.trim()) { addTodo({ text: newName.trim() }); setNewName(""); }
  }, [newName, addTodo]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Heart size={28} color="#D53F8C" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "Date Night Ideas")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Plan your first date! 💕" : todoIds.length < 5 ? "Love is in the air 🌹" : "Romance experts! 💘"}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{filteredIds.length}</Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add a date night idea..." value={newName} onChangeText={setNewName} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <Pressable key={f.id} onPress={() => setFilter(f.id)} style={[styles.filterChip, filter === f.id && styles.filterChipActive]}>
                <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {filteredIds.map((id) => <DateNightItem key={id} id={id} />)}

        {filteredIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💕</Text>
            <Text style={styles.emptyTitle}>{filter === "all" ? "No date night ideas yet!" : `No ${filter} dates`}</Text>
            <Text style={styles.emptySubtitle}>Start planning your perfect evenings together</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F7" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: "#D53F8C" },
  subtitle: { fontSize: 12, color: "#ED64A6" },
  headerBadge: { backgroundColor: "#FBB6CE", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#D53F8C", fontWeight: "600", fontSize: 13 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#FBB6CE", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#D53F8C", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  filterScroll: { marginBottom: 12 },
  filterRow: { flexDirection: "row", gap: 6, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#FBB6CE" },
  filterChipActive: { backgroundColor: "#D53F8C" },
  filterText: { fontSize: 12, color: "#D53F8C", fontWeight: "500" },
  filterTextActive: { color: "#FFF" },
  item: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 12, marginBottom: 8, gap: 10, borderWidth: 1, borderColor: "#FBB6CE" },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#FBB6CE", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 20 },
  itemContent: { flex: 1 },
  itemText: { fontSize: 15, fontWeight: "600", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemDate: { fontSize: 11, color: "#D53F8C", marginTop: 2 },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2 },
  stars: { flexDirection: "row", gap: 2, marginTop: 4 },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#D53F8C" },
  emptySubtitle: { fontSize: 14, color: "#ED64A6", textAlign: "center", maxWidth: 260 },
});

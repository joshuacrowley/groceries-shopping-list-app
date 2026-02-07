import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CaretDown, CaretRight } from "phosphor-react-native";

const ROOMS = [
  { name: "Living Room", emoji: "🛋️", color: "#3182CE" },
  { name: "Kitchen", emoji: "🍳", color: "#38A169" },
  { name: "Bedroom", emoji: "🛏️", color: "#805AD5" },
  { name: "Bathroom", emoji: "🚿", color: "#0BC5EA" },
  { name: "Kids Room", emoji: "🧸", color: "#D53F8C" },
  { name: "Office", emoji: "💻", color: "#DD6B20" },
  { name: "Hallway", emoji: "🚪", color: "#718096" },
  { name: "Other", emoji: "🏠", color: "#4A5568" },
];

const TidyItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const room = ROOMS.find((r) => r.name === String(itemData.category)) || ROOMS[7];

  return (
    <View style={[styles.item, { borderLeftColor: isDone ? "#CBD5E0" : room.color, opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: room.color, borderColor: room.color }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        {itemData.time ? <Text style={styles.timeText}>⏱️ {String(itemData.time)}</Text> : null}
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function TidyUp({ listId }: { listId: string }) {
  const [newTodo, setNewTodo] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0].name);
  const [openRooms, setOpenRooms] = useState<Record<string, boolean>>(ROOMS.reduce((acc, r) => ({ ...acc, [r.name]: true }), {}));
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const roomItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => { const cat = String(store?.getCell("todos", id, "category") || "Other"); if (!grouped[cat]) grouped[cat] = []; grouped[cat].push(id); });
    return grouped;
  }, [todoIds, store]);

  const doneCount = useMemo(() => todoIds.filter((id) => Boolean(store?.getCell("todos", id, "done"))).length, [todoIds, store]);
  const progress = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const addItem = useAddRowCallback("todos", (data: any) => ({ text: data.text?.trim() || "", category: data.category || selectedRoom, done: false, list: listId, time: "", notes: "" }), [listId, selectedRoom]);

  const handleAdd = useCallback(() => { if (newTodo.trim()) { addItem({ text: newTodo.trim(), category: selectedRoom }); setNewTodo(""); } }, [newTodo, selectedRoom, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 28 }}>🧹</Text>
            <View>
              <Text style={styles.title}>{String(listData?.name || "Tidy Up")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Add tidy-up tasks!" : progress === 100 ? "Sparkling clean! ✨" : progress >= 50 ? "Getting there! 🧽" : "Time to tidy! 🧹"}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{doneCount}/{todoIds.length}</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>

        <View style={styles.addSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.roomRow}>{ROOMS.map(({ name, emoji }) => (
              <Pressable key={name} onPress={() => setSelectedRoom(name)} style={[styles.roomChip, selectedRoom === name && styles.roomChipSelected]}>
                <Text style={[styles.roomChipText, selectedRoom === name && styles.roomChipTextSelected]}>{emoji} {name}</Text>
              </Pressable>
            ))}</View>
          </ScrollView>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add task..." value={newTodo} onChangeText={setNewTodo} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {ROOMS.map((room) => {
          const items = roomItems[room.name] || [];
          if (items.length === 0) return null;
          const isOpen = openRooms[room.name] !== false;
          return (
            <View key={room.name} style={styles.roomSection}>
              <Pressable onPress={() => setOpenRooms((p) => ({ ...p, [room.name]: !isOpen }))} style={[styles.roomHeader, { backgroundColor: room.color + "20" }]}>
                <Text style={[styles.roomName, { color: room.color }]}>{room.emoji} {room.name}</Text>
                <View style={styles.roomMeta}>
                  <View style={[styles.countBadge, { backgroundColor: room.color + "30" }]}><Text style={[styles.countText, { color: room.color }]}>{items.length}</Text></View>
                  {isOpen ? <CaretDown size={14} color={room.color} /> : <CaretRight size={14} color={room.color} />}
                </View>
              </Pressable>
              {isOpen && <View style={styles.roomItems}>{items.map((id) => <TidyItem key={id} id={id} />)}</View>}
            </View>
          );
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧹</Text>
            <Text style={styles.emptyTitle}>Nothing to tidy!</Text>
            <Text style={styles.emptySubtitle}>Add tasks for each room to get your home sparkling</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FFF4" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#276749" },
  subtitle: { fontSize: 12, color: "#38A169", fontStyle: "italic" },
  headerBadge: { backgroundColor: "#C6F6D5", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#276749", fontWeight: "600", fontSize: 14 },
  progressBar: { height: 8, backgroundColor: "#C6F6D5", borderRadius: 4, overflow: "hidden", marginBottom: 16 },
  progressFill: { height: "100%", backgroundColor: "#38A169", borderRadius: 4 },
  addSection: { backgroundColor: "rgba(255,255,255,0.88)", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10 },
  roomRow: { flexDirection: "row", gap: 6 },
  roomChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#F0FFF4", borderWidth: 1, borderColor: "#C6F6D5" },
  roomChipSelected: { backgroundColor: "#9AE6B4", borderColor: "#38A169" },
  roomChipText: { fontSize: 11, color: "#4A5568" },
  roomChipTextSelected: { color: "#276749", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#C6F6D5", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#38A169", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  roomSection: { marginBottom: 8 },
  roomHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 8 },
  roomName: { fontSize: 14, fontWeight: "bold" },
  roomMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 11, fontWeight: "600" },
  roomItems: { gap: 4, marginTop: 4 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, borderLeftWidth: 4, gap: 8 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  timeText: { fontSize: 11, color: "#718096", marginTop: 2 },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#276749" },
  emptySubtitle: { fontSize: 14, color: "#38A169", textAlign: "center", maxWidth: 280 },
});

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

const ROOMS = [
  { name: "Living Room", emoji: "🛋️" },
  { name: "Kitchen", emoji: "🍳" },
  { name: "Bedroom", emoji: "🛏️" },
  { name: "Bathroom", emoji: "🚿" },
  { name: "Kids Room", emoji: "🧸" },
  { name: "Office", emoji: "💻" },
  { name: "Hallway", emoji: "🚪" },
  { name: "Other", emoji: "🏠" },
];

const ROOM_MAP = ROOMS.reduce(
  (acc, r) => { acc[r.name] = r; return acc; },
  {} as Record<string, (typeof ROOMS)[0]>
);

const TidyItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const room = ROOM_MAP[String(itemData.category)] || ROOMS[7];

  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this task?", [
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
        <Text style={styles.itemEmoji}>{room.emoji}</Text>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemText, isDone && styles.itemTextDone]} numberOfLines={1}>
            {String(itemData.text || "")}
          </Text>
          <Text style={styles.itemRoom}>{room.name}</Text>
        </View>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={18} color="#E53E3E" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
});
TidyItem.displayName = "TidyItem";

const RoomGroup = memo(({ room, items, isOpen, onToggle }: {
  room: (typeof ROOMS)[0]; items: string[]; isOpen: boolean; onToggle: () => void;
}) => (
  <View style={styles.roomGroup}>
    <Pressable onPress={onToggle} style={styles.roomHeader}>
      <View style={styles.roomHeaderLeft}>
        <Text style={styles.roomEmoji}>{room.emoji}</Text>
        <Text style={styles.roomTitle}>{room.name}</Text>
      </View>
      <View style={styles.roomHeaderRight}>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
        {isOpen ? <CaretUp size={14} color="#38A169" /> : <CaretDown size={14} color="#38A169" />}
      </View>
    </Pressable>
    {isOpen && (
      <View style={styles.roomItems}>
        {items.map((id) => <TidyItem key={id} id={id} />)}
      </View>
    )}
  </View>
));
RoomGroup.displayName = "RoomGroup";

export default function TidyUp({ listId }: { listId: string }) {
  const [newTask, setNewTask] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0].name);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [openRooms, setOpenRooms] = useState<Record<string, boolean>>(
    ROOMS.reduce((acc, r) => ({ ...acc, [r.name]: true }), {} as Record<string, boolean>)
  );

  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const groupedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const cat = String(store?.getCell("todos", id, "category") || "Other");
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(id);
    });
    return grouped;
  }, [todoIds, store]);

  const doneCount = useMemo(() =>
    todoIds.filter((id) => Boolean(store?.getCell("todos", id, "done"))).length,
  [todoIds, store]);

  const progress = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const addTask = useAddRowCallback(
    "todos",
    (text: string) => ({
      text: text.trim(),
      category: selectedRoom,
      list: listId,
      done: false,
    }),
    [listId, selectedRoom],
    undefined,
    (rowId) => { if (rowId) setNewTask(""); }
  );

  const handleAdd = useCallback(() => {
    if (newTask.trim()) addTask(newTask);
  }, [addTask, newTask]);

  const toggleRoom = useCallback((room: string) => {
    setOpenRooms((prev) => ({ ...prev, [room]: !prev[room] }));
  }, []);

  const readinessLabel = useMemo(() => {
    if (todoIds.length === 0) return "Add tasks to tidy up! 🧹";
    if (progress === 100) return "Sparkling clean! ✨";
    if (progress >= 75) return "Almost there! 🧽";
    if (progress >= 50) return "Good progress! 💪";
    return "Let's get tidying! 🧹";
  }, [progress, todoIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.listTitle}>{String(listData?.name || "Tidy Up")}</Text>
            <Text style={styles.progressLabel}>{readinessLabel}</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{doneCount}/{todoIds.length}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Pressable onPress={() => setShowRoomPicker(!showRoomPicker)} style={styles.roomPickerBtn}>
          <Text style={styles.roomPickerText}>
            {ROOM_MAP[selectedRoom]?.emoji} {selectedRoom}
          </Text>
          <CaretDown size={14} color="#718096" />
        </Pressable>
        {showRoomPicker && (
          <View style={styles.pickerDropdown}>
            {ROOMS.map(({ name, emoji }) => (
              <Pressable key={name} onPress={() => { setSelectedRoom(name); setShowRoomPicker(false); }}
                style={[styles.pickerOption, selectedRoom === name && styles.pickerOptionActive]}>
                <Text>{emoji} {name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.addRow}>
          <TextInput style={styles.addInput} value={newTask} onChangeText={setNewTask}
            placeholder="Add tidy task..." placeholderTextColor="#A0AEC0"
            onSubmitEditing={handleAdd} returnKeyType="done" />
          <Pressable onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {ROOMS.map((room) => {
          const items = groupedItems[room.name] || [];
          if (items.length === 0) return null;
          return <RoomGroup key={room.name} room={room} items={items}
            isOpen={openRooms[room.name]} onToggle={() => toggleRoom(room.name)} />;
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧹</Text>
            <Text style={styles.emptyTitle}>All tidy!</Text>
            <Text style={styles.emptySubtitle}>Add tasks to get your space sparkling clean</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FFF4" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#276749" },
  progressLabel: { fontSize: 12, color: "#38A169", fontStyle: "italic", marginTop: 2 },
  progressBadge: { backgroundColor: "#C6F6D5", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  progressBadgeText: { fontSize: 14, fontWeight: "600", color: "#276749" },
  progressTrack: { height: 8, backgroundColor: "#C6F6D5", borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#38A169" },
  roomPickerBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#C6F6D5", marginBottom: 8, gap: 6, alignSelf: "flex-start" },
  roomPickerText: { fontSize: 14, color: "#4A5568" },
  pickerDropdown: { backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#C6F6D5", overflow: "hidden", marginBottom: 8 },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 10 },
  pickerOptionActive: { backgroundColor: "#F0FFF4" },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  addInput: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#2D3748", borderWidth: 1, borderColor: "#C6F6D5" },
  addButton: { backgroundColor: "#38A169", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  roomGroup: { marginBottom: 8 },
  roomHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#C6F6D5", borderRadius: 8, padding: 10 },
  roomHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  roomEmoji: { fontSize: 18 },
  roomTitle: { fontWeight: "bold", color: "#276749", fontSize: 15 },
  roomHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  countBadge: { backgroundColor: "#38A169", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  countText: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  roomItems: { marginTop: 4, gap: 4 },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemDone: { opacity: 0.55 },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  checkbox: { padding: 4 },
  checkboxInner: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#38A169", borderColor: "#38A169" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  itemEmoji: { fontSize: 18 },
  itemInfo: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  itemTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemRoom: { fontSize: 11, color: "#718096", marginTop: 2 },
  iconBtn: { padding: 6 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#276749" },
  emptySubtitle: { fontSize: 14, color: "#38A169", textAlign: "center", maxWidth: 280 },
});

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
import {
  Trash,
  CaretDown,
  CaretUp,
  Heart,
  Star,
  MapPin,
  Clock,
} from "phosphor-react-native";

const EMOJI_OPTIONS = [
  "❤️", "🍷", "🍽️", "🎬", "🎮", "🍿", "🎨",
  "🌃", "🎢", "🏖️", "🥂", "💃", "🎭", "🎪", "🌹",
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "unscheduled", label: "Ideas" },
];

const DateNightItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const todoData = useRow("todos", id);
  const store = useStore();
  const deleteTodo = useDelRowCallback("todos", id);

  if (!todoData) return null;

  const isDone = Boolean(todoData.done);

  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this idea?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteTodo },
    ]);
  };

  const handleRating = (v: number) => store?.setCell("todos", id, "fiveStarRating", v);
  const handleNotesChange = (text: string) => store?.setCell("todos", id, "notes", text);
  const handleLocationChange = (text: string) => store?.setCell("todos", id, "streetAddress", text);
  const handleDateChange = (text: string) => store?.setCell("todos", id, "date", text);
  const handleBudgetChange = (text: string) => {
    const val = parseFloat(text);
    store?.setCell("todos", id, "amount", isNaN(val) ? 0 : val);
  };
  const handleEmojiSelect = (emoji: string) => store?.setCell("todos", id, "emoji", emoji);

  const rating = Number(todoData.fiveStarRating || 0);
  const hasDate = typeof todoData.date === "string" && (todoData.date as string).trim().length > 0;

  return (
    <View style={[styles.itemCard, isDone && styles.itemCardDone]}>
      <View style={styles.itemRow}>
        <Pressable onPress={() => setExpanded(!expanded)}>
          <Text style={styles.itemEmoji}>{String(todoData.emoji || "❤️")}</Text>
        </Pressable>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, isDone && styles.itemTitleDone]} numberOfLines={1}>
            {String(todoData.text || "")}
          </Text>
          <View style={styles.metaRow}>
            {hasDate && (
              <View style={styles.metaItem}>
                <Clock size={12} color="#D53F8C" />
                <Text style={styles.metaText}>{String(todoData.date)}</Text>
              </View>
            )}
            {todoData.streetAddress && (
              <View style={styles.metaItem}>
                <MapPin size={12} color="#D53F8C" weight="fill" />
                <Text style={styles.metaText} numberOfLines={1}>{String(todoData.streetAddress)}</Text>
              </View>
            )}
            {Number(todoData.amount) > 0 && (
              <Text style={styles.metaText}>${Number(todoData.amount).toFixed(0)}</Text>
            )}
          </View>
        </View>
        <View style={styles.itemRight}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((v) => (
              <Pressable key={v} onPress={() => handleRating(v)}>
                <Star size={14} weight={v <= rating ? "fill" : "regular"} color={v <= rating ? "#FFD700" : "#CBD5E0"} />
              </Pressable>
            ))}
          </View>
          <View style={styles.actionsRow}>
            <Pressable onPress={handleToggle} style={styles.checkbox}>
              <View style={[styles.checkboxInner, isDone && styles.checkboxChecked]}>
                {isDone && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </Pressable>
            <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
              {expanded ? <CaretUp size={16} color="#D53F8C" /> : <CaretDown size={16} color="#D53F8C" />}
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.iconBtn}>
              <Trash size={16} color="#E53E3E" />
            </Pressable>
          </View>
        </View>
      </View>

      {expanded && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Date</Text>
          <TextInput style={styles.detailInput} value={String(todoData.date || "")}
            onChangeText={handleDateChange} placeholder="YYYY-MM-DD" placeholderTextColor="#A0AEC0" />

          <Text style={styles.detailLabel}>Location</Text>
          <TextInput style={styles.detailInput} value={String(todoData.streetAddress || "")}
            onChangeText={handleLocationChange} placeholder="Where to?" placeholderTextColor="#A0AEC0" />

          <Text style={styles.detailLabel}>Budget</Text>
          <TextInput style={styles.detailInput} value={String(Number(todoData.amount || 0))}
            onChangeText={handleBudgetChange} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#A0AEC0" />

          <Text style={styles.detailLabel}>Notes</Text>
          <TextInput style={[styles.detailInput, { minHeight: 60, textAlignVertical: "top" }]}
            value={String(todoData.notes || "")} onChangeText={handleNotesChange}
            placeholder="Reservations, outfit ideas..." placeholderTextColor="#A0AEC0" multiline />

          <Text style={styles.detailLabel}>Vibe</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <Pressable key={emoji} onPress={() => handleEmojiSelect(emoji)}
                style={[styles.emojiOption, String(todoData.emoji) === emoji && styles.emojiOptionActive]}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
});
DateNightItem.displayName = "DateNightItem";

export default function DateNightList({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [filter, setFilter] = useState("all");
  const store = useStore();
  const listData = useRow("lists", listId);
  const todoIds = useLocalRowIds("todoList", listId) || [];

  const filteredIds = useMemo(() => {
    return todoIds.filter((id) => {
      const todo = store?.getRow("todos", id);
      if (!todo) return false;
      const ds = String(todo.date || "");
      const now = new Date();
      switch (filter) {
        case "upcoming":
          if (!ds) return false;
          return new Date(ds) > now;
        case "past":
          if (!ds) return false;
          return new Date(ds) < now;
        case "unscheduled":
          return !ds;
        default:
          return true;
      }
    });
  }, [todoIds, store, filter]);

  const addTodo = useAddRowCallback(
    "todos",
    (text: string) => ({
      list: listId,
      text: text.trim(),
      emoji: EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)],
      notes: "",
      done: false,
      fiveStarRating: 3,
      amount: 0,
      streetAddress: "",
      date: "",
    }),
    [listId],
    undefined,
    (rowId) => { if (rowId) setNewName(""); }
  );

  const handleAdd = useCallback(() => {
    if (newName.trim()) addTodo(newName);
  }, [addTodo, newName]);

  const tagline = useMemo(() => {
    if (todoIds.length === 0) return "Plan your first date! 💕";
    if (todoIds.length < 5) return "Love is in the air 🌹";
    return "Romance experts! 💘";
  }, [todoIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Heart size={24} color="#D53F8C" weight="fill" />
            <View>
              <Text style={styles.listTitle}>{String(listData?.name || "Date Night Ideas")}</Text>
              <Text style={styles.tagline}>{tagline}</Text>
            </View>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredIds.length} ideas</Text>
          </View>
        </View>

        <View style={styles.addRow}>
          <TextInput style={styles.addInput} value={newName} onChangeText={setNewName}
            placeholder="Add a date night idea..." placeholderTextColor="#A0AEC0"
            onSubmitEditing={handleAdd} returnKeyType="done" />
          <Pressable onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable key={f.id} onPress={() => setFilter(f.id)}
              style={[styles.filterPill, filter === f.id && styles.filterPillActive]}>
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        {filteredIds.map((id) => <DateNightItem key={id} id={id} />)}

        {filteredIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💕</Text>
            <Text style={styles.emptyTitle}>
              {filter === "all" ? "No date night ideas yet!" : `No ${filter} dates found`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === "all" ? "Start planning your perfect evenings together" : "Try a different filter or add new ideas"}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F7" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  listTitle: { fontSize: 20, fontWeight: "bold", color: "#97266D" },
  tagline: { fontSize: 12, color: "#B83280", marginTop: 2 },
  countBadge: { backgroundColor: "#FED7E2", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  countBadgeText: { fontSize: 12, fontWeight: "600", color: "#97266D" },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  addInput: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: "#2D3748", borderWidth: 1, borderColor: "#FED7E2" },
  addButton: { backgroundColor: "#D53F8C", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  filterRow: { flexDirection: "row", justifyContent: "center", gap: 4, marginBottom: 16, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 4, borderWidth: 1, borderColor: "#FED7E2" },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  filterPillActive: { backgroundColor: "#D53F8C" },
  filterText: { fontSize: 12, fontWeight: "500", color: "#97266D" },
  filterTextActive: { color: "#FFFFFF" },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#FED7E2", overflow: "hidden" },
  itemCardDone: { opacity: 0.75, backgroundColor: "#FFF5F7" },
  itemRow: { flexDirection: "row", alignItems: "flex-start", padding: 12, gap: 10 },
  itemEmoji: { fontSize: 24, marginTop: 2 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: "600", color: "#2D3748" },
  itemTitleDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 11, color: "#718096" },
  itemRight: { alignItems: "flex-end", gap: 6 },
  starsRow: { flexDirection: "row", gap: 2 },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  checkbox: { padding: 2 },
  checkboxInner: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#D53F8C", borderColor: "#D53F8C" },
  checkmark: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  iconBtn: { padding: 4 },
  detailsSection: { backgroundColor: "#FFF5F7", padding: 14, gap: 8, borderTopWidth: 1, borderTopColor: "#FED7E2" },
  detailLabel: { fontSize: 11, fontWeight: "600", color: "#97266D", textTransform: "uppercase", letterSpacing: 0.5 },
  detailInput: { backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: "#2D3748", borderWidth: 1, borderColor: "#FED7E2" },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  emojiOption: { padding: 6, borderRadius: 8, borderWidth: 2, borderColor: "transparent" },
  emojiOptionActive: { backgroundColor: "#FED7E2", borderColor: "#D53F8C" },
  emojiText: { fontSize: 20 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#97266D" },
  emptySubtitle: { fontSize: 14, color: "#B83280", textAlign: "center", maxWidth: 260 },
});

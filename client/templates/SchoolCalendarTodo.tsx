import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useSetRowCallback, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CaretDown, CaretUp, Calendar, Backpack } from "phosphor-react-native";

const CATEGORIES = [
  { value: "term-dates", label: "Term Dates", color: "#805AD5", emoji: "📅" },
  { value: "pupil-free", label: "Pupil-Free Days", color: "#ED8936", emoji: "🎒" },
  { value: "sports", label: "Sports Carnivals", color: "#38A169", emoji: "🏆" },
  { value: "excursions", label: "Excursions", color: "#3182CE", emoji: "📍" },
  { value: "conferences", label: "Parent-Teacher", color: "#ED64A6", emoji: "👥" },
  { value: "assignments", label: "Assignments", color: "#E53E3E", emoji: "📚" },
  { value: "other", label: "Other", color: "#718096", emoji: "🎒" },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

const isToday = (dateStr: string) => {
  const today = new Date();
  const date = new Date(dateStr);
  return date.toDateString() === today.toDateString();
};

const isBefore = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

const isWithinWeek = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  const day = today.getDay();
  endOfWeek.setDate(today.getDate() + (day === 0 ? 0 : 7 - day));
  endOfWeek.setHours(23, 59, 59, 999);
  const date = new Date(dateStr);
  return date >= today && date <= endOfWeek;
};

const TodoItem = memo(({ id }: { id: string }) => {
  const todoData = useRow("todos", id);
  const store = useStore();
  const deleteTodo = useDelRowCallback("todos", id);

  if (!todoData) return null;

  const handleToggle = () => store?.setCell("todos", id, "done", !todoData.done);
  const handleDelete = () => {
    Alert.alert("Delete", "Delete this event?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteTodo },
    ]);
  };

  const category = CATEGORIES.find((c) => c.value === todoData.category) || CATEGORIES[6];
  const todayStatus = todoData.date ? isToday(todoData.date as string) : false;

  return (
    <View style={[styles.todoItem, { borderLeftColor: category.color, opacity: todoData.done ? 0.6 : 1 }]}>
      <Pressable onPress={handleToggle} style={styles.checkboxArea}>
        <View style={[styles.checkbox, todoData.done && styles.checkboxDone]}>
          {todoData.done && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </Pressable>
      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
      <View style={styles.todoContent}>
        <Text style={[styles.todoText, todoData.done && styles.todoTextDone, todayStatus && styles.todayText]}>
          {todoData.text as string}
        </Text>
        {todoData.notes ? <Text style={styles.notesText}>{todoData.notes as string}</Text> : null}
      </View>
      <View style={styles.todoRight}>
        <View style={[styles.dateBadge, todayStatus && styles.todayBadge]}>
          <Text style={[styles.dateBadgeText, todayStatus && styles.todayBadgeText]}>
            {todayStatus ? "Today" : formatDate(todoData.date as string)}
          </Text>
        </View>
      </View>
      <Pressable onPress={handleDelete} style={styles.deleteBtn}>
        <Trash size={18} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});
TodoItem.displayName = "TodoItem";

export default function SchoolCalendarTodo({ listId }: { listId: string }) {
  const [newTodo, setNewTodo] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [newNotes, setNewNotes] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [showFuture, setShowFuture] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];

  const addTodo = useAddRowCallback(
    "todos",
    (data: any) => ({
      text: data.text.trim(),
      done: false,
      list: listId,
      date: data.date || "",
      category: data.category,
      notes: data.notes.trim(),
    }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newTodo.trim() !== "") {
      addTodo({ text: newTodo, date: newDate, category: newCategory, notes: newNotes });
      setNewTodo("");
      setNewDate("");
      setNewNotes("");
      setNewCategory("other");
    }
  }, [addTodo, newTodo, newDate, newCategory, newNotes]);

  const { pastTodos, thisWeekTodos, futureTodos } = useMemo(() => {
    const past: string[] = [];
    const thisWeek: string[] = [];
    const future: string[] = [];

    todoIds.forEach((id) => {
      const todo = store?.getRow("todos", id);
      if (!todo) return;
      const todoDate = todo.date as string;

      if (!todoDate) {
        thisWeek.push(id);
      } else if (isBefore(todoDate) && !isToday(todoDate)) {
        past.push(id);
      } else if (isWithinWeek(todoDate)) {
        thisWeek.push(id);
      } else {
        future.push(id);
      }
    });

    const sortByDate = (a: string, b: string) => {
      const dateA = store?.getCell("todos", a, "date") as string;
      const dateB = store?.getCell("todos", b, "date") as string;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    };

    past.sort(sortByDate).reverse();
    thisWeek.sort(sortByDate);
    future.sort(sortByDate);

    return { pastTodos: past, thisWeekTodos: thisWeek, futureTodos: future };
  }, [todoIds, store]);

  const selectedCategory = CATEGORIES.find((c) => c.value === newCategory) || CATEGORIES[6];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Calendar size={28} color="#3182CE" weight="fill" />
        <View style={styles.headerText}>
          <Text style={styles.title}>School Calendar</Text>
          <Text style={styles.subtitle}>{thisWeekTodos.length} this week</Text>
        </View>
      </View>

      {/* Add Form */}
      <View style={styles.addForm}>
        <TextInput
          style={styles.input}
          value={newTodo}
          onChangeText={setNewTodo}
          placeholder="Add a school event"
          placeholderTextColor="#A0AEC0"
        />
        <TextInput
          style={styles.input}
          value={newDate}
          onChangeText={setNewDate}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor="#A0AEC0"
        />
        <Pressable onPress={() => setShowCategoryPicker(!showCategoryPicker)} style={styles.categorySelector}>
          <Text style={styles.categorySelectorText}>{selectedCategory.emoji} {selectedCategory.label}</Text>
          <CaretDown size={16} color="#718096" />
        </Pressable>
        {showCategoryPicker && (
          <View style={styles.categoryList}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                style={[styles.categoryOption, newCategory === cat.value && styles.categoryOptionActive]}
                onPress={() => { setNewCategory(cat.value); setShowCategoryPicker(false); }}
              >
                <Text style={styles.categoryOptionText}>{cat.emoji} {cat.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <TextInput
          style={styles.input}
          value={newNotes}
          onChangeText={setNewNotes}
          placeholder="Notes (optional)"
          placeholderTextColor="#A0AEC0"
        />
        <Pressable onPress={handleAdd} style={styles.addButton}>
          <Plus size={16} color="#FFFFFF" weight="bold" />
          <Text style={styles.addButtonText}>Add Event</Text>
        </Pressable>
      </View>

      {/* Empty State */}
      {todoIds.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={styles.emptyTitle}>No school events yet</Text>
          <Text style={styles.emptySubtitle}>Add classes and activities to build your weekly schedule</Text>
        </View>
      )}

      {/* Past Events */}
      {pastTodos.length > 0 && (
        <View style={styles.section}>
          <Pressable onPress={() => setShowPast(!showPast)} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Past Events ({pastTodos.length})</Text>
            {showPast ? <CaretUp size={18} color="#2D3748" /> : <CaretDown size={18} color="#2D3748" />}
          </Pressable>
          {showPast && pastTodos.map((id) => <TodoItem key={id} id={id} />)}
        </View>
      )}

      {/* This Week */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        {thisWeekTodos.length > 0 ? (
          thisWeekTodos.map((id) => <TodoItem key={id} id={id} />)
        ) : (
          <Text style={styles.emptySection}>No events scheduled for this week</Text>
        )}
      </View>

      {/* Future Events */}
      {futureTodos.length > 0 && (
        <View style={styles.section}>
          <Pressable onPress={() => setShowFuture(!showFuture)} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events ({futureTodos.length})</Text>
            {showFuture ? <CaretUp size={18} color="#2D3748" /> : <CaretDown size={18} color="#2D3748" />}
          </Pressable>
          {showFuture && futureTodos.map((id) => <TodoItem key={id} id={id} />)}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EBF4FF" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2A4365" },
  subtitle: { fontSize: 13, color: "#4A5568" },
  addForm: { paddingHorizontal: 16, gap: 8 },
  input: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 12, fontSize: 14, color: "#2D3748", borderWidth: 1, borderColor: "#E2E8F0" },
  categorySelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  categorySelectorText: { fontSize: 14, color: "#2D3748" },
  categoryList: { backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", overflow: "hidden" },
  categoryOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#EDF2F7" },
  categoryOptionActive: { backgroundColor: "#EBF8FF" },
  categoryOptionText: { fontSize: 14, color: "#2D3748" },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#3182CE", borderRadius: 8, padding: 12, gap: 6 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#2A4365", marginBottom: 8 },
  emptySection: { fontSize: 13, fontStyle: "italic", color: "#718096", textAlign: "center", paddingVertical: 12 },
  todoItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8, padding: 12, marginBottom: 8, borderLeftWidth: 4, gap: 8 },
  checkboxArea: { padding: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxDone: { backgroundColor: "#3182CE", borderColor: "#3182CE" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  categoryEmoji: { fontSize: 18 },
  todoContent: { flex: 1 },
  todoText: { fontSize: 14, color: "#2D3748" },
  todoTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  todayText: { fontWeight: "bold" },
  notesText: { fontSize: 12, color: "#718096", marginTop: 2 },
  todoRight: { marginRight: 4 },
  dateBadge: { backgroundColor: "#EDF2F7", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  todayBadge: { backgroundColor: "#C6F6D5" },
  dateBadgeText: { fontSize: 11, color: "#4A5568" },
  todayBadgeText: { color: "#276749" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#2A4365" },
  emptySubtitle: { fontSize: 13, color: "#718096", textAlign: "center", maxWidth: 260, marginTop: 4 },
});

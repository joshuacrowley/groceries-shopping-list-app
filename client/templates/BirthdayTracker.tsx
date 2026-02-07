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
  Gift,
  CaretDown,
  CaretUp,
} from "phosphor-react-native";
import {
  format,
  parse,
  isValid,
  differenceInYears,
  setYear,
  isFuture,
  differenceInDays,
  compareAsc,
} from "date-fns";

const BirthdayItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const todoData = useRow("todos", id);
  const store = useStore();
  const deleteTodo = useDelRowCallback("todos", id);
  const [newGiftIdea, setNewGiftIdea] = useState("");

  if (!todoData) return null;

  const handleDelete = () => {
    Alert.alert("Delete", "Remove this birthday?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteTodo },
    ]);
  };

  const handleToggleDone = () => {
    store?.setCell("todos", id, "done", !Boolean(todoData.done));
  };

  const handleBudgetChange = (text: string) => {
    const val = parseFloat(text);
    store?.setCell("todos", id, "amount", isNaN(val) ? 0 : val);
  };

  const handleNotesChange = (text: string) => {
    store?.setCell("todos", id, "notes", text);
  };

  if (!todoData.date) {
    return (
      <View style={styles.warningCard}>
        <View style={styles.warningRow}>
          <Text style={styles.warningText}>
            ⚠️ Missing birthday date for {String(todoData.text)}
          </Text>
          <Pressable onPress={handleDelete} style={styles.iconBtn}>
            <Trash size={18} color="#E53E3E" />
          </Pressable>
        </View>
      </View>
    );
  }

  const parseBirthDate = (dateString: string) => {
    const formats = ["yyyy-MM-dd", "yyyy-MM-dd'T'HH:mm:ss.SSSX"];
    for (const fmt of formats) {
      try {
        const d = parse(dateString, fmt, new Date());
        if (isValid(d)) return d;
      } catch {}
    }
    return null;
  };

  const birthDate = parseBirthDate(String(todoData.date));
  if (!birthDate) return null;

  const today = new Date();
  const age = differenceInYears(today, birthDate);
  const thisYearBirthday = setYear(birthDate, today.getFullYear());
  const nextBirthday = isFuture(thisYearBirthday)
    ? thisYearBirthday
    : setYear(birthDate, today.getFullYear() + 1);
  const daysUntil = differenceInDays(nextBirthday, today);

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemRow}>
        <Text style={styles.emoji}>{String(todoData.emoji || "🎂")}</Text>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>
            {String(todoData.text)}'s {age + 1}th Birthday
          </Text>
          <Text style={styles.itemDate}>
            {format(birthDate, "MMMM d, yyyy")}
          </Text>
        </View>
        <View
          style={[
            styles.daysBadge,
            daysUntil <= 30 ? styles.daysBadgeUrgent : styles.daysBadgeNormal,
          ]}
        >
          <Text
            style={[
              styles.daysBadgeText,
              daysUntil <= 30 ? styles.daysBadgeTextUrgent : styles.daysBadgeTextNormal,
            ]}
          >
            {daysUntil} days
          </Text>
        </View>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
          {expanded ? (
            <CaretUp size={18} color="#718096" />
          ) : (
            <CaretDown size={18} color="#718096" />
          )}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={18} color="#E53E3E" />
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Gift size={18} color="#805AD5" />
            <Text style={styles.detailLabel}>Gift Ideas / Notes:</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={String(todoData.notes || "")}
            onChangeText={handleNotesChange}
            placeholder="Add gift ideas, notes..."
            placeholderTextColor="#A0AEC0"
            multiline
          />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Budget: $</Text>
            <TextInput
              style={styles.budgetInput}
              value={String(Number(todoData.amount || 0).toFixed(2))}
              onChangeText={handleBudgetChange}
              keyboardType="decimal-pad"
            />
          </View>

          <Pressable onPress={handleToggleDone} style={styles.purchasedRow}>
            <View
              style={[
                styles.checkboxInner,
                Boolean(todoData.done) && styles.checkboxChecked,
              ]}
            >
              {Boolean(todoData.done) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.purchasedText}>Gift Purchased</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});
BirthdayItem.displayName = "BirthdayItem";

export default function BirthdayTracker({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("");
  const store = useStore();
  const listData = useRow("lists", listId);
  const birthdayIds = useLocalRowIds("todoList", listId) || [];

  const { incompleteBirthdayIds, sortedBirthdayIds } = useMemo(() => {
    const incomplete: string[] = [];
    const complete: string[] = [];

    birthdayIds.forEach((id) => {
      const todo = store?.getRow("todos", id);
      if (todo && todo.date) {
        complete.push(id);
      } else {
        incomplete.push(id);
      }
    });

    const sorted = complete.sort((a, b) => {
      const dateA = parse(
        String(store?.getCell("todos", a, "date")),
        "yyyy-MM-dd",
        new Date()
      );
      const dateB = parse(
        String(store?.getCell("todos", b, "date")),
        "yyyy-MM-dd",
        new Date()
      );
      const today = new Date();
      const nextA = isFuture(setYear(dateA, today.getFullYear()))
        ? setYear(dateA, today.getFullYear())
        : setYear(dateA, today.getFullYear() + 1);
      const nextB = isFuture(setYear(dateB, today.getFullYear()))
        ? setYear(dateB, today.getFullYear())
        : setYear(dateB, today.getFullYear() + 1);
      return compareAsc(nextA, nextB);
    });

    return { incompleteBirthdayIds: incomplete, sortedBirthdayIds: sorted };
  }, [birthdayIds, store]);

  const addBirthday = useAddRowCallback(
    "todos",
    (params: any) => ({
      list: listId,
      text: params.name,
      date: params.birthDate,
      emoji: "🎂",
      notes: "",
      amount: 0,
      done: false,
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewName("");
        setNewBirthDate("");
      }
    }
  );

  const handleAdd = useCallback(() => {
    if (newName.trim() && newBirthDate) {
      addBirthday({ name: newName, birthDate: newBirthDate });
    }
  }, [addBirthday, newName, newBirthDate]);

  const progressLabel = useMemo(() => {
    if (birthdayIds.length === 0) return "Add your first birthday! 🎂";
    if (birthdayIds.length < 5) return "A few dates to remember 📅";
    return "Birthday calendar pro! 🎁";
  }, [birthdayIds.length]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.listTitle}>
              {String(listData?.name || "Birthday Tracker")}
            </Text>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {sortedBirthdayIds.length} Birthdays
            </Text>
          </View>
        </View>

        {/* Add Form */}
        <View style={styles.addRow}>
          <TextInput
            style={[styles.addInput, { flex: 1 }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="Name"
            placeholderTextColor="#A0AEC0"
          />
          <TextInput
            style={[styles.addInput, { flex: 1 }]}
            value={newBirthDate}
            onChangeText={setNewBirthDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#A0AEC0"
          />
          <Pressable onPress={handleAdd} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {/* Items */}
        {incompleteBirthdayIds.map((id) => (
          <BirthdayItem key={id} id={id} />
        ))}
        {sortedBirthdayIds.map((id) => (
          <BirthdayItem key={id} id={id} />
        ))}

        {/* Empty State */}
        {birthdayIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎂</Text>
            <Text style={styles.emptyTitle}>No birthdays tracked yet!</Text>
            <Text style={styles.emptySubtitle}>
              Add someone special and never miss a birthday again
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FEEBC8" },
  content: { padding: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  listTitle: { fontSize: 24, fontWeight: "bold", color: "#744210" },
  progressLabel: { fontSize: 12, color: "#975A16", fontStyle: "italic", marginTop: 2 },
  countBadge: {
    backgroundColor: "#BEE3F8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countBadgeText: { fontSize: 14, fontWeight: "600", color: "#2B6CB0" },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  addInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#2D3748",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  addButton: {
    backgroundColor: "#3182CE",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  warningCard: {
    backgroundColor: "#FEFCBF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  warningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  warningText: { color: "#975A16", fontSize: 14, flex: 1 },
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  emoji: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "bold", color: "#2D3748" },
  itemDate: { fontSize: 12, color: "#718096", marginTop: 2 },
  daysBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  daysBadgeUrgent: { backgroundColor: "#FED7D7" },
  daysBadgeNormal: { backgroundColor: "#C6F6D5" },
  daysBadgeText: { fontSize: 12, fontWeight: "600" },
  daysBadgeTextUrgent: { color: "#C53030" },
  daysBadgeTextNormal: { color: "#276749" },
  iconBtn: { padding: 6 },
  detailsSection: { backgroundColor: "#F7FAFC", padding: 12, gap: 10 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { fontSize: 14, fontWeight: "500", color: "#4A5568" },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "#2D3748",
    minHeight: 50,
    textAlignVertical: "top",
  },
  budgetInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: "#2D3748",
    width: 100,
  },
  purchasedRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#3182CE", borderColor: "#3182CE" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  purchasedText: { fontSize: 14, color: "#4A5568" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#744210" },
  emptySubtitle: {
    fontSize: 14,
    color: "#975A16",
    textAlign: "center",
    maxWidth: 280,
  },
});

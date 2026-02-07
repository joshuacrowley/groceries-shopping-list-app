import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Gift, CaretDown, CaretRight } from "phosphor-react-native";

const BirthdayItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;

  const isDone = Boolean(itemData.done);
  const dateStr = String(itemData.date || "");
  const emoji = String(itemData.emoji || "🎂");

  // Calculate days until birthday
  const daysUntil = useMemo(() => {
    if (!dateStr) return null;
    try {
      const parts = dateStr.split("-");
      if (parts.length < 3) return null;
      const birthMonth = parseInt(parts[1], 10) - 1;
      const birthDay = parseInt(parts[2], 10);
      const today = new Date();
      let nextBday = new Date(today.getFullYear(), birthMonth, birthDay);
      if (nextBday < today) {
        nextBday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
      }
      return Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }, [dateStr]);

  const age = useMemo(() => {
    if (!dateStr) return null;
    try {
      const birth = new Date(dateStr);
      const today = new Date();
      let a = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
      return a;
    } catch {
      return null;
    }
  }, [dateStr]);

  const badgeColor = daysUntil !== null && daysUntil <= 30 ? "#E53E3E" : "#38A169";

  return (
    <View style={[styles.item, { opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: "#ED8936", borderColor: "#ED8936" }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>
          {String(itemData.text || "")}{age !== null ? `'s ${age + 1}th Birthday` : ""}
        </Text>
        {dateStr ? <Text style={styles.itemDate}>{dateStr}</Text> : null}
        {itemData.notes ? <Text style={styles.itemNotes} numberOfLines={1}>{String(itemData.notes)}</Text> : null}
      </View>
      {daysUntil !== null && (
        <View style={[styles.badge, { backgroundColor: badgeColor + "20" }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{daysUntil}d</Text>
        </View>
      )}
      <Pressable onPress={() => Alert.alert("Delete", "Remove this birthday?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function BirthdayTracker({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const sortedIds = useMemo(() => {
    return [...todoIds].sort((a, b) => {
      const dateA = String(store?.getCell("todos", a, "date") || "");
      const dateB = String(store?.getCell("todos", b, "date") || "");
      if (!dateA) return 1;
      if (!dateB) return -1;
      const today = new Date();
      const getNext = (d: string) => {
        try {
          const parts = d.split("-");
          const m = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          let next = new Date(today.getFullYear(), m, day);
          if (next < today) next = new Date(today.getFullYear() + 1, m, day);
          return next.getTime();
        } catch {
          return Infinity;
        }
      };
      return getNext(dateA) - getNext(dateB);
    });
  }, [todoIds, store]);

  const addBirthday = useAddRowCallback(
    "todos",
    (data: any) => ({ text: data.text?.trim() || "", date: data.date || "", emoji: "🎂", notes: "", amount: 0, done: false, list: listId }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newName.trim() && newDate.trim()) {
      addBirthday({ text: newName.trim(), date: newDate.trim() });
      setNewName("");
      setNewDate("");
    }
  }, [newName, newDate, addBirthday]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Gift size={32} color="#C05621" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "Birthday Tracker")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Add your first birthday! 🎂" : `${todoIds.length} birthdays tracked`}
              </Text>
            </View>
          </View>
          <View style={[styles.countBadge, { backgroundColor: "#ED893630" }]}>
            <Text style={{ color: "#C05621", fontWeight: "600", fontSize: 13 }}>{todoIds.length}</Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <TextInput style={styles.addInput} placeholder="Name" value={newName} onChangeText={setNewName} placeholderTextColor="#A0AEC0" returnKeyType="next" />
          <TextInput style={styles.addInput} placeholder="Date (YYYY-MM-DD)" value={newDate} onChangeText={setNewDate} placeholderTextColor="#A0AEC0" returnKeyType="done" onSubmitEditing={handleAdd} />
          <Pressable onPress={handleAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>Add Birthday</Text>
          </Pressable>
        </View>

        {sortedIds.map((id) => (
          <BirthdayItem key={id} id={id} />
        ))}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎂</Text>
            <Text style={styles.emptyTitle}>No birthdays tracked yet!</Text>
            <Text style={styles.emptySubtitle}>Add someone special and never miss a birthday again</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FEEBC8" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#C05621" },
  subtitle: { fontSize: 12, color: "#DD6B20", fontStyle: "italic" },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#ED8936", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  addBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, marginBottom: 6, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 18 },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemDate: { fontSize: 11, color: "#718096", marginTop: 2 },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#C05621" },
  emptySubtitle: { fontSize: 14, color: "#DD6B20", textAlign: "center", maxWidth: 280 },
});

import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, CaretDown, CaretRight, GraduationCap } from "phosphor-react-native";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PICKUP_TYPES: Record<string, string> = { A: "Drop Off", B: "Pick Up", C: "Both", D: "None", E: "Special" };
const TYPE_COLORS: Record<string, string> = { A: "#3182CE", B: "#38A169", C: "#805AD5", D: "#718096", E: "#DD6B20" };

const ScheduleItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const pickupType = PICKUP_TYPES[String(itemData.type)] || "Both";
  const typeColor = TYPE_COLORS[String(itemData.type)] || "#805AD5";

  return (
    <View style={[styles.item, { borderLeftColor: typeColor, opacity: isDone ? 0.55 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: typeColor, borderColor: typeColor }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        {itemData.time ? <Text style={styles.itemTime}>🕐 {String(itemData.time)}</Text> : null}
        {itemData.notes ? <Text style={styles.itemNotes} numberOfLines={1}>{String(itemData.notes)}</Text> : null}
      </View>
      <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
        <Text style={[styles.typeBadgeText, { color: typeColor }]}>{pickupType}</Text>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function SchoolPickupRoster({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const dayGroups = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    DAYS.forEach((d) => { grouped[d] = []; });
    todoIds.forEach((id) => {
      const day = String(store?.getCell("todos", id, "date") || "Monday");
      if (grouped[day]) grouped[day].push(id);
    });
    return grouped;
  }, [todoIds, store]);

  const addItem = useAddRowCallback("todos", (data: any) => ({ text: data.text?.trim() || "", date: selectedDay, type: "C", time: "", notes: "", done: false, list: listId }), [listId, selectedDay]);

  const handleAdd = useCallback(() => { if (newName.trim()) { addItem({ text: newName.trim() }); setNewName(""); } }, [newName, addItem]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <GraduationCap size={28} color="#276749" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "Pickup Roster")}</Text>
              <Text style={styles.subtitle}>School run schedule</Text>
            </View>
          </View>
        </View>

        <View style={styles.addSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dayRow}>{DAYS.map((day) => (
              <Pressable key={day} onPress={() => setSelectedDay(day)} style={[styles.dayChip, selectedDay === day && styles.dayChipSelected]}>
                <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextSelected]}>{day.substring(0, 3)}</Text>
              </Pressable>
            ))}</View>
          </ScrollView>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add person..." value={newName} onChangeText={setNewName} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {DAYS.map((day) => {
          const items = dayGroups[day] || [];
          if (items.length === 0) return null;
          return (
            <View key={day} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day}</Text>
                <Text style={styles.dayCount}>{items.length}</Text>
              </View>
              {items.map((id) => <ScheduleItem key={id} id={id} />)}
            </View>
          );
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎓</Text>
            <Text style={styles.emptyTitle}>No pickup schedule yet</Text>
            <Text style={styles.emptySubtitle}>Add drop-off and pick-up schedules for each day</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FFF4" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#276749" },
  subtitle: { fontSize: 12, color: "#38A169", fontStyle: "italic" },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  dayRow: { flexDirection: "row", gap: 6 },
  dayChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#F0FFF4", borderWidth: 1, borderColor: "#C6F6D5" },
  dayChipSelected: { backgroundColor: "#9AE6B4", borderColor: "#38A169" },
  dayChipText: { fontSize: 13, color: "#4A5568" },
  dayChipTextSelected: { color: "#276749", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#C6F6D5", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#38A169", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  daySection: { marginBottom: 12 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, borderLeftWidth: 4, borderLeftColor: "#C6F6D5", paddingLeft: 8 },
  dayTitle: { fontSize: 16, fontWeight: "bold", color: "#276749" },
  dayCount: { fontSize: 12, color: "#38A169", backgroundColor: "#C6F6D530", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 4, gap: 8 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemTime: { fontSize: 11, color: "#38A169", marginTop: 2 },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2, fontStyle: "italic" },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#276749" },
  emptySubtitle: { fontSize: 14, color: "#38A169", textAlign: "center", maxWidth: 280 },
});

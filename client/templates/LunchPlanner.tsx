import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus } from "phosphor-react-native";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MEAL_TYPES: Record<string, string> = { A: "Main", B: "Snack", C: "Fruit", D: "Drink", E: "Tuck Shop" };
const MEAL_COLORS: Record<string, string> = { A: "#3182CE", B: "#DD6B20", C: "#38A169", D: "#805AD5", E: "#D53F8C" };

const LunchItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const mealType = MEAL_TYPES[String(itemData.type)] || "Main";
  const mealColor = MEAL_COLORS[String(itemData.type)] || "#3182CE";

  return (
    <View style={[styles.lunchItem, { opacity: isDone ? 0.6 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: mealColor, borderColor: mealColor }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <Text style={{ fontSize: 18 }}>{String(itemData.emoji || "🥪")}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.lunchItemText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        <View style={[styles.mealBadge, { backgroundColor: mealColor + "20" }]}>
          <Text style={[styles.mealBadgeText, { color: mealColor }]}>{mealType}</Text>
        </View>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}>
        <Trash size={14} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function LunchPlanner({ listId }: { listId: string }) {
  const [newItem, setNewItem] = useState("");
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({ text: data.text?.trim() || "", emoji: "🥪", type: "A", category: "Child", date: selectedDay, notes: "", amount: 0, done: false, list: listId }),
    [listId, selectedDay]
  );

  const handleAdd = useCallback(() => { if (newItem.trim()) { addItem({ text: newItem.trim() }); setNewItem(""); } }, [newItem, addItem]);

  const dayItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    DAYS.forEach((d) => { grouped[d] = []; });
    todoIds.forEach((id) => {
      const day = String(store?.getCell("todos", id, "date") || "");
      if (grouped[day]) grouped[day].push(id);
    });
    return grouped;
  }, [todoIds, store]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={{ fontSize: 28 }}>🍱</Text>
            <View>
              <Text style={styles.title}>{String(listData?.name || "Lunch Box Planner")}</Text>
              <Text style={styles.subtitle}>Pack with love 🍱</Text>
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
            <TextInput style={styles.addInput} placeholder="Add lunch item..." value={newItem} onChangeText={setNewItem} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {DAYS.map((day) => {
          const items = dayItems[day] || [];
          return (
            <View key={day} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day}</Text>
                <Text style={styles.dayCount}>{items.length} items</Text>
              </View>
              {items.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.dayItemsRow}>
                    {items.map((id) => <LunchItem key={id} id={id} />)}
                  </View>
                </ScrollView>
              ) : (
                <Text style={styles.dayEmpty}>No items planned</Text>
              )}
            </View>
          );
        })}
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
  dayCount: { fontSize: 12, color: "#718096" },
  dayItemsRow: { flexDirection: "row", gap: 8 },
  dayEmpty: { fontSize: 13, color: "#A0AEC0", fontStyle: "italic", paddingVertical: 8, paddingLeft: 12 },
  lunchItem: { width: 160, backgroundColor: "#FFF", borderRadius: 8, padding: 10, gap: 6, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  lunchItemText: { fontSize: 13, fontWeight: "600", color: "#2D3748", textAlign: "center" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  mealBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: "center", marginTop: 2 },
  mealBadgeText: { fontSize: 10, fontWeight: "600" },
  checkbox: {},
  checkboxBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 11, fontWeight: "bold" },
});

import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Backpack, Trash, Plus } from "phosphor-react-native";

const STEPS = [
  { name: "Arrive Home", emoji: "🏠", order: 1 },
  { name: "Snack Time", emoji: "🍎", order: 2 },
  { name: "Homework", emoji: "📚", order: 3 },
  { name: "Free Time", emoji: "🎮", order: 4 },
  { name: "Activities", emoji: "⚽", order: 5 },
  { name: "Dinner Prep", emoji: "🍽️", order: 6 },
  { name: "Bath & Wind Down", emoji: "🛁", order: 7 },
  { name: "Bedtime", emoji: "🌙", order: 8 },
];

const RoutineItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const step = STEPS.find((s) => s.name === String(itemData.category)) || { name: String(itemData.category || "Other"), emoji: "📋" };

  return (
    <View style={[styles.item, isDone && styles.itemDone]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && styles.checkboxChecked]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <Text style={styles.itemEmoji}>{step.emoji}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strikethrough]}>{String(itemData.text)}</Text>
        {itemData.notes ? <Text style={styles.itemNotes} numberOfLines={1}>{String(itemData.notes)}</Text> : null}
      </View>
      <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{step.name}</Text></View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove this task?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function AfterSchoolRoutine({ listId }: { listId: string }) {
  const [newTask, setNewTask] = useState("");
  const [selectedStep, setSelectedStep] = useState(STEPS[0].name);
  const store = useStore();
  const listData = useRow("lists", listId);
  const todoIds = useLocalRowIds("todoList", listId) || [];

  const { stepGroups, doneCount } = useMemo(() => {
    const groups: Record<string, string[]> = {};
    let done = 0;
    todoIds.forEach((id) => {
      const cat = String(store?.getCell("todos", id, "category") || "Other");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(id);
      if (store?.getCell("todos", id, "done")) done++;
    });
    return { stepGroups: groups, doneCount: done };
  }, [todoIds, store]);

  const sortedSteps = useMemo(() => STEPS.filter((s) => stepGroups[s.name]?.length > 0).sort((a, b) => a.order - b.order), [stepGroups]);
  const progressPct = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const addTodo = useAddRowCallback("todos", (text: string) => ({ list: listId, text: text.trim(), done: false, category: selectedStep, notes: "", type: "A" }), [listId, selectedStep]);

  const handleAdd = useCallback(() => { if (newTask.trim()) { addTodo(newTask); setNewTask(""); } }, [addTodo, newTask]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Backpack size={28} color="#C05621" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "After-School Routine")}</Text>
              <Text style={styles.subtitle}>{progressPct === 100 ? "All done for today!" : progressPct >= 50 ? "More than halfway there!" : "Let's get going!"}</Text>
            </View>
          </View>
          {todoIds.length > 0 && <View style={styles.progressBadge}><Text style={styles.progressBadgeText}>{doneCount}/{todoIds.length}</Text></View>}
        </View>

        {todoIds.length > 0 && (
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
        )}

        <View style={styles.addSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.stepSelector}>
              {STEPS.map((s) => (
                <Pressable key={s.name} onPress={() => setSelectedStep(s.name)} style={[styles.stepChip, selectedStep === s.name && styles.stepChipSelected]}>
                  <Text style={[styles.stepChipText, selectedStep === s.name && styles.stepChipTextSelected]}>{s.emoji} {s.name}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add a routine step..." value={newTask} onChangeText={setNewTask} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {sortedSteps.map((step, idx) => (
          <View key={step.name} style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{idx + 1}</Text></View>
              <Text style={styles.stepTitle}>{step.emoji} {step.name}</Text>
            </View>
            <View style={styles.stepItems}>
              {stepGroups[step.name]?.map((id) => <RoutineItem key={id} id={id} />)}
            </View>
          </View>
        ))}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎒</Text>
            <Text style={styles.emptyTitle}>No routine set up yet!</Text>
            <Text style={styles.emptySubtitle}>Build an after-school routine with steps like snack time, homework, and free time</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFAF0" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 20, fontWeight: "bold", color: "#C05621" },
  subtitle: { fontSize: 12, color: "#718096", fontStyle: "italic" },
  progressBadge: { backgroundColor: "#FEEBC8", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  progressBadgeText: { fontSize: 13, fontWeight: "600", color: "#C05621" },
  progressBarTrack: { height: 6, backgroundColor: "#EDF2F7", borderRadius: 3, marginBottom: 16, overflow: "hidden" },
  progressBarFill: { height: "100%", backgroundColor: "#ED8936", borderRadius: 3 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, gap: 10 },
  stepSelector: { flexDirection: "row", gap: 6 },
  stepChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7", borderWidth: 1, borderColor: "#E2E8F0" },
  stepChipSelected: { backgroundColor: "#FEEBC8", borderColor: "#ED8936" },
  stepChipText: { fontSize: 12, color: "#4A5568" },
  stepChipTextSelected: { color: "#C05621", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#ED8936", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  stepSection: { marginBottom: 16 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#FEEBC8", alignItems: "center", justifyContent: "center" },
  stepNumberText: { fontSize: 12, fontWeight: "bold", color: "#C05621" },
  stepTitle: { fontSize: 14, fontWeight: "bold", color: "#C05621" },
  stepItems: { gap: 4, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#FEEBC8" },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  itemDone: { opacity: 0.7, backgroundColor: "#FFFAF0" },
  checkbox: { marginRight: 2 },
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#ED8936", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#ED8936" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  itemEmoji: { fontSize: 18 },
  itemContent: { flex: 1 },
  itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  itemNotes: { fontSize: 11, color: "#718096", marginTop: 2 },
  stepBadge: { backgroundColor: "#FEEBC8", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  stepBadgeText: { fontSize: 10, fontWeight: "600", color: "#C05621" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#C05621" },
  emptySubtitle: { fontSize: 14, color: "#718096", textAlign: "center", maxWidth: 280 },
});

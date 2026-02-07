import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, SunHorizon } from "phosphor-react-native";

const PHASES = [
  { name: "Wake Up", emoji: "⏰", order: 1 },
  { name: "Hygiene", emoji: "🪥", order: 2 },
  { name: "Get Dressed", emoji: "👔", order: 3 },
  { name: "Breakfast", emoji: "🥣", order: 4 },
  { name: "Prep & Pack", emoji: "🎒", order: 5 },
  { name: "Quick Tidy", emoji: "🧹", order: 6 },
  { name: "Out the Door", emoji: "🚪", order: 7 },
];

const RoutineItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);

  return (
    <View style={[styles.routineItem, { backgroundColor: isDone ? "#FFFFF0" : "#FFF", borderColor: isDone ? "#ECC94B50" : "#F7FAFC", opacity: isDone ? 0.7 : 1 }]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)} style={styles.checkbox}>
        <View style={[styles.checkboxBox, isDone && { backgroundColor: "#ECC94B", borderColor: "#ECC94B" }]}>
          {isDone ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.routineText, isDone && styles.strikethrough]}>{String(itemData.text || "")}</Text>
        {itemData.time ? <Text style={styles.timeText}>⏰ {String(itemData.time)}</Text> : null}
        {itemData.notes ? <Text style={styles.noteText} numberOfLines={1}>{String(itemData.notes)}</Text> : null}
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function MorningRoutine({ listId }: { listId: string }) {
  const [newTask, setNewTask] = useState("");
  const [selectedPhase, setSelectedPhase] = useState(PHASES[0].name);
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const doneCount = useMemo(() => todoIds.filter((id) => Boolean(store?.getCell("todos", id, "done"))).length, [todoIds, store]);
  const progress = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const phaseGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const cat = String(store?.getCell("todos", id, "category") || "Other");
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(id);
    });
    return groups;
  }, [todoIds, store]);

  const sortedPhases = useMemo(() => PHASES.filter((p) => phaseGroups[p.name]?.length > 0).sort((a, b) => a.order - b.order), [phaseGroups]);

  const addTodo = useAddRowCallback("todos", (data: any) => ({ list: listId, text: data.text?.trim() || "", notes: "", done: false, category: selectedPhase, emoji: "", date: "", time: "", type: "A" }), [listId, selectedPhase]);

  const handleAdd = useCallback(() => { if (newTask.trim()) { addTodo({ text: newTask.trim() }); setNewTask(""); } }, [newTask, addTodo]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SunHorizon size={28} color="#C05621" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "Morning Routine")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Build your morning flow" : progress === 100 ? "Ready to go! ☀️" : progress >= 50 ? "Halfway there!" : "Rise and shine!"}
              </Text>
            </View>
          </View>
          {todoIds.length > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{progress === 100 ? "Done! ☀️" : `${doneCount}/${todoIds.length}`}</Text>
            </View>
          )}
        </View>

        {todoIds.length > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
          </View>
        )}

        <View style={styles.addSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.phaseRow}>{PHASES.map((p) => (
              <Pressable key={p.name} onPress={() => setSelectedPhase(p.name)} style={[styles.phaseChip, selectedPhase === p.name && styles.phaseChipSelected]}>
                <Text style={[styles.phaseChipText, selectedPhase === p.name && styles.phaseChipTextSelected]}>{p.emoji} {p.name}</Text>
              </Pressable>
            ))}</View>
          </ScrollView>
          <View style={styles.addRow}>
            <TextInput style={styles.addInput} placeholder="Add a step..." value={newTask} onChangeText={setNewTask} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" />
            <Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable>
          </View>
        </View>

        {sortedPhases.map((phase, idx) => {
          const phaseItems = phaseGroups[phase.name] || [];
          const phaseDone = phaseItems.filter((id) => Boolean(store?.getCell("todos", id, "done"))).length;
          const allDone = phaseDone === phaseItems.length && phaseItems.length > 0;
          return (
            <View key={phase.name} style={styles.phaseSection}>
              <View style={styles.phaseHeader}>
                <View style={[styles.phaseNum, { backgroundColor: allDone ? "#C6F6D520" : "#FEEBC820" }]}>
                  <Text style={{ fontSize: 10, fontWeight: "bold", color: allDone ? "#38A169" : "#C05621" }}>{allDone ? "✓" : idx + 1}</Text>
                </View>
                <Text style={[styles.phaseName, { color: allDone ? "#38A169" : "#C05621" }]}>{phase.emoji} {phase.name}</Text>
                <View style={[styles.phaseBadge, { borderColor: allDone ? "#38A169" : "#ED8936" }]}>
                  <Text style={{ fontSize: 10, color: allDone ? "#38A169" : "#ED8936" }}>{phaseDone}/{phaseItems.length}</Text>
                </View>
              </View>
              <View style={[styles.phaseItems, { borderLeftColor: allDone ? "#C6F6D5" : "#FEEBC8" }]}>
                {phaseItems.map((id) => <RoutineItem key={id} id={id} />)}
              </View>
            </View>
          );
        })}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌅</Text>
            <Text style={styles.emptyTitle}>No morning routine yet!</Text>
            <Text style={styles.emptySubtitle}>Set up your morning steps from wake up to out the door</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFF0" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: "#C05621" },
  subtitle: { fontSize: 12, color: "#DD6B20" },
  headerBadge: { backgroundColor: "#FEEBC8", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { color: "#C05621", fontWeight: "600", fontSize: 13 },
  progressBar: { height: 6, backgroundColor: "#EDF2F7", borderRadius: 3, overflow: "hidden", marginBottom: 16 },
  progressFill: { height: "100%", backgroundColor: "#ED8936", borderRadius: 3 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  phaseRow: { flexDirection: "row", gap: 6 },
  phaseChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#FFFFF0", borderWidth: 1, borderColor: "#FEEBC8" },
  phaseChipSelected: { backgroundColor: "#FEEBC8", borderColor: "#ED8936" },
  phaseChipText: { fontSize: 11, color: "#4A5568" },
  phaseChipTextSelected: { color: "#C05621", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { flex: 1, borderWidth: 1, borderColor: "#FEEBC8", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#ED8936", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  phaseSection: { marginBottom: 12 },
  phaseHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  phaseNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  phaseName: { fontSize: 14, fontWeight: "bold" },
  phaseBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  phaseItems: { borderLeftWidth: 2, paddingLeft: 12, gap: 6 },
  routineItem: { flexDirection: "row", alignItems: "center", borderRadius: 8, padding: 10, gap: 10, borderWidth: 1 },
  checkbox: {},
  checkboxBox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#ECC94B", alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  routineText: { fontSize: 14, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  timeText: { fontSize: 11, color: "#A0AEC0", marginTop: 2 },
  noteText: { fontSize: 11, color: "#A0AEC0", marginTop: 1 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#C05621" },
  emptySubtitle: { fontSize: 14, color: "#DD6B20", textAlign: "center", maxWidth: 280 },
});

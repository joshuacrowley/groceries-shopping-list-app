import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, SunHorizon } from "phosphor-react-native";

const STEPS = [
  { name: "Wake Up", emoji: "⏰", order: 1 },
  { name: "Hygiene", emoji: "🪥", order: 2 },
  { name: "Get Dressed", emoji: "👕", order: 3 },
  { name: "Breakfast", emoji: "🥣", order: 4 },
  { name: "Prep", emoji: "🎒", order: 5 },
  { name: "Out the Door", emoji: "🚪", order: 6 },
];

const RoutineItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;
  const isDone = Boolean(itemData.done);
  const step = STEPS.find((s) => s.name === String(itemData.category)) || { name: "Other", emoji: "📋" };
  return (
    <View style={[styles.item, isDone && styles.itemDone]}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !isDone)}><View style={[styles.cbox, isDone && styles.cboxDone]}>{isDone ? <Text style={styles.chk}>✓</Text> : null}</View></Pressable>
      <Text style={styles.emoji}>{step.emoji}</Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, isDone && styles.strike]}>{String(itemData.text)}</Text>
        {itemData.time ? <Text style={styles.timeText}>{String(itemData.time)}</Text> : null}
      </View>
      <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{step.name}</Text></View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])}><Trash size={16} color="#E53E3E" /></Pressable>
    </View>
  );
});

export default function MorningRoutine({ listId }: { listId: string }) {
  const [newTask, setNewTask] = useState("");
  const [selectedStep, setSelectedStep] = useState(STEPS[0].name);
  const store = useStore();
  const listData = useRow("lists", listId);
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const { stepGroups, doneCount } = useMemo(() => { const groups: Record<string, string[]> = {}; let done = 0; todoIds.forEach((id) => { const cat = String(store?.getCell("todos", id, "category") || "Other"); if (!groups[cat]) groups[cat] = []; groups[cat].push(id); if (store?.getCell("todos", id, "done")) done++; }); return { stepGroups: groups, doneCount: done }; }, [todoIds, store]);
  const sortedSteps = useMemo(() => STEPS.filter((s) => stepGroups[s.name]?.length > 0).sort((a, b) => a.order - b.order), [stepGroups]);
  const progressPct = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;
  const addTodo = useAddRowCallback("todos", (text: string) => ({ list: listId, text: text.trim(), done: false, category: selectedStep, type: "A" }), [listId, selectedStep]);
  const handleAdd = useCallback(() => { if (newTask.trim()) { addTodo(newTask); setNewTask(""); } }, [addTodo, newTask]);

  return (
    <ScrollView style={styles.container}><View style={styles.content}>
      <View style={styles.header}><SunHorizon size={28} color="#ECC94B" weight="fill" /><View><Text style={styles.title}>{String(listData?.name || "Morning Routine")}</Text><Text style={styles.subtitle}>{progressPct === 100 ? "Ready to go!" : `${progressPct}% done`}</Text></View>{todoIds.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{doneCount}/{todoIds.length}</Text></View>}</View>
      {todoIds.length > 0 && <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progressPct}%` }]} /></View>}
      <View style={styles.addSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.stepRow}>{STEPS.map((s) => (<Pressable key={s.name} onPress={() => setSelectedStep(s.name)} style={[styles.stepChip, selectedStep === s.name && styles.stepChipSel]}><Text style={[styles.stepChipText, selectedStep === s.name && styles.stepChipTextSel]}>{s.emoji} {s.name}</Text></Pressable>))}</View></ScrollView>
        <View style={styles.addRow}><TextInput style={styles.addInput} placeholder="Add routine step..." value={newTask} onChangeText={setNewTask} onSubmitEditing={handleAdd} placeholderTextColor="#A0AEC0" returnKeyType="done" /><Pressable onPress={handleAdd} style={styles.addBtn}><Plus size={18} color="#FFF" weight="bold" /></Pressable></View>
      </View>
      {sortedSteps.map((step, idx) => (<View key={step.name} style={styles.stepSection}><View style={styles.stepHeader}><View style={styles.stepNum}><Text style={styles.stepNumText}>{idx + 1}</Text></View><Text style={styles.stepTitle}>{step.emoji} {step.name}</Text></View><View style={styles.stepItems}>{stepGroups[step.name]?.map((id) => <RoutineItem key={id} id={id} />)}</View></View>))}
      {todoIds.length === 0 && <View style={styles.empty}><Text style={styles.emptyE}>🌅</Text><Text style={styles.emptyT}>No morning routine set</Text><Text style={styles.emptyS}>Build your morning routine step by step</Text></View>}
    </View></ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFF0" }, content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }, title: { fontSize: 20, fontWeight: "bold", color: "#975A16" }, subtitle: { fontSize: 12, color: "#D69E2E", fontStyle: "italic" },
  badge: { marginLeft: "auto", backgroundColor: "#FEFCBF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }, badgeText: { fontSize: 13, fontWeight: "600", color: "#975A16" },
  progressTrack: { height: 6, backgroundColor: "#EDF2F7", borderRadius: 3, marginBottom: 16, overflow: "hidden" }, progressFill: { height: "100%", backgroundColor: "#ECC94B", borderRadius: 3 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  stepRow: { flexDirection: "row", gap: 6 }, stepChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7", borderWidth: 1, borderColor: "#E2E8F0" }, stepChipSel: { backgroundColor: "#FEFCBF", borderColor: "#ECC94B" }, stepChipText: { fontSize: 12, color: "#4A5568" }, stepChipTextSel: { color: "#975A16", fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 }, addInput: { flex: 1, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" }, addBtn: { backgroundColor: "#ECC94B", width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  stepSection: { marginBottom: 16 }, stepHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }, stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#FEFCBF", alignItems: "center", justifyContent: "center" }, stepNumText: { fontSize: 12, fontWeight: "bold", color: "#975A16" }, stepTitle: { fontSize: 14, fontWeight: "bold", color: "#975A16" },
  stepItems: { gap: 4, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: "#FEFCBF" },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 10, gap: 8 }, itemDone: { opacity: 0.7, backgroundColor: "#FFFFF0" },
  cbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#ECC94B", alignItems: "center", justifyContent: "center" }, cboxDone: { backgroundColor: "#ECC94B" }, chk: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  emoji: { fontSize: 16 }, itemContent: { flex: 1 }, itemText: { fontSize: 14, fontWeight: "500", color: "#2D3748" }, strike: { textDecorationLine: "line-through", color: "#A0AEC0" }, timeText: { fontSize: 11, color: "#718096", marginTop: 2 },
  stepBadge: { backgroundColor: "#FEFCBF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }, stepBadgeText: { fontSize: 10, fontWeight: "600", color: "#975A16" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 }, emptyE: { fontSize: 48 }, emptyT: { fontSize: 18, fontWeight: "600", color: "#975A16" }, emptyS: { fontSize: 14, color: "#718096", textAlign: "center", maxWidth: 280 },
});

import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Thermometer } from "phosphor-react-native";

const ReadingItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;

  const temp = Number(itemData.number) || 0;
  const dateTime = String(itemData.text || "");
  const isHigh = temp >= 38.0;
  const isFever = temp >= 38.5;

  return (
    <View style={[styles.item, { borderLeftColor: isFever ? "#E53E3E" : isHigh ? "#ED8936" : "#38A169" }]}>
      <Thermometer size={20} color={isFever ? "#E53E3E" : isHigh ? "#ED8936" : "#38A169"} weight="fill" />
      <View style={styles.itemContent}>
        <Text style={[styles.tempText, { color: isFever ? "#E53E3E" : isHigh ? "#ED8936" : "#2D3748" }]}>{temp.toFixed(1)}°C</Text>
        {dateTime ? <Text style={styles.dateText}>{dateTime}</Text> : null}
      </View>
      <View style={[styles.tempBadge, { backgroundColor: isFever ? "#FED7D730" : isHigh ? "#FEEBC830" : "#C6F6D530" }]}>
        <Text style={[styles.tempBadgeText, { color: isFever ? "#E53E3E" : isHigh ? "#DD6B20" : "#38A169" }]}>
          {isFever ? "Fever" : isHigh ? "Elevated" : "Normal"}
        </Text>
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove this reading?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function ChildTemperatureTracker({ listId }: { listId: string }) {
  const [newTemp, setNewTemp] = useState("37.0");
  const [newDateTime, setNewDateTime] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const averageTemp = useMemo(() => {
    if (todoIds.length === 0) return 0;
    let sum = 0;
    todoIds.forEach((id) => { sum += Number(store?.getCell("todos", id, "number")) || 0; });
    return sum / todoIds.length;
  }, [todoIds, store]);

  const addReading = useAddRowCallback(
    "todos",
    () => ({ number: parseFloat(newTemp) || 37.0, text: newDateTime, list: listId, done: false }),
    [listId, newTemp, newDateTime]
  );

  const handleAdd = useCallback(() => {
    if (newDateTime.trim()) {
      addReading();
      setNewTemp("37.0");
      setNewDateTime("");
    }
  }, [newDateTime, addReading]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Thermometer size={32} color="#E53E3E" weight="fill" />
            <View>
              <Text style={styles.title}>{String(listData?.name || "Temperature Tracker")}</Text>
              <Text style={styles.subtitle}>
                {todoIds.length === 0 ? "Ready to track temps 🌡️" : todoIds.length <= 3 ? "Monitoring... 📊" : "Good tracking! 👍"}
              </Text>
            </View>
          </View>
          <View style={styles.avgBadge}>
            <Text style={styles.avgText}>Avg: {averageTemp.toFixed(1)}°C</Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <View style={styles.addRow}>
            <TextInput style={[styles.addInput, { width: 80 }]} placeholder="°C" value={newTemp} onChangeText={setNewTemp} keyboardType="decimal-pad" placeholderTextColor="#A0AEC0" />
            <TextInput style={[styles.addInput, { flex: 1 }]} placeholder="Date & time" value={newDateTime} onChangeText={setNewDateTime} placeholderTextColor="#A0AEC0" returnKeyType="done" onSubmitEditing={handleAdd} />
            <Pressable onPress={handleAdd} style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
        </View>

        {todoIds.map((id) => (
          <ReadingItem key={id} id={id} />
        ))}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌡️</Text>
            <Text style={styles.emptyTitle}>No temperature readings yet</Text>
            <Text style={styles.emptySubtitle}>Add readings to monitor temperature over time</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5F5" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  title: { fontSize: 24, fontWeight: "bold", color: "#C53030" },
  subtitle: { fontSize: 12, color: "#E53E3E", fontStyle: "italic" },
  avgBadge: { backgroundColor: "#FED7D7", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  avgText: { color: "#C53030", fontWeight: "600", fontSize: 13 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  addInput: { borderWidth: 1, borderColor: "#FED7D7", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#E53E3E", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 8, padding: 12, marginBottom: 6, borderLeftWidth: 4, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  itemContent: { flex: 1 },
  tempText: { fontSize: 18, fontWeight: "bold" },
  dateText: { fontSize: 12, color: "#718096", marginTop: 2 },
  tempBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tempBadgeText: { fontSize: 11, fontWeight: "600" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#C53030" },
  emptySubtitle: { fontSize: 14, color: "#E53E3E", textAlign: "center", maxWidth: 280 },
});

import React, { useState, useCallback, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useStore, useLocalRowIds, useRow, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, Plus, Tree } from "phosphor-react-native";

const ParkCard = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const deleteItem = useDelRowCallback("todos", id);
  if (!itemData) return null;

  return (
    <View style={styles.item}>
      <Text style={styles.emoji}>{String(itemData.emoji || "🌳")}</Text>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{String(itemData.text || "")}</Text>
        {itemData.notes ? <Text style={styles.itemLocation}>📍 {String(itemData.notes)}</Text> : null}
        {itemData.date ? (
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>📅 {String(itemData.date)}</Text>
          </View>
        ) : null}
      </View>
      <Pressable onPress={() => Alert.alert("Delete", "Remove this park?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: deleteItem }])} style={styles.deleteBtn}>
        <Trash size={16} color="#E53E3E" weight="bold" />
      </Pressable>
    </View>
  );
});

export default function ParkLife({ listId }: { listId: string }) {
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addPark = useAddRowCallback(
    "todos",
    (data: any) => ({
      text: data.text?.trim() || "",
      notes: data.notes || "",
      date: new Date().toISOString().split("T")[0],
      list: listId,
      emoji: "🌳",
      done: false,
    }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newName.trim()) {
      addPark({ text: newName.trim(), notes: newLocation.trim() });
      setNewName("");
      setNewLocation("");
    }
  }, [newName, newLocation, addPark]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Tree size={32} color="#276749" weight="fill" />
            <Text style={styles.title}>{String(listData?.name || "Park Life")}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {todoIds.length === 0 ? "Head to the park! 🌳" : todoIds.length <= 3 ? "Packing 🧺" : "Park day! 🌿"}
            </Text>
          </View>
        </View>

        <View style={styles.addSection}>
          <TextInput style={styles.addInput} placeholder="Park name" value={newName} onChangeText={setNewName} placeholderTextColor="#A0AEC0" returnKeyType="next" />
          <TextInput style={styles.addInput} placeholder="Location" value={newLocation} onChangeText={setNewLocation} placeholderTextColor="#A0AEC0" returnKeyType="done" onSubmitEditing={handleAdd} />
          <Pressable onPress={handleAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>Add Park</Text>
          </Pressable>
        </View>

        {todoIds.map((id) => <ParkCard key={id} id={id} />)}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌳</Text>
            <Text style={styles.emptyTitle}>No park items yet</Text>
            <Text style={styles.emptySubtitle}>Add everything you need for a perfect park day</Text>
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 26, fontWeight: "bold", color: "#276749" },
  headerBadge: { backgroundColor: "#C6F6D5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  headerBadgeText: { color: "#276749", fontWeight: "500", fontSize: 11 },
  addSection: { backgroundColor: "#FFF", borderRadius: 12, padding: 12, marginBottom: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  addInput: { borderWidth: 1, borderColor: "#C6F6D5", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  addBtn: { backgroundColor: "#38A169", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  addBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FFF4", borderRadius: 8, padding: 12, marginBottom: 8, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 1, elevation: 1 },
  emoji: { fontSize: 22 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: "bold", color: "#276749" },
  itemLocation: { fontSize: 12, color: "#38A169", marginTop: 2 },
  dateBadge: { backgroundColor: "#C6F6D530", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start", marginTop: 4 },
  dateText: { fontSize: 11, color: "#276749" },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#276749" },
  emptySubtitle: { fontSize: 14, color: "#38A169", textAlign: "center", maxWidth: 280 },
});

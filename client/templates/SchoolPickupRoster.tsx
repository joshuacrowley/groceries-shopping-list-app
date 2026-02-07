import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import {
  useStore,
  useLocalRowIds,
  useRow,
  useDelRowCallback,
  useAddRowCallback,
} from "tinybase/ui-react";
import { Trash, CaretDown, CaretUp } from "phosphor-react-native";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const RosterItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const isDone = Boolean(itemData.done);

  const handleToggle = () => store?.setCell("todos", id, "done", !isDone);
  const handleDelete = () => {
    Alert.alert("Delete", "Remove this entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
    ]);
  };

  return (
    <View style={[styles.itemCard, isDone && styles.itemDone]}>
      <View style={styles.itemRow}>
        <Pressable onPress={handleToggle} style={styles.checkbox}>
          <View style={[styles.checkboxInner, isDone && styles.checkboxChecked]}>
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </Pressable>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemText, isDone && styles.itemTextDone]}>{String(itemData.text || "")}</Text>
          <View style={styles.metaRow}>
            {itemData.category && <Text style={styles.metaText}>📅 {String(itemData.category)}</Text>}
            {itemData.time && <Text style={styles.metaText}>🕐 {String(itemData.time)}</Text>}
            {itemData.email && <Text style={styles.metaText}>👤 {String(itemData.email)}</Text>}
          </View>
        </View>
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
          {expanded ? <CaretUp size={16} color="#805AD5" /> : <CaretDown size={16} color="#805AD5" />}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.iconBtn}>
          <Trash size={16} color="#E53E3E" />
        </Pressable>
      </View>
      {expanded && (
        <View style={styles.detailsSection}>
          <Text style={styles.detailLabel}>Day:</Text>
          <View style={styles.chipRow}>
            {DAYS.map((d) => (
              <Pressable key={d} onPress={() => store?.setCell("todos", id, "category", d)}
                style={[styles.chip, String(itemData.category) === d && styles.chipActive]}>
                <Text style={[styles.chipText, String(itemData.category) === d && styles.chipTextActive]}>{d.slice(0, 3)}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.detailLabel}>Time:</Text>
          <TextInput style={styles.detailInput} value={String(itemData.time || "")}
            onChangeText={(t) => store?.setCell("todos", id, "time", t)} placeholder="3:15 PM" placeholderTextColor="#A0AEC0" />
          <Text style={styles.detailLabel}>Pickup Person:</Text>
          <TextInput style={styles.detailInput} value={String(itemData.email || "")}
            onChangeText={(t) => store?.setCell("todos", id, "email", t)} placeholder="Who's picking up" placeholderTextColor="#A0AEC0" />
          <Text style={styles.detailLabel}>Notes:</Text>
          <TextInput style={[styles.detailInput, { minHeight: 50, textAlignVertical: "top" }]}
            value={String(itemData.notes || "")} onChangeText={(t) => store?.setCell("todos", id, "notes", t)}
            placeholder="Any special instructions" placeholderTextColor="#A0AEC0" multiline />
        </View>
      )}
    </View>
  );
});
RosterItem.displayName = "RosterItem";

export default function SchoolPickupRoster({ listId }: { listId: string }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ text: "", category: "Monday", time: "", email: "", notes: "" });
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addEntry = useAddRowCallback(
    "todos",
    (entry: any) => ({
      text: entry.text.trim(),
      category: entry.category,
      time: entry.time,
      email: entry.email,
      notes: entry.notes,
      list: listId,
      done: false,
    }),
    [listId]
  );

  const handleAddSubmit = () => {
    if (newEntry.text.trim()) {
      addEntry(newEntry);
      setNewEntry({ text: "", category: "Monday", time: "", email: "", notes: "" });
      setShowAddModal(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.listTitle}>{String(listData?.name || "School Pickup Roster")}</Text>
            <Text style={styles.progressLabel}>Keep pickup organized 🎒</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{todoIds.length} entries</Text>
          </View>
        </View>

        <Pressable onPress={() => setShowAddModal(true)} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Pickup Entry</Text>
        </Pressable>

        {todoIds.map((id) => <RosterItem key={id} id={id} />)}

        {todoIds.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎒</Text>
            <Text style={styles.emptyTitle}>No pickup entries yet</Text>
            <Text style={styles.emptySubtitle}>Set up your weekly pickup roster</Text>
          </View>
        )}
      </View>

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Add Pickup Entry</Text>
            <TextInput style={styles.modalInput} value={newEntry.text}
              onChangeText={(t) => setNewEntry({ ...newEntry, text: t })} placeholder="Child's name" placeholderTextColor="#A0AEC0" />
            <View style={styles.chipRow}>
              {DAYS.map((d) => (
                <Pressable key={d} onPress={() => setNewEntry({ ...newEntry, category: d })}
                  style={[styles.chip, newEntry.category === d && styles.chipActive]}>
                  <Text style={[styles.chipText, newEntry.category === d && styles.chipTextActive]}>{d.slice(0, 3)}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={styles.modalInput} value={newEntry.time}
              onChangeText={(t) => setNewEntry({ ...newEntry, time: t })} placeholder="Pickup time" placeholderTextColor="#A0AEC0" />
            <TextInput style={styles.modalInput} value={newEntry.email}
              onChangeText={(t) => setNewEntry({ ...newEntry, email: t })} placeholder="Who's picking up" placeholderTextColor="#A0AEC0" />
            <View style={styles.modalButtons}>
              <Pressable onPress={handleAddSubmit} style={styles.modalSubmit}>
                <Text style={styles.modalSubmitText}>Add</Text>
              </Pressable>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF5FF" },
  content: { padding: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  listTitle: { fontSize: 22, fontWeight: "bold", color: "#553C9A" },
  progressLabel: { fontSize: 12, color: "#805AD5", fontStyle: "italic", marginTop: 2 },
  countBadge: { backgroundColor: "#E9D8FD", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  countBadgeText: { fontSize: 13, fontWeight: "600", color: "#553C9A" },
  addButton: { backgroundColor: "#805AD5", borderRadius: 8, padding: 12, alignItems: "center", marginBottom: 16 },
  addButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  itemCard: { backgroundColor: "#FFFFFF", borderRadius: 8, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  itemDone: { opacity: 0.6 },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  checkbox: { padding: 4 },
  checkboxInner: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#805AD5", borderColor: "#805AD5" },
  checkmark: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  itemInfo: { flex: 1 },
  itemText: { fontSize: 15, fontWeight: "600", color: "#2D3748" },
  itemTextDone: { textDecorationLine: "line-through", color: "#A0AEC0" },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  metaText: { fontSize: 11, color: "#718096" },
  iconBtn: { padding: 4 },
  detailsSection: { backgroundColor: "#FAF5FF", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#E9D8FD" },
  detailLabel: { fontSize: 13, fontWeight: "500", color: "#553C9A" },
  detailInput: { backgroundColor: "#FFFFFF", borderRadius: 6, borderWidth: 1, borderColor: "#E9D8FD", paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7" },
  chipActive: { backgroundColor: "#805AD5" },
  chipText: { fontSize: 12, color: "#4A5568" },
  chipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#553C9A" },
  emptySubtitle: { fontSize: 14, color: "#805AD5", textAlign: "center", maxWidth: 280 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 20, width: 320, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#553C9A" },
  modalInput: { backgroundColor: "#F7FAFC", borderRadius: 8, borderWidth: 1, borderColor: "#E9D8FD", paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#2D3748" },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalSubmit: { flex: 1, backgroundColor: "#805AD5", borderRadius: 8, padding: 12, alignItems: "center" },
  modalSubmitText: { color: "#FFFFFF", fontWeight: "bold" },
  modalCancel: { flex: 1, backgroundColor: "#EDF2F7", borderRadius: 8, padding: 12, alignItems: "center" },
  modalCancelText: { color: "#4A5568", fontWeight: "500" },
});

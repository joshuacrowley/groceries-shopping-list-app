import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet, Modal } from "react-native";
import { useStore, useLocalRowIds, useRow, useSetRowCallback, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, CaretDown, CaretUp, GraduationCap, Student, Car, Clock, MapPin, X } from "phosphor-react-native";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const PICKUP_TYPES: Record<string, string> = {
  A: "Drop Off",
  B: "Pick Up",
  C: "Both",
  D: "None",
  E: "Special",
};

const TYPE_COLORS: Record<string, string> = {
  A: "#3182CE",
  B: "#38A169",
  C: "#805AD5",
  D: "#718096",
  E: "#ED8936",
};

const ScheduleItem = memo(({ id }: { id: string }) => {
  const [expanded, setExpanded] = useState(false);
  const itemData = useRow("todos", id);
  const store = useStore();
  const deleteItem = useDelRowCallback("todos", id);

  if (!itemData) return null;

  const handleDelete = () => {
    Alert.alert("Delete", "Delete this schedule?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteItem },
    ]);
  };

  const handleToggleDone = () => store?.setCell("todos", id, "done", !itemData.done);

  const typeKey = (itemData.type as string) || "A";
  const typeLabel = PICKUP_TYPES[typeKey] || "Drop Off";
  const typeColor = TYPE_COLORS[typeKey] || "#3182CE";

  return (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleInfo}>
          <Student size={22} color="#38A169" />
          <Text style={styles.scheduleName}>{itemData.text as string}</Text>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
          </View>
        </View>
        <View style={styles.scheduleActions}>
          <Pressable onPress={() => setExpanded(!expanded)} style={styles.iconBtn}>
            {expanded ? <CaretUp size={18} color="#718096" /> : <CaretDown size={18} color="#718096" />}
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.iconBtn}>
            <Trash size={18} color="#E53E3E" weight="bold" />
          </Pressable>
        </View>
      </View>
      {expanded && (
        <View style={styles.expandedContent}>
          {itemData.time ? (
            <View style={styles.detailRow}>
              <Clock size={18} color="#718096" />
              <Text style={styles.detailText}>{itemData.time as string}</Text>
            </View>
          ) : null}
          {itemData.streetAddress ? (
            <View style={styles.detailRow}>
              <MapPin size={18} color="#718096" />
              <Text style={styles.detailText}>{itemData.streetAddress as string}</Text>
            </View>
          ) : null}
          <Pressable onPress={handleToggleDone} style={[styles.confirmBtn, itemData.done && styles.confirmedBtn]}>
            <Text style={[styles.confirmBtnText, itemData.done && styles.confirmedBtnText]}>
              {itemData.done ? "✓ Confirmed" : "Tap to confirm"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});
ScheduleItem.displayName = "ScheduleItem";

export default function SchoolPickupRoster({ listId }: { listId: string }) {
  const [selectedDay, setSelectedDay] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ text: "", type: "A", time: "", streetAddress: "" });
  const [showTypePicker, setShowTypePicker] = useState(false);

  const store = useStore();
  const scheduleIds = useLocalRowIds("todoList", listId) || [];

  const addSchedule = useAddRowCallback(
    "todos",
    (data: any) => ({
      text: data.text.trim(),
      type: data.type,
      time: data.time || "",
      streetAddress: data.streetAddress || "",
      category: data.category,
      list: listId,
      done: false,
    }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newSchedule.text.trim()) {
      addSchedule({ ...newSchedule, category: selectedDay });
      setNewSchedule({ text: "", type: "A", time: "", streetAddress: "" });
      setModalVisible(false);
    }
  }, [addSchedule, newSchedule, selectedDay]);

  const handleAddClick = (day: string) => {
    setSelectedDay(day);
    setModalVisible(true);
  };

  const schedulesByDay = useMemo(() => {
    const result: Record<string, string[]> = {};
    DAYS.forEach((day) => {
      result[day] = scheduleIds.filter((id) => {
        const schedule = store?.getRow("todos", id);
        return schedule?.category === day;
      });
    });
    return result;
  }, [scheduleIds, store]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <GraduationCap size={28} color="#276749" weight="fill" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>School Pickup Roster</Text>
          <Text style={styles.subtitle}>
            {scheduleIds.length === 0 ? "Plan pickup duties! 🚗" : `${scheduleIds.length} schedules`}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{scheduleIds.length} schedules</Text>
        </View>
      </View>

      {scheduleIds.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🚗</Text>
          <Text style={styles.emptyTitle}>No pickup roster yet</Text>
          <Text style={styles.emptySubtitle}>Add pickup schedules to stay organized</Text>
        </View>
      )}

      {DAYS.map((day) => (
        <View key={day} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayTitle}>{day}</Text>
            <Pressable onPress={() => handleAddClick(day)} style={styles.dayAddBtn}>
              <Text style={styles.dayAddBtnText}>+ Add Schedule</Text>
            </Pressable>
          </View>
          {schedulesByDay[day]?.length > 0 ? (
            schedulesByDay[day].map((id) => <ScheduleItem key={id} id={id} />)
          ) : (
            <Text style={styles.noScheduleText}>No schedules for {day}</Text>
          )}
        </View>
      ))}

      <View style={{ height: 40 }} />

      {/* Add Schedule Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Schedule for {selectedDay}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={24} color="#718096" />
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>Child's Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newSchedule.text}
              onChangeText={(t) => setNewSchedule({ ...newSchedule, text: t })}
              placeholder="Enter name"
              placeholderTextColor="#A0AEC0"
            />
            <Text style={styles.fieldLabel}>Schedule Type</Text>
            <Pressable onPress={() => setShowTypePicker(!showTypePicker)} style={styles.typeSelector}>
              <Text style={styles.typeSelectorText}>{PICKUP_TYPES[newSchedule.type]}</Text>
              <CaretDown size={16} color="#718096" />
            </Pressable>
            {showTypePicker && (
              <View style={styles.typePickerList}>
                {Object.entries(PICKUP_TYPES).map(([key, value]) => (
                  <Pressable
                    key={key}
                    style={[styles.typeOption, newSchedule.type === key && styles.typeOptionActive]}
                    onPress={() => { setNewSchedule({ ...newSchedule, type: key }); setShowTypePicker(false); }}
                  >
                    <Text style={styles.typeOptionText}>{value}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <Text style={styles.fieldLabel}>Time</Text>
            <TextInput
              style={styles.modalInput}
              value={newSchedule.time}
              onChangeText={(t) => setNewSchedule({ ...newSchedule, time: t })}
              placeholder="e.g., 3:30 PM"
              placeholderTextColor="#A0AEC0"
            />
            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.modalInput}
              value={newSchedule.streetAddress}
              onChangeText={(t) => setNewSchedule({ ...newSchedule, streetAddress: t })}
              placeholder="Enter location"
              placeholderTextColor="#A0AEC0"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={handleAdd} style={styles.modalAddBtn}>
                <Text style={styles.modalAddBtnText}>Add Schedule</Text>
              </Pressable>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FFF4" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: "#276749" },
  subtitle: { fontSize: 13, color: "#38A169" },
  countBadge: { backgroundColor: "#C6F6D5", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countBadgeText: { fontSize: 13, color: "#276749", fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#276749" },
  emptySubtitle: { fontSize: 13, color: "#718096", textAlign: "center", maxWidth: 260, marginTop: 4 },
  dayCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: "#F0FFF4", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#C6F6D5" },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  dayTitle: { fontSize: 17, fontWeight: "bold", color: "#2D3748" },
  dayAddBtn: { backgroundColor: "#38A169", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  dayAddBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  noScheduleText: { fontSize: 13, color: "#A0AEC0", textAlign: "center", paddingVertical: 12 },
  scheduleCard: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: "#C6F6D5" },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scheduleInfo: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  scheduleName: { fontSize: 15, fontWeight: "bold", color: "#2D3748" },
  typeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { fontSize: 11, fontWeight: "600" },
  scheduleActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 4 },
  expandedContent: { marginTop: 10, gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, color: "#4A5568" },
  confirmBtn: { backgroundColor: "#EDF2F7", borderRadius: 8, padding: 10, alignItems: "center" },
  confirmedBtn: { backgroundColor: "#C6F6D5" },
  confirmBtnText: { color: "#718096", fontWeight: "600", fontSize: 13 },
  confirmedBtnText: { color: "#276749" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#2D3748" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#4A5568", marginBottom: 4, marginTop: 8 },
  modalInput: { backgroundColor: "#F7FAFC", borderRadius: 8, padding: 12, fontSize: 14, color: "#2D3748", borderWidth: 1, borderColor: "#E2E8F0" },
  typeSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F7FAFC", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  typeSelectorText: { fontSize: 14, color: "#2D3748" },
  typePickerList: { backgroundColor: "#F7FAFC", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", marginTop: 4 },
  typeOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#EDF2F7" },
  typeOptionActive: { backgroundColor: "#F0FFF4" },
  typeOptionText: { fontSize: 14, color: "#2D3748" },
  modalActions: { gap: 8, marginTop: 16 },
  modalAddBtn: { backgroundColor: "#38A169", borderRadius: 8, padding: 14, alignItems: "center" },
  modalAddBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  modalCancelBtn: { padding: 10, alignItems: "center" },
  modalCancelBtnText: { color: "#718096", fontSize: 14 },
});

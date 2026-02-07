import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
} from "react-native";
import {
  useStore,
  useLocalRowIds,
  useRow,
  useDelRowCallback,
  useAddRowCallback,
} from "tinybase/ui-react";
import {
  Trash,
  CaretDown,
  CaretUp,
  Basketball,
  Users,
  Confetti,
  ShoppingCart,
  Broom,
  Question,
  SunDim,
  SunHorizon,
  Sunglasses,
  Plus,
} from "phosphor-react-native";

const DAYS = ["Saturday", "Sunday"];

const CATEGORIES: Record<string, { name: string; Icon: React.ComponentType<any> }> = {
  A: { name: "Sport", Icon: Basketball },
  B: { name: "Play Date", Icon: Users },
  C: { name: "Party", Icon: Confetti },
  D: { name: "Shopping", Icon: ShoppingCart },
  E: { name: "Chores", Icon: Broom },
  F: { name: "None", Icon: Question },
};

const ActivityItem = memo(({ id }: { id: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activityData = useRow("todos", id);
  const store = useStore();
  const deleteActivity = useDelRowCallback("todos", id);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Activity", "Remove this activity?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteActivity },
    ]);
  }, [deleteActivity]);

  if (!activityData) return null;

  const typeKey = String(activityData.type || "F");
  const cat = CATEGORIES[typeKey] || CATEGORIES.F;
  const CatIcon = cat.Icon;

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityHeader}>
        <CatIcon size={20} color="#553C9A" />
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{String(activityData.text || "")}</Text>
          {activityData.notes ? (
            <Text style={styles.activityNotes} numberOfLines={1}>
              {String(activityData.notes)}
            </Text>
          ) : null}
        </View>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>
            {Number(activityData.number || 0)}:00
          </Text>
        </View>
        <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.actionBtn}>
          {isExpanded ? (
            <CaretUp size={16} color="#718096" />
          ) : (
            <CaretDown size={16} color="#718096" />
          )}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.actionBtn}>
          <Trash size={16} color="#E53E3E" />
        </Pressable>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Day:</Text>
            <View style={styles.optionRow}>
              {DAYS.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => store?.setCell("todos", id, "category", day)}
                  style={[
                    styles.optionChip,
                    String(activityData.category) === day && styles.selectedChip,
                  ]}
                >
                  <Text style={[styles.optionText, String(activityData.category) === day && styles.selectedChipText]}>
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionRow}>
                {Object.entries(CATEGORIES).map(([key, { name }]) => (
                  <Pressable
                    key={key}
                    onPress={() => store?.setCell("todos", id, "type", key)}
                    style={[
                      styles.optionChip,
                      typeKey === key && styles.selectedChip,
                    ]}
                  >
                    <Text style={[styles.optionText, typeKey === key && styles.selectedChipText]}>
                      {name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Time (hour):</Text>
            <TextInput
              style={styles.textInput}
              defaultValue={String(activityData.number || 0)}
              onEndEditing={(e) =>
                store?.setCell("todos", id, "number", parseInt(e.nativeEvent.text, 10) || 0)
              }
              keyboardType="number-pad"
              placeholder="9"
            />
          </View>

          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Notes:</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              defaultValue={String(activityData.notes || "")}
              onEndEditing={(e) => store?.setCell("todos", id, "notes", e.nativeEvent.text)}
              placeholder="Add notes..."
              multiline
            />
          </View>
        </View>
      )}
    </View>
  );
});
ActivityItem.displayName = "ActivityItem";

export default function WeekendPlanner({ listId }: { listId: string }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newActivity, setNewActivity] = useState({
    text: "",
    notes: "",
    type: "F",
    category: "Saturday",
    number: 9,
  });

  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const store = useStore();

  const groupedActivities = useMemo(() => {
    const grouped: Record<string, { Morning: string[]; Afternoon: string[] }> = {};
    DAYS.forEach((day) => (grouped[day] = { Morning: [], Afternoon: [] }));

    todoIds.forEach((id) => {
      const category = String(store?.getCell("todos", id, "category") || "Saturday");
      const day = DAYS.includes(category) ? category : "Saturday";
      const time = Number(store?.getCell("todos", id, "number") || 0);
      const period = time < 12 ? "Morning" : "Afternoon";
      grouped[day][period].push(id);
    });

    // Sort by time within each period
    DAYS.forEach((day) => {
      ["Morning", "Afternoon"].forEach((period) => {
        grouped[day][period as keyof typeof grouped[typeof day]].sort((a, b) => {
          const timeA = Number(store?.getCell("todos", a, "number") || 0);
          const timeB = Number(store?.getCell("todos", b, "number") || 0);
          return timeA - timeB;
        });
      });
    });

    return grouped;
  }, [todoIds, store]);

  const addActivity = useAddRowCallback(
    "todos",
    (activity: any) => ({
      text: activity.text.trim(),
      notes: activity.notes,
      type: activity.type,
      category: activity.category,
      number: activity.number,
      list: listId,
      done: false,
    }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newActivity.text.trim()) {
      addActivity(newActivity);
      setNewActivity({ text: "", notes: "", type: "F", category: "Saturday", number: 9 });
      setModalVisible(false);
    }
  }, [addActivity, newActivity]);

  const progressLabel = useMemo(() => {
    if (todoIds.length === 0) return "Plan your weekend!";
    if (todoIds.length <= 3) return "Weekend taking shape";
    return "Epic weekend planned!";
  }, [todoIds.length]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Sunglasses size={32} color="#553C9A" weight="fill" />
              <View>
                <Text style={styles.title}>
                  {String(listData?.name || "Weekend Planner")}
                </Text>
                <Text style={styles.subtitle}>{progressLabel}</Text>
              </View>
            </View>
            <Pressable onPress={() => setModalVisible(true)} style={styles.addButton}>
              <Plus size={18} color="#FFFFFF" weight="bold" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {todoIds.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🌤️</Text>
              <Text style={styles.emptyTitle}>No weekend plans yet</Text>
              <Text style={styles.emptySubtitle}>
                Add activities to make the most of your 48 hours
              </Text>
            </View>
          )}

          {DAYS.map((day) => (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayTitle}>{day}</Text>

              {(["Morning", "Afternoon"] as const).map((period) => (
                <View key={`${day}-${period}`} style={styles.periodSection}>
                  <View style={styles.periodHeader}>
                    {period === "Morning" ? (
                      <SunDim size={20} color="#553C9A" weight="fill" />
                    ) : (
                      <SunHorizon size={20} color="#553C9A" weight="fill" />
                    )}
                    <Text style={styles.periodTitle}>{period}</Text>
                  </View>
                  <View style={styles.activitiesList}>
                    {(groupedActivities[day]?.[period] || []).map((id) => (
                      <ActivityItem key={id} id={id} />
                    ))}
                    {(groupedActivities[day]?.[period] || []).length === 0 && (
                      <Text style={styles.emptyPeriod}>Nothing planned</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Activity</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder="Activity name"
                value={newActivity.text}
                onChangeText={(text) => setNewActivity({ ...newActivity, text })}
                placeholderTextColor="#A0AEC0"
              />

              <Text style={styles.fieldLabel}>Day:</Text>
              <View style={styles.optionRow}>
                {DAYS.map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => setNewActivity({ ...newActivity, category: day })}
                    style={[styles.optionChip, newActivity.category === day && styles.selectedChip]}
                  >
                    <Text style={[styles.optionText, newActivity.category === day && styles.selectedChipText]}>
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionRow}>
                  {Object.entries(CATEGORIES).map(([key, { name }]) => (
                    <Pressable
                      key={key}
                      onPress={() => setNewActivity({ ...newActivity, type: key })}
                      style={[styles.optionChip, newActivity.type === key && styles.selectedChip]}
                    >
                      <Text style={[styles.optionText, newActivity.type === key && styles.selectedChipText]}>
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Time (hour, 0-23):</Text>
              <TextInput
                style={styles.modalInput}
                value={String(newActivity.number)}
                onChangeText={(text) =>
                  setNewActivity({ ...newActivity, number: parseInt(text, 10) || 0 })
                }
                keyboardType="number-pad"
              />

              <Text style={styles.fieldLabel}>Notes:</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                placeholder="Notes (optional)"
                value={newActivity.notes}
                onChangeText={(notes) => setNewActivity({ ...newActivity, notes })}
                multiline
                placeholderTextColor="#A0AEC0"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable onPress={handleAdd} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Add Activity</Text>
              </Pressable>
              <Pressable onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF5FF" },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#553C9A" },
  subtitle: { fontSize: 12, color: "#805AD5", fontStyle: "italic" },
  addButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#805AD5", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  daySection: { marginBottom: 24 },
  dayTitle: { fontSize: 22, fontWeight: "bold", color: "#553C9A", marginBottom: 12 },
  periodSection: { marginBottom: 16 },
  periodHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  periodTitle: { fontSize: 16, fontWeight: "600", color: "#553C9A" },
  activitiesList: { gap: 6, paddingLeft: 28 },
  activityItem: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  activityHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 15, fontWeight: "600", color: "#553C9A" },
  activityNotes: { fontSize: 12, color: "#805AD5", marginTop: 2 },
  timeBadge: { backgroundColor: "#E9D8FD", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  timeBadgeText: { fontSize: 12, fontWeight: "600", color: "#553C9A" },
  actionBtn: { padding: 4 },
  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E9D8FD", gap: 12 },
  expandedField: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#4A5568", marginTop: 8, marginBottom: 4 },
  optionRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7", borderWidth: 1, borderColor: "#E2E8F0" },
  selectedChip: { backgroundColor: "#E9D8FD", borderColor: "#805AD5" },
  optionText: { fontSize: 12, color: "#4A5568" },
  selectedChipText: { color: "#553C9A", fontWeight: "600" },
  textInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  notesInput: { minHeight: 50, textAlignVertical: "top" },
  emptyPeriod: { fontSize: 13, color: "#A0AEC0", fontStyle: "italic", paddingVertical: 4 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#553C9A" },
  emptySubtitle: { fontSize: 14, color: "#805AD5", textAlign: "center", maxWidth: 280 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, width: "90%", maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#2D3748" },
  closeText: { fontSize: 20, color: "#718096" },
  modalBody: { padding: 20 },
  modalInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: "#2D3748", marginBottom: 8 },
  modalFooter: { flexDirection: "row", justifyContent: "flex-end", padding: 20, borderTopWidth: 1, borderTopColor: "#E2E8F0", gap: 12 },
  submitBtn: { backgroundColor: "#805AD5", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: "#718096", fontSize: 16 },
});

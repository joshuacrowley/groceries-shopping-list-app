import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, StyleSheet, Modal } from "react-native";
import { useStore, useLocalRowIds, useRow, useSetRowCallback, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { Trash, CaretDown, CaretUp, Sun, Plus, MapPin, Eye, EyeSlash, X } from "phosphor-react-native";

const CATEGORIES = [
  { name: "Day Trip", color: "#3182CE", emoji: "📍" },
  { name: "Beach Day", color: "#0BC5EA", emoji: "🏖️" },
  { name: "Home Activity", color: "#805AD5", emoji: "🏠" },
  { name: "Educational", color: "#38A169", emoji: "📚" },
  { name: "Sports & Games", color: "#ED8936", emoji: "⚽" },
  { name: "Social", color: "#ED64A6", emoji: "👥" },
  { name: "Adventure", color: "#E53E3E", emoji: "🏔️" },
  { name: "City Visit", color: "#718096", emoji: "🏙️" },
  { name: "Nature", color: "#319795", emoji: "🌳" },
  { name: "Swimming", color: "#3182CE", emoji: "🏊" },
  { name: "Camping", color: "#38A169", emoji: "⛺" },
  { name: "Special Event", color: "#ECC94B", emoji: "✨" },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

const isToday = (dateStr: string) => new Date(dateStr).toDateString() === new Date().toDateString();

const isTomorrow = (dateStr: string) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(dateStr).toDateString() === tomorrow.toDateString();
};

const isPast = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

const daysDifference = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const ActivityItem = memo(({ id, isNext }: { id: string; isNext: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const activityData = useRow("todos", id);
  const store = useStore();
  const deleteActivity = useDelRowCallback("todos", id);

  if (!activityData) return null;

  const handleToggleDone = () => store?.setCell("todos", id, "done", !activityData.done);
  const handleDelete = () => {
    Alert.alert("Delete", "Delete this activity?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteActivity },
    ]);
  };

  const category = CATEGORIES.find((c) => c.name === activityData.category) || CATEGORIES[0];
  const dateStr = formatDate(activityData.date as string);

  let dateLabel = "";
  if (activityData.date) {
    if (isToday(activityData.date as string)) dateLabel = "Today";
    else if (isTomorrow(activityData.date as string)) dateLabel = "Tomorrow";
    else {
      const daysUntil = daysDifference(activityData.date as string);
      if (daysUntil > 0 && daysUntil <= 7) dateLabel = `In ${daysUntil} days`;
    }
  }

  return (
    <View style={[styles.activityCard, isNext && styles.nextCard, activityData.done && { opacity: 0.6 }]}>
      <View style={styles.activityHeader}>
        <View style={styles.activityInfo}>
          <Text style={{ fontSize: 20 }}>{category.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activityTitle, activityData.done && styles.doneText]}>{activityData.text as string}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.activityDate}>{dateStr}</Text>
              {dateLabel ? (
                <View style={[styles.badge, isNext && styles.nextBadge]}>
                  <Text style={[styles.badgeText, isNext && styles.nextBadgeText]}>{dateLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
        <View style={styles.activityActions}>
          {isNext && (
            <View style={styles.nextUpBadge}>
              <Text style={styles.nextUpText}>Next Up</Text>
            </View>
          )}
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
          {activityData.notes ? (
            <View>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailText}>{activityData.notes as string}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={[styles.badge, { backgroundColor: category.color + "20" }]}>
              <Text style={[styles.badgeText, { color: category.color }]}>{category.name}</Text>
            </View>
            {activityData.done && (
              <View style={[styles.badge, { backgroundColor: "#C6F6D5" }]}>
                <Text style={[styles.badgeText, { color: "#276749" }]}>Completed</Text>
              </View>
            )}
          </View>
          <Pressable onPress={handleToggleDone} style={styles.completeButton}>
            <Text style={styles.completeButtonText}>{activityData.done ? "Mark incomplete" : "Mark as complete"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});
ActivityItem.displayName = "ActivityItem";

export default function SchoolHolidayPlanner({ listId }: { listId: string }) {
  const [showPast, setShowPast] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newActivity, setNewActivity] = useState({ text: "", date: "", category: CATEGORIES[0].name, notes: "" });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const store = useStore();
  const activityIds = useLocalRowIds("todoList", listId) || [];

  const addActivity = useAddRowCallback(
    "todos",
    (data: any) => ({
      text: data.text.trim(),
      date: data.date,
      category: data.category,
      notes: data.notes || "",
      list: listId,
      done: false,
    }),
    [listId]
  );

  const handleAdd = useCallback(() => {
    if (newActivity.text.trim() && newActivity.date) {
      addActivity(newActivity);
      setNewActivity({ text: "", date: "", category: CATEGORIES[0].name, notes: "" });
      setModalVisible(false);
    }
  }, [addActivity, newActivity]);

  const { pastActivities, futureActivities, nextActivityId } = useMemo(() => {
    const past: string[] = [];
    const future: string[] = [];
    let nextId: string | null = null;
    let minDays = Infinity;

    activityIds.forEach((id) => {
      const activity = store?.getRow("todos", id);
      if (activity && activity.date) {
        if (isPast(activity.date as string)) {
          past.push(id);
        } else {
          future.push(id);
          if (!activity.done) {
            const daysUntil = daysDifference(activity.date as string);
            if (daysUntil >= 0 && daysUntil < minDays) {
              minDays = daysUntil;
              nextId = id;
            }
          }
        }
      }
    });

    past.sort((a, b) => {
      const da = store?.getCell("todos", a, "date") as string;
      const db = store?.getCell("todos", b, "date") as string;
      return new Date(db).getTime() - new Date(da).getTime();
    });
    future.sort((a, b) => {
      const da = store?.getCell("todos", a, "date") as string;
      const db = store?.getCell("todos", b, "date") as string;
      return new Date(da).getTime() - new Date(db).getTime();
    });

    return { pastActivities: past, futureActivities: future, nextActivityId: nextId };
  }, [activityIds, store]);

  const selectedCategory = CATEGORIES.find((c) => c.name === newActivity.category) || CATEGORIES[0];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Sun size={28} color="#2A4365" weight="fill" />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>School Holiday Planner</Text>
          <Text style={styles.subtitle}>
            {activityIds.length === 0 ? "Plan those holidays! 🏖️" : `${futureActivities.length} planned`}
          </Text>
        </View>
        <Pressable onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Plus size={20} color="#FFFFFF" weight="bold" />
        </Pressable>
      </View>

      {/* Upcoming Activities */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Activities</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{futureActivities.length} planned</Text>
          </View>
        </View>

        {futureActivities.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>☀️</Text>
            <Text style={styles.emptyTitle}>No activities planned yet!</Text>
            <Text style={styles.emptySubtitle}>Tap + to add some fun holiday activities</Text>
          </View>
        )}

        {futureActivities.map((id) => (
          <ActivityItem key={id} id={id} isNext={id === nextActivityId} />
        ))}
      </View>

      {/* Past Activities */}
      {pastActivities.length > 0 && (
        <View style={styles.section}>
          <Pressable onPress={() => setShowPast(!showPast)} style={styles.pastToggle}>
            {showPast ? <EyeSlash size={18} color="#718096" /> : <Eye size={18} color="#718096" />}
            <Text style={styles.pastToggleText}>
              {showPast ? "Hide" : "Show"} Past Activities ({pastActivities.length})
            </Text>
          </Pressable>
          {showPast && pastActivities.map((id) => <ActivityItem key={id} id={id} isNext={false} />)}
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* Add Activity Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Holiday Activity</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={24} color="#718096" />
              </Pressable>
            </View>
            <TextInput
              style={styles.modalInput}
              value={newActivity.text}
              onChangeText={(t) => setNewActivity({ ...newActivity, text: t })}
              placeholder="Activity name (e.g., Trip to the Zoo)"
              placeholderTextColor="#A0AEC0"
            />
            <TextInput
              style={styles.modalInput}
              value={newActivity.date}
              onChangeText={(t) => setNewActivity({ ...newActivity, date: t })}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#A0AEC0"
            />
            <Pressable onPress={() => setShowCategoryPicker(!showCategoryPicker)} style={styles.categorySelector}>
              <Text style={styles.categorySelectorText}>{selectedCategory.emoji} {selectedCategory.name}</Text>
              <CaretDown size={16} color="#718096" />
            </Pressable>
            {showCategoryPicker && (
              <ScrollView style={styles.categoryPickerList} nestedScrollEnabled>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.name}
                    style={[styles.categoryOption, newActivity.category === cat.name && styles.categoryOptionActive]}
                    onPress={() => { setNewActivity({ ...newActivity, category: cat.name }); setShowCategoryPicker(false); }}
                  >
                    <Text style={styles.categoryOptionText}>{cat.emoji} {cat.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <TextInput
              style={[styles.modalInput, { height: 80, textAlignVertical: "top" }]}
              value={newActivity.notes}
              onChangeText={(t) => setNewActivity({ ...newActivity, notes: t })}
              placeholder="Description (optional)"
              placeholderTextColor="#A0AEC0"
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable onPress={handleAdd} style={styles.modalAddBtn}>
                <Text style={styles.modalAddBtnText}>Add Activity</Text>
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
  container: { flex: 1, backgroundColor: "#EBF8FF" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2A4365" },
  subtitle: { fontSize: 13, color: "#718096" },
  addBtn: { backgroundColor: "#3182CE", borderRadius: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#2A4365" },
  countBadge: { backgroundColor: "#BEE3F8", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countBadgeText: { fontSize: 13, color: "#2A4365", fontWeight: "600" },
  activityCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  nextCard: { borderWidth: 2, borderColor: "#ECC94B", backgroundColor: "#FFFFF0" },
  activityHeader: { flexDirection: "row", justifyContent: "space-between" },
  activityInfo: { flexDirection: "row", gap: 10, flex: 1, alignItems: "center" },
  activityTitle: { fontSize: 15, fontWeight: "bold", color: "#2D3748" },
  doneText: { textDecorationLine: "line-through", color: "#A0AEC0" },
  activityDate: { fontSize: 12, color: "#718096" },
  activityActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { padding: 4 },
  nextUpBadge: { backgroundColor: "#ECC94B", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  nextUpText: { fontSize: 11, fontWeight: "bold", color: "#744210" },
  expandedContent: { marginTop: 12, gap: 10 },
  detailLabel: { fontSize: 13, fontWeight: "bold", color: "#2D3748", marginBottom: 2 },
  detailText: { fontSize: 13, color: "#4A5568" },
  badge: { backgroundColor: "#EDF2F7", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  nextBadge: { backgroundColor: "#FEFCBF" },
  badgeText: { fontSize: 11, color: "#4A5568" },
  nextBadgeText: { color: "#744210" },
  completeButton: { backgroundColor: "#38A169", borderRadius: 8, padding: 10, alignItems: "center" },
  completeButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  pastToggle: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  pastToggleText: { fontSize: 14, color: "#718096" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#2A4365" },
  emptySubtitle: { fontSize: 13, color: "#718096", textAlign: "center", maxWidth: 260, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#2D3748" },
  modalInput: { backgroundColor: "#F7FAFC", borderRadius: 8, padding: 12, fontSize: 14, color: "#2D3748", borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 10 },
  categorySelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F7FAFC", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 10 },
  categorySelectorText: { fontSize: 14, color: "#2D3748" },
  categoryPickerList: { maxHeight: 200, backgroundColor: "#F7FAFC", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 10 },
  categoryOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#EDF2F7" },
  categoryOptionActive: { backgroundColor: "#EBF8FF" },
  categoryOptionText: { fontSize: 14, color: "#2D3748" },
  modalActions: { gap: 8, marginTop: 8 },
  modalAddBtn: { backgroundColor: "#3182CE", borderRadius: 8, padding: 14, alignItems: "center" },
  modalAddBtnText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  modalCancelBtn: { padding: 10, alignItems: "center" },
  modalCancelBtnText: { color: "#718096", fontSize: 14 },
});

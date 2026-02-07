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
  CookingPot,
  Coffee,
  ForkKnife,
  Hamburger,
  Plus,
} from "phosphor-react-native";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEAL_TYPES: Record<string, string> = {
  A: "Breakfast",
  B: "Lunch",
  C: "Dinner",
  D: "Snack",
  E: "Other",
};

const MEAL_COLORS: Record<string, string> = {
  A: "#DD6B20",
  B: "#38A169",
  C: "#805AD5",
  D: "#E53E3E",
  E: "#718096",
};

const MealItem = memo(({ id }: { id: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const mealData = useRow("todos", id);
  const store = useStore();
  const deleteMeal = useDelRowCallback("todos", id);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Meal", "Remove this meal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteMeal },
    ]);
  }, [deleteMeal]);

  if (!mealData) return null;

  const mealType = String(mealData.type || "A");
  const mealColor = MEAL_COLORS[mealType] || "#718096";

  return (
    <View style={[styles.mealItem, { opacity: mealData.done ? 0.6 : 1 }]}>
      <View style={styles.mealHeader}>
        <Pressable
          onPress={() => store?.setCell("todos", id, "done", !mealData.done)}
          style={styles.mealCheckbox}
        >
          <View
            style={[
              styles.checkboxBox,
              mealData.done && { backgroundColor: "#319795", borderColor: "#319795" },
            ]}
          >
            {mealData.done ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </View>
        </Pressable>

        <View style={styles.mealInfo}>
          <Text style={[styles.mealName, mealData.done && styles.strikethrough]}>
            {String(mealData.text || "")}
          </Text>
        </View>

        <View style={[styles.mealBadge, { backgroundColor: mealColor + "20" }]}>
          <Text style={[styles.mealBadgeText, { color: mealColor }]}>
            {MEAL_TYPES[mealType] || "Other"}
          </Text>
        </View>

        <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.actionBtn}>
          {isExpanded ? (
            <CaretUp size={16} color="#718096" />
          ) : (
            <CaretDown size={16} color="#718096" />
          )}
        </Pressable>
      </View>

      {isExpanded && (
        <View style={styles.mealExpanded}>
          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Meal Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionRow}>
                {Object.entries(MEAL_TYPES).map(([key, value]) => (
                  <Pressable
                    key={key}
                    onPress={() => store?.setCell("todos", id, "type", key)}
                    style={[
                      styles.optionChip,
                      mealType === key && { backgroundColor: (MEAL_COLORS[key] || "#718096") + "20", borderColor: MEAL_COLORS[key] },
                    ]}
                  >
                    <Text style={[styles.optionText, mealType === key && { color: MEAL_COLORS[key] }]}>
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Day:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionRow}>
                {DAYS_OF_WEEK.map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => store?.setCell("todos", id, "category", day)}
                    style={[
                      styles.optionChip,
                      String(mealData.category) === day && styles.selectedChip,
                    ]}
                  >
                    <Text style={[styles.optionText, String(mealData.category) === day && styles.selectedChipText]}>
                      {day.slice(0, 3)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Notes:</Text>
            <TextInput
              style={styles.notesInput}
              defaultValue={String(mealData.notes || "")}
              onEndEditing={(e) => store?.setCell("todos", id, "notes", e.nativeEvent.text)}
              placeholder="Add notes..."
              multiline
            />
          </View>

          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <Trash size={16} color="#E53E3E" />
            <Text style={styles.deleteBtnText}>Delete Meal</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});
MealItem.displayName = "MealItem";

export default function WeeklyMealPlanner({ listId }: { listId: string }) {
  const [newMeal, setNewMeal] = useState({ text: "", type: "A", category: "Monday" });
  const [modalVisible, setModalVisible] = useState(false);

  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const mealsByDay = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    DAYS_OF_WEEK.forEach((day) => (grouped[day] = []));

    todoIds.forEach((id) => {
      const category = String(store?.getCell("todos", id, "category") || "Monday");
      const day = DAYS_OF_WEEK.includes(category) ? category : "Monday";
      grouped[day].push(id);
    });

    return grouped;
  }, [todoIds, store]);

  const addMeal = useAddRowCallback(
    "todos",
    (meal: any) => ({
      text: meal.text.trim(),
      type: meal.type,
      category: DAYS_OF_WEEK.includes(meal.category) ? meal.category : "Monday",
      list: listId,
      done: false,
    }),
    [listId]
  );

  const handleAddMeal = useCallback(() => {
    if (newMeal.text.trim()) {
      addMeal(newMeal);
      setNewMeal({ text: "", type: "A", category: "Monday" });
      setModalVisible(false);
    }
  }, [addMeal, newMeal]);

  const progressLabel = useMemo(() => {
    const total = todoIds.length;
    if (total === 0) return "Plan your week of meals!";
    if (total <= 5) return "Getting started...";
    if (total <= 14) return "Meal plan coming together!";
    if (total <= 21) return "Well-fed week ahead!";
    return "Culinary masterplan!";
  }, [todoIds.length]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerEmoji}>🍳</Text>
              <View>
                <Text style={styles.title}>
                  {String(listData?.name || "Meal Plan")}
                </Text>
                <Text style={styles.subtitle}>{progressLabel}</Text>
              </View>
            </View>
            <Pressable onPress={() => setModalVisible(true)} style={styles.addButton}>
              <Plus size={18} color="#FFFFFF" weight="bold" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {DAYS_OF_WEEK.map((day, index) => (
            <View key={day} style={styles.daySection}>
              <View style={styles.dayHeader}>
                <View style={styles.dayNumber}>
                  <Text style={styles.dayNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.dayName}>{day}</Text>
                <View style={styles.mealCountBadge}>
                  <Text style={styles.mealCountText}>
                    {(mealsByDay[day] || []).length}
                  </Text>
                </View>
              </View>
              <View style={styles.mealsContainer}>
                {(mealsByDay[day] || []).map((id) => (
                  <MealItem key={id} id={id} />
                ))}
                {(mealsByDay[day] || []).length === 0 && (
                  <Text style={styles.emptyDayText}>No meals planned</Text>
                )}
              </View>
            </View>
          ))}

          {todoIds.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>No meals planned yet</Text>
              <Text style={styles.emptySubtitle}>
                Add meals to any day above to start building your weekly plan
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Meal</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder="Meal name"
                value={newMeal.text}
                onChangeText={(text) => setNewMeal({ ...newMeal, text })}
                placeholderTextColor="#A0AEC0"
              />

              <Text style={styles.fieldLabel}>Meal Type:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionRow}>
                  {Object.entries(MEAL_TYPES).map(([key, value]) => (
                    <Pressable
                      key={key}
                      onPress={() => setNewMeal({ ...newMeal, type: key })}
                      style={[
                        styles.optionChip,
                        newMeal.type === key && { backgroundColor: (MEAL_COLORS[key] || "#718096") + "20", borderColor: MEAL_COLORS[key] },
                      ]}
                    >
                      <Text style={[styles.optionText, newMeal.type === key && { color: MEAL_COLORS[key] }]}>
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Day:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionRow}>
                  {DAYS_OF_WEEK.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => setNewMeal({ ...newMeal, category: day })}
                      style={[
                        styles.optionChip,
                        newMeal.category === day && styles.selectedChip,
                      ]}
                    >
                      <Text style={[styles.optionText, newMeal.category === day && styles.selectedChipText]}>
                        {day.slice(0, 3)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <Pressable onPress={handleAddMeal} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Add Meal</Text>
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
  container: { flex: 1, backgroundColor: "#E6FFFA" },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerEmoji: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: "bold", color: "#234E52" },
  subtitle: { fontSize: 12, color: "#319795", fontStyle: "italic" },
  addButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#319795", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 6 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  daySection: { marginBottom: 16 },
  dayHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  dayNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#319795", alignItems: "center", justifyContent: "center" },
  dayNumberText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  dayName: { fontSize: 18, fontWeight: "bold", color: "#234E52", flex: 1 },
  mealCountBadge: { backgroundColor: "#B2F5EA", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  mealCountText: { fontSize: 12, fontWeight: "600", color: "#234E52" },
  mealsContainer: { gap: 6, paddingLeft: 36 },
  mealItem: { backgroundColor: "#FFFFFF", borderRadius: 8, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  mealHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  mealCheckbox: { marginRight: 4 },
  checkboxBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#CBD5E0", alignItems: "center", justifyContent: "center" },
  checkboxMark: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 15, fontWeight: "500", color: "#2D3748" },
  strikethrough: { textDecorationLine: "line-through", color: "#A0AEC0" },
  mealBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  mealBadgeText: { fontSize: 11, fontWeight: "600" },
  actionBtn: { padding: 4 },
  mealExpanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E2E8F0", gap: 12 },
  expandedField: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#4A5568", marginBottom: 4 },
  optionRow: { flexDirection: "row", gap: 6 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7", borderWidth: 1, borderColor: "#E2E8F0" },
  selectedChip: { backgroundColor: "#B2F5EA", borderColor: "#319795" },
  optionText: { fontSize: 12, color: "#4A5568" },
  selectedChipText: { color: "#234E52", fontWeight: "600" },
  notesInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 6, padding: 10, fontSize: 14, color: "#2D3748", minHeight: 50, textAlignVertical: "top" },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  deleteBtnText: { color: "#E53E3E", fontSize: 13, fontWeight: "500" },
  emptyDayText: { fontSize: 13, color: "#A0AEC0", fontStyle: "italic", paddingVertical: 8 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#234E52" },
  emptySubtitle: { fontSize: 14, color: "#319795", textAlign: "center", maxWidth: 280 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, width: "90%", maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#2D3748" },
  closeText: { fontSize: 20, color: "#718096" },
  modalBody: { padding: 20, gap: 16 },
  modalInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: "#2D3748" },
  modalFooter: { flexDirection: "row", justifyContent: "flex-end", padding: 20, borderTopWidth: 1, borderTopColor: "#E2E8F0", gap: 12 },
  submitBtn: { backgroundColor: "#319795", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: "#718096", fontSize: 16 },
});

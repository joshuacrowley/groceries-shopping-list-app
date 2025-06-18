import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import {
  useStore,
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useTable,
} from "tinybase/ui-react";
import {
  Trash,
  Basketball,
  Users,
  Confetti,
  ShoppingCart,
  Broom,
  CaretDown,
  CaretUp,
  Question,
  Sunglasses,
  SunDim,
  SunHorizon,
} from "phosphor-react-native";

const DAYS = ["Saturday", "Sunday"];
const TIME_PERIODS = ["Morning", "Afternoon"];

const CATEGORIES = {
  A: { name: "Sport", icon: Basketball },
  B: { name: "Play Date", icon: Users },
  C: { name: "Party", icon: Confetti },
  D: { name: "Shopping", icon: ShoppingCart },
  E: { name: "Chores", icon: Broom },
  F: { name: "None", icon: Question },
};

interface ActivityItemProps {
  id: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ id }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activityData = useRow("todos", id);
  
  const updateActivity = useSetRowCallback(
    "todos",
    id,
    (updates) => ({
      ...activityData,
      category: activityData?.category || "Saturday",
      ...updates
    }),
    [activityData]
  );
  
  const deleteActivity = useDelRowCallback("todos", id);

  const Icon = activityData?.type ? CATEGORIES[activityData.type as keyof typeof CATEGORIES]?.icon : Question;

  if (!activityData) return null;

  const handleDelete = () => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteActivity },
      ]
    );
  };

  return (
    <View style={styles.activityItem}>
      <View style={styles.activityHeader}>
        <View style={styles.activityInfo}>
          <Icon size={20} color="#B7791F" />
          <View style={styles.activityText}>
            <Text style={styles.activityTitle}>
              {activityData.text}
            </Text>
            {activityData.notes && (
              <Text style={styles.activityNotes}>
                {activityData.notes}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.activityActions}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeBadgeText}>
              {activityData.number || 0}:00
            </Text>
          </View>
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            style={styles.iconButton}
          >
            {isExpanded ? (
              <CaretUp size={16} color="#B7791F" />
            ) : (
              <CaretDown size={16} color="#B7791F" />
            )}
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.iconButton}>
            <Trash size={16} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.activityDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Day:</Text>
            <View style={styles.selectContainer}>
              {DAYS.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => updateActivity({ category: day })}
                  style={[
                    styles.selectOption,
                    (activityData.category as string) === day && styles.selectOptionSelected
                  ]}
                >
                  <Text style={[
                    styles.selectOptionText,
                    (activityData.category as string) === day && styles.selectOptionTextSelected
                  ]}>
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <View style={styles.selectContainer}>
              {Object.entries(CATEGORIES).map(([key, { name }]) => (
                <Pressable
                  key={key}
                  onPress={() => updateActivity({ type: key })}
                  style={[
                    styles.selectOption,
                    (activityData.type as string) === key && styles.selectOptionSelected
                  ]}
                >
                  <Text style={[
                    styles.selectOptionText,
                    (activityData.type as string) === key && styles.selectOptionTextSelected
                  ]}>
                    {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
              {Array.from({ length: 24 }, (_, i) => (
                <Pressable
                  key={i}
                  onPress={() => updateActivity({ number: i })}
                  style={[
                    styles.timeOption,
                    Number(activityData.number) === i && styles.timeOptionSelected
                  ]}
                >
                  <Text style={[
                    styles.timeOptionText,
                    Number(activityData.number) === i && styles.timeOptionTextSelected
                  ]}>
                    {i}:00
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <TextInput
            value={(activityData.notes as string) || ""}
            onChangeText={(text) => updateActivity({ notes: text })}
            placeholder="Add notes..."
            style={styles.notesInput}
            multiline
          />
        </View>
      )}
    </View>
  );
};

interface TimeBlockProps {
  day: string;
  period: string;
  activities: string[];
}

const TimeBlock: React.FC<TimeBlockProps> = ({ day, period, activities }) => {
  return (
    <View style={styles.timeBlock}>
      <View style={styles.timeBlockHeader}>
        {period === "Morning" ? (
          <SunDim size={20} color="#B7791F" weight="fill" />
        ) : (
          <SunHorizon size={20} color="#B7791F" weight="fill" />
        )}
        <Text style={styles.timeBlockTitle}>{period}</Text>
      </View>
      <View style={styles.activitiesContainer}>
        {activities.map((id) => (
          <ActivityItem key={id} id={id} />
        ))}
      </View>
    </View>
  );
};

interface WeekendPlannerProps {
  listId: string;
}

const WeekendPlanner: React.FC<WeekendPlannerProps> = ({ listId }) => {
  const [newActivity, setNewActivity] = useState({
    text: "",
    notes: "",
    type: "F",
    category: "Saturday",
    number: 9,
  });

  const todosTable = useTable("todos");
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const store = useStore();

  const groupedActivities = useMemo(() => {
    return todoIds.reduce((grouped, id) => {
      const activity = todosTable?.[id];
      if (!activity) return grouped;
      
      const day = activity.category as string || "Saturday";
      const time = Number(activity.number) || 0;
      const period = time < 12 ? "Morning" : "Afternoon";

      if (!grouped[day]) {
        grouped[day] = { Morning: [], Afternoon: [] };
      }

      grouped[day][period].push(id);
      grouped[day][period].sort((a, b) => {
        const timeA = Number(todosTable?.[a]?.number) || 0;
        const timeB = Number(todosTable?.[b]?.number) || 0;
        return timeA - timeB;
      });

      return grouped;
    }, DAYS.reduce((acc, day) => ({ ...acc, [day]: { Morning: [], Afternoon: [] } }), {}));
  }, [todoIds, todosTable]);

  const addActivity = useAddRowCallback(
    "todos",
    (activity: typeof newActivity) => ({
      text: activity.text,
      notes: activity.notes,
      type: activity.type,
      category: activity.category,
      number: activity.number,
      list: listId,
      done: false,
    }),
    [listId]
  );

  const handleAddActivity = useCallback(() => {
    if (newActivity.text.trim()) {
      addActivity(newActivity);
      setNewActivity({
        text: "",
        notes: "",
        type: "F",
        category: "Saturday",
        number: 9,
      });
    }
  }, [addActivity, newActivity]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Sunglasses size={32} color="#B7791F" weight="fill" />
            <Text style={styles.title}>
              {listData?.name || "Weekend Planner"}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {todoIds.length} Activities
            </Text>
          </View>
        </View>

        <View style={styles.addActivityContainer}>
          <TextInput
            value={newActivity.text}
            onChangeText={(text) => setNewActivity({ ...newActivity, text })}
            placeholder="Add new activity"
            style={styles.addActivityInput}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {Object.entries(CATEGORIES).map(([key, { name }]) => (
              <Pressable
                key={key}
                onPress={() => setNewActivity({ ...newActivity, type: key })}
                style={[
                  styles.categoryOption,
                  newActivity.type === key && styles.categoryOptionSelected
                ]}
              >
                <Text style={[
                  styles.categoryOptionText,
                  newActivity.type === key && styles.categoryOptionTextSelected
                ]}>
                  {name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable onPress={handleAddActivity} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {DAYS.map((day) => (
          <View key={day} style={styles.daySection}>
            <Text style={styles.dayTitle}>{day}</Text>
            {TIME_PERIODS.map((period) => (
              <TimeBlock
                key={`${day}-${period}`}
                day={day}
                period={period}
                activities={groupedActivities[day]?.[period] || []}
              />
            ))}
            {day === "Saturday" && <View style={styles.daySeparator} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFBEB",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#B7791F",
    marginLeft: 12,
  },
  badge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  badgeText: {
    color: "#B7791F",
    fontSize: 12,
    fontWeight: "600",
  },
  addActivityContainer: {
    marginBottom: 24,
  },
  addActivityInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#F3E8FF",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryOption: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#F3E8FF",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryOptionSelected: {
    backgroundColor: "#FEF3C7",
    borderColor: "#B7791F",
  },
  categoryOptionText: {
    color: "#6B7280",
    fontSize: 14,
  },
  categoryOptionTextSelected: {
    color: "#B7791F",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  daySection: {
    marginBottom: 24,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#B7791F",
    marginBottom: 16,
  },
  daySeparator: {
    height: 1,
    backgroundColor: "#FEF3C7",
    marginVertical: 24,
  },
  timeBlock: {
    marginBottom: 16,
  },
  timeBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeBlockTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#B7791F",
    marginLeft: 8,
  },
  activitiesContainer: {
    gap: 8,
  },
  activityItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityText: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#B7791F",
  },
  activityNotes: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  activityActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: "#B7791F",
    fontSize: 12,
    fontWeight: "600",
  },
  iconButton: {
    padding: 4,
  },
  activityDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  selectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  selectOption: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectOptionSelected: {
    backgroundColor: "#FEF3C7",
    borderColor: "#B7791F",
  },
  selectOptionText: {
    fontSize: 12,
    color: "#6B7280",
  },
  selectOptionTextSelected: {
    color: "#B7791F",
    fontWeight: "600",
  },
  timeScroll: {
    maxHeight: 40,
  },
  timeOption: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    minWidth: 50,
    alignItems: "center",
  },
  timeOptionSelected: {
    backgroundColor: "#FEF3C7",
    borderColor: "#B7791F",
  },
  timeOptionText: {
    fontSize: 12,
    color: "#6B7280",
  },
  timeOptionTextSelected: {
    color: "#B7791F",
    fontWeight: "600",
  },
  notesInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
});

export default WeekendPlanner;
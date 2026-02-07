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
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useLocalRowIds,
} from "tinybase/ui-react";
import {
  Plus,
  Trash,
  CaretDown,
  CaretUp,
  ArrowCircleUp,
  Clock,
  CalendarCheck,
} from "phosphor-react-native";

const TaskItem = memo(({ id, isTodaySection }: { id: string; isTodaySection: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const taskData = useRow("todos", id);
  const store = useStore();
  const deleteTask = useDelRowCallback("todos", id);

  const handleToggle = useCallback(() => {
    store?.setCell("todos", id, "done", !taskData?.done);
  }, [store, id, taskData?.done]);

  const handleMoveToToday = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    store?.setCell("todos", id, "date", today);
  }, [store, id]);

  const handleTextUpdate = useCallback(
    (newText: string) => {
      store?.setCell("todos", id, "text", newText);
    },
    [store, id]
  );

  const handleNotesUpdate = useCallback(
    (newNotes: string) => {
      store?.setCell("todos", id, "notes", newNotes);
    },
    [store, id]
  );

  const handleDateUpdate = useCallback(
    (newDate: string) => {
      store?.setCell("todos", id, "date", newDate);
    },
    [store, id]
  );

  const handleTimeUpdate = useCallback(
    (newTime: string) => {
      store?.setCell("todos", id, "time", newTime);
    },
    [store, id]
  );

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteTask },
    ]);
  }, [deleteTask]);

  const isOld = useMemo(() => {
    if (!taskData?.date) return false;
    const taskDate = new Date(String(taskData.date));
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return taskDate < weekAgo;
  }, [taskData?.date]);

  if (!taskData) return null;

  const borderColor = isOld ? "#E53E3E" : isTodaySection ? "#4299E1" : "#A0AEC0";

  return (
    <View style={[styles.taskContainer, { opacity: taskData.done ? 0.7 : 1 }]}>
      <View style={[styles.taskBorder, { backgroundColor: borderColor }]} />
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <View style={styles.taskLeft}>
            <Pressable onPress={handleToggle} style={styles.checkbox}>
              <View
                style={[
                  styles.checkboxBox,
                  taskData.done && {
                    backgroundColor: isTodaySection ? "#4299E1" : "#A0AEC0",
                    borderColor: isTodaySection ? "#4299E1" : "#A0AEC0",
                  },
                ]}
              >
                {taskData.done ? (
                  <Text style={styles.checkboxMark}>✓</Text>
                ) : null}
              </View>
            </Pressable>
            <View style={styles.taskTextContainer}>
              {taskData.emoji ? (
                <Text style={styles.taskEmoji}>{String(taskData.emoji)}</Text>
              ) : null}
              <Text
                style={[
                  styles.taskText,
                  taskData.done && styles.strikethrough,
                  isTodaySection && styles.boldText,
                ]}
              >
                {String(taskData.text || "")}
              </Text>
            </View>
          </View>

          <View style={styles.taskRight}>
            {taskData.time ? (
              <View style={styles.timeBadge}>
                <Clock size={12} color="#718096" />
                <Text style={styles.timeText}>{String(taskData.time)}</Text>
              </View>
            ) : null}
            {!isTodaySection && !taskData.done ? (
              <Pressable onPress={handleMoveToToday} style={styles.actionButton}>
                <ArrowCircleUp size={18} color="#4299E1" />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setIsExpanded(!isExpanded)}
              style={styles.actionButton}
            >
              {isExpanded ? (
                <CaretUp size={16} color="#718096" />
              ) : (
                <CaretDown size={16} color="#718096" />
              )}
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.actionButton}>
              <Trash size={16} color="#E53E3E" />
            </Pressable>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Task:</Text>
              <TextInput
                style={styles.detailInput}
                defaultValue={String(taskData.text || "")}
                onEndEditing={(e) => handleTextUpdate(e.nativeEvent.text)}
              />
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <TextInput
                style={[styles.detailInput, styles.detailTextArea]}
                defaultValue={String(taskData.notes || "")}
                onEndEditing={(e) => handleNotesUpdate(e.nativeEvent.text)}
                multiline
              />
            </View>
            <View style={styles.detailDateRow}>
              <View style={styles.detailHalf}>
                <Text style={styles.detailLabel}>Date:</Text>
                <TextInput
                  style={styles.detailInput}
                  defaultValue={String(taskData.date || "")}
                  placeholder="YYYY-MM-DD"
                  onEndEditing={(e) => handleDateUpdate(e.nativeEvent.text)}
                />
              </View>
              <View style={styles.detailHalf}>
                <Text style={styles.detailLabel}>Time:</Text>
                <TextInput
                  style={styles.detailInput}
                  defaultValue={String(taskData.time || "")}
                  placeholder="HH:MM"
                  onEndEditing={(e) => handleTimeUpdate(e.nativeEvent.text)}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
});
TaskItem.displayName = "TaskItem";

const AddTaskModal = memo(
  ({
    visible,
    onClose,
    onAdd,
  }: {
    visible: boolean;
    onClose: () => void;
    onAdd: (task: any) => void;
  }) => {
    const [task, setTask] = useState({
      text: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
      time: "",
      done: false,
      emoji: "",
    });

    const handleSubmit = useCallback(() => {
      if (task.text.trim()) {
        onAdd(task);
        setTask({
          text: "",
          notes: "",
          date: new Date().toISOString().split("T")[0],
          time: "",
          done: false,
          emoji: "",
        });
        onClose();
      }
    }, [task, onAdd, onClose]);

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                placeholder="Task description"
                value={task.text}
                onChangeText={(text) => setTask({ ...task, text })}
                style={styles.modalInput}
                placeholderTextColor="#A0AEC0"
              />
              <TextInput
                placeholder="Notes (optional)"
                value={task.notes}
                onChangeText={(notes) => setTask({ ...task, notes })}
                style={[styles.modalInput, styles.modalTextArea]}
                multiline
                numberOfLines={3}
                placeholderTextColor="#A0AEC0"
              />
              <View style={styles.dateTimeRow}>
                <TextInput
                  placeholder="Date (YYYY-MM-DD)"
                  value={task.date}
                  onChangeText={(date) => setTask({ ...task, date })}
                  style={[styles.modalInput, styles.halfInput]}
                  placeholderTextColor="#A0AEC0"
                />
                <TextInput
                  placeholder="Time (HH:MM)"
                  value={task.time}
                  onChangeText={(time) => setTask({ ...task, time })}
                  style={[styles.modalInput, styles.halfInput]}
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable onPress={handleSubmit} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Add Task</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
);
AddTaskModal.displayName = "AddTaskModal";

export default function Today({ listId }: { listId: string }) {
  const [modalVisible, setModalVisible] = useState(false);
  const store = useStore();

  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addTask = useAddRowCallback(
    "todos",
    (task: any) => ({
      text: task.text.trim(),
      notes: task.notes,
      date: task.date,
      time: task.time,
      done: false,
      type: "A",
      list: listId,
      emoji: task.emoji,
    }),
    [listId]
  );

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { todayTasks, previousTasks } = useMemo(() => {
    const sorted = todoIds.reduce(
      (acc, id) => {
        const date = store?.getCell("todos", id, "date");
        if (date === today) {
          acc.todayTasks.push(id);
        } else {
          acc.previousTasks.push(id);
        }
        return acc;
      },
      { todayTasks: [] as string[], previousTasks: [] as string[] }
    );

    sorted.todayTasks.sort((aId, bId) => {
      const timeA = String(store?.getCell("todos", aId, "time") || "23:59");
      const timeB = String(store?.getCell("todos", bId, "time") || "23:59");
      return timeA.localeCompare(timeB);
    });

    return sorted;
  }, [todoIds, store, today]);

  const progressLabel = useMemo(() => {
    const count = todoIds.length;
    if (count === 0) return "What's on today?";
    if (count <= 2) return "Day's taking shape";
    if (count <= 5) return "Packed day ahead!";
    return "Crushing it today!";
  }, [todoIds.length]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <CalendarCheck size={32} color="#2B6CB0" />
              <View>
                <Text style={styles.title}>
                  {String(listData?.name || "Daily Tasks")}
                </Text>
                <Text style={styles.progressLabel}>{progressLabel}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => setModalVisible(true)}
              style={styles.addButton}
            >
              <Plus size={18} color="#FFFFFF" weight="bold" />
              <Text style={styles.addButtonText}>Add Task</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Todo</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{todayTasks.length}</Text>
              </View>
            </View>
            <View style={styles.tasksList}>
              {todayTasks.map((id) => (
                <TaskItem key={`today-${id}`} id={id} isTodaySection={true} />
              ))}
              {todayTasks.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>☀️</Text>
                  <Text style={styles.emptyTitle}>No tasks for today</Text>
                  <Text style={styles.emptySubtitle}>
                    Add tasks to plan your day
                  </Text>
                </View>
              )}
            </View>
          </View>

          {previousTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Todidn't</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{previousTasks.length}</Text>
                </View>
              </View>
              <View style={styles.tasksList}>
                {previousTasks.map((id) => (
                  <TaskItem
                    key={`previous-${id}`}
                    id={id}
                    isTodaySection={false}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EBF8FF",
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2B6CB0",
  },
  progressLabel: {
    fontSize: 12,
    color: "#4299E1",
    fontStyle: "italic",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4299E1",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    backgroundColor: "#BEE3F8",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
  },
  badge: {
    backgroundColor: "#4299E1",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  tasksList: {
    gap: 8,
  },
  taskContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskBorder: {
    width: 4,
  },
  taskContent: {
    flex: 1,
    padding: 12,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#CBD5E0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxMark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  taskTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  taskText: {
    fontSize: 16,
    color: "#2D3748",
    flex: 1,
  },
  boldText: {
    fontWeight: "600",
  },
  strikethrough: {
    textDecorationLine: "line-through",
    color: "#A0AEC0",
  },
  taskRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#718096",
  },
  actionButton: {
    padding: 4,
  },
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
    gap: 12,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
  },
  detailInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#2D3748",
    backgroundColor: "#FFFFFF",
  },
  detailTextArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  detailDateRow: {
    flexDirection: "row",
    gap: 12,
  },
  detailHalf: {
    flex: 1,
    gap: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2B6CB0",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#4299E1",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#718096",
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2D3748",
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 12,
  },
  submitButton: {
    backgroundColor: "#4299E1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: "#718096",
    fontSize: 16,
  },
});

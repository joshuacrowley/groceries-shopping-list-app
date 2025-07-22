import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useTable,
} from "tinybase/ui-react";
import {
  Plus,
  Trash,
  Cookie,
  ClockCounterClockwise,
  Knife,
  CookingPot,
  ForkKnife,
  Package,
  CaretDown,
  EggCrack,
} from "phosphor-react-native";

const STAGES = [
  { name: "Day Ahead", icon: ClockCounterClockwise, color: "#805AD5" },
  { name: "Prep", icon: Knife, color: "#3182CE" },
  { name: "Cook", icon: CookingPot, color: "#DD6B20" },
  { name: "Serve", icon: ForkKnife, color: "#38A169" },
  { name: "Store", icon: Package, color: "#E53E3E" },
];

const FOOD_EMOJIS = ["🥩", "🍄", "🧀", "🧄", "🥕", "🥘", "🥛", "🍅", "🍖", "🍝", "👩‍🍳", "⏲️", "🌿", "🍞", "🥡", "📝", "❄️", "🧈", "🥜", "🍫", "⚖️", "🥚", "🍪", "🔥", "⚪", "🍽️", "🥛", "📸", "📄", "🔒"];

interface TaskItemProps {
  id: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ id }) => {
  const taskData = useRow("todos", id);
  const updateTask = useSetRowCallback(
    "todos",
    id,
    (updates) => ({
      ...taskData,
      category: taskData?.category || STAGES[0].name,
      ...updates
    }),
    [taskData]
  );
  const deleteTask = useDelRowCallback("todos", id);

  const handleToggle = useCallback(() => {
    updateTask({ done: !taskData?.done });
  }, [updateTask, taskData?.done]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteTask },
      ]
    );
  };

  const stage = STAGES.find(s => s.name === taskData?.category);
  const stageColor = stage?.color || "#718096";

  if (!taskData) return null;

  return (
    <View style={[styles.taskItem, { opacity: taskData.done ? 0.6 : 1 }]}>
      <View style={styles.taskHeader}>
        <Pressable
          onPress={handleToggle}
          style={[
            styles.checkbox,
            { borderColor: stageColor },
            taskData.done && { backgroundColor: stageColor }
          ]}
        >
          {taskData.done && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>

        <Text style={styles.taskEmoji}>{taskData.emoji || "🔸"}</Text>

        <View style={styles.taskContent}>
          <Text style={[
            styles.taskText,
            taskData.done && styles.taskTextCompleted
          ]}>
            {taskData.text}
          </Text>
          {taskData.notes && (
            <View style={[styles.recipeBadge, { backgroundColor: "#FEF3C7" }]}>
              <Text style={styles.recipeText} numberOfLines={1}>
                {taskData.notes}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.timeBadge, { backgroundColor: stageColor + "20" }]}>
          <Text style={[styles.timeText, { color: stageColor }]}>
            {taskData.time || "—"}
          </Text>
        </View>

        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Trash size={16} color="#E53E3E" />
        </Pressable>
      </View>
    </View>
  );
};

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: any) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ visible, onClose, onAdd }) => {
  const [newTask, setNewTask] = useState({
    text: "",
    category: STAGES[0].name,
    notes: "",
    emoji: "🔸",
    time: "",
    done: false,
    type: "A",
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = () => {
    if (newTask.text.trim()) {
      onAdd(newTask);
      setNewTask({
        text: "",
        category: STAGES[0].name,
        notes: "",
        emoji: "🔸",
        time: "",
        done: false,
        type: "A",
      });
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Task</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <View style={styles.taskRow}>
                <Pressable
                  style={styles.emojiSelectButton}
                  onPress={() => setShowEmojiPicker(true)}
                >
                  <Text style={styles.emoji}>{newTask.emoji}</Text>
                  <CaretDown size={16} color="#718096" />
                </Pressable>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Task description"
                  value={newTask.text}
                  onChangeText={(text) => setNewTask({ ...newTask, text })}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Recipe name:</Text>
              <TextInput
                style={styles.input}
                placeholder="Recipe name"
                value={newTask.notes}
                onChangeText={(text) => setNewTask({ ...newTask, notes: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Time:</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                value={newTask.time}
                onChangeText={(text) => setNewTask({ ...newTask, time: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Stage:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {STAGES.map(({ name, color }) => (
                  <Pressable
                    key={name}
                    onPress={() => setNewTask({ ...newTask, category: name })}
                    style={[
                      styles.stageOption,
                      newTask.category === name && { backgroundColor: color + "20", borderColor: color }
                    ]}
                  >
                    <Text style={[
                      styles.stageOptionText,
                      newTask.category === name && { color }
                    ]}>
                      {name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Add Task</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>

          {showEmojiPicker && (
            <Modal
              visible={showEmojiPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowEmojiPicker(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowEmojiPicker(false)}
              >
                <View style={styles.emojiPickerContainer}>
                  <Text style={styles.emojiPickerTitle}>Choose Emoji</Text>
                  <ScrollView style={styles.emojiGrid}>
                    <View style={styles.emojiRow}>
                      {FOOD_EMOJIS.map((emoji) => (
                        <Pressable
                          key={emoji}
                          style={styles.emojiOption}
                          onPress={() => {
                            setNewTask({ ...newTask, emoji });
                            setShowEmojiPicker(false);
                          }}
                        >
                          <Text style={styles.emojiOptionText}>{emoji}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface BatchCookingListProps {
  listId: string;
}

const BatchCookingList: React.FC<BatchCookingListProps> = ({ listId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const todosTable = useTable("todos");
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const { groupedTasks, totalTasks } = useMemo(() => {
    const grouped = todoIds.reduce((acc, id) => {
      const task = todosTable?.[id];
      if (task) {
        const category = task.category || STAGES[0].name;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(id);
      }
      return acc;
    }, {} as Record<string, string[]>);

    return {
      groupedTasks: grouped,
      totalTasks: todoIds.length
    };
  }, [todoIds, todosTable]);

  useEffect(() => {
    console.log('Recipe card distribution updated:', {
      listId,
      groupedTasks,
      totalTasks,
      allTasks: todosTable,
      relationshipIds: todoIds
    });
  }, [groupedTasks, totalTasks, listId, todosTable, todoIds]);

  const addTask = useAddRowCallback(
    "todos",
    (task) => ({
      text: task.text.trim(),
      category: task.category,
      notes: task.notes,
      emoji: task.emoji,
      time: task.time,
      done: false,
      type: "A",
      list: listId,
    }),
    [listId]
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <EggCrack size={32} color="#DD6B20" />
            <Text style={styles.title}>
              {listData?.name || "Batch Cooking"}
            </Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => setIsModalOpen(true)}
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </Pressable>
        </View>

        {STAGES.map(({ name, icon: Icon, color }) => {
          const tasks = groupedTasks[name] || [];
          if (tasks.length === 0) return null;

          return (
            <View key={name} style={[styles.stageSection, { backgroundColor: "#FFF7ED" }]}>
              <View style={styles.stageHeader}>
                <Icon size={24} color={color} />
                <Text style={[styles.stageTitle, { color }]}>{name}</Text>
                <View style={[styles.taskCountBadge, { backgroundColor: color + "20" }]}>
                  <Text style={[styles.taskCountText, { color }]}>{tasks.length}</Text>
                </View>
              </View>
              <View style={styles.tasksContainer}>
                {tasks.map((id) => (
                  <TaskItem key={id} id={id} />
                ))}
              </View>
            </View>
          );
        })}

        {totalTasks === 0 && (
          <View style={styles.emptyState}>
            <Cookie size={48} color="#CBD5E0" />
            <Text style={styles.emptyText}>No tasks yet. Start by adding your first cooking task!</Text>
          </View>
        )}
      </View>

      <AddTaskModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addTask}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
  content: {
    padding: 16,
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3748",
    marginLeft: 12,
  },
  addButton: {
    backgroundColor: "#DD6B20",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  stageSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  stageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  taskCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tasksContainer: {
    gap: 8,
  },
  taskItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  taskEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
  },
  taskTextCompleted: {
    textDecorationLine: "line-through",
    color: "#718096",
  },
  recipeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  recipeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B7791F",
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: {
    color: "#718096",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#718096",
  },
  modalContent: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emojiSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 8,
    gap: 4,
  },
  emoji: {
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: "#2D3748",
  },
  stageOption: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  stageOptionText: {
    fontSize: 12,
    color: "#4A5568",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  submitButton: {
    backgroundColor: "#DD6B20",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: "#718096",
  },
  emojiPickerContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "80%",
    maxHeight: "60%",
  },
  emojiPickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 12,
    textAlign: "center",
  },
  emojiGrid: {
    flex: 1,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  emojiOption: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F7FAFC",
  },
  emojiOptionText: {
    fontSize: 24,
  },
});

export default BatchCookingList;
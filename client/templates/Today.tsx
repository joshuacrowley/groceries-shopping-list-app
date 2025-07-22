import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import {
  useStore,
  useRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useLocalRowIds,
  useTable,
} from "tinybase/ui-react";
import { Feather } from '@expo/vector-icons';
import PhosphorIcon from '@/components/PhosphorIcon';

const { width } = Dimensions.get('window');

const COLORS = {
  lightBlue: '#E6F3FF',
  white: '#FFFFFF',
  darkGray: '#2D3748',
  mediumGray: '#718096',
  lightGray: '#E2E8F0',
  red: '#E53E3E',
  blue: '#4299E1',
  orange: '#FF8C42',
  background: '#F7FAFC',
};

interface TaskItemProps {
  id: string;
  isTodaySection: boolean;
}

const TaskItem: React.FC<TaskItemProps> = React.memo(({ id, isTodaySection }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const taskData = useRow("todos", id);
  const updateTask = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...taskData, ...updates }),
    [taskData]
  );
  const deleteTask = useDelRowCallback("todos", id);

  const handleToggle = useCallback(() => {
    updateTask({ done: !taskData.done });
  }, [updateTask, taskData.done]);

  const handleMoveToToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const updatedTask = {
      ...taskData,
      date: today,
      list: taskData.list
    };
    updateTask(updatedTask);
  }, [updateTask, taskData]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const isOld = useMemo(() => {
    const taskDate = new Date(taskData.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return taskDate < weekAgo;
  }, [taskData.date]);

  const opacity = taskData.done ? 0.7 : 1;
  const borderColor = isOld ? COLORS.red : COLORS.orange;

  return (
    <View style={[styles.taskContainer, { opacity }]}>
      <View style={[styles.taskBorder, { backgroundColor: borderColor }]} />
      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <View style={styles.taskLeft}>
            <Pressable onPress={handleToggle} style={styles.checkbox}>
              <Feather 
                name={taskData.done ? 'check-square' : 'square'} 
                size={20} 
                color={taskData.done ? COLORS.blue : COLORS.mediumGray} 
              />
            </Pressable>
            <View style={styles.taskTextContainer}>
              {taskData.icon && (
                <Text style={styles.taskIcon}>{taskData.icon}</Text>
              )}
              <Text 
                style={[
                  styles.taskText,
                  taskData.done && styles.strikethrough,
                  isTodaySection && styles.boldText
                ]}
              >
                {taskData.text}
              </Text>
            </View>
          </View>
          
          <View style={styles.taskRight}>
            {taskData.time && (
              <View style={styles.timeBadge}>
                <PhosphorIcon name="Clock" size={12} color={COLORS.mediumGray} />
                <Text style={styles.timeText}>{taskData.time}</Text>
              </View>
            )}
            {!isTodaySection && !taskData.done && (
              <Pressable onPress={handleMoveToToday} style={styles.actionButton}>
                <PhosphorIcon name="Info" size={16} color={COLORS.mediumGray} />
              </Pressable>
            )}
            <Pressable onPress={toggleExpanded} style={styles.actionButton}>
              <Feather 
                name="chevron-down" 
                size={16} 
                color={COLORS.mediumGray} 
              />
            </Pressable>
            <Pressable onPress={deleteTask} style={styles.actionButton}>
              <Feather name="trash-2" size={16} color={COLORS.red} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
});

TaskItem.displayName = "TaskItem";

interface AddTaskModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAdd: (task: any) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = React.memo(({ isVisible, onClose, onAdd }) => {
  const [task, setTask] = useState({
    text: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
    time: "",
    done: false,
    icon: "",
  });

  const handleSubmit = useCallback(() => {
    if (task.text.trim()) {
      onAdd(task);
      setTask({
        text: "",
        notes: "",
        date: new Date().toISOString().split('T')[0],
        time: "",
        done: false,
        icon: "",
      });
      onClose();
    }
  }, [task, onAdd, onClose]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Task</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={COLORS.mediumGray} />
            </Pressable>
          </View>
          
          <View style={styles.modalBody}>
            <TextInput
              placeholder="Task description"
              value={task.text}
              onChangeText={(text) => setTask({ ...task, text })}
              style={styles.input}
              placeholderTextColor={COLORS.mediumGray}
            />
            <TextInput
              placeholder="Notes (optional)"
              value={task.notes}
              onChangeText={(notes) => setTask({ ...task, notes })}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              placeholderTextColor={COLORS.mediumGray}
            />
            <View style={styles.dateTimeRow}>
              <TextInput
                placeholder="Date"
                value={task.date}
                onChangeText={(date) => setTask({ ...task, date })}
                style={[styles.input, styles.dateInput]}
                placeholderTextColor={COLORS.mediumGray}
              />
              <TextInput
                placeholder="Time"
                value={task.time}
                onChangeText={(time) => setTask({ ...task, time })}
                style={[styles.input, styles.timeInput]}
                placeholderTextColor={COLORS.mediumGray}
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
});

AddTaskModal.displayName = "AddTaskModal";

interface TodoListProps {
  listId?: string;
}

const TodoList: React.FC<TodoListProps> = ({ listId = "daily-tasks" }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const store = useStore();
  
  const todosTable = useTable("todos");
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addTask = useAddRowCallback(
    "todos",
    (task) => ({
      text: task.text.trim(),
      notes: task.notes,
      date: task.date,
      time: task.time,
      done: false,
      type: "A",
      list: listId,
      icon: task.icon,
    }),
    [listId]
  );

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { todayTasks, previousTasks } = useMemo(() => {
    const getTimeValue = (task) => {
      if (!task.time) return '23:59';
      return task.time;
    };

    const sorted = todoIds.reduce(
      (acc, id) => {
        const task = todosTable?.[id];
        if (task) {
          if (task.date === today) {
            acc.todayTasks.push(id);
          } else {
            acc.previousTasks.push(id);
          }
        }
        return acc;
      },
      { todayTasks: [], previousTasks: [] }
    );

    sorted.todayTasks.sort((aId, bId) => {
      const taskA = todosTable?.[aId];
      const taskB = todosTable?.[bId];
      return getTimeValue(taskA).localeCompare(getTimeValue(taskB));
    });

    return sorted;
  }, [todoIds, todosTable, today]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <PhosphorIcon name="CalendarCheck" size={32} color={COLORS.darkGray} />
              <Text style={styles.title}>Today</Text>
            </View>
            <Pressable onPress={openModal} style={styles.addButton}>
              <Feather name="plus" size={20} color={COLORS.white} />
              <Text style={styles.addButtonText}>Add Task</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Todo</Text>
              <Text style={styles.sectionCount}>{todayTasks.length}</Text>
            </View>
            <View style={styles.tasksList}>
              {todayTasks.map((id) => (
                <TaskItem key={`today-${id}`} id={id} isTodaySection={true} />
              ))}
              {todayTasks.length === 0 && (
                <Text style={styles.emptyMessage}>No tasks for today</Text>
              )}
            </View>
          </View>

          {previousTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Todidn't</Text>
                <Text style={styles.sectionCount}>{previousTasks.length}</Text>
              </View>
              <View style={styles.tasksList}>
                {previousTasks.map((id) => (
                  <TaskItem key={`previous-${id}`} id={id} isTodaySection={false} />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <AddTaskModal
        isVisible={modalVisible}
        onClose={closeModal}
        onAdd={addTask}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 12,
    color: COLORS.darkGray,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  sectionCount: {
    fontSize: 18,
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  tasksList: {
    gap: 8,
  },
  emptyMessage: {
    color: COLORS.mediumGray,
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 16,
    fontStyle: 'italic',
  },
  taskContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
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
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    marginRight: 12,
  },
  taskTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  taskText: {
    fontSize: 16,
    color: COLORS.darkGray,
    flex: 1,
  },
  boldText: {
    fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  actionButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: width - 32,
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.darkGray,
    backgroundColor: COLORS.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  timeInput: {
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 12,
  },
  submitButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: COLORS.mediumGray,
    fontSize: 16,
  },
});

export default TodoList;
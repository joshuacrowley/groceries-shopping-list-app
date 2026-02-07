import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
import {
  useStore,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useLocalRowIds,
} from "tinybase/ui-react";
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Checkbox,
  IconButton,
  useColorModeValue,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  Collapse,
  Tooltip,
  Editable,
  EditableInput,
  EditablePreview,
  EditableTextarea,
  useEditableControls,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash,
  CaretDown,
  CaretUp,
  ArrowCircleUp,
  Clock,
  CalendarCheck,
  CalendarX,
  Note,
  Calendar,
  CalendarStar,
  PencilSimple,
  Check,
  X,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const EditableControl = () => {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls();

  return isEditing ? (
    <HStack spacing={2}>
      <IconButton
        icon={<Check weight="bold" />}
        {...getSubmitButtonProps()}
        aria-label="Confirm edit"
        size="sm"
        colorScheme="blue"
        variant="ghost"
      />
      <IconButton
        icon={<X weight="bold" />}
        {...getCancelButtonProps()}
        aria-label="Cancel edit"
        size="sm"
        colorScheme="blue"
        variant="ghost"
      />
    </HStack>
  ) : (
    <IconButton
      icon={<PencilSimple weight="bold" />}
      {...getEditButtonProps()}
      aria-label="Edit task"
      size="sm"
      colorScheme="blue"
      variant="ghost"
      opacity={0.5}
      _hover={{ opacity: 1 }}
    />
  );
};

const TaskItem = memo(({ id, isTodaySection }) => {
  const { isOpen, onToggle } = useDisclosure();
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
    console.log('Moving task to today:', {
      taskId: id,
      currentDate: taskData.date,
      newDate: today,
      currentTask: taskData,
      isTodaySection
    });
    
    // Create a complete task object with all existing data plus the new date
    const updatedTask = {
      ...taskData,
      date: today,
      list: taskData.list
    };
    
    updateTask(updatedTask, (store) => {
      const result = store.getRow("todos", id);
      console.log('Task after update:', {
        taskId: id,
        success: !!result,
        updatedDate: result?.date,
        updatedTask: result,
        listId: result?.list,
        relationships: store.getTable("todoList")
      });
    });
  }, [updateTask, id, taskData, isTodaySection]);

  const handleTextUpdate = useCallback((newText) => {
    updateTask({ text: newText });
  }, [updateTask]);

  const handleNotesUpdate = useCallback((newNotes) => {
    updateTask({ notes: newNotes });
  }, [updateTask]);

  const handleEmojiUpdate = useCallback((newEmoji) => {
    updateTask({ icon: newEmoji });
  }, [updateTask]);

  const isOld = useMemo(() => {
    const taskDate = new Date(taskData.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return taskDate < weekAgo;
  }, [taskData.date]);

  const bgColor = useColorModeValue(
    taskData.done ? "gray.50" : "white",
    taskData.done ? "gray.700" : "gray.600"
  );
  const textColor = useColorModeValue("gray.800", "white");

  // Add logging for taskData changes
  useEffect(() => {
    console.log('TaskItem data changed:', {
      taskId: id,
      date: taskData.date,
      isTodaySection
    });
  }, [taskData, id, isTodaySection]);

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      opacity={taskData.done ? 0.7 : 1}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      borderLeft="4px solid"
      borderLeftColor={isOld ? "red.400" : isTodaySection ? "blue.400" : "gray.400"}
    >
      <VStack align="stretch" spacing={2}>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Checkbox
              isChecked={taskData.done}
              onChange={handleToggle}
              colorScheme={isTodaySection ? "blue" : "gray"}
            />
            <HStack spacing={2}>
              {taskData.emoji && (
                <Text fontSize="lg">
                  {taskData.emoji}
                </Text>
              )}
              <Text
                fontWeight={isTodaySection ? "semibold" : "normal"}
                textDecoration={taskData.done ? "line-through" : "none"}
                color={textColor}
              >
                {taskData.text}
              </Text>
            </HStack>
          </HStack>
          <HStack>
            {taskData.time && (
              <Badge colorScheme="gray">
                <HStack spacing={1}>
                  <Clock size={14} />
                  <Text>{taskData.time}</Text>
                </HStack>
              </Badge>
            )}
            {!isTodaySection && !taskData.done && (
              <Tooltip label="Move to Today">
                <IconButton
                  icon={<ArrowCircleUp />}
                  onClick={handleMoveToToday}
                  aria-label="Move to today"
                  size="sm"
                  colorScheme="blue"
                  variant="ghost"
                />
              </Tooltip>
            )}
            <IconButton
              icon={isOpen ? <CaretUp /> : <CaretDown />}
              onClick={onToggle}
              aria-label="Toggle details"
              size="sm"
              variant="ghost"
              color={textColor}
            />
            <IconButton
              icon={<Trash />}
              onClick={deleteTask}
              aria-label="Delete task"
              size="sm"
              colorScheme="red"
              variant="ghost"
            />
          </HStack>
        </HStack>

        <Collapse in={isOpen}>
          <Box pl={8} pt={2}>
            <VStack align="stretch" spacing={4}>
              {/* Task Text Row */}
              <HStack spacing={0}>
                <Box minW="100px">
                  <Text fontWeight="bold" color={textColor}>Task:</Text>
                </Box>
                <Box flex={1}>
                  <Editable
                    defaultValue={taskData.text}
                    onSubmit={handleTextUpdate}
                    display="flex"
                    gap={2}
                  >
                    <Box flex={1}>
                      <EditablePreview w="full" />
                      <EditableInput />
                    </Box>
                    <EditableControl />
                  </Editable>
                </Box>
              </HStack>

              {/* Notes Row */}
              <HStack spacing={0} alignItems="start">
                <Box minW="100px">
                  <Text fontWeight="bold" color={textColor}>Notes:</Text>
                </Box>
                <Box flex={1}>
                  <Editable
                    defaultValue={taskData.notes || ''}
                    onSubmit={handleNotesUpdate}
                    display="flex"
                    gap={2}
                  >
                    <Box flex={1}>
                      <EditablePreview whiteSpace="pre-wrap" w="full" />
                      <EditableTextarea minH="60px" />
                    </Box>
                    <EditableControl />
                  </Editable>
                </Box>
              </HStack>

              {/* Date & Time Row */}
              <HStack spacing={0}>
                <Box minW="100px">
                  <Text fontWeight="bold" color={textColor}>Due:</Text>
                </Box>
                <Box flex={1}>
                  <HStack spacing={4}>
                    <Input
                      type="date"
                      value={taskData.date || ''}
                      onChange={(e) => updateTask({ date: e.target.value })}
                      size="sm"
                      maxW="200px"
                      bg={useColorModeValue("white", "gray.700")}
                    />
                    <Input
                      type="time"
                      value={taskData.time || ''}
                      onChange={(e) => updateTask({ time: e.target.value })}
                      size="sm"
                      maxW="150px"
                      bg={useColorModeValue("white", "gray.700")}
                    />
                  </HStack>
                </Box>
              </HStack>
            </VStack>
          </Box>
        </Collapse>
      </VStack>
    </Box>
  );
});

TaskItem.displayName = "TaskItem";

const AddTaskModal = memo(({ isOpen, onClose, onAdd }) => {
  const [task, setTask] = useState({
    text: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
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
        date: new Date().toISOString().split('T')[0],
        time: "",
        done: false,
        emoji: "",
      });
      onClose();
    }
  }, [task, onAdd, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Input
              placeholder="Task description (start with emoji if desired)"
              value={task.text}
              onChange={(e) => setTask({ ...task, text: e.target.value })}
            />
            <Textarea
              placeholder="Notes (optional)"
              value={task.notes}
              onChange={(e) => setTask({ ...task, notes: e.target.value })}
            />
            <HStack width="100%">
              <Input
                type="date"
                value={task.date}
                onChange={(e) => setTask({ ...task, date: e.target.value })}
              />
              <Input
                type="time"
                value={task.time}
                onChange={(e) => setTask({ ...task, time: e.target.value })}
              />
            </HStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Add Task
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

AddTaskModal.displayName = "AddTaskModal";

const TodoList = ({ listId = "daily-tasks" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const store = useStore();
  
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });

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
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) playAdd();
    }
  );

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter and sort tasks using imperative store reads keyed on todoIds
  const { todayTasks, previousTasks } = useMemo(() => {
    const getTimeValue = (id: string) => {
      const time = store?.getCell("todos", id, "time");
      if (!time) return '23:59';
      return String(time);
    };

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
      return getTimeValue(aId).localeCompare(getTimeValue(bId));
    });

    return sorted;
  }, [todoIds, store, today]);

  const progressLabel = useMemo(() => {
    const count = todoIds.length;
    if (count === 0) return "What's on today? ☀️";
    if (count <= 2) return "Day's taking shape 📋";
    if (count <= 5) return "Packed day ahead! 💪";
    return "Crushing it today! 🔥";
  }, [todoIds.length]);

  // Debug logging
  useEffect(() => {
    console.log('Task distribution updated:', {
      listId,
      today,
      todayTasksCount: todayTasks.length,
      previousTasksCount: previousTasks.length,
      relationshipIds: todoIds
    });
  }, [todayTasks, previousTasks, listId, today, todoIds]);

  const bgGradient = useColorModeValue(
    "linear(to-br, cyan.50, blue.50)",
    "linear(to-br, gray.900, blue.900)"
  );
  const todayBgColor = useColorModeValue("blue.100", "blue.900");
  const previousBgColor = useColorModeValue("blue.100", "blue.900");
  const headerColor = useColorModeValue("blue.700", "blue.200");
  const subTextColor = useColorModeValue("blue.500", "blue.300");

  return (
    <Box maxW="800px" mx="auto" p={4} bgGradient={bgGradient} borderRadius="xl" overflow="hidden" boxShadow="xl">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Box as={motion.div} animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <CalendarCheck size={32} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color={headerColor}>
                {listData?.name || "Daily Tasks"}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </VStack>
          </HStack>
          <Button
            leftIcon={<Plus />}
            colorScheme="blue"
            onClick={onOpen}
          >
            Add Task
          </Button>
        </HStack>

        <Box bg={todayBgColor} p={4} borderRadius="lg" boxShadow="md">
          <HStack mb={4}>
            <Text fontSize="lg" fontWeight="bold">Todo</Text>
            <Badge colorScheme="blue">{todayTasks.length}</Badge>
          </HStack>
          <VStack spacing={2} align="stretch">
            <AnimatePresence>
              {todayTasks.map((id) => (
                <TaskItem key={`today-${id}`} id={id} isTodaySection={true} />
              ))}
            </AnimatePresence>
            {todayTasks.length === 0 && (
              <VStack py={8} spacing={3}>
                <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                  <Text fontSize="5xl">☀️</Text>
                </Box>
                <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">No tasks for today</Text>
                <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add tasks to plan your day</Text>
              </VStack>
            )}
          </VStack>
        </Box>

        {previousTasks.length > 0 && (
          <Box bg={previousBgColor} p={4} borderRadius="lg" boxShadow="md">
            <HStack mb={4}>
              <Text fontSize="lg" fontWeight="bold">Todidn't</Text>
              <Badge colorScheme="blue">{previousTasks.length}</Badge>
            </HStack>
            <VStack spacing={2} align="stretch">
              <AnimatePresence>
                {previousTasks.map((id) => (
                  <TaskItem key={`previous-${id}`} id={id} isTodaySection={false} />
                ))}
              </AnimatePresence>
            </VStack>
          </Box>
        )}
      </VStack>

      <AddTaskModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={addTask}
      />
    </Box>
  );
};

export default TodoList;
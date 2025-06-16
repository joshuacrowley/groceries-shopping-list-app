import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
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
  EggCrack
} from "@phosphor-icons/react";

const STAGES = [
  { name: "Day Ahead", icon: ClockCounterClockwise, color: "purple" },
  { name: "Prep", icon: Knife, color: "blue" },
  { name: "Cook", icon: CookingPot, color: "orange" },
  { name: "Serve", icon: ForkKnife, color: "green" },
  { name: "Store", icon: Package, color: "red" },
];

const FOOD_EMOJIS = ["🥩", "🍄", "🧀", "🧄", "🥕", "🥘", "🥛", "🍅", "🍖", "🍝", "👩‍🍳", "⏲️", "🌿", "🍞", "🥡", "📝", "❄️", "🧈", "🥜", "🍫", "⚖️", "🥚", "🍪", "🔥", "⚪", "🍽️", "🥛", "📸", "📄", "🔒"];

const TaskItem = ({ id }: { id: string }) => {
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

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const stageColor = STAGES.find(s => s.name === taskData?.category)?.color || "gray";

  if (!taskData) return null;

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      opacity={taskData.done ? 0.6 : 1}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <HStack spacing={3} align="flex-start">
        <Checkbox
          isChecked={taskData.done}
          onChange={handleToggle}
          colorScheme={stageColor}
          mt={1}
        />
        <Text fontSize="xl" lineHeight="1">
          {taskData.emoji || "🔸"}
        </Text>
        <VStack spacing={1} align="flex-start" flex={1}>
          <Text 
            color={textColor} 
            textDecoration={taskData.done ? "line-through" : "none"}
            fontWeight="medium"
          >
            {taskData.text}
          </Text>
          <Tooltip label={taskData.notes} hasArrow placement="top">
            <Badge 
              colorScheme="yellow" 
              fontSize="xs"
              maxW="200px"
              isTruncated
            >
              {taskData.notes}
            </Badge>
          </Tooltip>
        </VStack>
        <Badge colorScheme={stageColor} variant="subtle">
          {taskData.time}
        </Badge>
        <IconButton
          icon={<Trash />}
          onClick={deleteTask}
          aria-label="Delete task"
          size="sm"
          colorScheme="red"
          variant="ghost"
        />
      </HStack>
    </Box>
  );
};

const AddTaskModal = ({ isOpen, onClose, onAdd }) => {
  const [newTask, setNewTask] = useState({
    text: "",
    category: STAGES[0].name,
    notes: "",
    emoji: "🔸",
    time: "",
    done: false,
    type: "A",
  });

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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <HStack width="100%">
              <Menu>
                <MenuButton as={Button}>
                  <HStack>
                    <Text>{newTask.emoji}</Text>
                    <CaretDown />
                  </HStack>
                </MenuButton>
                <MenuList maxH="200px" overflowY="auto">
                  {FOOD_EMOJIS.map((emoji) => (
                    <MenuItem
                      key={emoji}
                      onClick={() => setNewTask({ ...newTask, emoji })}
                    >
                      {emoji}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
              <Input
                flex={1}
                placeholder="Task description"
                value={newTask.text}
                onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
              />
            </HStack>
            <Input
              placeholder="Recipe name"
              value={newTask.notes}
              onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
            />
            <Input
              type="time"
              value={newTask.time}
              onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
            />
            <Select
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
            >
              {STAGES.map(({ name }) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
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
};

const BatchCookingList = ({ listId = "batch-cooking" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Get all todos data reactively
  const todosTable = useTable("todos");
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  // Group tasks by stage reactively
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

  // Debug logging
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
    (task: typeof AddTaskModal.prototype.state.newTask) => ({
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

  const bgColor = useColorModeValue("orange.50", "gray.800");
  const headerBgColor = useColorModeValue("white", "gray.700");

  return (
    <Box maxW="800px" mx="auto" p={4}>
      <VStack spacing={6} align="stretch">
        <Box bg={headerBgColor} p={4} borderRadius="lg" boxShadow="sm">
          <HStack justify="space-between">
            <HStack>
              <EggCrack size={32} />
              <Text fontSize="2xl" fontWeight="bold">
                {listData?.name || "Batch Cooking"}
              </Text>
            </HStack>
            <Button
              leftIcon={<Plus />}
              colorScheme="orange"
              onClick={onOpen}
            >
              Add Task
            </Button>
          </HStack>
        </Box>

        {STAGES.map(({ name, icon: Icon, color }) => {
          const tasks = groupedTasks[name] || [];
          if (tasks.length === 0) return null;

          return (
            <Box key={name} bg={bgColor} p={4} borderRadius="lg">
              <HStack mb={4} color={`${color}.500`}>
                <Icon size={24} />
                <Text fontSize="lg" fontWeight="bold">
                  {name}
                </Text>
                <Badge colorScheme={color}>{tasks.length}</Badge>
              </HStack>
              <VStack spacing={2} align="stretch">
                <AnimatePresence>
                  {tasks.map((id) => (
                    <TaskItem key={id} id={id} />
                  ))}
                </AnimatePresence>
              </VStack>
            </Box>
          );
        })}
      </VStack>

      <AddTaskModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={addTask}
      />
    </Box>
  );
};

export default BatchCookingList;
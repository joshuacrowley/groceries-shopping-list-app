import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
import {
  useStore,
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
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
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

const STAGES = [
  { name: "Day Ahead", icon: ClockCounterClockwise, color: "purple" },
  { name: "Prep", icon: Knife, color: "blue" },
  { name: "Cook", icon: CookingPot, color: "orange" },
  { name: "Serve", icon: ForkKnife, color: "green" },
  { name: "Store", icon: Package, color: "red" },
];

const FOOD_EMOJIS = ["🥩", "🍄", "🧀", "🧄", "🥕", "🥘", "🥛", "🍅", "🍖", "🍝", "👩‍🍳", "⏲️", "🌿", "🍞", "🥡", "📝", "❄️", "🧈", "🥜", "🍫", "⚖️", "🥚", "🍪", "🔥", "⚪", "🍽️", "🥛", "📸", "📄", "🔒"];

const TaskItem = memo(({ id }: { id: string }) => {
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
});
TaskItem.displayName = "TaskItem";

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
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });
  
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  // Group tasks by stage using imperative store reads
  const { groupedTasks, totalTasks } = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const category = String(store?.getCell("todos", id, "category") || STAGES[0].name);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(id);
    });
    return { groupedTasks: grouped, totalTasks: todoIds.length };
  }, [todoIds, store]);

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

  const bgGradient = useColorModeValue(
    "linear-gradient(180deg, #FFF8F0 0%, #FFFAF5 50%, white 100%)",
    "linear-gradient(180deg, #3d2a1a 0%, #2D3748 100%)"
  );
  const headerColor = useColorModeValue("orange.700", "orange.200");
  const subTextColor = useColorModeValue("orange.500", "orange.300");
  const colorMode = useColorModeValue("light", "dark");

  const progressLabel = useMemo(() => {
    if (totalTasks === 0) return "Ready to cook? Add your recipe steps! 👩‍🍳";
    if (totalTasks <= 3) return "Mise en place... 🔪";
    if (totalTasks <= 8) return "Recipe taking shape! 📋";
    if (totalTasks <= 15) return "Serious batch cook incoming 🍳";
    return "Chef mode: activated! 👨‍🍳";
  }, [totalTasks]);

  return (
    <Box maxW="800px" mx="auto" borderRadius="xl" overflow="hidden" boxShadow="xl" bgGradient={bgGradient} position="relative">
      <VStack spacing={5} align="stretch" p={5}>
        <HStack justify="space-between" alignItems="flex-start">
          <HStack spacing={3}>
            <Box
              as={motion.div}
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <DynamicIcon iconName={String(listData?.icon || "EggCrack")} size={36} weight="fill" />
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={headerColor}>
                {String(listData?.name || "Batch Cooking")}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </Box>
          </HStack>
          <HStack spacing={2}>
            <Badge colorScheme="orange" fontSize="sm" px={3} py={1} borderRadius="full">
              {totalTasks} {totalTasks === 1 ? "step" : "steps"}
            </Badge>
            <Button leftIcon={<Plus />} colorScheme="orange" onClick={onOpen} size="sm" borderRadius="md">
              Add
            </Button>
          </HStack>
        </HStack>

        {STAGES.map(({ name, icon: Icon, color }) => {
          const tasks = groupedTasks[name] || [];
          if (tasks.length === 0) return null;
          return (
            <Box key={name} bg={colorMode === "light" ? `${color}.50` : `${color}.900`} p={4} borderRadius="lg">
              <HStack mb={3} color={`${color}.500`}>
                <Icon size={24} weight="fill" />
                <Text fontSize="lg" fontWeight="bold">{name}</Text>
                <Badge colorScheme={color} borderRadius="full">{tasks.length}</Badge>
              </HStack>
              <VStack spacing={2} align="stretch">
                {tasks.map((id) => (<TaskItem key={id} id={id} />))}
              </VStack>
            </Box>
          );
        })}

        {totalTasks === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🍳</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">No recipe steps yet</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add your first cooking task to get started with your batch cook</Text>
          </VStack>
        )}
      </VStack>

      <AddTaskModal isOpen={isOpen} onClose={onClose} onAdd={(task) => { addTask(task); playAdd(); }} />
    </Box>
  );
};

export default BatchCookingList;
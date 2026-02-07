import React, { useState, useCallback, useMemo, memo } from "react";
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
} from "tinybase/ui-react";
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  IconButton,
  useColorModeValue,
  Badge,
  Select,
  Checkbox,
  InputGroup,
  InputRightElement,
  Tooltip,
  useToast,
  Flex,
} from "@chakra-ui/react";
import {
  Backpack,
  Trash,
  Plus,
  Cookie,
  BookOpen,
  Basketball,
  Bathtub,
  Moon,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const STEPS = [
  { name: "Arrive Home", emoji: "🏠", order: 1 },
  { name: "Snack Time", emoji: "🍎", order: 2 },
  { name: "Homework", emoji: "📚", order: 3 },
  { name: "Free Time", emoji: "🎮", order: 4 },
  { name: "Activities", emoji: "⚽", order: 5 },
  { name: "Dinner Prep", emoji: "🍽️", order: 6 },
  { name: "Bath & Wind Down", emoji: "🛁", order: 7 },
  { name: "Bedtime", emoji: "🌙", order: 8 },
];

const RoutineItem = memo(({ id }) => {
  const todoData = useRow("todos", id);
  const updateTodo = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...todoData, ...updates }),
    [todoData]
  );
  const deleteTodo = useDelRowCallback("todos", id);
  const [playComplete] = useSound("/sounds/complete/Complete 1.m4a", { volume: 0.5 });
  const [playDelete] = useSound("/sounds/cancel/Cancel 1.m4a", { volume: 0.5 });
  const toast = useToast();

  const isDone = Boolean(todoData.done);
  const step = STEPS.find((s) => s.name === String(todoData.category)) || { name: String(todoData.category || "Other"), emoji: "📋", order: 99 };

  const handleToggle = useCallback(() => {
    const newDone = !isDone;
    updateTodo({ done: newDone });
    if (newDone) {
      playComplete();
      toast({
        title: "Great job! ⭐",
        status: "success",
        duration: 1500,
        isClosable: true,
      });
    }
  }, [isDone, updateTodo, playComplete, toast]);

  const handleDelete = useCallback(() => {
    deleteTodo();
    playDelete();
  }, [deleteTodo, playDelete]);

  const cardBg = useColorModeValue("white", "gray.700");
  const doneBg = useColorModeValue("orange.50", "orange.900");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const doneBorder = useColorModeValue("orange.200", "orange.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <HStack
      bg={isDone ? doneBg : cardBg}
      px={3}
      py={2}
      borderRadius="lg"
      border="1px solid"
      borderColor={isDone ? doneBorder : borderColor}
      opacity={isDone ? 0.7 : 1}
      spacing={3}
      css={{ transition: "all 0.2s ease" }}
    >
      <Checkbox
        isChecked={isDone}
        onChange={handleToggle}
        colorScheme="orange"
        size="lg"
      />
      <Text fontSize="lg">{step.emoji}</Text>
      <VStack align="start" spacing={0} flex={1}>
        <Text
          fontWeight="medium"
          color={textColor}
          textDecoration={isDone ? "line-through" : "none"}
          fontSize="sm"
        >
          {String(todoData.text)}
        </Text>
        {todoData.notes && (
          <Text fontSize="xs" color={mutedColor} noOfLines={1}>
            {String(todoData.notes)}
          </Text>
        )}
      </VStack>
      <Badge colorScheme="orange" variant="subtle" fontSize="10px" borderRadius="full">
        {step.name}
      </Badge>
      <Tooltip label="Remove">
        <IconButton
          icon={<Trash weight="bold" />}
          onClick={handleDelete}
          aria-label="Delete task"
          size="sm"
          variant="ghost"
          colorScheme="red"
        />
      </Tooltip>
    </HStack>
  );
});
RoutineItem.displayName = "RoutineItem";

const AfterSchoolRoutine = ({ listId = "after-school-routine" }) => {
  const [newTask, setNewTask] = useState("");
  const [selectedStep, setSelectedStep] = useState(STEPS[0].name);
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.5 });

  const store = useStore();
  const listData = useRow("lists", listId);
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const toast = useToast();

  const doneCount = useMemo(() => {
    let count = 0;
    todoIds.forEach((id) => {
      if (store.getCell("todos", id, "done")) count++;
    });
    return count;
  }, [todoIds, store]);

  const stepGroups = useMemo(() => {
    const groups = {};
    todoIds.forEach((id) => {
      const cat = store.getCell("todos", id, "category") || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(id);
    });
    return groups;
  }, [todoIds, store]);

  const sortedSteps = useMemo(() => {
    return STEPS.filter((s) => stepGroups[s.name]?.length > 0).sort(
      (a, b) => a.order - b.order
    );
  }, [stepGroups]);

  const addTodo = useAddRowCallback(
    "todos",
    (text) => ({
      list: listId,
      text: String(text).trim(),
      notes: "",
      done: false,
      category: selectedStep,
      emoji: "",
      date: "",
      time: "",
      url: "",
      email: "",
      streetAddress: "",
      number: 0,
      amount: 0,
      fiveStarRating: 1,
      type: "A",
    }),
    [listId, selectedStep],
    store,
    (rowId) => {
      if (rowId) {
        setNewTask("");
        playAdd();
      }
    }
  );

  const handleAdd = useCallback(() => {
    if (newTask.trim()) addTodo(newTask);
  }, [addTodo, newTask]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && newTask.trim()) addTodo(newTask);
    },
    [addTodo, newTask]
  );

  const bgGradient = useColorModeValue(
    "linear(to-b, orange.50, white)",
    "linear(to-b, orange.900, gray.800)"
  );
  const cardBg = useColorModeValue("white", "gray.700");
  const headerColor = useColorModeValue("orange.700", "orange.200");
  const subColor = useColorModeValue("gray.500", "gray.400");
  const accentHex = useColorModeValue("#C05621", "#ED8936");

  const progressPct = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const statusLabel = useMemo(() => {
    if (todoIds.length === 0) return "Set up the routine";
    if (progressPct === 100) return "All done for today! 🌟";
    if (progressPct >= 50) return "More than halfway there!";
    return "Let's get going!";
  }, [todoIds.length, progressPct]);

  return (
    <Box
      maxWidth="600px"
      margin="auto"
      bgGradient={bgGradient}
      borderRadius="xl"
      boxShadow="xl"
      overflow="hidden"
      minH="500px"
    >
      {/* Header */}
      <Box bg={cardBg} px={5} py={4} borderBottom="1px solid" borderColor={useColorModeValue("orange.100", "orange.800")}>
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Backpack size={24} weight="fill" color={accentHex} />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={headerColor}>
                {listData?.name || "After-School Routine"}
              </Text>
              <Text fontSize="xs" color={subColor}>
                {statusLabel}
              </Text>
            </VStack>
          </HStack>
          {todoIds.length > 0 && (
            <Badge
              colorScheme={progressPct === 100 ? "green" : "orange"}
              variant="subtle"
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              {doneCount}/{todoIds.length}
            </Badge>
          )}
        </HStack>

        {/* Progress bar */}
        {todoIds.length > 0 && (
          <Box mt={3} bg={useColorModeValue("gray.100", "gray.600")} borderRadius="full" h="6px" overflow="hidden">
            <Box
              bg="orange.400"
              h="100%"
              borderRadius="full"
              w={`${progressPct}%`}
              css={{ transition: "width 0.4s ease" }}
            />
          </Box>
        )}
      </Box>

      {/* Add task */}
      <Box px={5} pt={4}>
        <HStack spacing={2}>
          <Select
            size="sm"
            value={selectedStep}
            onChange={(e) => setSelectedStep(e.target.value)}
            bg={cardBg}
            w="160px"
            borderRadius="lg"
          >
            {STEPS.map((s) => (
              <option key={s.name} value={s.name}>
                {s.emoji} {s.name}
              </option>
            ))}
          </Select>
          <InputGroup size="sm" flex={1}>
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a routine step..."
              bg={cardBg}
              borderRadius="lg"
              pr="3.5rem"
            />
            <InputRightElement width="3.5rem">
              <Button h="1.5rem" size="xs" onClick={handleAdd} colorScheme="orange">
                <Plus weight="bold" size={14} />
              </Button>
            </InputRightElement>
          </InputGroup>
        </HStack>
      </Box>

      {/* Tasks by step */}
      <Box p={5}>
        <VStack spacing={4} align="stretch">
          {sortedSteps.map((step, idx) => (
            <Box key={step.name}>
              <HStack spacing={2} mb={2}>
                <Flex
                  w="20px"
                  h="20px"
                  borderRadius="full"
                  bg={useColorModeValue("orange.100", "orange.800")}
                  align="center"
                  justify="center"
                >
                  <Text fontSize="10px" fontWeight="bold" color={headerColor}>
                    {idx + 1}
                  </Text>
                </Flex>
                <Text fontSize="sm" fontWeight="bold" color={headerColor}>
                  {step.emoji} {step.name}
                </Text>
              </HStack>
              <VStack spacing={2} align="stretch" pl={2} borderLeft="2px solid" borderColor={useColorModeValue("orange.100", "orange.800")}>
                {stepGroups[step.name].map((id) => (
                  <RoutineItem key={id} id={id} />
                ))}
              </VStack>
            </Box>
          ))}

          {/* Uncategorized items */}
          {Object.keys(stepGroups)
            .filter((k) => !STEPS.find((s) => s.name === k))
            .map((cat) => (
              <Box key={cat}>
                <Text fontSize="sm" fontWeight="bold" color={headerColor} mb={2}>
                  📋 {cat}
                </Text>
                <VStack spacing={2} align="stretch">
                  {stepGroups[cat].map((id) => (
                    <RoutineItem key={id} id={id} />
                  ))}
                </VStack>
              </Box>
            ))}

          {/* Empty state */}
          {todoIds.length === 0 && (
            <VStack py={10} spacing={3}>
              <Text fontSize="4xl">🎒</Text>
              <Text textAlign="center" color={headerColor} fontWeight="medium">
                No routine set up yet!
              </Text>
              <Text textAlign="center" color={subColor} fontSize="sm" maxW="280px">
                Build an after-school routine with steps like snack time, homework, and free time
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default AfterSchoolRoutine;

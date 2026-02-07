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
  SunHorizon,
  Trash,
  Plus,
  Coffee,
  Alarm,
  Sun,
  Drop,
  CheckCircle,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const PHASES = [
  { name: "Wake Up", emoji: "⏰", order: 1 },
  { name: "Hygiene", emoji: "🪥", order: 2 },
  { name: "Get Dressed", emoji: "👔", order: 3 },
  { name: "Breakfast", emoji: "🥣", order: 4 },
  { name: "Prep & Pack", emoji: "🎒", order: 5 },
  { name: "Quick Tidy", emoji: "🧹", order: 6 },
  { name: "Out the Door", emoji: "🚪", order: 7 },
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
  const phase = PHASES.find((p) => p.name === String(todoData.category)) || { name: String(todoData.category || "Other"), emoji: "📋", order: 99 };

  const handleToggle = useCallback(() => {
    const newDone = !isDone;
    updateTodo({ done: newDone });
    if (newDone) {
      playComplete();
    }
  }, [isDone, updateTodo, playComplete]);

  const handleDelete = useCallback(() => {
    deleteTodo();
    playDelete();
  }, [deleteTodo, playDelete]);

  const cardBg = useColorModeValue("white", "gray.700");
  const doneBg = useColorModeValue("yellow.50", "yellow.900");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const doneBorder = useColorModeValue("yellow.200", "yellow.700");
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
        colorScheme="yellow"
        size="lg"
      />
      <VStack align="start" spacing={0} flex={1}>
        <Text
          fontWeight="medium"
          color={textColor}
          textDecoration={isDone ? "line-through" : "none"}
          fontSize="sm"
        >
          {String(todoData.text)}
        </Text>
        {todoData.time && (
          <HStack spacing={1}>
            <Alarm size={12} color={mutedColor} />
            <Text fontSize="xs" color={mutedColor}>
              {String(todoData.time)}
            </Text>
          </HStack>
        )}
        {todoData.notes && (
          <Text fontSize="xs" color={mutedColor} noOfLines={1}>
            {String(todoData.notes)}
          </Text>
        )}
      </VStack>
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

const MorningRoutine = ({ listId = "morning-routine" }) => {
  const [newTask, setNewTask] = useState("");
  const [selectedPhase, setSelectedPhase] = useState(PHASES[0].name);
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

  const phaseGroups = useMemo(() => {
    const groups = {};
    todoIds.forEach((id) => {
      const cat = store.getCell("todos", id, "category") || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(id);
    });
    return groups;
  }, [todoIds, store]);

  const sortedPhases = useMemo(() => {
    return PHASES.filter((p) => phaseGroups[p.name]?.length > 0).sort(
      (a, b) => a.order - b.order
    );
  }, [phaseGroups]);

  const addTodo = useAddRowCallback(
    "todos",
    (text) => ({
      list: listId,
      text: String(text).trim(),
      notes: "",
      done: false,
      category: selectedPhase,
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
    [listId, selectedPhase],
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
    "linear(to-b, yellow.50, orange.50, white)",
    "linear(to-b, yellow.900, gray.800)"
  );
  const cardBg = useColorModeValue("white", "gray.700");
  const headerColor = useColorModeValue("orange.600", "yellow.200");
  const subColor = useColorModeValue("gray.500", "gray.400");
  const accentHex = useColorModeValue("#C05621", "#F6AD55");

  const progressPct = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

  const statusLabel = useMemo(() => {
    if (todoIds.length === 0) return "Build your morning flow";
    if (progressPct === 100) return "Ready to go! ☀️";
    if (progressPct >= 75) return "Almost out the door!";
    if (progressPct >= 50) return "Halfway there!";
    return "Rise and shine!";
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
            <SunHorizon size={26} weight="fill" color={accentHex} />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={headerColor}>
                {listData?.name || "Morning Routine"}
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
              {progressPct === 100 ? "Done! ☀️" : `${doneCount}/${todoIds.length}`}
            </Badge>
          )}
        </HStack>

        {/* Progress bar */}
        {todoIds.length > 0 && (
          <Box mt={3} bg={useColorModeValue("gray.100", "gray.600")} borderRadius="full" h="6px" overflow="hidden">
            <Box
              bg={useColorModeValue("orange.300", "yellow.400")}
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
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            bg={cardBg}
            w="155px"
            borderRadius="lg"
          >
            {PHASES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.emoji} {p.name}
              </option>
            ))}
          </Select>
          <InputGroup size="sm" flex={1}>
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a step..."
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

      {/* Tasks by phase */}
      <Box p={5}>
        <VStack spacing={4} align="stretch">
          {sortedPhases.map((phase, idx) => {
            const phaseItems = phaseGroups[phase.name] || [];
            const phaseDone = phaseItems.filter((id) => store.getCell("todos", id, "done")).length;
            const allPhaseDone = phaseDone === phaseItems.length && phaseItems.length > 0;

            return (
              <Box key={phase.name}>
                <HStack spacing={2} mb={2}>
                  <Flex
                    w="22px"
                    h="22px"
                    borderRadius="full"
                    bg={allPhaseDone ? useColorModeValue("green.100", "green.800") : useColorModeValue("orange.100", "orange.800")}
                    align="center"
                    justify="center"
                  >
                    {allPhaseDone ? (
                      <CheckCircle size={14} weight="fill" color="#38A169" />
                    ) : (
                      <Text fontSize="10px" fontWeight="bold" color={headerColor}>
                        {idx + 1}
                      </Text>
                    )}
                  </Flex>
                  <Text fontSize="sm" fontWeight="bold" color={allPhaseDone ? useColorModeValue("green.600", "green.300") : headerColor}>
                    {phase.emoji} {phase.name}
                  </Text>
                  <Badge
                    colorScheme={allPhaseDone ? "green" : "orange"}
                    variant="outline"
                    fontSize="10px"
                  >
                    {phaseDone}/{phaseItems.length}
                  </Badge>
                </HStack>
                <VStack spacing={2} align="stretch" pl={3} borderLeft="2px solid" borderColor={allPhaseDone ? useColorModeValue("green.200", "green.700") : useColorModeValue("orange.100", "orange.800")}>
                  {phaseItems.map((id) => (
                    <RoutineItem key={id} id={id} />
                  ))}
                </VStack>
              </Box>
            );
          })}

          {/* Uncategorized items */}
          {Object.keys(phaseGroups)
            .filter((k) => !PHASES.find((p) => p.name === k))
            .map((cat) => (
              <Box key={cat}>
                <Text fontSize="sm" fontWeight="bold" color={headerColor} mb={2}>
                  📋 {cat}
                </Text>
                <VStack spacing={2} align="stretch">
                  {phaseGroups[cat].map((id) => (
                    <RoutineItem key={id} id={id} />
                  ))}
                </VStack>
              </Box>
            ))}

          {/* Empty state */}
          {todoIds.length === 0 && (
            <VStack py={10} spacing={3}>
              <Text fontSize="4xl">🌅</Text>
              <Text textAlign="center" color={headerColor} fontWeight="medium">
                No morning routine yet!
              </Text>
              <Text textAlign="center" color={subColor} fontSize="sm" maxW="280px">
                Set up your morning steps from wake up to out the door -- then check them off each day
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default MorningRoutine;

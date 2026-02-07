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
  Flex,
  InputGroup,
  InputRightElement,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import {
  Broom,
  Trash,
  Plus,
  SprayBottle,
  Drop,
  Sparkle,
  CheckCircle,
  House,
  Timer,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const ROOMS = [
  { name: "Living Room", emoji: "🛋️" },
  { name: "Kitchen", emoji: "🍳" },
  { name: "Bedroom", emoji: "🛏️" },
  { name: "Bathroom", emoji: "🚿" },
  { name: "Kids Room", emoji: "🧸" },
  { name: "Office", emoji: "💻" },
  { name: "Hallway", emoji: "🚪" },
  { name: "Other", emoji: "🏠" },
];

const TidyItem = memo(({ id }) => {
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
  const room = ROOMS.find((r) => r.name === String(todoData.category)) || ROOMS[ROOMS.length - 1];

  const handleToggle = useCallback(() => {
    const newDone = !isDone;
    updateTodo({ done: newDone });
    if (newDone) {
      playComplete();
      toast({
        title: "Sparkling clean! ✨",
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
  const doneBg = useColorModeValue("green.50", "green.900");
  const borderColor = useColorModeValue("gray.100", "gray.600");
  const doneBorder = useColorModeValue("green.200", "green.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      bg={isDone ? doneBg : cardBg}
      p={3}
      borderRadius="lg"
      border="1px solid"
      borderColor={isDone ? doneBorder : borderColor}
      opacity={isDone ? 0.7 : 1}
      css={{ transition: "all 0.2s ease" }}
    >
      <HStack spacing={3}>
        <Checkbox
          isChecked={isDone}
          onChange={handleToggle}
          colorScheme="teal"
          size="lg"
        />
        <Text fontSize="xl">{room.emoji}</Text>
        <VStack align="start" spacing={0} flex={1}>
          <Text
            fontWeight="medium"
            color={textColor}
            textDecoration={isDone ? "line-through" : "none"}
            fontSize="sm"
          >
            {String(todoData.text)}
          </Text>
          <HStack spacing={2}>
            <Badge
              colorScheme="teal"
              variant="subtle"
              fontSize="10px"
              borderRadius="full"
            >
              {room.name}
            </Badge>
            {todoData.notes && (
              <Text fontSize="xs" color={mutedColor} noOfLines={1}>
                {String(todoData.notes)}
              </Text>
            )}
          </HStack>
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
    </Box>
  );
});
TidyItem.displayName = "TidyItem";

const TidyUp = ({ listId = "tidy-up" }) => {
  const [newTask, setNewTask] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0].name);
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

  const roomGroups = useMemo(() => {
    const groups = {};
    todoIds.forEach((id) => {
      const cat = store.getCell("todos", id, "category") || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(id);
    });
    return groups;
  }, [todoIds, store]);

  const addTodo = useAddRowCallback(
    "todos",
    (text) => ({
      list: listId,
      text: String(text).trim(),
      notes: "",
      done: false,
      category: selectedRoom,
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
    [listId, selectedRoom],
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
    "linear(to-b, teal.50, white)",
    "linear(to-b, teal.900, gray.800)"
  );
  const cardBg = useColorModeValue("white", "gray.700");
  const headerColor = useColorModeValue("teal.700", "teal.200");
  const subColor = useColorModeValue("gray.500", "gray.400");

  const progressPct = todoIds.length > 0 ? Math.round((doneCount / todoIds.length) * 100) : 0;

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
      <Box bg={cardBg} px={5} py={4} borderBottom="1px solid" borderColor={useColorModeValue("teal.100", "teal.800")}>
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Broom size={24} weight="fill" color="#319795" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={headerColor}>
                {listData?.name || "Tidy Up"}
              </Text>
              <Text fontSize="xs" color={subColor}>
                {todoIds.length === 0
                  ? "Add some tasks to get started"
                  : `${doneCount}/${todoIds.length} done`}
              </Text>
            </VStack>
          </HStack>
          {todoIds.length > 0 && (
            <Badge
              colorScheme={progressPct === 100 ? "green" : "teal"}
              variant="subtle"
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
            >
              {progressPct === 100 ? "All done! ✨" : `${progressPct}%`}
            </Badge>
          )}
        </HStack>

        {/* Progress bar */}
        {todoIds.length > 0 && (
          <Box mt={3} bg={useColorModeValue("gray.100", "gray.600")} borderRadius="full" h="6px" overflow="hidden">
            <Box
              bg="teal.400"
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
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            bg={cardBg}
            w="140px"
            borderRadius="lg"
          >
            {ROOMS.map((r) => (
              <option key={r.name} value={r.name}>
                {r.emoji} {r.name}
              </option>
            ))}
          </Select>
          <InputGroup size="sm" flex={1}>
            <Input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What needs tidying?"
              bg={cardBg}
              borderRadius="lg"
              pr="3.5rem"
            />
            <InputRightElement width="3.5rem">
              <Button h="1.5rem" size="xs" onClick={handleAdd} colorScheme="teal">
                <Plus weight="bold" size={14} />
              </Button>
            </InputRightElement>
          </InputGroup>
        </HStack>
      </Box>

      {/* Tasks by room */}
      <Box p={5}>
        <VStack spacing={4} align="stretch">
          {ROOMS.filter((r) => roomGroups[r.name]?.length > 0).map((room) => (
            <Box key={room.name}>
              <HStack spacing={2} mb={2}>
                <Text fontSize="sm" fontWeight="bold" color={headerColor}>
                  {room.emoji} {room.name}
                </Text>
                <Badge colorScheme="teal" variant="outline" fontSize="10px">
                  {roomGroups[room.name].length}
                </Badge>
              </HStack>
              <VStack spacing={2} align="stretch">
                {roomGroups[room.name].map((id) => (
                  <TidyItem key={id} id={id} />
                ))}
              </VStack>
            </Box>
          ))}

          {/* Uncategorized items */}
          {Object.keys(roomGroups)
            .filter((k) => !ROOMS.find((r) => r.name === k))
            .map((cat) => (
              <Box key={cat}>
                <Text fontSize="sm" fontWeight="bold" color={headerColor} mb={2}>
                  🏠 {cat}
                </Text>
                <VStack spacing={2} align="stretch">
                  {roomGroups[cat].map((id) => (
                    <TidyItem key={id} id={id} />
                  ))}
                </VStack>
              </Box>
            ))}

          {/* Empty state */}
          {todoIds.length === 0 && (
            <VStack py={10} spacing={3}>
              <Text fontSize="4xl">🧹</Text>
              <Text textAlign="center" color={headerColor} fontWeight="medium">
                Nothing to tidy yet!
              </Text>
              <Text textAlign="center" color={subColor} fontSize="sm" maxW="260px">
                Add rooms and tasks to build your tidy-up checklist
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default TidyUp;

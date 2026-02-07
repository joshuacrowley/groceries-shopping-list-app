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
  IconButton,
  useColorModeValue,
  Collapse,
  useDisclosure,
  Badge,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Flex,
  Editable,
  EditableInput,
  EditablePreview,
  EditableTextarea,
  useEditableControls,
  Divider,
  InputGroup,
  InputRightElement,
  useToast,
  Tooltip,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  CaretDown,
  CaretUp,
  Heart,
  CalendarCheck,
  Star,
  PencilSimple,
  Check,
  Plus,
  Notepad,
  Coins,
  MapPin,
  Clock,
  MoonStars,
  Sun,
  Sunset,
} from "@phosphor-icons/react";
import {
  format,
  parse,
  differenceInDays,
  isToday,
  isFuture,
  isPast,
  parseISO,
} from "date-fns";
import useSound from "use-sound";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

const EMOJI_OPTIONS = [
  "❤️", "🍷", "🍽️", "🎬", "🎮", "🍿", "🎨",
  "🌃", "🎢", "🏖️", "🥂", "💃", "🎭", "🎪", "🌹",
];

const EditableControls = () => {
  const { isEditing, getSubmitButtonProps, getEditButtonProps } = useEditableControls();
  return isEditing ? (
    <IconButton
      icon={<Check weight="bold" />}
      {...getSubmitButtonProps()}
      aria-label="Confirm"
      size="xs"
      colorScheme="pink"
      variant="ghost"
    />
  ) : (
    <IconButton
      icon={<PencilSimple weight="bold" />}
      {...getEditButtonProps()}
      aria-label="Edit"
      size="xs"
      colorScheme="pink"
      variant="ghost"
    />
  );
};

const DateNightItem = memo(({ id }) => {
  const { isOpen, onToggle } = useDisclosure();
  const [playEdit] = useSound("/sounds/notification/Notification 2.m4a", { volume: 0.5 });
  const [playDelete] = useSound("/sounds/cancel/Cancel 1.m4a", { volume: 0.5 });
  const [playComplete] = useSound("/sounds/complete/Complete 1.m4a", { volume: 0.5 });

  const todoData = useRow("todos", id);
  const updateTodo = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...todoData, ...updates }),
    [todoData]
  );
  const deleteTodo = useDelRowCallback("todos", id);
  const toast = useToast();

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    if (todoData.date) {
      try {
        const dateTime = String(todoData.date);
        if (dateTime.includes("T")) {
          const [datePart, timePart] = dateTime.split("T");
          setNewDate(datePart || "");
          setNewTime(timePart?.slice(0, 5) || "");
        } else {
          setNewDate(dateTime);
          setNewTime("");
        }
      } catch (e) {
        console.error("Error parsing date:", e);
      }
    }
  }, [todoData.date]);

  const handleDateTimeSubmit = useCallback(() => {
    if (newDate) {
      const dateTimeValue = newTime ? `${newDate}T${newTime}` : newDate;
      updateTodo({ date: dateTimeValue });
      playEdit();
    }
  }, [newDate, newTime, updateTodo, playEdit]);

  const handleDelete = useCallback(() => {
    deleteTodo();
    playDelete();
    toast({ title: "Idea removed", status: "info", duration: 1500, isClosable: true });
  }, [deleteTodo, playDelete, toast]);

  const handleDoneToggle = useCallback(() => {
    const newDone = !Boolean(todoData.done);
    updateTodo({ done: newDone });
    if (newDone) {
      playComplete();
      toast({ title: "Date night completed! 💖", status: "success", duration: 2500, isClosable: true });
    }
  }, [updateTodo, todoData.done, playComplete, toast]);

  const isDone = Boolean(todoData.done);

  // --- colours (top-level) ---
  const cardBg = useColorModeValue("white", "gray.750");
  const doneBg = useColorModeValue("pink.50", "gray.700");
  const borderIdle = useColorModeValue("pink.100", "gray.600");
  const borderHover = useColorModeValue("pink.300", "pink.500");
  const borderDone = useColorModeValue("green.200", "green.700");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const accentHex = useColorModeValue("#D53F8C", "#ED64A6");
  const detailBg = useColorModeValue("pink.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.600");

  // --- date parsing ---
  let formattedDate = "";
  let dateStatus = "";
  let dateBadgeColor = "gray";
  let TimeIcon = Clock;

  if (todoData.date) {
    try {
      const ds = String(todoData.date);
      const parsed = ds.includes("T") ? parseISO(ds) : parse(ds, "yyyy-MM-dd", new Date());
      formattedDate = ds.includes("T")
        ? format(parsed, "EEE, MMM d 'at' h:mm a")
        : format(parsed, "EEE, MMM d, yyyy");

      const hour = parsed.getHours?.() ?? 12;
      if (hour >= 17 && hour < 20) TimeIcon = Sunset;
      else if (hour >= 20 || hour < 5) TimeIcon = MoonStars;
      else TimeIcon = Sun;

      if (isToday(parsed)) { dateStatus = "Tonight"; dateBadgeColor = "green"; }
      else if (isPast(parsed)) { dateStatus = "Past"; dateBadgeColor = "gray"; }
      else if (isFuture(parsed)) {
        const days = differenceInDays(parsed, new Date());
        if (days === 1) { dateStatus = "Tomorrow"; dateBadgeColor = "orange"; }
        else if (days <= 7) { dateStatus = "This Week"; dateBadgeColor = "blue"; }
        else { dateStatus = "Upcoming"; dateBadgeColor = "purple"; }
      }
    } catch { /* skip */ }
  }

  return (
    <Box
      bg={isDone ? doneBg : cardBg}
      borderRadius="xl"
      border="1px solid"
      borderColor={isDone ? borderDone : borderIdle}
      overflow="hidden"
      opacity={isDone ? 0.75 : 1}
      css={{
        transition: "all 0.2s ease",
        "&:hover": { borderColor: isDone ? undefined : borderHover },
      }}
    >
      {/* Card face */}
      <Box px={4} py={3}>
        <HStack spacing={3} align="start">
          {/* Emoji */}
          <Text
            fontSize="2xl"
            cursor="pointer"
            onClick={onToggle}
            css={{ transition: "transform 0.15s", "&:hover": { transform: "scale(1.15)" } }}
            mt="2px"
          >
            {String(todoData.emoji || "❤️")}
          </Text>

          {/* Title + meta */}
          <VStack align="start" spacing={1} flex={1} minW={0}>
            <Editable
              defaultValue={String(todoData.text)}
              onSubmit={(v) => { updateTodo({ text: v }); playEdit(); }}
              isPreviewFocusable={false}
              width="100%"
            >
              <HStack spacing={1}>
                <EditablePreview
                  fontWeight="semibold"
                  color={textColor}
                  fontSize="md"
                  textDecoration={isDone ? "line-through" : "none"}
                  noOfLines={1}
                  cursor="pointer"
                />
                <EditableInput fontSize="md" fontWeight="semibold" />
                <EditableControls />
              </HStack>
            </Editable>

            <HStack spacing={3} flexWrap="wrap">
              {formattedDate && (
                <HStack spacing={1}>
                  <TimeIcon size={13} color={accentHex} />
                  <Text fontSize="xs" color={mutedColor}>{formattedDate}</Text>
                </HStack>
              )}
              {todoData.streetAddress && (
                <HStack spacing={1}>
                  <MapPin size={13} weight="fill" color={accentHex} />
                  <Text fontSize="xs" color={mutedColor} noOfLines={1}>{String(todoData.streetAddress)}</Text>
                </HStack>
              )}
              {Number(todoData.amount) > 0 && (
                <HStack spacing={1}>
                  <Coins size={13} weight="fill" color={accentHex} />
                  <Text fontSize="xs" color={mutedColor}>${Number(todoData.amount).toFixed(0)}</Text>
                </HStack>
              )}
            </HStack>
          </VStack>

          {/* Right side */}
          <VStack spacing={1} align="end" flexShrink={0}>
            <HStack spacing={2}>
              {dateStatus && (
                <Badge colorScheme={dateBadgeColor} borderRadius="full" fontSize="10px" px={2}>
                  {dateStatus}
                </Badge>
              )}
              <Checkbox
                isChecked={isDone}
                onChange={handleDoneToggle}
                colorScheme="pink"
                size="lg"
              />
            </HStack>
            <HStack spacing={0}>
              {RATING_OPTIONS.map((v) => (
                <Box
                  key={v}
                  as={Star}
                  size="14px"
                  weight={v <= (Number(todoData.fiveStarRating) || 1) ? "fill" : "regular"}
                  color={v <= (Number(todoData.fiveStarRating) || 1) ? "gold" : "#CBD5E0"}
                  cursor="pointer"
                  onClick={() => updateTodo({ fiveStarRating: v })}
                  css={{ transition: "transform 0.1s", "&:hover": { transform: "scale(1.2)" } }}
                />
              ))}
              <IconButton
                icon={isOpen ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
                onClick={onToggle}
                aria-label="Toggle details"
                size="xs"
                variant="ghost"
                colorScheme="pink"
                ml={1}
              />
              <IconButton
                icon={<Trash weight="bold" />}
                onClick={handleDelete}
                aria-label="Delete"
                size="xs"
                variant="ghost"
                colorScheme="red"
              />
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Expanded details */}
      <Collapse in={isOpen} animateOpacity>
        <Box bg={detailBg} px={4} py={4} borderTop="1px solid" borderColor={borderIdle}>
          <VStack align="stretch" spacing={4}>
            {/* Date & Time */}
            <VStack align="stretch" spacing={1}>
              <HStack spacing={1}>
                <CalendarCheck size={14} weight="fill" color={accentHex} />
                <Text fontWeight="semibold" fontSize="xs" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
                  Date & Time
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Input
                  type="date"
                  size="sm"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  onBlur={handleDateTimeSubmit}
                  bg={inputBg}
                  borderRadius="md"
                  flex={1}
                />
                <Input
                  type="time"
                  size="sm"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  onBlur={handleDateTimeSubmit}
                  bg={inputBg}
                  borderRadius="md"
                  w="130px"
                />
              </HStack>
            </VStack>

            {/* Location */}
            <VStack align="stretch" spacing={1}>
              <HStack spacing={1}>
                <MapPin size={14} weight="fill" color={accentHex} />
                <Text fontWeight="semibold" fontSize="xs" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
                  Location
                </Text>
              </HStack>
              <Editable
                defaultValue={String(todoData.streetAddress || "")}
                onSubmit={(v) => { updateTodo({ streetAddress: v }); playEdit(); }}
                placeholder="Where to?"
              >
                <EditablePreview
                  px={3}
                  py={2}
                  borderRadius="md"
                  bg={inputBg}
                  w="100%"
                  fontSize="sm"
                  minH="36px"
                  display="flex"
                  alignItems="center"
                  cursor="pointer"
                  color={todoData.streetAddress ? textColor : mutedColor}
                />
                <EditableInput px={3} py={2} bg={inputBg} borderRadius="md" />
                <EditableControls />
              </Editable>
            </VStack>

            {/* Budget */}
            <VStack align="stretch" spacing={1}>
              <HStack spacing={1}>
                <Coins size={14} weight="fill" color={accentHex} />
                <Text fontWeight="semibold" fontSize="xs" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
                  Budget
                </Text>
              </HStack>
              <NumberInput
                value={todoData.amount || 0}
                onChange={(_, v) => updateTodo({ amount: v || 0 })}
                min={0}
                precision={2}
                step={10}
                size="sm"
              >
                <NumberInputField bg={inputBg} borderRadius="md" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </VStack>

            {/* Notes */}
            <VStack align="stretch" spacing={1}>
              <HStack spacing={1}>
                <Notepad size={14} weight="fill" color={accentHex} />
                <Text fontWeight="semibold" fontSize="xs" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
                  Notes
                </Text>
              </HStack>
              <Editable
                defaultValue={String(todoData.notes || "")}
                onSubmit={(v) => { updateTodo({ notes: v }); playEdit(); }}
                placeholder="Reservations, outfit ideas, what to bring..."
              >
                <EditablePreview
                  whiteSpace="pre-wrap"
                  px={3}
                  py={2}
                  borderRadius="md"
                  bg={inputBg}
                  minH="60px"
                  width="100%"
                  fontSize="sm"
                  color={todoData.notes ? textColor : mutedColor}
                  cursor="pointer"
                />
                <EditableTextarea minH="60px" px={3} py={2} bg={inputBg} borderRadius="md" />
                <EditableControls />
              </Editable>
            </VStack>

            {/* Emoji picker */}
            <VStack align="stretch" spacing={1}>
              <HStack spacing={1}>
                <Heart size={14} weight="fill" color={accentHex} />
                <Text fontWeight="semibold" fontSize="xs" color={mutedColor} textTransform="uppercase" letterSpacing="wide">
                  Vibe
                </Text>
              </HStack>
              <Flex wrap="wrap" gap={1}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <Box
                    key={emoji}
                    cursor="pointer"
                    p={1.5}
                    onClick={() => { updateTodo({ emoji }); playEdit(); }}
                    borderRadius="md"
                    bg={String(todoData.emoji) === emoji ? "pink.100" : "transparent"}
                    border="2px solid"
                    borderColor={String(todoData.emoji) === emoji ? "pink.300" : "transparent"}
                    fontSize="lg"
                    css={{ transition: "all 0.15s", "&:hover": { background: "var(--chakra-colors-pink-50)", transform: "scale(1.1)" } }}
                  >
                    {emoji}
                  </Box>
                ))}
              </Flex>
            </VStack>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
});
DateNightItem.displayName = "DateNightItem";

const DateFilter = ({ filter, setFilter }) => {
  const filters = [
    { id: "all", label: "All" },
    { id: "upcoming", label: "Upcoming" },
    { id: "tonight", label: "Tonight" },
    { id: "past", label: "Past" },
    { id: "unscheduled", label: "Ideas" },
  ];
  const pillBg = useColorModeValue("white", "gray.700");
  const pillBorder = useColorModeValue("pink.100", "gray.600");
  const hoverBg = useColorModeValue("pink.50", "pink.900");

  return (
    <HStack spacing={1} justify="center" bg={pillBg} p={1} borderRadius="full" border="1px solid" borderColor={pillBorder}>
      {filters.map((f) => (
        <Button
          key={f.id}
          size="xs"
          variant={filter === f.id ? "solid" : "ghost"}
          colorScheme="pink"
          onClick={() => setFilter(f.id)}
          borderRadius="full"
          fontWeight="medium"
          px={3}
          _hover={{ bg: filter === f.id ? undefined : hoverBg }}
        >
          {f.label}
        </Button>
      ))}
    </HStack>
  );
};

const DateNightList = ({ listId = "date-night-ideas" }) => {
  const [newName, setNewName] = useState("");
  const [filter, setFilter] = useState("all");
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.5 });

  const store = useStore();
  const listData = useRow("lists", listId);
  const toast = useToast();

  useEffect(() => {
    if (!store.hasRow("lists", listId)) {
      store.setRow("lists", listId, {
        name: "Date Night Ideas",
        number: 1,
        code: "DateNightList",
        type: "Romance",
      });
    }
  }, [store, listId]);

  const todoIds = useLocalRowIds("todoList", listId) || [];

  const filteredAndSortedTodoIds = useMemo(() => {
    return [...todoIds]
      .filter((id) => {
        const todo = store.getRow("todos", id);
        if (!todo) return false;
        const ds = String(todo.date || "");
        switch (filter) {
          case "upcoming":
            if (!ds) return false;
            try { const d = ds.includes("T") ? parseISO(ds) : parse(ds, "yyyy-MM-dd", new Date()); return isFuture(d) && !isToday(d); } catch { return false; }
          case "tonight":
            if (!ds) return false;
            try { const d = ds.includes("T") ? parseISO(ds) : parse(ds, "yyyy-MM-dd", new Date()); return isToday(d); } catch { return false; }
          case "past":
            if (!ds) return false;
            try { const d = ds.includes("T") ? parseISO(ds) : parse(ds, "yyyy-MM-dd", new Date()); return isPast(d) && !isToday(d); } catch { return false; }
          case "unscheduled":
            return !ds;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const todoA = store.getRow("todos", a);
        const todoB = store.getRow("todos", b);
        const dA = String(todoA.date || "");
        const dB = String(todoB.date || "");
        if (!dA && !dB) return String(todoA.text).localeCompare(String(todoB.text));
        if (!dA) return 1;
        if (!dB) return -1;
        try {
          const pA = dA.includes("T") ? parseISO(dA) : parse(dA, "yyyy-MM-dd", new Date());
          const pB = dB.includes("T") ? parseISO(dB) : parse(dB, "yyyy-MM-dd", new Date());
          if (isToday(pA) && !isToday(pB)) return -1;
          if (!isToday(pA) && isToday(pB)) return 1;
          if (isFuture(pA) && isPast(pB)) return -1;
          if (isPast(pA) && isFuture(pB)) return 1;
          return pA.getTime() - pB.getTime();
        } catch { return 0; }
      });
  }, [todoIds, store, filter]);

  const addTodo = useAddRowCallback(
    "todos",
    (text) => ({
      list: listId,
      text: String(text).trim(),
      emoji: EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)],
      notes: "",
      done: false,
      fiveStarRating: 3,
      amount: 0,
      streetAddress: "",
      date: "",
    }),
    [listId],
    store,
    (rowId) => {
      if (rowId) {
        setNewName("");
        playAdd();
        toast({ title: "New idea added! 💕", status: "success", duration: 1500, isClosable: true });
      }
    }
  );

  const handleAdd = useCallback(() => {
    if (newName.trim()) addTodo(newName);
  }, [addTodo, newName]);

  const handleKeyPress = useCallback(
    (e) => { if (e.key === "Enter" && newName.trim()) addTodo(newName); },
    [addTodo, newName]
  );

  // --- colours ---
  const cardBg = useColorModeValue("white", "gray.700");
  const headerColor = useColorModeValue("pink.700", "pink.200");
  const subColor = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  const heartHex = useColorModeValue("#D53F8C", "#ED64A6");
  const inputBorder = useColorModeValue("pink.200", "gray.600");

  const tagline = useMemo(() => {
    if (todoIds.length === 0) return "Plan your first date! 💕";
    if (todoIds.length < 5) return "Love is in the air 🌹";
    return "Romance experts! 💘";
  }, [todoIds.length]);

  return (
    <Box
      maxWidth="640px"
      margin="auto"
      bgGradient={useColorModeValue(
        "linear(to-b, pink.50, white 60%)",
        "linear(to-b, pink.900, gray.800 60%)"
      )}
      borderRadius="xl"
      boxShadow="xl"
      overflow="hidden"
      minH="500px"
    >
      {/* Header */}
      <Box bg={cardBg} px={5} py={4} borderBottom="1px solid" borderColor={useColorModeValue("pink.100", "pink.800")}>
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Box
              as={motion.div}
              animate={{ scale: [1, 1.15, 1], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}
            >
              <Heart size={26} weight="fill" color={heartHex} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={headerColor}>
                {listData?.name || "Date Night Ideas"}
              </Text>
              <Text fontSize="xs" color={subColor}>{tagline}</Text>
            </VStack>
          </HStack>
          <Badge colorScheme="pink" variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs">
            {filteredAndSortedTodoIds.length} {filteredAndSortedTodoIds.length === 1 ? "idea" : "ideas"}
          </Badge>
        </HStack>
      </Box>

      {/* Body */}
      <Box px={5} py={4}>
        <VStack spacing={4} align="stretch">
          {/* Add input */}
          <InputGroup size="sm">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a date night idea..."
              bg={cardBg}
              color={textColor}
              borderRadius="full"
              border="1px solid"
              borderColor={inputBorder}
              _focus={{ borderColor: "pink.400", boxShadow: "0 0 0 1px var(--chakra-colors-pink-400)" }}
              _placeholder={{ color: subColor }}
              pr="4rem"
            />
            <InputRightElement width="4rem">
              <Button
                h="1.5rem"
                size="xs"
                onClick={handleAdd}
                colorScheme="pink"
                borderRadius="full"
                rightIcon={<Plus weight="bold" size={12} />}
              >
                Add
              </Button>
            </InputRightElement>
          </InputGroup>

          <DateFilter filter={filter} setFilter={setFilter} />

          {/* Items */}
          <VStack spacing={3} align="stretch">
            {filteredAndSortedTodoIds.map((id) => (
              <DateNightItem key={id} id={id} />
            ))}
          </VStack>

          {/* Empty state */}
          {filteredAndSortedTodoIds.length === 0 && (
            <VStack py={10} spacing={3}>
              <Box
                as={motion.div}
                animate={{ y: [0, -6, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
              >
                <Text fontSize="5xl">💕</Text>
              </Box>
              <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="md">
                {filter === "all" ? "No date night ideas yet!" : `No ${filter} dates found`}
              </Text>
              <Text textAlign="center" color={subColor} fontSize="sm" maxW="260px">
                {filter === "all"
                  ? "Start planning your perfect evenings together"
                  : "Try a different filter or add new ideas"}
              </Text>
              {filter === "all" && (
                <Button
                  colorScheme="pink"
                  size="md"
                  borderRadius="full"
                  px={6}
                  mt={2}
                  onClick={() => {
                    setNewName("Candlelit dinner at home");
                    setTimeout(() => addTodo("Candlelit dinner at home"), 100);
                  }}
                  leftIcon={<Plus weight="bold" />}
                >
                  Add Your First Date Night
                </Button>
              )}
            </VStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default DateNightList;

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
  Checkbox,
  IconButton,
  useColorModeValue,
  Badge,
  Collapse,
  useDisclosure,
  Select,
  Divider,
  Tooltip,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  Plus,
  CaretDown,
  CaretUp,
  Calendar,
  Backpack,
  GraduationCap,
  Users,
  MapPin,
  Trophy,
  Books,
  Student,
  Chalkboard,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const CATEGORY_ICONS = {
  "term-dates": Calendar,
  "pupil-free": Student,
  "sports": Trophy,
  "excursions": MapPin,
  "conferences": Users,
  "assignments": Books,
  "other": Backpack,
};

const CATEGORIES = [
  { value: "term-dates", label: "Term Dates", color: "purple" },
  { value: "pupil-free", label: "Pupil-Free Days", color: "orange" },
  { value: "sports", label: "Sports Carnivals", color: "green" },
  { value: "excursions", label: "Excursions", color: "blue" },
  { value: "conferences", label: "Parent-Teacher", color: "pink" },
  { value: "assignments", label: "Assignments", color: "red" },
  { value: "other", label: "Other", color: "gray" },
];

// Date utility functions
const formatDate = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const isTomorrow = (date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();
};

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

const getEndOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  return new Date(d.setDate(diff));
};

const isBefore = (date1, date2) => {
  return date1.getTime() < date2.getTime();
};

const isWithinInterval = (date, start, end) => {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
};

const TodoItem = memo(({ id, isPast = false }) => {
  const [playComplete] = useSound("/sounds/complete/Complete 1.m4a", {
    volume: 0.5,
  });
  const [playDelete] = useSound("/sounds/cancel/Cancel 1.m4a", { volume: 0.5 });

  const todoData = useRow("todos", id);
  const updateTodo = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...todoData, ...updates }),
    [todoData]
  );
  const deleteTodo = useDelRowCallback("todos", id);

  const handleToggle = useCallback(() => {
    updateTodo({ done: !todoData.done });
    playComplete();
  }, [updateTodo, todoData.done, playComplete]);

  const handleDelete = useCallback(() => {
    deleteTodo();
    playDelete();
  }, [deleteTodo, playDelete]);

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  
  const category = CATEGORIES.find(c => c.value === todoData.category) || CATEGORIES[6];
  const CategoryIcon = CATEGORY_ICONS[todoData.category] || CATEGORY_ICONS.other;
  
  const todoDate = todoData.date ? new Date(todoData.date) : null;
  const dateDisplay = todoDate ? formatDate(todoDate) : "No date";
  const todayStatus = todoDate && isToday(todoDate);
  const tomorrowStatus = todoDate && isTomorrow(todoDate);

  return (
    <HStack
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      opacity={todoData.done || isPast ? 0.6 : 1}
      borderLeft="4px solid"
      borderLeftColor={`${category.color}.400`}
    >
      <Checkbox
        isChecked={todoData.done}
        onChange={handleToggle}
        colorScheme={category.color}
      />
      <CategoryIcon size={20} weight="fill" color={`var(--chakra-colors-${category.color}-500)`} />
      <VStack align="start" flex={1} spacing={0}>
        <Text
          color={textColor}
          textDecoration={todoData.done ? "line-through" : "none"}
          fontWeight={todayStatus ? "bold" : "normal"}
        >
          {todoData.text}
        </Text>
        {todoData.notes && (
          <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
            {todoData.notes}
          </Text>
        )}
      </VStack>
      <VStack align="end" spacing={0}>
        <Badge
          colorScheme={todayStatus ? "green" : tomorrowStatus ? "blue" : category.color}
          fontSize="xs"
        >
          {todayStatus ? "Today" : tomorrowStatus ? "Tomorrow" : dateDisplay}
        </Badge>
        {todoData.url && (
          <Text fontSize="xs" color="blue.500" cursor="pointer" onClick={() => window.open(todoData.url, '_blank')}>
            View details
          </Text>
        )}
      </VStack>
      <IconButton
        icon={<Trash weight="bold" />}
        onClick={handleDelete}
        aria-label="Delete todo"
        size="sm"
        colorScheme="red"
        variant="ghost"
      />
    </HStack>
  );
});

TodoItem.displayName = "TodoItem";

const SchoolCalendarTodo = ({ listId }) => {
  const [newTodo, setNewTodo] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("other");
  const [newNotes, setNewNotes] = useState("");
  const [newUrl, setNewUrl] = useState("");
  
  const { isOpen: isPastOpen, onToggle: onPastToggle } = useDisclosure();
  const { isOpen: isFutureOpen, onToggle: onFutureToggle } = useDisclosure({ defaultIsOpen: true });
  
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", {
    volume: 0.5,
  });

  const store = useStore();
  const listData = useRow("lists", listId);
  const todoIds = useLocalRowIds("todoList", listId) || [];

  const addTodo = useAddRowCallback(
    "todos",
    (data) => ({
      text: data.text.trim(),
      done: false,
      list: listId,
      date: data.date || null,
      category: data.category,
      notes: data.notes.trim(),
      url: data.url.trim(),
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewTodo("");
        setNewDate("");
        setNewNotes("");
        setNewUrl("");
        setNewCategory("other");
        playAdd();
      }
    }
  );

  const handleAddClick = useCallback(() => {
    if (newTodo.trim() !== "") {
      addTodo({
        text: newTodo,
        date: newDate,
        category: newCategory,
        notes: newNotes,
        url: newUrl,
      });
    }
  }, [addTodo, newTodo, newDate, newCategory, newNotes, newUrl]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && newTodo.trim() !== "") {
        handleAddClick();
      }
    },
    [handleAddClick]
  );

  const { pastTodos, thisWeekTodos, futureTodos } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = getStartOfWeek(today);
    const endOfWeek = getEndOfWeek(today);
    
    const past = [];
    const thisWeek = [];
    const future = [];
    
    todoIds.forEach(id => {
      const todo = store.getRow("todos", id);
      if (!todo) return;
      
      const todoDate = todo.date ? new Date(todo.date) : null;
      
      if (!todoDate) {
        thisWeek.push(id);
      } else if (isBefore(todoDate, today) && !isToday(todoDate)) {
        past.push(id);
      } else if (isWithinInterval(todoDate, today, endOfWeek)) {
        thisWeek.push(id);
      } else {
        future.push(id);
      }
    });
    
    // Sort each group by date
    const sortByDate = (a, b) => {
      const dateA = store.getCell("todos", a, "date");
      const dateB = store.getCell("todos", b, "date");
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA) - new Date(dateB);
    };
    
    past.sort(sortByDate).reverse();
    thisWeek.sort(sortByDate);
    future.sort(sortByDate);
    
    return { pastTodos: past, thisWeekTodos: thisWeek, futureTodos: future };
  }, [todoIds, store]);

  // Dynamic theming based on list configuration
  const iconName = listData?.icon || "Backpack";
  const iconMap = { Backpack, GraduationCap, Chalkboard, Calendar, Student, Books };
  const ListIcon = iconMap[iconName] || Backpack;
  
  const colorScheme = listData?.color || "blue";
  const bgGradient = useColorModeValue(
    `linear(to-br, ${colorScheme}.50, ${colorScheme}.100)`,
    `linear(to-br, ${colorScheme}.900, ${colorScheme}.800)`
  );
  const cardBgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue(`${colorScheme}.800`, `${colorScheme}.100`);
  const subTextColor = useColorModeValue(`${colorScheme}.600`, `${colorScheme}.300`);

  const currentWeekDate = getStartOfWeek(new Date());
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentWeek = `Week of ${currentWeekDate.getDate()} ${months[currentWeekDate.getMonth()]}`;

  const progressLabel = useMemo(() => {
    const count = todoIds.length;
    if (count === 0) return "Set up your school week! 📚";
    if (count <= 3) return "Calendar taking shape 📝";
    return "School week organized! 🎓";
  }, [todoIds.length]);

  return (
    <Box
      maxWidth="700px"
      margin="auto"
      p={5}
      bgGradient={bgGradient}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xl"
    >
      <VStack spacing={4} align="stretch">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack spacing={3}>
            <Box as={motion.div} animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <ListIcon size={32} weight="fill" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {listData?.name || "School Calendar"}
              </Text>
              <Text fontSize="sm" color={textColor} opacity={0.8}>
                {currentWeek}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </VStack>
          </HStack>
          <Badge colorScheme={colorScheme} fontSize="md" p={2} borderRadius="md">
            {thisWeekTodos.length} this week
          </Badge>
        </HStack>

        <VStack spacing={2} align="stretch">
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a school event"
            bg={cardBgColor}
            color={textColor}
          />
          <HStack>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              bg={cardBgColor}
              size="sm"
            />
            <Select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              bg={cardBgColor}
              size="sm"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </HStack>
          <Input
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Notes (optional)"
            bg={cardBgColor}
            size="sm"
          />
          <HStack>
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Link (optional)"
              bg={cardBgColor}
              size="sm"
              flex={1}
            />
            <Button
              onClick={handleAddClick}
              colorScheme={colorScheme}
              leftIcon={<Plus />}
              size="sm"
            >
              Add Event
            </Button>
          </HStack>
        </VStack>

        <Divider />

        {todoIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">📚</Text>
            </Box>
            <Text textAlign="center" color={textColor} fontWeight="medium" fontSize="lg">No school events yet</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add classes and activities to build your weekly schedule</Text>
          </VStack>
        )}

        {/* Past Events */}
        {pastTodos.length > 0 && (
          <Box>
            <HStack
              onClick={onPastToggle}
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              mb={2}
            >
              <Text fontWeight="bold" color={textColor}>
                Past Events ({pastTodos.length})
              </Text>
              {isPastOpen ? <CaretUp /> : <CaretDown />}
            </HStack>
            <Collapse in={isPastOpen} animateOpacity>
              <VStack spacing={2} align="stretch" opacity={0.7}>
                <AnimatePresence>
                  {pastTodos.map((id) => (
                    <TodoItem key={id} id={id} isPast={true} />
                  ))}
                </AnimatePresence>
              </VStack>
            </Collapse>
          </Box>
        )}

        {/* This Week */}
        <Box>
          <Text fontWeight="bold" color={textColor} mb={2}>
            This Week
          </Text>
          <VStack spacing={2} align="stretch">
            {thisWeekTodos.length > 0 ? (
              <AnimatePresence>
                {thisWeekTodos.map((id) => (
                  <TodoItem key={id} id={id} />
                ))}
              </AnimatePresence>
            ) : (
              <Text
                fontSize="sm"
                fontStyle="italic"
                textAlign="center"
                color={textColor}
                opacity={0.6}
              >
                No events scheduled for this week
              </Text>
            )}
          </VStack>
        </Box>

        {/* Future Events */}
        {futureTodos.length > 0 && (
          <Box>
            <HStack
              onClick={onFutureToggle}
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              mb={2}
            >
              <Text fontWeight="bold" color={textColor}>
                Upcoming Events ({futureTodos.length})
              </Text>
              {isFutureOpen ? <CaretUp /> : <CaretDown />}
            </HStack>
            <Collapse in={isFutureOpen} animateOpacity>
              <VStack spacing={2} align="stretch">
                <AnimatePresence>
                  {futureTodos.map((id) => (
                    <TodoItem key={id} id={id} />
                  ))}
                </AnimatePresence>
              </VStack>
            </Collapse>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SchoolCalendarTodo;
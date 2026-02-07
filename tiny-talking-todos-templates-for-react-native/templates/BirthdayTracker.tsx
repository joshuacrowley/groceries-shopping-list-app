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
  Textarea,
  Badge,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  List,
  ListItem,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  Gift,
  CaretDown,
  CaretUp,
  Confetti,
  Warning,
  Calendar,
  Coins,
  ThumbsUp,
  ThumbsDown,
} from "@phosphor-icons/react";
import {
  format,
  parse,
  isValid,
  differenceInYears,
  addYears,
  compareAsc,
  differenceInDays,
  setYear,
  isFuture,
  addDays
} from "date-fns";
import DynamicIcon from "@/components/catalogue/DynamicIcon";
import useSound from "use-sound";

const BirthdayItem = memo(({ id }) => {
  const listData = useRow("lists", useRow("todos", id)?.list);
  const { isOpen, onToggle } = useDisclosure();
  const todoData = useRow("todos", id);
  const updateTodo = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...todoData, ...updates }),
    [todoData]
  );
  const deleteTodo = useDelRowCallback("todos", id);

  const [newDate, setNewDate] = useState("");
  const [newGiftIdea, setNewGiftIdea] = useState("");

  const handleDateChange = useCallback((e) => {
    setNewDate(e.target.value);
  }, []);

  const handleDateSubmit = useCallback(() => {
    if (newDate) {
      updateTodo({ date: newDate });
      setNewDate("");
    }
  }, [newDate, updateTodo]);

  const handleGiftIdeaSubmit = useCallback(() => {
    if (newGiftIdea.trim()) {
      const updatedGiftIdeas = [
        ...(todoData.giftIdeas || []),
        { idea: newGiftIdea.trim(), votes: 0 },
      ];
      updateTodo({ giftIdeas: updatedGiftIdeas });
      setNewGiftIdea("");
    }
  }, [newGiftIdea, todoData.giftIdeas, updateTodo]);

  const handleVote = useCallback(
    (index, increment) => {
      const updatedGiftIdeas = [...(todoData.giftIdeas || [])];
      updatedGiftIdeas[index].votes += increment;
      updateTodo({ giftIdeas: updatedGiftIdeas });
    },
    [todoData.giftIdeas, updateTodo]
  );

  const handleDelete = useCallback(() => {
    deleteTodo();
  }, [deleteTodo]);

  const handleBudgetChange = useCallback(
    (valueString) => {
      updateTodo({ amount: parseFloat(valueString) });
    },
    [updateTodo]
  );

  const handleGiftPurchased = useCallback(
    (e) => {
      updateTodo({ done: e.target.checked });
    },
    [updateTodo]
  );

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");

  if (!todoData.date) {
    return (
      <Box
        as={motion.div}
        layout
        width="100%"
        bg={useColorModeValue("yellow.100", "yellow.700")}
        p={4}
        borderRadius="md"
        boxShadow="sm"
      >
        <VStack align="stretch" spacing={3}>
          <HStack justifyContent="space-between">
            <Text color={useColorModeValue("yellow.800", "yellow.100")}>
              <Warning /> Missing birthday date for {todoData.text}
            </Text>
            <IconButton
              icon={<Trash />}
              onClick={handleDelete}
              aria-label="Delete incomplete birthday"
              size="sm"
              colorScheme="red"
              variant="ghost"
            />
          </HStack>
          <HStack>
            <Input
              type="date"
              value={newDate}
              onChange={handleDateChange}
              placeholder="Enter birthday date"
            />
            <Button onClick={handleDateSubmit} colorScheme={listData?.color || "blue"}>
              Add Date
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  }

  const parseBirthDate = (dateString) => {
    const formats = ["yyyy-MM-dd", "yyyy-MM-dd'T'HH:mm:ss.SSSX", "yyyy-MM-dd'T'HH:mm:ssX"];
    let parsedDate = null;
  
    for (const formatString of formats) {
      try {
        parsedDate = parse(dateString, formatString, new Date());
        if (isValid(parsedDate)) {
          return parsedDate;
        }
      } catch (error) {
        console.log(`Failed to parse date with format ${formatString}:`, error);
      }
    }
  
    return null;
  };
  
  const birthDate = parseBirthDate(todoData.date);
  
  if (!birthDate) {
    console.error(`Error parsing date: ${todoData.date}`);
    return null;
  }

  const today = new Date();
  const age = differenceInYears(today, birthDate);
  
  // Calculate this year's birthday
  const thisYearBirthday = setYear(birthDate, today.getFullYear());
  
  // If this year's birthday has passed, use next year's birthday
  const nextBirthday = isFuture(thisYearBirthday) 
    ? thisYearBirthday 
    : setYear(birthDate, today.getFullYear() + 1);
    
  const daysUntilBirthday = differenceInDays(nextBirthday, today);

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={4}
      borderRadius="md"
      boxShadow="sm"
    >
      <HStack justifyContent="space-between">
        <HStack>
          <Text fontSize="2xl">{todoData.emoji || "🎂"}</Text>
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" color={textColor}>
              {todoData.text}'s {age + 1}th Birthday
            </Text>
            <Text
              fontSize="sm"
              color={useColorModeValue("gray.600", "gray.400")}
            >
              {format(birthDate, "MMMM d, yyyy")}
            </Text>
          </VStack>
        </HStack>
        <HStack>
          <Badge
            colorScheme={daysUntilBirthday <= 30 ? "red" : "green"}
            borderRadius="full"
            px={2}
          >
            {daysUntilBirthday} days
          </Badge>
          <IconButton
            icon={isOpen ? <CaretUp /> : <CaretDown />}
            onClick={onToggle}
            aria-label="Toggle gift ideas"
            size="sm"
            variant="ghost"
          />
          <IconButton
            icon={<Trash />}
            onClick={handleDelete}
            aria-label="Delete birthday"
            size="sm"
            colorScheme="red"
            variant="ghost"
          />
        </HStack>
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <VStack align="stretch" mt={4} spacing={3}>
          <HStack>
            <Gift size={20} />
            <Text fontWeight="medium">Gift Ideas:</Text>
          </HStack>
          <List spacing={2}>
            {todoData.giftIdeas?.map((giftIdea, index) => (
              <ListItem key={index}>
                <HStack justifyContent="space-between">
                  <Text>{giftIdea.idea}</Text>
                  <HStack>
                    <Text>Votes: {giftIdea.votes}</Text>
                    <IconButton
                      icon={<ThumbsUp />}
                      onClick={() => handleVote(index, 1)}
                      aria-label="Upvote"
                      size="xs"
                      colorScheme="green"
                    />
                    <IconButton
                      icon={<ThumbsDown />}
                      onClick={() => handleVote(index, -1)}
                      aria-label="Downvote"
                      size="xs"
                      colorScheme="red"
                    />
                  </HStack>
                </HStack>
              </ListItem>
            ))}
          </List>
          <HStack>
            <Input
              value={newGiftIdea}
              onChange={(e) => setNewGiftIdea(e.target.value)}
              placeholder="Add a new gift idea"
              size="sm"
            />
            <Button onClick={handleGiftIdeaSubmit} size="sm" colorScheme={listData?.color || "blue"}>
              Add Idea
            </Button>
          </HStack>
          <HStack>
            <Coins size={20} />
            <Text fontWeight="medium">Budget:</Text>
            <NumberInput
              value={todoData.amount || 0}
              onChange={handleBudgetChange}
              min={0}
              precision={2}
              step={0.01}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </HStack>
          <Checkbox
            isChecked={todoData.done}
            onChange={handleGiftPurchased}
            colorScheme={listData?.color || "blue"}
          >
            Gift Purchased
          </Checkbox>
        </VStack>
      </Collapse>
    </Box>
  );
});
BirthdayItem.displayName = "BirthdayItem";

const BirthdayTracker = ({ listId = "birthday-list" }) => {
  const [newName, setNewName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [playAdd] = useSound("/sounds/complete/Complete 2.m4a", { volume: 0.5 });
  const store = useStore();
  const listData = useRow("lists", listId);

  useEffect(() => {
    if (!store.hasRow("lists", listId)) {
      store.setRow("lists", listId, {
        name: "Birthday Tracker",
        number: 1,
        code: "BirthdayTracker",
        type: "Guide",
      });
    }
  }, [store, listId]);

  const birthdayIds = useLocalRowIds("todoList", listId) || [];

  const { incompleteBirthdayIds, sortedBirthdayIds } = useMemo(() => {
    const incomplete = [];
    const complete = [];

    birthdayIds.forEach((id) => {
      const todo = store.getRow("todos", id);
      if (todo && todo.date) {
        complete.push(id);
      } else {
        incomplete.push(id);
      }
    });

    const sorted = complete.sort((a, b) => {
      const dateA = parse(
        store.getCell("todos", a, "date"),
        "yyyy-MM-dd",
        new Date()
      );
      const dateB = parse(
        store.getCell("todos", b, "date"),
        "yyyy-MM-dd",
        new Date()
      );
      
      const today = new Date();
      const thisYearA = setYear(dateA, today.getFullYear());
      const thisYearB = setYear(dateB, today.getFullYear());
      
      const nextBirthdayA = isFuture(thisYearA) ? thisYearA : setYear(dateA, today.getFullYear() + 1);
      const nextBirthdayB = isFuture(thisYearB) ? thisYearB : setYear(dateB, today.getFullYear() + 1);
      
      return compareAsc(nextBirthdayA, nextBirthdayB);
    });

    return { incompleteBirthdayIds: incomplete, sortedBirthdayIds: sorted };
  }, [birthdayIds, store]);

  const addBirthday = useAddRowCallback(
    "todos",
    (params) => {
      return {
        list: listId,
        text: params.name,
        date: params.birthDate,
        emoji: "🎂",
        notes: "",
        amount: 0,
        done: false,
      };
    },
    [listId],
    store,
    (rowId) => {
      if (rowId) {
        setNewName("");
        setNewBirthDate("");
        playAdd();
      }
    }
  );

  const handleAddClick = useCallback(() => {
    if (newName.trim() !== "" && newBirthDate !== "") {
      addBirthday({ name: newName, birthDate: newBirthDate });
    }
  }, [addBirthday, newName, newBirthDate]);

  const bgGradient = useColorModeValue(
    "linear-gradient(180deg, #FEEBC8 0%, white 100%)",
    "linear-gradient(180deg, #652B19 0%, #1A202C 100%)"
  );
  const cardBgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue(`${listData?.color || "blue"}.800`, `${listData?.color || "blue"}.100`);
  const subTextColor = useColorModeValue("gray.500", "gray.400");

  const progressLabel = useMemo(() => {
    if (birthdayIds.length === 0) return "Add your first birthday! 🎂";
    if (birthdayIds.length < 5) return "A few dates to remember 📅";
    return "Birthday calendar pro! 🎁";
  }, [birthdayIds.length]);

  return (
    <Box
      maxWidth="600px"
      margin="auto"
      p={5}
      background={bgGradient}
      borderRadius="lg"
      boxShadow="lg"
    >
      <VStack spacing={4} align="stretch">
        <HStack justifyContent="space-between" alignItems="center">
          <HStack spacing={2} alignItems="center">
            <Box as={motion.div} animate={{ rotate: [0, 5, -5, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}>
              <DynamicIcon iconName={listData?.icon || "Confetti"} size={32} weight="fill" color={textColor}/>
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="3xl" fontWeight="bold" color={textColor}>
                {listData?.name || "Birthday Tracker"}
              </Text>
              <Text fontSize="sm" color={subTextColor} fontWeight="medium">
                {progressLabel}
              </Text>
            </VStack>
          </HStack>
          <Badge colorScheme={listData?.color || "blue"} fontSize="md" p={2} borderRadius="md">
            {sortedBirthdayIds.length} Birthdays
          </Badge>
        </HStack>
        <HStack>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            bg={cardBgColor}
            color={textColor}
          />
          <Input
            type="date"
            value={newBirthDate}
            onChange={(e) => setNewBirthDate(e.target.value)}
            bg={cardBgColor}
            color={textColor}
          />
          <Button onClick={handleAddClick} colorScheme={listData?.color || "blue"}>
            Add
          </Button>
        </HStack>
        <VStack spacing={3} align="stretch">
          <AnimatePresence>
            {incompleteBirthdayIds.map((id) => (
              <BirthdayItem key={id} id={id} />
            ))}
            {sortedBirthdayIds.map((id) => (
              <BirthdayItem key={id} id={id} />
            ))}
          </AnimatePresence>
        </VStack>
        {birthdayIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}>
              <Text fontSize="5xl">🎂</Text>
            </Box>
            <Text textAlign="center" color={textColor} fontWeight="medium" fontSize="lg">
              No birthdays tracked yet!
            </Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">
              Add someone special and never miss a birthday again
            </Text>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default BirthdayTracker;
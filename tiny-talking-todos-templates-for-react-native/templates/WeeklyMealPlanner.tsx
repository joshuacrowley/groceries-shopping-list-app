import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
import {
  useStore,
  useCreateQueries,
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
} from "tinybase/ui-react";
import { createQueries } from "tinybase";
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  IconButton,
  useColorModeValue,
  Select,
  Textarea,
  Badge,
  Collapse,
  useDisclosure,
  Checkbox,
  Tooltip,
  Flex,
  Divider,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  PencilSimple,
  CaretDown,
  CaretUp,
  CookingPot,
  Coffee,
  ForkKnife,
  Hamburger,
} from "@phosphor-icons/react";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEAL_TYPES = {
  A: "Breakfast",
  B: "Lunch",
  C: "Dinner",
  D: "Snack",
  E: "Other",
};

const MEAL_ICONS = {
  A: Coffee,
  B: ForkKnife,
  C: CookingPot,
  D: Hamburger,
  E: ForkKnife,
};

const MealItem = memo(({ id }: { id: string }) => {
  const { isOpen, onToggle } = useDisclosure();
  const mealData = useRow("todos", id);
  const updateMeal = useSetRowCallback(
    "todos",
    id,
    (updates) => ({
      ...mealData,
      category: mealData?.category || "Monday",
      ...updates
    }),
    [mealData]
  );
  const deleteMeal = useDelRowCallback("todos", id);

  const bgColor = useColorModeValue("white", "teal.700");
  const textColor = useColorModeValue("teal.800", "white");
  const IconComponent = MEAL_ICONS[mealData?.type as keyof typeof MEAL_ICONS] || ForkKnife;

  if (!mealData) return null;

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      opacity={mealData.done ? 0.6 : 1}
    >
      <HStack justifyContent="space-between">
        <HStack>
          <IconComponent size={20} />
          <Text fontWeight="bold" color={textColor}>
            {mealData.text}
          </Text>
        </HStack>
        <HStack>
          <Badge colorScheme="teal" fontSize="xs" padding={1}>
            {MEAL_TYPES[mealData.type as keyof typeof MEAL_TYPES]}
          </Badge>
          <Checkbox
            isChecked={mealData.done}
            onChange={(e) => updateMeal({ done: e.target.checked })}
            colorScheme="teal"
            size="sm"
          />
          <IconButton
            icon={isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
            onClick={onToggle}
            aria-label="Toggle meal details"
            size="sm"
            variant="ghost"
          />
        </HStack>
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <VStack align="stretch" mt={3} spacing={3}>
          <Select
            value={mealData.type || "A"}
            onChange={(e) => updateMeal({ type: e.target.value })}
            bg={useColorModeValue("teal.50", "teal.600")}
            size="sm"
          >
            {Object.entries(MEAL_TYPES).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </Select>
          <Select
            value={mealData.category || "Monday"}
            onChange={(e) => updateMeal({ category: e.target.value })}
            bg={useColorModeValue("teal.50", "teal.600")}
            size="sm"
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </Select>
          <Textarea
            value={mealData.notes || ""}
            onChange={(e) => updateMeal({ notes: e.target.value })}
            placeholder="Add notes..."
            bg={useColorModeValue("teal.50", "teal.600")}
            size="sm"
          />
          <Button
            onClick={deleteMeal}
            colorScheme="red"
            leftIcon={<Trash size={16} />}
            size="sm"
          >
            Delete Meal
          </Button>
        </VStack>
      </Collapse>
    </Box>
  );
});
MealItem.displayName = "MealItem";

const MealPlanList = ({ listId = "meal-plan-list" }) => {
  const [newMeal, setNewMeal] = useState({ text: "", type: "A", category: "Monday" });
  
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  // Group meals by day using imperative store reads
  const { mealsByDay, totalMeals } = useMemo(() => {
    const grouped = DAYS_OF_WEEK.reduce<Record<string, string[]>>((acc, day) => {
      acc[day] = [];
      return acc;
    }, {});

    todoIds.forEach((id) => {
      const category = String(store?.getCell("todos", id, "category") || "Monday");
      const day = DAYS_OF_WEEK.includes(category) ? category : "Monday";
      grouped[day].push(id);
    });

    return { mealsByDay: grouped, totalMeals: todoIds.length };
  }, [todoIds, store]);

  const addMeal = useAddRowCallback(
    "todos",
    (meal: typeof newMeal) => ({
      text: meal.text,
      type: meal.type,
      category: DAYS_OF_WEEK.includes(meal.category) ? meal.category : "Monday",
      list: listId,
      done: false,
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewMeal({ text: "", type: "A", category: "Monday" });
      }
    }
  );

  const handleAddMeal = useCallback(() => {
    if (newMeal.text.trim() !== "") {
      addMeal(newMeal);
    }
  }, [addMeal, newMeal]);

  const bgGradient = useColorModeValue(
    "linear-gradient(180deg, #E6FFFA 0%, white 100%)",
    "linear-gradient(180deg, #1a3a3d 0%, #1A202C 100%)"
  );
  const textColor = useColorModeValue("teal.800", "teal.100");
  const subTextColor = useColorModeValue("teal.600", "teal.300");

  const progressLabel = useMemo(() => {
    if (totalMeals === 0) return "Plan your week of meals! 🍽️";
    if (totalMeals <= 5) return "Getting started... 🥄";
    if (totalMeals <= 14) return "Meal plan coming together! 🥘";
    if (totalMeals <= 21) return "Well-fed week ahead! 😋";
    return "Culinary masterplan! 👨‍🍳";
  }, [totalMeals]);

  return (
    <Box
      margin="auto"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xl"
      bgGradient={bgGradient}
      position="relative"
    >
      <VStack spacing={5} align="stretch" p={5}>
        <HStack justifyContent="space-between" alignItems="flex-start">
          <HStack spacing={3}>
            <Box
              as={motion.div}
              animate={{ rotate: [0, 6, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Text fontSize="3xl">🍳</Text>
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {listData?.name || "Meal Plan"}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </Box>
          </HStack>
          <Badge colorScheme="teal" fontSize="sm" px={3} py={1} borderRadius="full">
            {totalMeals} {totalMeals === 1 ? "meal" : "meals"}
          </Badge>
        </HStack>
        <HStack spacing={3}>
          <Input
            value={newMeal.text}
            onChange={(e) => setNewMeal({ ...newMeal, text: e.target.value })}
            placeholder="Meal name"
            bg={useColorModeValue("white", "teal.700")}
            size="md"
            width="35%"
          />
          <Select
            value={newMeal.type}
            onChange={(e) => setNewMeal({ ...newMeal, type: e.target.value })}
            width="25%"
            bg={useColorModeValue("white", "teal.700")}
            size="md"
          >
            {Object.entries(MEAL_TYPES).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </Select>
          <Select
            value={newMeal.category}
            onChange={(e) => setNewMeal({ ...newMeal, category: e.target.value })}
            width="25%"
            bg={useColorModeValue("white", "teal.700")}
            size="md"
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </Select>
          <Button onClick={handleAddMeal} colorScheme="teal" size="md" width="15%">
            Add
          </Button>
        </HStack>
        {DAYS_OF_WEEK.map((day, index) => (
          <Box key={day} mt={4}>
            <HStack mb={2}>
              <Text
                fontSize="lg"
                fontWeight="bold"
                width="24px"
                textAlign="center"
                color={textColor}
              >
                {index + 1}
              </Text>
              <Text fontWeight="bold" color={textColor} fontSize="lg">
                {day}
              </Text>
            </HStack>
            <VStack spacing={2} align="stretch">
              <AnimatePresence>
                {(mealsByDay[day] || []).map((id) => (
                  <MealItem key={id} id={id} />
                ))}
              </AnimatePresence>
            </VStack>
            {day !== "Sunday" && <Divider mt={4} borderColor="teal.200" />}
          </Box>
        ))}

        {totalMeals === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🍽️</Text>
            </Box>
            <Text textAlign="center" color={textColor} fontWeight="medium" fontSize="lg">No meals planned yet</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add meals to any day above to start building your weekly plan</Text>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default MealPlanList;
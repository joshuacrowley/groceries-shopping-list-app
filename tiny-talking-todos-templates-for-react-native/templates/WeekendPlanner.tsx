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
  Select,
  Badge,
  Collapse,
  useDisclosure,
  Divider,
} from "@chakra-ui/react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Trash,
  Basketball,
  Users,
  Confetti,
  ShoppingCart,
  Broom,
  CaretDown,
  CaretUp,
  Question,
  Sunglasses,
  SunDim,
  SunHorizon,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const DAYS = ["Saturday", "Sunday"];
const TIME_PERIODS = ["Morning", "Afternoon"];

const CATEGORIES = {
  A: { name: "Sport", icon: Basketball },
  B: { name: "Play Date", icon: Users },
  C: { name: "Party", icon: Confetti },
  D: { name: "Shopping", icon: ShoppingCart },
  E: { name: "Chores", icon: Broom },
  F: { name: "None", icon: Question },
};

const ActivityItem = memo(({ id }: { id: string }) => {
  const { isOpen, onToggle } = useDisclosure();
  const activityData = useRow("todos", id);
  
  const updateActivity = useSetRowCallback(
    "todos",
    id,
    (updates) => ({
      ...activityData,
      category: activityData?.category || "Saturday",
      ...updates
    }),
    [activityData]
  );
  
  const deleteActivity = useDelRowCallback("todos", id);

  const Icon = activityData?.type ? CATEGORIES[activityData.type as keyof typeof CATEGORIES]?.icon : Question;
  const bgColor = useColorModeValue("white", "purple.800");
  const textColor = useColorModeValue("purple.800", "white");

  if (!activityData) return null;

  return (
    <Reorder.Item value={id} as="div">
      <Box
        width="100%"
        bg={bgColor}
        p={3}
        borderRadius="md"
        boxShadow="sm"
        cursor="grab"
      >
        <HStack justifyContent="space-between">
          <HStack spacing={3}>
            <Icon size={20} />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" color={textColor}>
                {activityData.text}
              </Text>
              <Text fontSize="sm" color={textColor} opacity={0.8}>
                {activityData.notes || ""}
              </Text>
            </VStack>
          </HStack>
          <HStack>
            <Badge colorScheme="purple">
              {activityData.number || 0}:00
            </Badge>
            <IconButton
              icon={isOpen ? <CaretUp /> : <CaretDown />}
              onClick={onToggle}
              aria-label="Toggle details"
              size="sm"
              variant="ghost"
            />
            <IconButton
              icon={<Trash />}
              onClick={deleteActivity}
              aria-label="Delete activity"
              size="sm"
              colorScheme="red"
              variant="ghost"
            />
          </HStack>
        </HStack>

        <Collapse in={isOpen} animateOpacity>
          <VStack align="stretch" mt={3} spacing={3}>
            <HStack>
              <Select
                value={activityData.category as string || "Saturday"}
                onChange={(e) => updateActivity({ category: e.target.value })}
                size="sm"
                bg="white"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </Select>
              <Select
                value={activityData.type as string || "F"}
                onChange={(e) => updateActivity({ type: e.target.value })}
                size="sm"
                bg="white"
              >
                {Object.entries(CATEGORIES).map(([key, { name }]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </Select>
            </HStack>
            <HStack>
              <Text width="60px" fontSize="sm">Time:</Text>
              <Select
                value={String(activityData.number || 0)}
                onChange={(e) => updateActivity({ number: parseInt(e.target.value, 10) })}
                size="sm"
                bg="white"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}:00
                  </option>
                ))}
              </Select>
            </HStack>
            <Input
              value={activityData.notes as string || ""}
              onChange={(e) => updateActivity({ notes: e.target.value })}
              placeholder="Add notes..."
              size="sm"
              bg="white"
            />
          </VStack>
        </Collapse>
      </Box>
    </Reorder.Item>
  );
});
ActivityItem.displayName = "ActivityItem";

const TimeBlock = ({ day, period, activities, onReorder }) => {
  const textColor = useColorModeValue("purple.800", "purple.100");

  return (
    <Box mb={4}>
      <HStack mb={2}>
        {period === "Morning" ? (
          <SunDim size={20} weight="fill" />
        ) : (
          <SunHorizon size={20} weight="fill" />
        )}
        <Text fontSize="lg" fontWeight="medium" color={textColor}>
          {period}
        </Text>
      </HStack>
      <Reorder.Group 
        axis="y" 
        values={activities} 
        onReorder={onReorder}
      >
        <VStack align="stretch" spacing={2}>
          <AnimatePresence>
            {activities.map((id) => (
              <ActivityItem key={id} id={id} />
            ))}
          </AnimatePresence>
        </VStack>
      </Reorder.Group>
    </Box>
  );
};

const WeekendPlanner = ({ listId = "weekend-planner" }) => {
  const [newActivity, setNewActivity] = useState({
    text: "",
    notes: "",
    type: "F",
    category: "Saturday",
    number: 9,
  });

  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.5 });

  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const store = useStore();

  const groupedActivities = useMemo(() => {
    return todoIds.reduce((grouped, id) => {
      const category = store?.getCell("todos", id, "category") as string || "Saturday";
      const time = Number(store?.getCell("todos", id, "number")) || 0;
      const period = time < 12 ? "Morning" : "Afternoon";

      if (!grouped[category]) {
        grouped[category] = { Morning: [], Afternoon: [] };
      }

      grouped[category][period].push(id);
      // Sort by time
      grouped[category][period].sort((a, b) => {
        const timeA = Number(store?.getCell("todos", a, "number")) || 0;
        const timeB = Number(store?.getCell("todos", b, "number")) || 0;
        return timeA - timeB;
      });

      return grouped;
    }, DAYS.reduce((acc, day) => ({ ...acc, [day]: { Morning: [], Afternoon: [] } }), {} as Record<string, Record<string, string[]>>));
  }, [todoIds, store]);

  const handleReorder = useCallback((day, period, newOrder) => {
    const updateOrder = {};
    newOrder.forEach((id, index) => {
      updateOrder[index] = id;
    });
    store.setTable("todoList", { [listId]: updateOrder });
  }, [store, listId]);

  const addActivity = useAddRowCallback(
    "todos",
    (activity: typeof newActivity) => ({
      text: activity.text,
      notes: activity.notes,
      type: activity.type,
      category: activity.category,
      number: activity.number,
      list: listId,
      done: false,
    }),
    [listId],
    undefined,
    (store, rowId) => {
      if (rowId) {
        playAdd();
      }
    }
  );

  const handleAddActivity = useCallback(() => {
    if (newActivity.text.trim()) {
      addActivity(newActivity);
    }
  }, [addActivity, newActivity]);

  const bgGradient = useColorModeValue(
    "linear-gradient(180deg, purple.50 0%, white 100%)",
    "linear-gradient(180deg, #2D1B4E 0%, #1A202C 100%)"
  );
  const textColor = useColorModeValue("purple.800", "purple.100");
  const headerColor = useColorModeValue("purple.700", "purple.200");
  const subTextColor = useColorModeValue("purple.500", "purple.300");

  const progressLabel = useMemo(() => {
    if (todoIds.length === 0) return "Plan your weekend! 🌤️";
    if (todoIds.length <= 3) return "Weekend taking shape 📋";
    return "Epic weekend planned! 🎉";
  }, [todoIds.length]);

  return (
    <Box
      maxWidth="800px"
      margin="auto"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xl"
      bgGradient={bgGradient}
    >
      <VStack spacing={4} align="stretch" p={5}>
        <HStack justifyContent="space-between">
          <HStack>
            <Box
              as={motion.div}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sunglasses size={32} weight="fill" />
            </Box>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              {listData?.name || "Weekend Planner"}
            </Text>
          </HStack>
          <Badge colorScheme="purple" p={2} borderRadius="md">
            {progressLabel}
          </Badge>
        </HStack>

        <HStack spacing={3}>
          <Input
            value={newActivity.text}
            onChange={(e) => setNewActivity({ ...newActivity, text: e.target.value })}
            placeholder="Add new activity"
            bg={useColorModeValue("white", "gray.700")}
          />
          <Select
            value={newActivity.type}
            onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
            width="150px"
            bg={useColorModeValue("white", "gray.700")}
          >
            {Object.entries(CATEGORIES).map(([key, { name }]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </Select>
          <Button onClick={handleAddActivity} colorScheme="purple">
            Add
          </Button>
        </HStack>

        {todoIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🌤️</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">No weekend plans yet</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add activities to make the most of your 48 hours</Text>
          </VStack>
        )}

        {DAYS.map((day) => (
          <Box key={day}>
            <Text fontSize="xl" fontWeight="bold" color={textColor} mb={4}>
              {day}
            </Text>
            {TIME_PERIODS.map((period) => (
              <React.Fragment key={`${day}-${period}`}>
                <TimeBlock
                  day={day}
                  period={period}
                  activities={groupedActivities[day]?.[period] || []}
                  onReorder={(newOrder) => handleReorder(day, period, newOrder)}
                />
                {period === "Morning" && <Divider my={4} borderColor={useColorModeValue("purple.200", "purple.700")} />}
              </React.Fragment>
            ))}
            {day === "Saturday" && <Divider my={6} borderColor={useColorModeValue("purple.200", "purple.700")} />}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default WeekendPlanner;

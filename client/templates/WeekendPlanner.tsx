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

const ActivityItem = ({ id }: { id: string }) => {
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
  const bgColor = useColorModeValue("white", "yellow.700");
  const textColor = useColorModeValue("yellow.800", "white");

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
            <Badge colorScheme="yellow">
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
};

const TimeBlock = ({ day, period, activities, onReorder }) => {
  const textColor = useColorModeValue("yellow.800", "yellow.100");

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

  const todosTable = useTable("todos");
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const store = useStore();

  const groupedActivities = useMemo(() => {
    return todoIds.reduce((grouped, id) => {
      const activity = todosTable?.[id];
      if (!activity) return grouped;
      
      const day = activity.category as string || "Saturday";
      const time = Number(activity.number) || 0;
      const period = time < 12 ? "Morning" : "Afternoon";

      if (!grouped[day]) {
        grouped[day] = { Morning: [], Afternoon: [] };
      }

      grouped[day][period].push(id);
      // Sort by time
      grouped[day][period].sort((a, b) => {
        const timeA = Number(todosTable?.[a]?.number) || 0;
        const timeB = Number(todosTable?.[b]?.number) || 0;
        return timeA - timeB;
      });

      return grouped;
    }, DAYS.reduce((acc, day) => ({ ...acc, [day]: { Morning: [], Afternoon: [] } }), {}));
  }, [todoIds, todosTable]);

  useEffect(() => {
    console.log('Weekend planner distribution updated:', {
      listId,
      groupedActivities,
      allActivities: todosTable,
      relationshipIds: todoIds
    });
  }, [groupedActivities, listId, todosTable, todoIds]);

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
    [listId]
  );

  const handleAddActivity = useCallback(() => {
    if (newActivity.text.trim()) {
      addActivity(newActivity);
    }
  }, [addActivity, newActivity]);

  const bgColor = useColorModeValue("yellow.50", "yellow.900");
  const textColor = useColorModeValue("yellow.800", "yellow.100");

  return (
    <Box
      maxWidth="800px"
      margin="auto"
      p={5}
      bg={bgColor}
      borderRadius="lg"
      boxShadow="lg"
    >
      <VStack spacing={4} align="stretch">
        <HStack justifyContent="space-between">
          <HStack>
            <Sunglasses size={32} weight="fill" />
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              {listData?.name || "Weekend Planner"}
            </Text>
          </HStack>
          <Badge colorScheme="yellow" p={2} borderRadius="md">
            {todoIds.length} Activities
          </Badge>
        </HStack>

        <HStack spacing={3}>
          <Input
            value={newActivity.text}
            onChange={(e) => setNewActivity({ ...newActivity, text: e.target.value })}
            placeholder="Add new activity"
            bg="white"
          />
          <Select
            value={newActivity.type}
            onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
            width="150px"
            bg="white"
          >
            {Object.entries(CATEGORIES).map(([key, { name }]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </Select>
          <Button onClick={handleAddActivity} colorScheme="yellow">
            Add
          </Button>
        </HStack>

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
                {period === "Morning" && <Divider my={4} borderColor="yellow.200" />}
              </React.Fragment>
            ))}
            {day === "Saturday" && <Divider my={6} borderColor="yellow.200" />}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default WeekendPlanner;
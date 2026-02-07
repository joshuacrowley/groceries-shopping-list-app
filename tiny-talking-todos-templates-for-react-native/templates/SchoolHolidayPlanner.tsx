import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Textarea,
  Badge,
  Collapse,
  useToast,
  Divider,
  Flex,
  Tooltip,
  Checkbox,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  Calendar,
  Plus,
  CaretDown,
  CaretUp,
  Sun,
  Airplane,
  GameController,
  Books,
  Users,
  MapPin,
  House,
  Sparkle,
  Clock,
  Eye,
  EyeSlash,
  CalendarBlank,
  SwimmingPool,
  Mountains,
  City,
  Tree,
  Waves,
  Camera,
  Soccer,
  Tent,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const CATEGORIES = [
  { name: "Day Trip", icon: MapPin, color: "blue" },
  { name: "Beach Day", icon: Waves, color: "cyan" },
  { name: "Home Activity", icon: House, color: "purple" },
  { name: "Educational", icon: Books, color: "green" },
  { name: "Sports & Games", icon: Soccer, color: "orange" },
  { name: "Social", icon: Users, color: "pink" },
  { name: "Adventure", icon: Mountains, color: "red" },
  { name: "City Visit", icon: City, color: "gray" },
  { name: "Nature", icon: Tree, color: "teal" },
  { name: "Swimming", icon: SwimmingPool, color: "blue" },
  { name: "Camping", icon: Tent, color: "green" },
  { name: "Special Event", icon: Sparkle, color: "yellow" },
];

// Helper functions for date handling
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

const isToday = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return date.toDateString() === today.toDateString();
};

const isTomorrow = (dateString) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(dateString);
  return date.toDateString() === tomorrow.toDateString();
};

const isPast = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

const daysDifference = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  const diffTime = date - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const ActivityItem = memo(({ id, isNext }) => {
  const { isOpen, onToggle } = useDisclosure();
  const [playComplete] = useSound("/sounds/complete/Complete 1.m4a", {
    volume: 0.5,
  });
  const [playDelete] = useSound("/sounds/cancel/Cancel 1.m4a", { volume: 0.5 });

  const activityData = useRow("todos", id);
  const updateActivity = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...activityData, ...updates }),
    [activityData]
  );
  const deleteActivity = useDelRowCallback("todos", id);

  const handleDelete = useCallback(() => {
    deleteActivity();
    playDelete();
  }, [deleteActivity, playDelete]);

  const handleComplete = useCallback(() => {
    updateActivity({ done: !activityData.done });
    if (!activityData.done) playComplete();
  }, [updateActivity, activityData.done, playComplete]);

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const nextBgColor = useColorModeValue("yellow.50", "yellow.900");

  const category = CATEGORIES.find((cat) => cat.name === activityData.category) || CATEGORIES[0];
  const CategoryIcon = category.icon;

  const dateString = formatDate(activityData.date);
  
  let dateLabel = "";
  if (activityData.date) {
    if (isToday(activityData.date)) dateLabel = "Today";
    else if (isTomorrow(activityData.date)) dateLabel = "Tomorrow";
    else {
      const daysUntil = daysDifference(activityData.date);
      if (daysUntil > 0 && daysUntil <= 7) dateLabel = `In ${daysUntil} days`;
    }
  }

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={isNext ? nextBgColor : bgColor}
      p={3}
      borderRadius="md"
      boxShadow={isNext ? "md" : "sm"}
      border={isNext ? "2px solid" : "none"}
      borderColor={isNext ? "yellow.400" : "transparent"}
      opacity={activityData.done ? 0.6 : 1}
    >
      <HStack justifyContent="space-between">
        <HStack spacing={3}>
          <CategoryIcon size={24} color={category.color} weight="fill" />
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" color={textColor}>
              {activityData.text || "Unnamed Activity"}
            </Text>
            <HStack spacing={2}>
              <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                {dateString}
              </Text>
              {dateLabel && (
                <Badge colorScheme={isNext ? "yellow" : "gray"} fontSize="xs">
                  {dateLabel}
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>
        <HStack>
          {isNext && (
            <Badge colorScheme="yellow" variant="solid">
              <HStack spacing={1}>
                <Clock size={14} />
                <Text>Next Up</Text>
              </HStack>
            </Badge>
          )}
          <IconButton
            icon={isOpen ? <CaretUp /> : <CaretDown />}
            onClick={onToggle}
            aria-label="Toggle details"
            size="sm"
            variant="ghost"
          />
          <IconButton
            icon={<Trash weight="bold" />}
            onClick={handleDelete}
            aria-label="Delete activity"
            size="sm"
            colorScheme="red"
            variant="ghost"
          />
        </HStack>
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <VStack align="stretch" mt={3} spacing={2}>
          {activityData.notes && (
            <Box>
              <Text fontWeight="bold" fontSize="sm" mb={1}>
                Description:
              </Text>
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {activityData.notes}
              </Text>
            </Box>
          )}
          <HStack>
            <Badge colorScheme={category.color}>{category.name}</Badge>
            {activityData.done && <Badge colorScheme="green">Completed</Badge>}
          </HStack>
          <Checkbox
            isChecked={activityData.done}
            onChange={handleComplete}
            colorScheme="green"
          >
            Mark as complete
          </Checkbox>
        </VStack>
      </Collapse>
    </Box>
  );
});
ActivityItem.displayName = "ActivityItem";

const EmptyDayCard = ({ date, onAdd }) => {
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const textColor = useColorModeValue("gray.500", "gray.400");
  const dateString = formatDate(date);

  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="md"
      border="2px dashed"
      borderColor={useColorModeValue("gray.300", "gray.600")}
      cursor="pointer"
      onClick={() => onAdd(date)}
      _hover={{
        borderColor: useColorModeValue("gray.400", "gray.500"),
        transform: "scale(1.02)",
      }}
      transition="all 0.2s"
    >
      <VStack spacing={2}>
        <CalendarBlank size={32} color={textColor} />
        <Text color={textColor} fontWeight="medium">
          {dateString}
        </Text>
        <Text fontSize="sm" color={textColor}>
          Click to add activity
        </Text>
      </VStack>
    </Box>
  );
};

const AddActivityModal = ({ isOpen, onClose, onAdd, suggestedDate }) => {
  const [newActivity, setNewActivity] = useState({
    text: "",
    date: suggestedDate || "",
    category: CATEGORIES[0].name,
    notes: "",
  });

  useEffect(() => {
    setNewActivity(prev => ({ ...prev, date: suggestedDate || prev.date }));
  }, [suggestedDate]);

  const handleAdd = () => {
    if (newActivity.text.trim() && newActivity.date) {
      onAdd(newActivity);
      setNewActivity({
        text: "",
        date: "",
        category: CATEGORIES[0].name,
        notes: "",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Holiday Activity</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Input
              placeholder="Activity name (e.g., Trip to the Zoo)"
              value={newActivity.text}
              onChange={(e) => setNewActivity({ ...newActivity, text: e.target.value })}
              autoFocus
            />
            <Input
              type="date"
              value={newActivity.date}
              onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
            />
            <Select
              value={newActivity.category}
              onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
            >
              {CATEGORIES.map(({ name, icon: Icon }) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Textarea
              placeholder="Description (what to bring, who's coming, meeting point, etc.)"
              value={newActivity.notes}
              onChange={(e) => setNewActivity({ ...newActivity, notes: e.target.value })}
              rows={4}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleAdd}>
            Add Activity
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SchoolHolidayPlanner = ({ listId }) => {
  const [showPast, setShowPast] = useState(false);
  const [holidayStartDate, setHolidayStartDate] = useState("");
  const [holidayEndDate, setHolidayEndDate] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [suggestedDate, setSuggestedDate] = useState("");
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", {
    volume: 0.5,
  });
  const toast = useToast();

  const store = useStore();
  const listData = useRow("lists", listId);
  const activityIds = useLocalRowIds("todoList", listId) || [];

  const addActivity = useAddRowCallback(
    "todos",
    (activity) => ({
      text: activity.text.trim(),
      date: activity.date,
      category: activity.category,
      notes: activity.notes,
      list: listId,
      done: false,
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) {
        playAdd();
        onClose();
        toast({
          title: "Activity added!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    }
  );

  // Sort and filter activities
  const { pastActivities, futureActivities, nextActivityId, emptyDays } = useMemo(() => {
    const past = [];
    const future = [];
    let nextId = null;
    let minFutureDays = Infinity;

    activityIds.forEach((id) => {
      const activity = store.getRow("todos", id);
      if (activity && activity.date) {
        if (isPast(activity.date)) {
          past.push({ id, date: activity.date });
        } else {
          future.push({ id, date: activity.date });
          
          if (!activity.done) {
            const daysUntil = daysDifference(activity.date);
            if (daysUntil >= 0 && daysUntil < minFutureDays) {
              minFutureDays = daysUntil;
              nextId = id;
            }
          }
        }
      }
    });

    // Sort by date
    past.sort((a, b) => new Date(b.date) - new Date(a.date));
    future.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Find empty days in holiday period
    const empty = [];
    if (holidayStartDate && holidayEndDate) {
      const start = new Date(holidayStartDate);
      const end = new Date(holidayEndDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const hasActivity = activityIds.some((id) => {
          const activity = store.getRow("todos", id);
          return activity && activity.date === dateStr;
        });
        
        if (!hasActivity && !isPast(dateStr)) {
          empty.push(dateStr);
        }
      }
    }

    return {
      pastActivities: past.map(a => a.id),
      futureActivities: future.map(a => a.id),
      nextActivityId: nextId,
      emptyDays: empty,
    };
  }, [activityIds, store, holidayStartDate, holidayEndDate]);

  const handleAddClick = (date = null) => {
    setSuggestedDate(date || "");
    onOpen();
  };

  const bgGradient = useColorModeValue(
    "linear-gradient(180deg, #BEE3F8 0%, white 100%)",
    "linear-gradient(180deg, #1A365D 0%, #1A202C 100%)"
  );
  const cardBgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("blue.800", "blue.100");
  const subTextColor = useColorModeValue("gray.500", "gray.400");

  const progressLabel = useMemo(() => {
    if (activityIds.length === 0) return "Plan those holidays! 🏖️";
    if (activityIds.length < 5) return "Adventures brewing ⛺";
    return "Holiday sorted! 🎉";
  }, [activityIds.length]);

  return (
    <Box
      maxWidth="700px"
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
              <Sun weight="fill" size={32} color={textColor} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="3xl" fontWeight="bold" color={textColor}>
                {listData?.name || "School Holiday Planner"}
              </Text>
              <Text fontSize="sm" color={subTextColor} fontWeight="medium">
                {progressLabel}
              </Text>
            </VStack>
          </HStack>
          <Tooltip label="Add new activity">
            <IconButton
              icon={<Plus />}
              onClick={() => handleAddClick()}
              colorScheme="blue"
              aria-label="Add activity"
            />
          </Tooltip>
        </HStack>

        <Box>
          <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
            Holiday Period:
          </Text>
          <HStack spacing={3}>
            <Input
              type="date"
              value={holidayStartDate}
              onChange={(e) => setHolidayStartDate(e.target.value)}
              placeholder="Start date"
              bg={cardBgColor}
              size="sm"
            />
            <Text>to</Text>
            <Input
              type="date"
              value={holidayEndDate}
              onChange={(e) => setHolidayEndDate(e.target.value)}
              placeholder="End date"
              bg={cardBgColor}
              size="sm"
            />
          </HStack>
        </Box>

        <Divider />

        {/* Future Activities */}
        <VStack align="stretch" spacing={3}>
          <HStack justifyContent="space-between">
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              Upcoming Activities
            </Text>
            <Badge colorScheme="blue" fontSize="md" p={2}>
              {futureActivities.length} planned
            </Badge>
          </HStack>

          {futureActivities.length === 0 && emptyDays.length === 0 && (
            <VStack py={8} spacing={3}>
              <Box as={motion.div} animate={{ y: [0, -5, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}>
                <Text fontSize="5xl">☀️</Text>
              </Box>
              <Text textAlign="center" color={textColor} fontWeight="medium" fontSize="lg">
                No activities planned yet!
              </Text>
              <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">
                Click the + button to add some fun holiday activities and make every day count
              </Text>
            </VStack>
          )}

          <AnimatePresence>
            {futureActivities.map((id) => (
              <ActivityItem key={id} id={id} isNext={id === nextActivityId} />
            ))}
          </AnimatePresence>

          {/* Empty days */}
          {emptyDays.length > 0 && (
            <VStack align="stretch" spacing={2} mt={4}>
              <Text fontSize="sm" fontWeight="bold" color={textColor}>
                Free days - click to plan something:
              </Text>
              <Flex gap={2} flexWrap="wrap">
                {emptyDays.slice(0, 7).map((date) => (
                  <Box key={date} flex="1 1 200px" maxW="300px">
                    <EmptyDayCard date={date} onAdd={handleAddClick} />
                  </Box>
                ))}
              </Flex>
              {emptyDays.length > 7 && (
                <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")} textAlign="center">
                  And {emptyDays.length - 7} more free days...
                </Text>
              )}
            </VStack>
          )}
        </VStack>

        {/* Past Activities Toggle */}
        {pastActivities.length > 0 && (
          <>
            <Divider />
            <HStack>
              <Button
                leftIcon={showPast ? <EyeSlash /> : <Eye />}
                onClick={() => setShowPast(!showPast)}
                variant="ghost"
                size="sm"
              >
                {showPast ? "Hide" : "Show"} Past Activities ({pastActivities.length})
              </Button>
            </HStack>
            <Collapse in={showPast}>
              <VStack align="stretch" spacing={2}>
                {pastActivities.map((id) => (
                  <ActivityItem key={id} id={id} isNext={false} />
                ))}
              </VStack>
            </Collapse>
          </>
        )}
      </VStack>

      <AddActivityModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={addActivity}
        suggestedDate={suggestedDate}
      />
    </Box>
  );
};

export default SchoolHolidayPlanner;
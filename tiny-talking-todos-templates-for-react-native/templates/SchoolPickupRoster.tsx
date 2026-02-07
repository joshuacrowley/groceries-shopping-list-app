import React, { useState, useCallback, useMemo, memo } from "react";
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
  Select,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Checkbox,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  CaretDown,
  CaretUp,
  GraduationCap,
  Student,
  Car,
  Clock,
  MapPin,
  PencilSimple,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const PICKUP_TYPES = {
  "A": "Drop Off",
  "B": "Pick Up",
  "C": "Both",
  "D": "None",
  "E": "Special",
};

const ScheduleItem = memo(({ id }) => {
  const { isOpen, onToggle } = useDisclosure();
  const itemData = useRow("todos", id);
  
  const updateItem = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...itemData, ...updates }),
    [itemData]
  );
  
  const deleteItem = useDelRowCallback("todos", id);

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("green.100", "green.700");
  const textColor = useColorModeValue("gray.800", "white");

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={4}
      borderRadius="md"
      borderLeft="4px solid"
      borderColor={borderColor}
      boxShadow="sm"
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <HStack spacing={4}>
            <Student size={24} />
            <Text fontWeight="bold" color={textColor}>
              {itemData.text}
            </Text>
            <Badge colorScheme={itemData.done ? "green" : "blue"}>
              {PICKUP_TYPES[itemData.type]}
            </Badge>
          </HStack>
          <HStack>
            <IconButton
              icon={isOpen ? <CaretUp /> : <CaretDown />}
              onClick={onToggle}
              aria-label="Toggle details"
              size="sm"
              variant="ghost"
            />
            <IconButton
              icon={<Trash />}
              onClick={deleteItem}
              aria-label="Delete schedule"
              size="sm"
              colorScheme="red"
              variant="ghost"
            />
          </HStack>
        </HStack>

        <Collapse in={isOpen}>
          <VStack align="stretch" spacing={3} pt={2}>
            <HStack>
              <Clock size={20} />
              <Input
                value={itemData.time || ""}
                onChange={(e) => updateItem({ time: e.target.value })}
                type="time"
                size="sm"
                width="auto"
              />
            </HStack>
            <HStack>
              <MapPin size={20} />
              <Input
                value={itemData.streetAddress || ""}
                onChange={(e) => updateItem({ streetAddress: e.target.value })}
                placeholder="Location"
                size="sm"
              />
            </HStack>
            <HStack>
              <Car size={20} />
              <Select
                value={itemData.type}
                onChange={(e) => updateItem({ type: e.target.value })}
                size="sm"
              >
                {Object.entries(PICKUP_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </Select>
            </HStack>
            <Checkbox
              isChecked={itemData.done}
              onChange={(e) => updateItem({ done: e.target.checked })}
            >
              Confirmed
            </Checkbox>
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
});

ScheduleItem.displayName = "ScheduleItem";

const AddScheduleModal = ({ isOpen, onClose, onAdd, selectedDay }) => {
  const [newSchedule, setNewSchedule] = useState({
    text: "",
    type: "A",
    time: "",
    streetAddress: "",
  });

  const handleSubmit = () => {
    if (newSchedule.text.trim()) {
      onAdd({
        ...newSchedule,
        category: selectedDay,
      });
      setNewSchedule({
        text: "",
        type: "A",
        time: "",
        streetAddress: "",
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Schedule for {selectedDay}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Child's Name</FormLabel>
              <Input
                value={newSchedule.text}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, text: e.target.value })
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Schedule Type</FormLabel>
              <Select
                value={newSchedule.type}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, type: e.target.value })
                }
              >
                {Object.entries(PICKUP_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Time</FormLabel>
              <Input
                type="time"
                value={newSchedule.time}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, time: e.target.value })
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Location</FormLabel>
              <Input
                value={newSchedule.streetAddress}
                onChange={(e) =>
                  setNewSchedule({ ...newSchedule, streetAddress: e.target.value })
                }
                placeholder="Enter location"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" mr={3} onClick={handleSubmit}>
            Add Schedule
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const SchoolPickupRoster = ({ listId }) => {
  const [selectedDay, setSelectedDay] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const store = useStore();
  const scheduleIds = useLocalRowIds("todoList", listId) || [];
  
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });

  const addSchedule = useAddRowCallback(
    "todos",
    (schedule) => ({
      ...schedule,
      list: listId,
      done: false,
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) playAdd();
    }
  );

  const schedulesByDay = useMemo(() => {
    return DAYS.reduce((acc, day) => {
      acc[day] = scheduleIds.filter(id => {
        const schedule = store.getRow("todos", id);
        return schedule?.category === day;
      });
      return acc;
    }, {});
  }, [scheduleIds, store]);

  const progressLabel = useMemo(() => {
    const count = scheduleIds.length;
    if (count === 0) return "Plan pickup duties! 🚗";
    if (count <= 3) return "Roster coming together 📋";
    return "Pickup sorted! ✅";
  }, [scheduleIds.length]);

  const handleAddClick = (day) => {
    setSelectedDay(day);
    onOpen();
  };

  const bgGradient = useColorModeValue(
    "linear(to-br, green.50, green.100)",
    "linear(to-br, green.900, green.800)"
  );
  const bgColor = useColorModeValue("green.50", "green.900");
  const headerColor = useColorModeValue("green.600", "green.200");
  const subTextColor = useColorModeValue("green.500", "green.300");

  return (
    <Box maxW="800px" mx="auto" p={5} bgGradient={bgGradient} borderRadius="xl" overflow="hidden" boxShadow="xl">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Box as={motion.div} animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <GraduationCap size={32} weight="fill" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color={headerColor}>
                School Pickup Roster
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </VStack>
          </HStack>
          <Badge colorScheme="green" fontSize="md" p={2} borderRadius="md">
            {scheduleIds.length} schedules
          </Badge>
        </HStack>

        {scheduleIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🚗</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">No pickup roster yet</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add pickup schedules to stay organized</Text>
          </VStack>
        )}

        {DAYS.map((day) => (
          <Box
            key={day}
            bg={bgColor}
            p={4}
            borderRadius="lg"
            boxShadow="sm"
            borderWidth="1px"
          >
            <HStack justify="space-between" mb={4}>
              <Text fontWeight="bold" fontSize="lg">
                {day}
              </Text>
              <Button
                leftIcon={<PencilSimple />}
                onClick={() => handleAddClick(day)}
                size="sm"
                colorScheme="green"
              >
                Add Schedule
              </Button>
            </HStack>
            <VStack spacing={3} align="stretch">
              {schedulesByDay[day]?.map((id) => (
                <ScheduleItem key={id} id={id} />
              ))}
              {!schedulesByDay[day]?.length && (
                <Text color="gray.500" textAlign="center">
                  No schedules for {day}
                </Text>
              )}
            </VStack>
          </Box>
        ))}
      </VStack>

      <AddScheduleModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={addSchedule}
        selectedDay={selectedDay}
      />
    </Box>
  );
};

export default SchoolPickupRoster;
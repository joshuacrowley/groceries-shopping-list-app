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
  Badge,
  Collapse,
  useDisclosure,
  Select,
  Textarea,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Flex,
  Center,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  CaretDown,
  CaretUp,
  Baby,
  Plus,
  CircleWavyWarning,
  Onigiri,
  X,
} from "@phosphor-icons/react";
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MEAL_TYPES = {
  A: "Main",
  B: "Snack",
  C: "Fruit",
  D: "Drink",
  E: "Tuck Shop",
};
const FOOD_EMOJIS = ["🥪", "🍎", "🥕", "🍇", "🥨", "🧃", "🍪", "🍌", "🥤", "🍫"];

const LunchItem = memo(({ id }: { id: string }) => {
  const { isOpen, onToggle } = useDisclosure();
  const [playToggle] = useSound("/sounds/notification/Notification 2.m4a", { volume: 0.5 });

  const itemData = useRow("todos", id);
  const updateItem = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...itemData, ...updates }),
    [itemData]
  );
  const deleteItem = useDelRowCallback("todos", id);

  const handleNotEaten = useCallback(() => {
    updateItem({ done: !itemData.done });
  }, [updateItem, itemData.done]);

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");

  if (!itemData) return null;

  return (
    <Box
      as={motion.div}
      layout
      width="200px"
      minW="200px"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      opacity={itemData.done ? 0.7 : 1}
      mx={2}
    >
      <VStack spacing={3}>
        <Center fontSize="3xl" h="60px">
          {itemData.emoji}
        </Center>
        <VStack spacing={1} align="center" w="100%">
          <Text fontWeight="bold" textAlign="center">
            {itemData.text}
          </Text>
          <Badge colorScheme={getTypeColor(MEAL_TYPES[itemData.type])}>
            {MEAL_TYPES[itemData.type]}
          </Badge>
        </VStack>
        <HStack spacing={2}>
          <Tooltip label={itemData.done ? "Wasn't eaten" : "Mark as not eaten"}>
            <IconButton
              icon={<CircleWavyWarning />}
              onClick={handleNotEaten}
              aria-label="Toggle eaten status"
              colorScheme={itemData.done ? "red" : "gray"}
              variant="ghost"
              size="sm"
            />
          </Tooltip>
          <IconButton
            icon={isOpen ? <CaretUp /> : <CaretDown />}
            onClick={() => {
              onToggle();
              playToggle();
            }}
            aria-label="Toggle details"
            size="sm"
            variant="ghost"
          />
          <IconButton
            icon={<Trash />}
            onClick={deleteItem}
            aria-label="Delete item"
            colorScheme="red"
            variant="ghost"
            size="sm"
          />
        </HStack>
      </VStack>
      <Collapse in={isOpen}>
        <VStack align="stretch" mt={3} spacing={2}>
          <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.300")}>
            Notes: {itemData.notes || "No special instructions"}
          </Text>
          {itemData.type === "E" && (
            <Text fontSize="sm" color={useColorModeValue("green.600", "green.300")}>
              Amount: ${itemData.amount.toFixed(2)}
            </Text>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
});
LunchItem.displayName = "LunchItem";

const AddLunchItemModal = ({ isOpen, onClose, onAdd, childName, day }) => {
  const [newItem, setNewItem] = useState({
    text: "",
    type: "A",
    notes: "",
    emoji: "🥪",
    amount: 0,
  });

  const handleAdd = () => {
    if (newItem.text.trim()) {
      onAdd({
        ...newItem,
        category: childName,
        date: day,
      });
      setNewItem({
        text: "",
        type: "A",
        notes: "",
        emoji: "🥪",
        amount: 0,
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Lunch Item for {day}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <HStack>
              <Select
                value={newItem.emoji}
                onChange={(e) => setNewItem({ ...newItem, emoji: e.target.value })}
                width="100px"
              >
                {FOOD_EMOJIS.map((emoji) => (
                  <option key={emoji} value={emoji}>
                    {emoji}
                  </option>
                ))}
              </Select>
              <Input
                placeholder="Item name"
                value={newItem.text}
                onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
              />
            </HStack>
            <Select
              value={newItem.type}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
            >
              {Object.entries(MEAL_TYPES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </Select>
            {newItem.type === "E" && (
              <Input
                type="number"
                placeholder="Amount"
                value={newItem.amount}
                onChange={(e) =>
                  setNewItem({ ...newItem, amount: parseFloat(e.target.value) || 0 })
                }
              />
            )}
            <Textarea
              placeholder="Special instructions or notes"
              value={newItem.notes}
              onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" mr={3} onClick={handleAdd}>
            Add Item
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const getTypeColor = (type) => {
  switch (type) {
    case "Main":
      return "blue";
    case "Snack":
      return "orange";
    case "Fruit":
      return "green";
    case "Drink":
      return "purple";
    case "Tuck Shop":
      return "pink";
    default:
      return "gray";
  }
};

const DaySection = ({ day, childName, items, onAddItem }) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const store = useStore();
  const borderColor = useColorModeValue("green.200", "green.700");

  const dayItems = useMemo(() => {
    return items.filter(id => {
      const item = store.getRow("todos", id);
      return item && item.date === day;
    });
  }, [items, day, store]);

  return (
    <Box borderLeft="4px" borderColor={borderColor} pl={3} mb={4}>
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="bold">{day}</Text>
        <IconButton
          icon={<Plus />}
          onClick={onOpen}
          aria-label={`Add item for ${day}`}
          size="sm"
          colorScheme="green"
          variant="ghost"
        />
      </HStack>
      <Box overflowX="auto" pb={2}>
        <Flex direction="row" minWidth="min-content">
          {dayItems.map((id) => (
            <LunchItem key={id} id={id} />
          ))}
          {dayItems.length === 0 && (
            <Text
              fontSize="sm"
              fontStyle="italic"
              color={useColorModeValue("gray.500", "gray.400")}
              textAlign="center"
              py={2}
              w="full"
            >
              No items planned
            </Text>
          )}
        </Flex>
      </Box>
      <AddLunchItemModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={onAddItem}
        childName={childName}
        day={day}
      />
    </Box>
  );
};

const ChildSection = ({ childName, onDelete, listId, todoIds }) => {
  const bgColor = useColorModeValue("green.100", "green.800");
  const store = useStore();

  const addItem = useAddRowCallback(
    "todos",
    (item) => ({
      ...item,
      list: listId,
      done: false,
      fiveStarRating: 1,
    }),
    [listId]
  );

  const items = useMemo(() => {
    return todoIds.filter((id) => {
      const cat = store?.getCell("todos", id, "category");
      return cat === childName;
    });
  }, [todoIds, store, childName]);

  return (
    <Box bg={bgColor} p={4} borderRadius="lg" mb={4}>
      <HStack mb={4} spacing={2} justify="space-between">
        <HStack>
          <Baby size={24} />
          <Text fontSize="xl" fontWeight="bold">
            {childName}
          </Text>
        </HStack>
        <IconButton
          icon={<X />}
          onClick={() => onDelete(childName)}
          aria-label="Delete child"
          colorScheme="red"
          variant="ghost"
          size="sm"
        />
      </HStack>
      {DAYS.map((day) => (
        <DaySection
          key={day}
          day={day}
          childName={childName}
          items={items}
          onAddItem={addItem}
        />
      ))}
    </Box>
  );
};

const LunchPlanner = ({ listId = "lunch-planner" }) => {
  const [children, setChildren] = useState(["Child 1"]);
  const [newChildName, setNewChildName] = useState("");
  const listData = useRow("lists", listId);
  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.5 });

  const handleAddChild = () => {
    if (newChildName.trim() && !children.includes(newChildName.trim())) {
      setChildren([...children, newChildName.trim()]);
      setNewChildName("");
      playAdd();
    }
  };

  const handleDeleteChild = useCallback((childName) => {
    todoIds.forEach((id) => {
      const cat = store?.getCell("todos", id, "category");
      if (cat === childName) {
        store?.delRow("todos", id);
      }
    });
    setChildren(children.filter(name => name !== childName));
  }, [store, children, todoIds]);

  const bgGradient = useColorModeValue(
    "linear-gradient(180deg, #F0FFF4 0%, white 100%)",
    "linear-gradient(180deg, #1a3a2a 0%, #1A202C 100%)"
  );
  const headerColor = useColorModeValue("green.700", "green.200");
  const subTextColor = useColorModeValue("green.500", "green.300");

  return (
    <Box maxW="800px" mx="auto" borderRadius="xl" overflow="hidden" boxShadow="xl" bgGradient={bgGradient} position="relative">
      <VStack spacing={4} align="stretch" p={5}>
        <HStack justify="space-between" alignItems="flex-start">
          <HStack spacing={3}>
            <Box
              as={motion.div}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <DynamicIcon iconName={String(listData?.icon || "Onigiri")} size={32} weight="fill" />
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={headerColor}>
                {String(listData?.name || "Lunch Box Planner")}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">Pack with love 🍱</Text>
            </Box>
          </HStack>
          <HStack>
            <Input
              placeholder="Add child's name"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              size="sm"
              width="200px"
            />
            <Button onClick={handleAddChild} size="sm" colorScheme={listData?.color || 'green'}>
              Add Child
            </Button>
          </HStack>
        </HStack>

        <AnimatePresence>
          {children.map((childName) => (
            <ChildSection
              key={childName}
              childName={childName}
              onDelete={handleDeleteChild}
              listId={listId}
              todoIds={todoIds}
            />
          ))}
        </AnimatePresence>
      </VStack>
    </Box>
  );
};

export default LunchPlanner;
import React, { useState, useCallback, useMemo, memo } from "react";
import {
  useLocalRowIds,
  useStore,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useRow,
} from "tinybase/ui-react";
import DynamicIcon from "@/components/catalogue/DynamicIcon";
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  IconButton,
  useColorModeValue,
  Checkbox,
  Textarea,
  Collapse,
  useDisclosure,
  Badge,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  Gift,
  CaretDown,
  CaretUp,
  PencilSimple,
  Check,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const TYPES = ["A", "B", "C", "D", "E"];

const GiveAwayItem = memo(({ id }: { id: string }) => {
  const todoData = useRow("todos", id);
  const { isOpen, onToggle } = useDisclosure();

  const updateTodo = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...todoData, ...updates }),
    [todoData]
  );

  const deleteTodo = useDelRowCallback("todos", id);

  const handleChange = useCallback(
    (field, value) => {
      updateTodo({ [field]: value });
    },
    [updateTodo]
  );

  const handleToggleDone = useCallback(() => {
    updateTodo({ done: !todoData.done });
  }, [updateTodo, todoData.done]);

  const bgColor = useColorModeValue("white", "gray.700");
  const inputBgColor = useColorModeValue("gray.100", "gray.600");

  return (
    <Box
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      opacity={todoData.done ? 0.6 : 1}
      css={{ transition: "opacity 0.2s, border-color 0.2s" }}
    >
      <HStack spacing={4}>
        <Checkbox
          isChecked={todoData.done}
          onChange={handleToggleDone}
          colorScheme="green"
        />
        <Text flex={1} fontWeight="bold">
          {todoData.text}
        </Text>
        <IconButton
          icon={isOpen ? <CaretUp /> : <CaretDown />}
          onClick={onToggle}
          aria-label="Toggle details"
          size="sm"
        />
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <VStack align="stretch" mt={4} spacing={3}>
          <Textarea
            value={todoData.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Item description"
            bg={inputBgColor}
          />
          <Input
            value={todoData.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Recipient's email"
            bg={inputBgColor}
          />
          <HStack>
            <IconButton
              icon={<Trash />}
              onClick={deleteTodo}
              aria-label="Delete item"
              colorScheme="red"
              size="sm"
            />
          </HStack>
        </VStack>
      </Collapse>
    </Box>
  );
});
GiveAwayItem.displayName = "GiveAwayItem";

const ItemList = ({ items, title, badgeColor }) => {
  return (
    <Box>
      <Text fontWeight="bold" mb={2}>
        {title} <Badge colorScheme={badgeColor}>{items.length}</Badge>
      </Text>
      <VStack spacing={2} align="stretch">
        <AnimatePresence>
          {items.map((item) => (
            <GiveAwayItem
              key={item.id}
              id={item.id}
            />
          ))}
        </AnimatePresence>
      </VStack>
    </Box>
  );
};

const GiveAwayList = ({ listId = "give-away-list" }) => {
  const [newItem, setNewItem] = useState("");
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.5 });
  const store = useStore();
  const listData = useRow("lists", listId);
  const itemIds = useLocalRowIds("todoList", listId) || [];

  const addItem = useAddRowCallback(
    "todos",
    (text) => ({
      text: text.trim(),
      list: listId,
      done: false,
      type: "A",
    }),
    [listId],
    undefined,
    (store, rowId) => {
      if (rowId) {
        setNewItem("");
        playAdd();
      }
    }
  );

  const handleAddItem = useCallback(() => {
    if (newItem.trim() !== "") {
      addItem(newItem);
    }
  }, [addItem, newItem]);

  const { availableItems, assignedItems } = useMemo(() => {
    const available = [];
    const assigned = [];
    itemIds.forEach((id) => {
      const email = store?.getCell("todos", id, "email");
      if (email) {
        assigned.push({ id });
      } else {
        available.push({ id });
      }
    });
    return { availableItems: available, assignedItems: assigned };
  }, [itemIds, store]);

  const bgGradient = useColorModeValue(
    "linear-gradient(180deg, teal.50 0%, white 100%)",
    "linear-gradient(180deg, #1a3d3d 0%, #1A202C 100%)"
  );
  const textColor = useColorModeValue(
    listData?.color ? `${listData.color}.800` : "teal.800",
    listData?.color ? `${listData.color}.100` : "teal.100"
  );
  const headerColor = useColorModeValue("teal.700", "teal.200");
  const subTextColor = useColorModeValue("teal.500", "teal.300");
  const inputBgColor = useColorModeValue("white", "gray.700");

  const progressLabel = useMemo(() => {
    if (itemIds.length === 0) return "Ready to declutter? 📦";
    if (itemIds.length <= 3) return "Sorting things out 🧹";
    return "Declutter champion! ✨";
  }, [itemIds.length]);

  return (
    <Box
      maxWidth="600px"
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
              <DynamicIcon iconName={listData?.icon || "Gift"} size={32} weight="fill" color={textColor}/>
            </Box>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              {listData?.name || "Give Away List"}
            </Text>
          </HStack>
          <Badge colorScheme="teal" p={2} borderRadius="md">
            {progressLabel}
          </Badge>
        </HStack>
        <HStack>
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add a new item"
            bg={inputBgColor}
          />
          <Button
            onClick={handleAddItem}
            colorScheme="teal"
            leftIcon={<Check />}
            size="md"
          >
            Add
          </Button>
        </HStack>

        {itemIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">📦</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">Nothing to rehome yet</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add items you'd like to give away, sell, or donate</Text>
          </VStack>
        )}

        <ItemList
          items={availableItems}
          title="Available Items"
          badgeColor="green"
  
        />
        <ItemList
          items={assignedItems}
          title="Assigned Items"
          badgeColor="blue"
    
        />
      </VStack>
    </Box>
  );
};

export default GiveAwayList;

import React, { useState, useCallback, useMemo, memo } from "react";
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
} from "tinybase/ui-react";
import DynamicIcon from "@/components/catalogue/DynamicIcon";
import useSound from "use-sound";
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
  Collapse,
  useDisclosure,
  Badge,
  Select,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  CaretDown,
  CaretUp,
  SmileyXEyes,
  SmileyNervous,
  Smiley,
} from "@phosphor-icons/react";

const TYPES = [
  "Dry Goods",
  "Canned/Jarred",
  "Refrigerated",
  "Frozen",
  "Spices/Seasonings",
];

const PantryItem = memo(({ id }: { id: string }) => {
  const { isOpen, onToggle } = useDisclosure();
  const itemData = useRow("todos", id);

  const updateItem = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...itemData, ...updates }),
    [itemData]
  );

  const deleteItem = useDelRowCallback("todos", id);

  const handleChange = useCallback(
    (field, value) => {
      updateItem({ [field]: value });
    },
    [updateItem]
  );

  const handleDelete = useCallback(() => {
    deleteItem();
  }, [deleteItem]);

  const daysUntilExpiration = useMemo(() => {
    if (!itemData.date) return null;
    const today = new Date();
    const expDate = new Date(itemData.date);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [itemData.date]);

  const expirationStatus = useMemo(() => {
    if (daysUntilExpiration === null) return "none";
    if (daysUntilExpiration < 0) return "expired";
    if (daysUntilExpiration <= 7) return "soon";
    return "good";
  }, [daysUntilExpiration]);

  const statusColors = {
    expired: "red.500",
    soon: "orange.400",
    good: "green.400",
    none: "gray.400",
  };

  const statusIcons = {
    expired: <SmileyXEyes size={20} />,
    soon: <SmileyNervous size={20} />,
    good: <Smiley size={20} />,
    none: null,
  };

  const textColor = useColorModeValue("gray.700", "gray.200");
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("orange.200", "orange.600");

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      borderLeft="4px solid"
      borderLeftColor={statusColors[expirationStatus]}
      borderColor={borderColor}
      borderWidth="1px"
    >
      <HStack spacing={4}>
        <Checkbox
          isChecked={itemData.done}
          onChange={(e) => handleChange("done", e.target.checked)}
          colorScheme="green"
        />
        <Text
          flex={1}
          color={textColor}
          textDecoration={itemData.done ? "line-through" : "none"}
        >
          {itemData.text}
        </Text>
        <Badge
          colorScheme={
            expirationStatus === "expired"
              ? "red"
              : expirationStatus === "soon"
              ? "orange"
              : "green"
          }
          display="flex"
          alignItems="center"
          paddingY={1}
        >
          {statusIcons[expirationStatus]}
          <Text ml={1}>
            {expirationStatus === "expired"
              ? "Expired"
              : expirationStatus === "soon"
              ? "Expiring Soon"
              : expirationStatus === "good"
              ? "Good"
              : "No Date"}
          </Text>
        </Badge>
        <IconButton
          icon={isOpen ? <CaretUp /> : <CaretDown />}
          onClick={onToggle}
          aria-label="Toggle details"
          colorScheme="orange"
          variant="ghost"
        />
        <IconButton
          icon={<Trash />}
          onClick={handleDelete}
          aria-label="Delete item"
          colorScheme="red"
          variant="ghost"
        />
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <VStack align="stretch" mt={4} spacing={3}>
          <HStack>
            <Text minWidth="120px">Expiration Date:</Text>
            <Input
              value={itemData.date || ""}
              onChange={(e) => handleChange("date", e.target.value)}
              placeholder="YYYY-MM-DD"
              type="date"
            />
          </HStack>
          <HStack>
            <Text minWidth="120px">Type:</Text>
            <Select
              value={itemData.type || "Dry Goods"}
              onChange={(e) => handleChange("type", e.target.value)}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </HStack>
          <HStack>
            <Text minWidth="120px">Notes:</Text>
            <Input
              value={itemData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes"
            />
          </HStack>
        </VStack>
      </Collapse>
    </Box>
  );
});
PantryItem.displayName = "PantryItem";

const PantryInventory = ({ listId }) => {
  const [newItem, setNewItem] = useState("");
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });
  const itemIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addItem = useAddRowCallback(
    "todos",
    (text) => ({
      text: text.trim(),
      done: false,
      list: listId,
      date: "",
      type: "Dry Goods",
      notes: "",
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewItem("");
      }
    }
  );

  const handleInputChange = useCallback((e) => {
    setNewItem(e.target.value);
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && newItem.trim() !== "") {
        addItem(newItem);
      }
    },
    [addItem, newItem]
  );

  const handleAddClick = useCallback(() => {
    if (newItem.trim() !== "") {
      addItem(newItem);
      playAdd();
    }
  }, [addItem, newItem, playAdd]);

  const color = String(listData?.color || "orange");
  const bgGradient = useColorModeValue(
    `linear-gradient(180deg, ${color}.50 0%, white 100%)`,
    `linear-gradient(180deg, #3d2a1a 0%, #1A202C 100%)`
  );
  const cardBgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue(`${color}.800`, `${color}.100`);
  const subTextColor = useColorModeValue(`${color}.600`, `${color}.300`);

  const progressLabel = useMemo(() => {
    if (itemIds.length === 0) return "Track what's in your pantry! 🏪";
    if (itemIds.length <= 5) return "A few items to watch 👀";
    if (itemIds.length <= 15) return "Good pantry awareness 📦";
    if (itemIds.length <= 30) return "Well-stocked kitchen! 🧑‍🍳";
    return "Pantry pro status! 🏆";
  }, [itemIds.length]);

  return (
    <Box
      maxWidth="600px"
      margin="auto"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xl"
      bgGradient={bgGradient}
      position="relative"
    >
      <VStack spacing={4} align="stretch" p={5}>
        <HStack justifyContent="space-between" alignItems="flex-start">
          <HStack spacing={3}>
            <Box
              as={motion.div}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <DynamicIcon iconName={String(listData?.icon || "Cookie")} size={32} weight="fill" />
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {String(listData?.name || "Pantry Inventory")}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </Box>
          </HStack>
          <Badge colorScheme={color} fontSize="sm" px={3} py={1} borderRadius="full">
            {itemIds.length} {itemIds.length === 1 ? "item" : "items"}
          </Badge>
        </HStack>
        <HStack>
          <Input
            value={newItem}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Add a new pantry item"
            bg={cardBgColor}
            color={textColor}
          />
          <Button onClick={handleAddClick} colorScheme="orange">
            Add
          </Button>
        </HStack>
        <VStack spacing={2} align="stretch">
          <AnimatePresence>
            {itemIds.map((id) => (
              <PantryItem key={id} id={id} />
            ))}
          </AnimatePresence>
        </VStack>

        {itemIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🫙</Text>
            </Box>
            <Text textAlign="center" color={textColor} fontWeight="medium" fontSize="lg">Your pantry tracker is empty</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add items above to start tracking expiration dates</Text>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default PantryInventory;

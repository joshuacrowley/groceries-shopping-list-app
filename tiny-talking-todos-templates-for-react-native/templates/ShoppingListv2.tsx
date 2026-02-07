import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
  useCreateQueries,
  useResultCell,
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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
  Checkbox,
  Collapse,
  Textarea,
  useDisclosure,
  Tooltip,
  useToast,
  Badge,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  CaretDown,
  CaretRight,
  Orange,
  Egg,
  Fish,
  Bread,
  Package,
  Snowflake,
  Coffee,
  House,
  Question,
  JarLabel,
  Note,
  Tag,
  ClipboardText, // Added ClipboardText icon
} from "@phosphor-icons/react";
import DynamicIcon from "@/components/catalogue/DynamicIcon";
import useSound from "use-sound";

const CATEGORIES = [
  { name: "Fruits & Vegetables", icon: Orange },
  { name: "Dairy & Eggs", icon: Egg },
  { name: "Meat & Seafood", icon: Fish },
  { name: "Bakery", icon: Bread },
  { name: "Pantry", icon: Package },
  { name: "Frozen Foods", icon: Snowflake },
  { name: "Beverages", icon: Coffee },
  { name: "Household", icon: House },
  { name: "Other", icon: Question },
];

const GroceryItem = memo(({ id }: { id: string }) => {
  const { isOpen, onToggle } = useDisclosure();
  const itemData = useRow("todos", id);

  const updateItem = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...itemData, ...updates }),
    [itemData]
  );

  const deleteItem = useDelRowCallback("todos", id);

  const handleAmountChange = useCallback(
    (value) => {
      updateItem({ amount: parseFloat(value) });
    },
    [updateItem]
  );

  const handleCategoryChange = useCallback(
    (e) => {
      updateItem({ category: e.target.value });
    },
    [updateItem]
  );

  const handleNotesChange = useCallback(
    (e) => {
      updateItem({ notes: e.target.value });
    },
    [updateItem]
  );

  const handleDoneToggle = useCallback(() => {
    updateItem({ done: !Boolean(itemData.done) });
  }, [updateItem, itemData.done]);

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const detailsBgColor = useColorModeValue("gray.50", "gray.600");
  const hasNotes = typeof itemData.notes === 'string' && itemData.notes.trim().length > 0;

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      borderRadius="md"
      boxShadow="sm"
      opacity={Boolean(itemData.done) ? 0.6 : 1}
      overflow="hidden"
    >
      <HStack
        p={2}
        width="100%"
        spacing={3}
        justifyContent="space-between"
      >
        <Checkbox
          isChecked={Boolean(itemData.done)}
          onChange={handleDoneToggle}
          colorScheme="green"
        />
        <Box flex={1}>
          <Text
            color={textColor}
            textDecoration={Boolean(itemData.done) ? "line-through" : "none"}
          >
            {String(itemData.text || "")}
          </Text>
          {hasNotes && (
            <Text
              fontSize="xs"
              color="gray.500"
              noOfLines={1}
              textDecoration={Boolean(itemData.done) ? "line-through" : "none"}
            >
              {String(itemData.notes)}
            </Text>
          )}
        </Box>
        
        <HStack spacing={1}>
          <Text fontSize="sm" color={textColor}>
            ${Number(itemData.amount || 0).toFixed(2)}
          </Text>
          <IconButton
            icon={isOpen ? <CaretDown /> : <CaretRight />}
            onClick={onToggle}
            aria-label={isOpen ? "Collapse details" : "Expand details"}
            size="sm"
            variant="ghost"
          />
          <IconButton
            icon={<Trash weight="bold" />}
            onClick={deleteItem}
            aria-label="Delete grocery item"
            size="sm"
            colorScheme="red"
            variant="ghost"
          />
        </HStack>
      </HStack>

      <Collapse in={isOpen}>
        <VStack 
          align="stretch" 
          p={3} 
          bg={detailsBgColor} 
          spacing={3}
        >
          <HStack alignItems="flex-start">
            <Box width="50%">
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Category:
              </Text>
              <Select
                value={String(itemData.category || "Other")}
                onChange={handleCategoryChange}
                size="sm"
              >
                {CATEGORIES.map(({ name }) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </Box>
            
            <Box width="50%">
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                Price:
              </Text>
              <InputGroup size="sm">
                <InputLeftAddon children="$" />
                <NumberInput
                  value={Number(itemData.amount || 0)}
                  onChange={handleAmountChange}
                  min={0}
                  step={0.01}
                  precision={2}
                  width="100%"
                >
                  <NumberInputField borderLeftRadius={0} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </InputGroup>
            </Box>
          </HStack>
          
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              Notes (recipe, brand, etc.):
            </Text>
            <Textarea
              value={String(itemData.notes || "")}
              onChange={handleNotesChange}
              placeholder="Add notes about this item..."
              size="sm"
              rows={2}
            />
          </Box>
        </VStack>
      </Collapse>
    </Box>
  );
});
GroceryItem.displayName = "GroceryItem";

const CategoryGroup = memo(({ category, items, isOpen, onToggle, listData }: any) => {
  const bgColor = useColorModeValue(`${listData?.color || "green"}.50`, `${listData?.color || "green"}.900`);
  const textColor = useColorModeValue(`${listData?.color || "green"}.800`, `${listData?.color || "green"}.100`);
  const IconComponent = category.icon;

  return (
    <Box mb={2}>
      <HStack
        onClick={onToggle}
        cursor="pointer"
        bg={bgColor}
        p={2}
        borderRadius="md"
        justifyContent="space-between"
      >
        <HStack>
          <IconComponent size={24} />
          <Text fontWeight="bold" color={textColor}>
            {category.name}
          </Text>
        </HStack>
        <HStack>
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </Text>
          {isOpen ? <CaretDown /> : <CaretRight />}
        </HStack>
      </HStack>
      <Collapse in={isOpen}>
        <VStack align="stretch" mt={1} spacing={1}>
          {items.map((id) => (
            <GroceryItem key={id} id={id} />
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
});
CategoryGroup.displayName = "CategoryGroup";

const GroceryListTodo = ({ listId }) => {
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [openCategories, setOpenCategories] = useState(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {})
  );
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });

  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  const store = useStore();
  const toast = useToast();

  const { categorizedItems, uncategorizedItems } = useMemo(() => {
    return todoIds.reduce(
      (acc, id) => {
        const cat = String(store?.getCell("todos", id, "category") || "Other");
        const categoryExists = CATEGORIES.some(c => c.name === cat);
        if (categoryExists) {
          if (!acc.categorizedItems[cat]) acc.categorizedItems[cat] = [];
          acc.categorizedItems[cat].push(id);
        } else {
          acc.uncategorizedItems.push(id);
        }
        return acc;
      },
      { categorizedItems: {} as Record<string, string[]>, uncategorizedItems: [] as string[] }
    );
  }, [todoIds, store]);

  const addItem = useAddRowCallback(
    "todos",
    (text: string) => ({
      text: text.trim(),
      amount: 0,
      category: selectedCategory,
      list: listId,
      done: false,
      notes: "",
    }),
    [listId, selectedCategory],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewItem("");
        setSelectedCategory(CATEGORIES[0].name);
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

  const queries = useCreateQueries(store, (store) => {
    return createQueries(store).setQueryDefinition(
      "totalAmount",
      "todos",
      ({ select, where, group }) => {
        select("amount");
        where("list", listId);
        where("done", false);
        group("amount", "sum").as("total");
      }
    );
  });

  const totalAmountCell = useResultCell("totalAmount", "0", "total", queries);
  const totalAmount = Number(totalAmountCell) || 0;

  const color = String(listData?.color || "green");
  const bgGradient = useColorModeValue(
    `linear-gradient(180deg, ${color}.50 0%, white 100%)`,
    `linear-gradient(180deg, ${color}.900 0%, gray.800 100%)`
  );
  const cardBgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue(`${color}.800`, `${color}.100`);
  const subTextColor = useColorModeValue(`${color}.600`, `${color}.300`);

  const progressLabel = useMemo(() => {
    const count = todoIds.length;
    if (count === 0) return "Time to start shopping! 🛒";
    if (count <= 5) return "Quick shop today 🧺";
    if (count <= 15) return "Good haul coming up 🛍️";
    if (count <= 25) return "Big shop energy! 💪";
    return "Stocking up the pantry! 🏪";
  }, [todoIds.length]);

  const toggleCategory = useCallback((category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const handleCopyList = useCallback(async () => {
    const activeItems = todoIds.filter(id => !store.getCell("todos", id, "done"));
    if (activeItems.length === 0) {
      toast({
        title: "List is empty or all items are done",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const listContent = activeItems.map(id => {
      const item = store.getRow("todos", id);
      if (item) {
        const itemText = String(item.text || "");
        const itemAmount = Number(item.amount || 0) > 0 ? `$${Number(item.amount).toFixed(2)}` : '';
        const itemNotes = typeof item.notes === 'string' && item.notes ? ` (${item.notes})` : '';
        return `- ${itemText}${itemAmount ? ` - ${itemAmount}` : ''}${itemNotes}`;
      }
      return '';
    }).filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(listContent);
      toast({
        title: "List copied to clipboard!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Failed to copy list: ", err);
      toast({
        title: "Failed to copy list",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  }, [todoIds, store, toast]);

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
      <VStack spacing={3} align="stretch" p={5}>
        <HStack justifyContent="space-between" alignItems="flex-start">
          <HStack alignItems="center" spacing={3}>
            <Box
              as={motion.div}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <DynamicIcon iconName={String(listData?.icon || "ListChecks")} size={32} weight="fill" />
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {String(listData?.name || "Shopping")}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </Box>
          </HStack>
          <HStack>
            <Badge colorScheme={color} fontSize="sm" px={3} py={1} borderRadius="full">
              ${totalAmount.toFixed(2)}
            </Badge>
            <Tooltip label="Copy active items to clipboard" placement="top">
              <IconButton
                icon={<ClipboardText weight="bold" />}
                onClick={handleCopyList}
                aria-label="Copy list to clipboard"
                size="sm"
                colorScheme={color}
                variant="ghost"
              />
            </Tooltip>
          </HStack>
        </HStack>
        <HStack>
          <Input
            value={newItem}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Add a new item"
            bg={cardBgColor}
            color={textColor}
          />
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            width="150px"
            bg="white"
          >
            {CATEGORIES.map(({ name }) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <Button onClick={handleAddClick} colorScheme="green" size="md">
            Add
          </Button>
        </HStack>
        <VStack spacing={1} align="stretch">
          <AnimatePresence>
            {CATEGORIES.map((category) => {
              const items = categorizedItems[category.name] || [];
              return items.length > 0 ? (
                <CategoryGroup
                  key={category.name}
                  category={category}
                  items={items}
                  isOpen={openCategories[category.name]}
                  onToggle={() => toggleCategory(category.name)}
                  listData={listData}
                />
              ) : null;
            })}
            
            {uncategorizedItems.length > 0 && (
              <CategoryGroup
                key="Other"
                category={CATEGORIES[CATEGORIES.length - 1]}
                items={uncategorizedItems}
                isOpen={openCategories["Other"]}
                onToggle={() => toggleCategory("Other")}
                listData={listData}
              />
            )}
          </AnimatePresence>
        </VStack>
        {todoIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box
              as={motion.div}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Text fontSize="5xl">🛒</Text>
            </Box>
            <Text textAlign="center" color={textColor} fontWeight="medium" fontSize="lg">
              Your list is empty!
            </Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">
              Add items above to start building your shopping list
            </Text>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default GroceryListTodo;
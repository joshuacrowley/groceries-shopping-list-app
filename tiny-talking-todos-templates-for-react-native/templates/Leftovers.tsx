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
  Checkbox,
  IconButton,
  useColorModeValue,
  Collapse,
  useDisclosure,
  Badge,
  Select,
  Flex,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  CaretDown,
  CaretUp,
  ThermometerCold,
  Snowflake,
  Clock,
  Warning,
  Check,
  X,
  Desktop,
  CookingPot
} from "@phosphor-icons/react";
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

const LOCATIONS = ["Refrigerator", "Freezer"];
const PORTION_SIZES = ["Individual", "Small (2-3)", "Medium (4-5)", "Large (6+)"];

const LeftoverItem = memo(({ id }: { id: string }) => {
  const { isOpen, onToggle } = useDisclosure();
  const [playDelete] = useSound("/sounds/cancel/Cancel 1.m4a", { volume: 0.5 });
  const [playComplete] = useSound("/sounds/complete/Complete 1.m4a", { volume: 0.5 });
  
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
    playDelete();
  }, [deleteItem, playDelete]);

  const handleToggleDone = useCallback(() => {
    updateItem({ done: !itemData.done });
    playComplete();
  }, [updateItem, itemData.done, playComplete]);

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
    if (daysUntilExpiration <= 2) return "critical";
    if (daysUntilExpiration <= 5) return "soon";
    return "good";
  }, [daysUntilExpiration]);

  const statusColors = {
    expired: "red.500",
    critical: "red.400",
    soon: "orange.400",
    good: "green.400",
    none: "gray.400",
  };

  const locationIcons = {
    "Refrigerator": <ThermometerCold size={20} />,
    "Freezer": <Snowflake size={20} />,
  };

  const statusIcons = {
    expired: <X size={16} />,
    critical: <Warning size={16} />,
    soon: <Clock size={16} />,
    good: <Check size={16} />,
    none: null,
  };

  const textColor = useColorModeValue("gray.700", "gray.200");
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("teal.200", "teal.600");

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
      opacity={itemData.done ? 0.7 : 1}
    >
      <HStack spacing={4}>
        <Checkbox
          isChecked={itemData.done}
          onChange={handleToggleDone}
          colorScheme="teal"
        />
        <Text
          flex={1}
          color={textColor}
          fontWeight="medium"
          textDecoration={itemData.done ? "line-through" : "none"}
        >
          {itemData.text}
        </Text>
        <Tooltip label={itemData.type || "Location"}>
          <Badge colorScheme="teal" display="flex" alignItems="center" px={2} py={1}>
            {locationIcons[itemData.type] || <CookingPot size={20} />}
          </Badge>
        </Tooltip>
        <Badge
          colorScheme={
            expirationStatus === "expired" || expirationStatus === "critical"
              ? "red"
              : expirationStatus === "soon"
              ? "orange"
              : "green"
          }
          display="flex"
          alignItems="center"
          py={1}
          px={2}
        >
          {statusIcons[expirationStatus]}
          <Text ml={1}>
            {expirationStatus === "expired"
              ? "Expired"
              : expirationStatus === "critical"
              ? "Eat ASAP!"
              : expirationStatus === "soon"
              ? "Eat Soon"
              : expirationStatus === "good"
              ? `${daysUntilExpiration} days`
              : "No Date"}
          </Text>
        </Badge>
        <IconButton
          icon={isOpen ? <CaretUp /> : <CaretDown />}
          onClick={onToggle}
          aria-label="Toggle details"
          colorScheme="teal"
          variant="ghost"
          size="sm"
        />
        <IconButton
          icon={<Trash />}
          onClick={handleDelete}
          aria-label="Delete item"
          colorScheme="red"
          variant="ghost"
          size="sm"
        />
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <VStack align="stretch" mt={4} spacing={4} pl={10}>
          <HStack>
            <Text minWidth="140px">Expiration Date:</Text>
            <Input
              value={itemData.date || ""}
              onChange={(e) => handleChange("date", e.target.value)}
              placeholder="YYYY-MM-DD"
              type="date"
              size="sm"
            />
          </HStack>
          <HStack>
            <Text minWidth="140px">Storage Location:</Text>
            <Select
              value={itemData.type || "Refrigerator"}
              onChange={(e) => handleChange("type", e.target.value)}
              size="sm"
            >
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </Select>
          </HStack>
          <HStack>
            <Text minWidth="140px">Portion Size:</Text>
            <Select
              value={itemData.category || "Individual"}
              onChange={(e) => handleChange("category", e.target.value)}
              size="sm"
            >
              {PORTION_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </HStack>
          <HStack>
            <Text minWidth="140px">Servings Left:</Text>
            <NumberInput
              value={itemData.number || 1}
              onChange={(valueString) => handleChange("number", parseInt(valueString))}
              min={1}
              max={20}
              size="sm"
              maxW="100px"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </HStack>
          <HStack>
            <Text minWidth="140px">Notes:</Text>
            <Input
              value={itemData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes, reheating instructions, etc."
              size="sm"
            />
          </HStack>
        </VStack>
      </Collapse>
    </Box>
  );
});
LeftoverItem.displayName = "LeftoverItem";

const LocationSection = ({ location, itemIds }) => {
  const cardBgColor = useColorModeValue("white", "gray.700");
  
  return (
    <Box mb={4}>
      <HStack 
        bg="teal.500" 
        color="white" 
        p={2} 
        borderRadius="md" 
        mb={2}
      >
        {location === "Refrigerator" ? (
          <ThermometerCold size={20} weight="fill" />
        ) : (
          <Snowflake size={20} weight="fill" />
        )}
        <Text fontWeight="bold">{location}</Text>
        <Text ml={2}>({itemIds.length})</Text>
      </HStack>
      
      <VStack spacing={2} align="stretch">
        <AnimatePresence>
          {itemIds.map((id) => (
            <LeftoverItem key={id} id={id} />
          ))}
        </AnimatePresence>
        {itemIds.length === 0 && (
          <Text 
            p={3} 
            textAlign="center" 
            fontStyle="italic" 
            color="gray.500"
            bg={cardBgColor}
            borderRadius="md"
          >
            No items in {location.toLowerCase()}
          </Text>
        )}
      </VStack>
    </Box>
  );
};

const LeftoversTracker = ({ listId }) => {
  const [newItem, setNewItem] = useState("");
  const [location, setLocation] = useState("Refrigerator");
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.5 });
  
  const store = useStore();
  const itemIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  
  // Group items by location
  const [groupedItems, setGroupedItems] = useState({
    "Refrigerator": [],
    "Freezer": []
  });
  
  // Count expiring items
  const [expiringCount, setExpiringCount] = useState(0);
  
  // Update groupedItems and expiringCount when itemIds change
  useEffect(() => {
    const grouped = {
      "Refrigerator": [],
      "Freezer": []
    };
    
    let expiring = 0;
    
    for (const id of itemIds) {
      const item = store.getRow("todos", id);
      if (item) {
        // Group by location
        const itemLocation = item.type || "Refrigerator";
        if (grouped[itemLocation]) {
          grouped[itemLocation].push(id);
        } else {
          grouped["Refrigerator"].push(id);
        }
        
        // Check if expiring
        if (!item.done && item.date) {
          const today = new Date();
          const expDate = new Date(item.date);
          const diffTime = expDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 2) expiring++;
        }
      }
    }
    
    setGroupedItems(grouped);
    setExpiringCount(expiring);
  }, [itemIds, store]);

  const addItem = useAddRowCallback(
    "todos",
    (text) => ({
      text: text.trim(),
      done: false,
      list: listId,
      date: getDefaultDate(location),
      type: location,
      category: "Individual",
      number: 1,
      notes: "",
    }),
    [listId, location],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewItem("");
        playAdd();
      }
    }
  );

  const getDefaultDate = useCallback((loc) => {
    const today = new Date();
    // Default expiration: 4 days for refrigerator, 60 days for freezer
    const addDays = loc === "Refrigerator" ? 4 : 60;
    today.setDate(today.getDate() + addDays);
    return today.toISOString().split('T')[0];
  }, []);

  const handleInputChange = useCallback((e) => {
    setNewItem(e.target.value);
  }, []);

  const handleLocationChange = useCallback((e) => {
    setLocation(e.target.value);
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
    }
  }, [addItem, newItem]);

  const color = String(listData?.color || "teal");
  const bgGradient = useColorModeValue(
    `linear-gradient(180deg, ${color}.50 0%, white 100%)`,
    `linear-gradient(180deg, #1a3a3d 0%, #1A202C 100%)`
  );
  const cardBgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const headerColor = useColorModeValue(`${color}.700`, `${color}.200`);
  const subTextColor = useColorModeValue(`${color}.500`, `${color}.300`);

  const progressLabel = useMemo(() => {
    if (itemIds.length === 0) return "No leftovers to track! 🧹";
    if (expiringCount > 0) return `${expiringCount} item${expiringCount > 1 ? 's' : ''} need attention! ⏰`;
    if (itemIds.length <= 3) return "A few things to use up 🥡";
    if (itemIds.length <= 8) return "Leftovers under control 👍";
    return "Fridge is well stocked! 🧊";
  }, [itemIds.length, expiringCount]);

  return (
    <Box
      maxWidth="700px"
      margin="auto"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xl"
      bgGradient={bgGradient}
      position="relative"
    >
      <VStack spacing={5} align="stretch" p={5}>
        <Flex justifyContent="space-between" alignItems="flex-start">
          <HStack spacing={3}>
            <Box
              as={motion.div}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <DynamicIcon iconName={String(listData?.icon || "ThermometerCold")} size={32} weight="fill" />
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={headerColor}>
                {String(listData?.name || "Leftovers Tracker")}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </Box>
          </HStack>
          <HStack spacing={2}>
            {expiringCount > 0 && (
              <Badge colorScheme="red" fontSize="xs" px={2} py={1} borderRadius="full">
                {expiringCount} expiring!
              </Badge>
            )}
            <Badge colorScheme={color} fontSize="sm" px={3} py={1} borderRadius="full">
              {itemIds.length} {itemIds.length === 1 ? "item" : "items"}
            </Badge>
          </HStack>
        </Flex>

        <HStack>
          <Input
            value={newItem}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Add a new leftover item"
            bg={cardBgColor}
            color={textColor}
          />
          <Select
            value={location}
            onChange={handleLocationChange}
            width="150px"
            bg={cardBgColor}
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </Select>
          <Button onClick={handleAddClick} colorScheme={listData?.color || 'teal'}>
            Add
          </Button>
        </HStack>

        {LOCATIONS.map(location => (
          <LocationSection 
            key={location} 
            location={location} 
            itemIds={groupedItems[location] || []} 
          />
        ))}

        {itemIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🧊</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">No leftovers to track</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add items above when you have leftovers to track their freshness</Text>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default LeftoversTracker;
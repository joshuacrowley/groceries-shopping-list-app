import React, { useState, useCallback, useMemo, memo } from "react";
import {
  useLocalRowIds,
  useRow,
  useCell,
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
  Tooltip,
  Checkbox,
  Wrap,
  WrapItem,
  Select,
  Divider,
  Flex,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  Trash,
  Sun,
  Waves,
  Sunglasses,
  Umbrella,
  SwimmingPool,
  FishSimple,
  Drop,
  Wind,
  Sparkle,
  MusicNote,
  Book,
  CaretDown,
  CaretUp,
  Plus,
  ShoppingBag,
  FirstAid,
  Camera,
  GameController,
  CookingPot,
  SunHorizon,
} from "@phosphor-icons/react";
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

// ── Beach categories ──────────────────────────────────────────────
const CATEGORIES = [
  { name: "Beach Bag", icon: ShoppingBag, emoji: "🎒", color: "orange" },
  { name: "Sun & Safety", icon: Sun, emoji: "☀️", color: "yellow" },
  { name: "Snacks & Drinks", icon: CookingPot, emoji: "🧊", color: "teal" },
  { name: "Water Fun", icon: SwimmingPool, emoji: "🏄", color: "cyan" },
  { name: "Entertainment", icon: GameController, emoji: "🎶", color: "purple" },
];

const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.name] = c;
  return acc;
}, {} as Record<string, (typeof CATEGORIES)[number]>);

// ── Quick-add presets ──────────────────────────────────────────────
const PRESETS = {
  "Family Day": [
    { text: "Beach umbrella", category: "Beach Bag", emoji: "⛱️", notes: "The big one with the sand anchor" },
    { text: "Towels for everyone", category: "Beach Bag", emoji: "🏖️", notes: "" },
    { text: "Sunscreen SPF 50+", category: "Sun & Safety", emoji: "🧴", notes: "Reapply every 2 hours!" },
    { text: "Kids' sun hats", category: "Sun & Safety", emoji: "👒", notes: "" },
    { text: "Rashies", category: "Sun & Safety", emoji: "👕", notes: "UV protection swim shirts" },
    { text: "Sandwiches & fruit", category: "Snacks & Drinks", emoji: "🥪", notes: "Keep in the cooler" },
    { text: "Water bottles (frozen)", category: "Snacks & Drinks", emoji: "🧊", notes: "Freeze overnight, doubles as ice pack" },
    { text: "Boogie boards", category: "Water Fun", emoji: "🏄", notes: "" },
    { text: "Sand toys & buckets", category: "Water Fun", emoji: "🏰", notes: "Shovels, moulds, the works" },
    { text: "Beach cricket set", category: "Entertainment", emoji: "🏏", notes: "" },
  ],
  "Surf Session": [
    { text: "Surfboard", category: "Water Fun", emoji: "🏄", notes: "Check fins are tight" },
    { text: "Wetsuit", category: "Beach Bag", emoji: "🤿", notes: "" },
    { text: "Board wax", category: "Water Fun", emoji: "🕯️", notes: "Temperature-matched wax" },
    { text: "Zinc sunscreen", category: "Sun & Safety", emoji: "🧴", notes: "The thick stuff for your nose" },
    { text: "Towel", category: "Beach Bag", emoji: "🏖️", notes: "" },
    { text: "Water bottle", category: "Snacks & Drinks", emoji: "💧", notes: "Saltwater dehydrates you fast" },
    { text: "Banana & muesli bar", category: "Snacks & Drinks", emoji: "🍌", notes: "Post-surf fuel" },
    { text: "Car key pouch", category: "Beach Bag", emoji: "🔑", notes: "Waterproof one!" },
  ],
  "Sunset Picnic": [
    { text: "Picnic blanket", category: "Beach Bag", emoji: "🧺", notes: "The sand-proof one" },
    { text: "Cheese & crackers", category: "Snacks & Drinks", emoji: "🧀", notes: "" },
    { text: "Bottle of wine", category: "Snacks & Drinks", emoji: "🍷", notes: "Don't forget the opener!" },
    { text: "Sparkling water", category: "Snacks & Drinks", emoji: "✨", notes: "" },
    { text: "Dips & veggie sticks", category: "Snacks & Drinks", emoji: "🥕", notes: "Hummus, tzatziki" },
    { text: "Portable speaker", category: "Entertainment", emoji: "🔊", notes: "Charge it before you go" },
    { text: "Camera", category: "Entertainment", emoji: "📸", notes: "Golden hour photos!" },
    { text: "Light jacket", category: "Beach Bag", emoji: "🧥", notes: "It gets cool after sunset" },
    { text: "Mosquito repellent", category: "Sun & Safety", emoji: "🦟", notes: "Mozzies come out at dusk" },
    { text: "Candles or fairy lights", category: "Entertainment", emoji: "🕯️", notes: "Set the mood" },
  ],
  "Beach Walk": [
    { text: "Comfortable shoes", category: "Beach Bag", emoji: "👟", notes: "Or just go barefoot!" },
    { text: "Hat", category: "Sun & Safety", emoji: "🧢", notes: "" },
    { text: "Sunglasses", category: "Sun & Safety", emoji: "🕶️", notes: "" },
    { text: "Water bottle", category: "Snacks & Drinks", emoji: "💧", notes: "" },
    { text: "Shell collection bag", category: "Beach Bag", emoji: "🐚", notes: "For treasures found along the way" },
    { text: "Dog lead & treats", category: "Beach Bag", emoji: "🐕", notes: "Check if dogs are allowed" },
    { text: "Phone for photos", category: "Entertainment", emoji: "📱", notes: "" },
  ],
  "Rock Pool Explorer": [
    { text: "Reef shoes", category: "Beach Bag", emoji: "👟", notes: "Protect those toes from rocks" },
    { text: "Bucket for finds", category: "Water Fun", emoji: "🪣", notes: "Return creatures after looking!" },
    { text: "Magnifying glass", category: "Entertainment", emoji: "🔍", notes: "Get up close with tiny critters" },
    { text: "Waterproof camera", category: "Entertainment", emoji: "📸", notes: "For underwater shots" },
    { text: "Snacks", category: "Snacks & Drinks", emoji: "🍎", notes: "" },
    { text: "Sunscreen", category: "Sun & Safety", emoji: "🧴", notes: "You lose track of time rock pooling" },
    { text: "First aid kit", category: "Sun & Safety", emoji: "🩹", notes: "For scrapes on rocks" },
    { text: "Marine life guide", category: "Entertainment", emoji: "📖", notes: "Identify what you find" },
  ],
};

// ── Wave animation ────────────────────────────────────────────────
const WaveDecoration = () => (
  <Box position="relative" width="100%" height="30px" overflow="hidden" mt={2}>
    <Box
      as={motion.div}
      position="absolute"
      bottom="0"
      left="-50%"
      width="200%"
      height="30px"
      animate={{ x: ["0%", "-25%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    >
      <svg viewBox="0 0 1200 30" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <path d="M0,15 C150,0 350,30 600,15 C850,0 1050,30 1200,15 L1200,30 L0,30 Z" fill="rgba(56, 178, 212, 0.3)" />
        <path d="M0,20 C200,8 400,28 600,18 C800,8 1000,28 1200,18 L1200,30 L0,30 Z" fill="rgba(56, 178, 212, 0.15)" />
      </svg>
    </Box>
  </Box>
);

const SandGrain = ({ top, left, size = 2, opacity = 0.3 }) => (
  <Box position="absolute" top={top} left={left} width={`${size}px`} height={`${size}px`} borderRadius="full" bg="orange.300" opacity={opacity} pointerEvents="none" />
);

// ── Single beach item (subscribes to its own row only) ────────────
const BeachItem = memo(({ id }: { id: string }) => {
  const itemData = useRow("todos", id);
  const updateItem = useSetRowCallback(
    "todos", id, (updates) => ({ ...itemData, ...updates }), [itemData]
  );
  const deleteItem = useDelRowCallback("todos", id);

  const handleToggle = useCallback(() => {
    updateItem({ done: !itemData?.done });
  }, [updateItem, itemData?.done]);

  const catInfo = CATEGORY_MAP[String(itemData?.category)] || CATEGORIES[0];
  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const notesColor = useColorModeValue("gray.500", "gray.400");
  const isDone = Boolean(itemData?.done);
  const hasNotes = typeof itemData?.notes === "string" && itemData.notes.trim().length > 0;

  if (!itemData) return null;

  return (
    <Box
      width="100%"
      bg={bgColor}
      borderRadius="lg"
      boxShadow="sm"
      overflow="hidden"
      borderLeft="4px solid"
      borderLeftColor={isDone ? "gray.300" : `${catInfo.color}.400`}
      opacity={isDone ? 0.55 : 1}
      css={{ transition: "opacity 0.2s, border-color 0.2s, box-shadow 0.2s" }}
      _hover={{ boxShadow: "md" }}
    >
      <HStack p={3} spacing={3}>
        <Checkbox isChecked={isDone} onChange={handleToggle} colorScheme={catInfo.color} size="lg" />
        <Text fontSize="xl" lineHeight="1" userSelect="none">{String(itemData.emoji || catInfo.emoji)}</Text>
        <Box flex={1} minW={0}>
          <Text color={textColor} fontWeight="medium" textDecoration={isDone ? "line-through" : "none"} noOfLines={1}>
            {String(itemData.text || "")}
          </Text>
          {hasNotes && (
            <Text fontSize="xs" color={notesColor} noOfLines={1} textDecoration={isDone ? "line-through" : "none"} fontStyle="italic">
              {String(itemData.notes)}
            </Text>
          )}
        </Box>
        <IconButton icon={<Trash weight="bold" />} onClick={deleteItem} aria-label="Remove item" size="sm" colorScheme="red" variant="ghost" opacity={0.6} _hover={{ opacity: 1 }} />
      </HStack>
    </Box>
  );
});
BeachItem.displayName = "BeachItem";

// ── Done status for a single item (for progress counting) ─────────
const ItemDoneStatus = memo(({ id, onDone }: { id: string; onDone: (id: string, done: boolean) => void }) => {
  const done = useCell("todos", id, "done");
  React.useEffect(() => {
    onDone(id, Boolean(done));
  }, [id, done, onDone]);
  return null; // Render-less component, purely for observation
});
ItemDoneStatus.displayName = "ItemDoneStatus";

// ── Progress header (isolated from item rendering) ────────────────
const ProgressHeader = memo(({ todoIds, listData, headerColor, subTextColor, progressTrackBg }: {
  todoIds: string[];
  listData: any;
  headerColor: string;
  subTextColor: string;
  progressTrackBg: string;
}) => {
  const [doneCounts, setDoneCounts] = useState<Record<string, boolean>>({});

  const handleDone = useCallback((id: string, done: boolean) => {
    setDoneCounts((prev) => {
      if (prev[id] === done) return prev;
      return { ...prev, [id]: done };
    });
  }, []);

  const totalCount = todoIds.length;
  const doneCount = useMemo(() => Object.values(doneCounts).filter(Boolean).length, [doneCounts]);
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const readinessLabel = useMemo(() => {
    if (totalCount === 0) return "Add items to get beach-ready!";
    if (progress === 100) return "You're beach-ready! 🏖️";
    if (progress >= 75) return "Almost there! 🌊";
    if (progress >= 50) return "Halfway packed! ☀️";
    if (progress >= 25) return "Getting started... 🐚";
    return "Just getting started 🌴";
  }, [progress, totalCount]);

  return (
    <Box px={5} pt={5} pb={3}>
      {/* Render-less observers for each item's done status */}
      {todoIds.map((id) => (
        <ItemDoneStatus key={id} id={id} onDone={handleDone} />
      ))}

      <HStack justifyContent="space-between" alignItems="flex-start">
        <HStack spacing={3}>
          <Box
            as={motion.div}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <DynamicIcon iconName={String(listData?.icon || "Waves")} size={36} weight="fill" color={headerColor} />
          </Box>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color={headerColor} lineHeight="1.2">
              {String(listData?.name || "Beach Day")}
            </Text>
            <Text fontSize="xs" color={subTextColor} fontStyle="italic">
              {readinessLabel}
            </Text>
          </Box>
        </HStack>
        <VStack spacing={0} align="flex-end">
          <Badge colorScheme={progress === 100 ? "green" : "blue"} fontSize="sm" px={3} py={1} borderRadius="full">
            {doneCount}/{totalCount} packed
          </Badge>
        </VStack>
      </HStack>

      {/* Beach readiness bar */}
      <Box mt={3} position="relative">
        <Box height="8px" bg={progressTrackBg} borderRadius="full" overflow="hidden">
          <Box
            as={motion.div}
            height="100%"
            borderRadius="full"
            bgGradient="linear(to-r, cyan.400, blue.400, teal.300)"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </Box>
        {progress > 0 && progress < 100 && (
          <Box as={motion.div} position="absolute" top="-4px" style={{ left: `calc(${progress}% - 8px)` }} animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Text fontSize="xs">🏄</Text>
          </Box>
        )}
        {progress === 100 && (
          <Box as={motion.div} position="absolute" top="-6px" right="0" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <Text fontSize="sm">🎉</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
});
ProgressHeader.displayName = "ProgressHeader";

// ── Category group ────────────────────────────────────────────────
const CategoryGroup = memo(({
  category, items, isOpen, onToggle,
}: {
  category: (typeof CATEGORIES)[number];
  items: string[];
  isOpen: boolean;
  onToggle: (name: string) => void;
}) => {
  const bgColor = useColorModeValue(`${category.color}.50`, `${category.color}.900`);
  const textColor = useColorModeValue(`${category.color}.700`, `${category.color}.200`);
  const Icon = category.icon;

  return (
    <Box mb={2}>
      <HStack onClick={() => onToggle(category.name)} cursor="pointer" bg={bgColor} p={2.5} px={3} borderRadius="lg" justifyContent="space-between" _hover={{ opacity: 0.85 }} transition="all 0.15s">
        <HStack spacing={2}>
          <Icon size={20} weight="fill" />
          <Text fontWeight="bold" fontSize="sm" color={textColor}>{category.emoji} {category.name}</Text>
        </HStack>
        <HStack spacing={2}>
          <Badge colorScheme={category.color} borderRadius="full" fontSize="xs">{items.length}</Badge>
          {isOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </HStack>
      </HStack>
      <Collapse in={isOpen}>
        <VStack align="stretch" mt={1} spacing={1} pl={1}>
          {items.map((id) => (<BeachItem key={id} id={id} />))}
        </VStack>
      </Collapse>
    </Box>
  );
}, (prev, next) =>
  prev.isOpen === next.isOpen &&
  prev.category.name === next.category.name &&
  prev.items.length === next.items.length &&
  prev.items.every((id, i) => id === next.items[i])
);
CategoryGroup.displayName = "CategoryGroup";

// ── Main Beach List ───────────────────────────────────────────────
const BeachList = ({ listId = "beach" }) => {
  const [newTodo, setNewTodo] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [showPresets, setShowPresets] = useState(false);
  const [openCategories, setOpenCategories] = useState(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {} as Record<string, boolean>)
  );

  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });

  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const color = listData?.color || "cyan";

  // Group items by category using imperative store reads (non-reactive).
  // This only recomputes when todoIds changes (add/remove), NOT on toggle.
  const categorizedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const cat = String(store?.getCell("todos", id, "category") || "Beach Bag");
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(id);
    });
    return grouped;
  }, [todoIds, store]);

  const addItem = useAddRowCallback(
    "todos",
    (data: any) => ({
      text: data.text?.trim() || "",
      category: data.category || selectedCategory,
      emoji: data.emoji || "🏖️",
      notes: data.notes || "",
      done: false,
      list: listId,
    }),
    [listId, selectedCategory]
  );

  const handleAdd = useCallback(() => {
    if (newTodo.trim()) {
      addItem({ text: newTodo.trim(), category: selectedCategory });
      setNewTodo("");
      playAdd();
    }
  }, [newTodo, selectedCategory, addItem, playAdd]);

  const handleKeyDown = useCallback(
    (e: any) => { if (e.key === "Enter") handleAdd(); },
    [handleAdd]
  );

  const handlePreset = useCallback(
    (presetName: string) => {
      const items = PRESETS[presetName];
      if (items) {
        items.forEach((item) => { addItem(item); });
        playAdd();
      }
      setShowPresets(false);
    },
    [addItem, playAdd]
  );

  const toggleCategory = useCallback((cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  // Colors
  const sandBg = useColorModeValue(
    "linear-gradient(180deg, #87CEEB 0%, #B0E0E6 15%, #F5DEB3 50%, #FAEBD7 100%)",
    "linear-gradient(180deg, #1a365d 0%, #2a4365 15%, #744210 50%, #5a3e1b 100%)"
  );
  const cardBg = useColorModeValue("rgba(255,255,255,0.85)", "rgba(26,32,44,0.85)");
  const headerColor = useColorModeValue("blue.800", "blue.200");
  const subTextColor = useColorModeValue("blue.600", "blue.300");
  const inputBg = useColorModeValue("white", "gray.700");
  const progressTrackBg = useColorModeValue("blue.100", "blue.900");
  const presetBtnBg = useColorModeValue("whiteAlpha.700", "whiteAlpha.200");
  const presetBtnHoverBg = useColorModeValue("white", "whiteAlpha.300");

  return (
    <Box maxWidth="600px" margin="auto" borderRadius="xl" overflow="hidden" boxShadow="xl" bgGradient={sandBg} position="relative">
      <SandGrain top="60%" left="10%" size={3} opacity={0.2} />
      <SandGrain top="65%" left="85%" size={2} opacity={0.15} />
      <SandGrain top="70%" left="30%" size={4} opacity={0.1} />
      <SandGrain top="72%" left="55%" size={2} opacity={0.2} />
      <SandGrain top="80%" left="75%" size={3} opacity={0.15} />
      <SandGrain top="55%" left="45%" size={2} opacity={0.12} />

      <VStack spacing={0} align="stretch">
        {/* Progress header (isolated: subscribes to done status per-item) */}
        <ProgressHeader
          todoIds={todoIds}
          listData={listData}
          headerColor={headerColor}
          subTextColor={subTextColor}
          progressTrackBg={progressTrackBg}
        />

        {/* Add item section */}
        <Box px={5} py={3} bg={cardBg} mx={3} borderRadius="lg" backdropFilter="blur(8px)">
          <HStack spacing={2}>
            <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} size="sm" width="150px" bg={inputBg} borderRadius="md" fontSize="xs">
              {CATEGORIES.map(({ name, emoji }) => (<option key={name} value={name}>{emoji} {name}</option>))}
            </Select>
            <Input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={handleKeyDown} placeholder="Add to your beach bag..." size="sm" bg={inputBg} borderRadius="md" flex={1} />
            <IconButton icon={<Plus weight="bold" />} onClick={handleAdd} aria-label="Add item" size="sm" colorScheme="cyan" borderRadius="md" />
          </HStack>
        </Box>

        {/* Quick presets */}
        <Box px={5} pt={3}>
          <HStack spacing={1} cursor="pointer" onClick={() => setShowPresets(!showPresets)} mb={showPresets ? 2 : 0}>
            <SunHorizon size={14} weight="fill" color="var(--chakra-colors-orange-500)" />
            <Text fontSize="xs" fontWeight="bold" color={subTextColor}>Quick Pack</Text>
            {showPresets ? <CaretUp size={12} /> : <CaretDown size={12} />}
          </HStack>
          <Collapse in={showPresets}>
            <Wrap spacing={2} pb={2}>
              {Object.keys(PRESETS).map((name) => (
                <WrapItem key={name}>
                  <Button size="xs" variant="outline" colorScheme="blue" borderRadius="full" onClick={() => handlePreset(name)}
                    leftIcon={<Text fontSize="xs">{name === "Family Day" ? "👨‍👩‍👧‍👦" : name === "Surf Session" ? "🏄" : name === "Sunset Picnic" ? "🌅" : name === "Beach Walk" ? "🚶" : "🔍"}</Text>}
                    bg={presetBtnBg} _hover={{ bg: presetBtnHoverBg, transform: "translateY(-1px)" }} transition="all 0.15s"
                  >{name}</Button>
                </WrapItem>
              ))}
            </Wrap>
          </Collapse>
        </Box>

        {/* Category groups */}
        <Box px={5} py={3}>
          <VStack spacing={1} align="stretch">
            {CATEGORIES.map((category) => {
              const items = categorizedItems[category.name] || [];
              if (items.length === 0) return null;
              return (
                <CategoryGroup key={category.name} category={category} items={items} isOpen={openCategories[category.name]} onToggle={toggleCategory} />
              );
            })}
            {Object.keys(categorizedItems)
              .filter((cat) => !CATEGORIES.some((c) => c.name === cat))
              .map((cat) => {
                const items = categorizedItems[cat] || [];
                if (items.length === 0) return null;
                return (
                  <CategoryGroup key={cat} category={{ name: cat, icon: ShoppingBag, emoji: "📦", color: "gray" }} items={items} isOpen={openCategories[cat] !== false} onToggle={toggleCategory} />
                );
              })}
          </VStack>
        </Box>

        {/* Empty state */}
        {todoIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🏖️</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">Time to hit the beach! 🌊</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add items one by one, or try a Quick Pack preset to get started</Text>
          </VStack>
        )}

        <WaveDecoration />
      </VStack>
    </Box>
  );
};

export default BeachList;

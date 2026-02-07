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
  Checkbox,
  Select,
  Textarea,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  Trash,
  Plus,
  CaretDown,
  CaretUp,
  TShirt,
  Drop,
  Wind,
  Sun,
  ArrowsClockwise,
  Package,
  Sparkle,
} from "@phosphor-icons/react";
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

// ── Laundry categories ───────────────────────────────────────────
const CATEGORIES = [
  { name: "Wash", icon: Drop, emoji: "🫧", color: "cyan" },
  { name: "Dry", icon: Sun, emoji: "☀️", color: "yellow" },
  { name: "Fold", icon: TShirt, emoji: "👕", color: "teal" },
  { name: "Iron", icon: Wind, emoji: "♨️", color: "orange" },
  { name: "Put Away", icon: Package, emoji: "🗄️", color: "purple" },
];

const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.name] = c;
  return acc;
}, {} as Record<string, (typeof CATEGORIES)[number]>);

// ── Bubble decoration ────────────────────────────────────────────
const Bubble = ({ top, left, size = 8, delay = 0 }: { top: string; left: string; size?: number; delay?: number }) => (
  <Box
    as={motion.div}
    position="absolute"
    top={top}
    left={left}
    width={`${size}px`}
    height={`${size}px`}
    borderRadius="full"
    border="1px solid"
    borderColor="cyan.200"
    bg="transparent"
    opacity={0.2}
    pointerEvents="none"
    animate={{ y: [0, -12, 0], opacity: [0.2, 0.35, 0.2], scale: [1, 1.1, 1] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

// ── Single laundry item (subscribes to its own row only) ─────────
const LaundryItem = memo(({ id }: { id: string }) => {
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
          <HStack spacing={1} mb={hasNotes ? 0.5 : 0}>
            <Text color={textColor} fontWeight="medium" textDecoration={isDone ? "line-through" : "none"} noOfLines={1} flex={1}>
              {String(itemData.text || "")}
            </Text>
            <Badge colorScheme={catInfo.color} fontSize="2xs" borderRadius="full" px={2}>{catInfo.name}</Badge>
          </HStack>
          {hasNotes && (
            <Text fontSize="xs" color={notesColor} noOfLines={2} textDecoration={isDone ? "line-through" : "none"} fontStyle="italic">
              {String(itemData.notes)}
            </Text>
          )}
        </Box>
        <IconButton icon={<Trash weight="bold" />} onClick={deleteItem} aria-label="Remove item" size="sm" colorScheme="red" variant="ghost" opacity={0.6} _hover={{ opacity: 1 }} />
      </HStack>
    </Box>
  );
});
LaundryItem.displayName = "LaundryItem";

// ── Done status observer (render-less, for progress counting) ────
const ItemDoneStatus = memo(({ id, onDone }: { id: string; onDone: (id: string, done: boolean) => void }) => {
  const done = useCell("todos", id, "done");
  React.useEffect(() => {
    onDone(id, Boolean(done));
  }, [id, done, onDone]);
  return null;
});
ItemDoneStatus.displayName = "ItemDoneStatus";

// ── Progress header (isolated from item rendering) ───────────────
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
    if (totalCount === 0) return "Add loads to track your laundry";
    if (progress === 100) return "All clean! 🧺";
    if (progress >= 75) return "Nearly done 🫧";
    if (progress >= 50) return "Spinning away 🌀";
    if (progress >= 25) return "Laundry mountain 🏔️";
    return "Time to start sorting 🧦";
  }, [progress, totalCount]);

  return (
    <Box px={5} pt={5} pb={3}>
      {todoIds.map((id) => (
        <ItemDoneStatus key={id} id={id} onDone={handleDone} />
      ))}

      <HStack justifyContent="space-between" alignItems="flex-start">
        <HStack spacing={3}>
          <Box
            as={motion.div}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <DynamicIcon iconName={String(listData?.icon || "ArrowsClockwise")} size={36} weight="fill" color={headerColor} />
          </Box>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color={headerColor} lineHeight="1.2">
              {String(listData?.name || "Laundry Tracker")}
            </Text>
            <Text fontSize="xs" color={subTextColor} fontStyle="italic">
              {readinessLabel}
            </Text>
          </Box>
        </HStack>
        <VStack spacing={0} align="flex-end">
          <Badge colorScheme={progress === 100 ? "green" : "cyan"} fontSize="sm" px={3} py={1} borderRadius="full">
            {doneCount}/{totalCount} done
          </Badge>
        </VStack>
      </HStack>

      <Box mt={3} position="relative">
        <Box height="8px" bg={progressTrackBg} borderRadius="full" overflow="hidden">
          <Box
            as={motion.div}
            height="100%"
            borderRadius="full"
            bgGradient="linear(to-r, cyan.300, teal.300, cyan.400)"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </Box>
        {progress > 0 && progress < 100 && (
          <Box as={motion.div} position="absolute" top="-4px" style={{ left: `calc(${progress}% - 8px)` }} animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <Text fontSize="xs">🌀</Text>
          </Box>
        )}
        {progress === 100 && (
          <Box as={motion.div} position="absolute" top="-6px" right="0" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <Text fontSize="sm">✨</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
});
ProgressHeader.displayName = "ProgressHeader";

// ── Category group ───────────────────────────────────────────────
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
          {items.map((id) => (<LaundryItem key={id} id={id} />))}
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

// ── Main Laundry Tracker ─────────────────────────────────────────
const LaundryTrackerList = ({ listId = "laundry" }) => {
  const [newTodo, setNewTodo] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [showNotes, setShowNotes] = useState(false);
  const [openCategories, setOpenCategories] = useState(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {} as Record<string, boolean>)
  );

  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });

  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const categorizedItems = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    todoIds.forEach((id) => {
      const cat = String(store?.getCell("todos", id, "category") || "Wash");
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
      emoji: data.emoji || CATEGORY_MAP[data.category || selectedCategory]?.emoji || "🧺",
      notes: data.notes || "",
      done: false,
      list: listId,
    }),
    [listId, selectedCategory]
  );

  const handleAdd = useCallback(() => {
    if (newTodo.trim()) {
      addItem({ text: newTodo.trim(), category: selectedCategory, notes: newNotes.trim() });
      setNewTodo("");
      setNewNotes("");
      setShowNotes(false);
      playAdd();
    }
  }, [newTodo, newNotes, selectedCategory, addItem, playAdd]);

  const handleKeyDown = useCallback(
    (e: any) => { if (e.key === "Enter" && !e.shiftKey) handleAdd(); },
    [handleAdd]
  );

  const toggleCategory = useCallback((cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  // Colors
  const gradientBg = useColorModeValue(
    "linear-gradient(180deg, #E0F7FA 0%, #B2EBF2 20%, #E0F2F1 50%, #F0FFFE 100%)",
    "linear-gradient(180deg, #0D2B2E 0%, #153338 20%, #1A3A3D 50%, #0F2528 100%)"
  );
  const cardBg = useColorModeValue("rgba(255,255,255,0.88)", "rgba(26,32,44,0.88)");
  const headerColor = useColorModeValue("cyan.800", "cyan.200");
  const subTextColor = useColorModeValue("cyan.600", "cyan.300");
  const inputBg = useColorModeValue("white", "gray.700");
  const progressTrackBg = useColorModeValue("cyan.100", "cyan.900");

  return (
    <Box maxWidth="600px" margin="auto" borderRadius="xl" overflow="hidden" boxShadow="xl" bgGradient={gradientBg} position="relative">
      <Bubble top="10%" left="8%" size={10} delay={0} />
      <Bubble top="22%" left="88%" size={6} delay={0.7} />
      <Bubble top="38%" left="5%" size={8} delay={1.4} />
      <Bubble top="55%" left="92%" size={5} delay={2.1} />
      <Bubble top="70%" left="15%" size={7} delay={0.3} />
      <Bubble top="82%" left="80%" size={9} delay={2.8} />
      <Bubble top="45%" left="50%" size={4} delay={3.5} />

      <VStack spacing={0} align="stretch">
        {/* Progress header */}
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
            <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} size="sm" width="140px" bg={inputBg} borderRadius="md" fontSize="xs">
              {CATEGORIES.map(({ name, emoji }) => (<option key={name} value={name}>{emoji} {name}</option>))}
            </Select>
            <Input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={handleKeyDown} placeholder="Add laundry item..." size="sm" bg={inputBg} borderRadius="md" flex={1} />
            <IconButton icon={<Plus weight="bold" />} onClick={handleAdd} aria-label="Add item" size="sm" colorScheme="cyan" borderRadius="md" />
          </HStack>
          <HStack spacing={1} mt={1.5} cursor="pointer" onClick={() => setShowNotes(!showNotes)}>
            <Sparkle size={12} weight="fill" color="var(--chakra-colors-cyan-400)" />
            <Text fontSize="xs" color={subTextColor}>Add notes</Text>
            {showNotes ? <CaretUp size={10} /> : <CaretDown size={10} />}
          </HStack>
          <Collapse in={showNotes}>
            <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Fabric type, temperature, special care..." size="sm" bg={inputBg} borderRadius="md" mt={1} rows={2} resize="none" fontSize="xs" />
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
                  <CategoryGroup key={cat} category={{ name: cat, icon: ArrowsClockwise, emoji: "🔄", color: "gray" }} items={items} isOpen={openCategories[cat] !== false} onToggle={toggleCategory} />
                );
              })}
          </VStack>
        </Box>

        {/* Empty state */}
        {todoIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🧺</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">No laundry to track</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add loads and items to stay on top of your laundry game</Text>
          </VStack>
        )}

        {/* Bottom bubbles decoration */}
        <Box position="relative" width="100%" height="28px" overflow="hidden" mt={2}>
          <Box
            as={motion.div}
            position="absolute"
            bottom="0"
            left="-50%"
            width="200%"
            height="28px"
            animate={{ x: ["0%", "-25%"] }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 1200 28" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
              <circle cx="50" cy="20" r="6" fill="rgba(0, 188, 212, 0.12)" />
              <circle cx="150" cy="16" r="4" fill="rgba(0, 188, 212, 0.18)" />
              <circle cx="250" cy="22" r="5" fill="rgba(0, 188, 212, 0.10)" />
              <circle cx="350" cy="14" r="7" fill="rgba(0, 188, 212, 0.15)" />
              <circle cx="450" cy="20" r="3" fill="rgba(0, 188, 212, 0.20)" />
              <circle cx="550" cy="18" r="6" fill="rgba(0, 188, 212, 0.12)" />
              <circle cx="650" cy="22" r="4" fill="rgba(0, 188, 212, 0.16)" />
              <circle cx="750" cy="15" r="5" fill="rgba(0, 188, 212, 0.14)" />
              <circle cx="850" cy="20" r="7" fill="rgba(0, 188, 212, 0.10)" />
              <circle cx="950" cy="17" r="3" fill="rgba(0, 188, 212, 0.22)" />
              <circle cx="1050" cy="21" r="6" fill="rgba(0, 188, 212, 0.13)" />
              <circle cx="1150" cy="14" r="4" fill="rgba(0, 188, 212, 0.18)" />
              <path d="M0,24 Q100,18 200,24 Q300,28 400,24 Q500,18 600,24 Q700,28 800,24 Q900,18 1000,24 Q1100,28 1200,24 L1200,28 L0,28 Z" fill="rgba(0, 188, 212, 0.08)" />
            </svg>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default LaundryTrackerList;

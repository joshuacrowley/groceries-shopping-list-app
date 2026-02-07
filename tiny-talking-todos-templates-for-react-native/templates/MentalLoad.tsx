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
  Brain,
  CalendarBlank,
  TreeStructure,
  UsersThree,
  Heart,
  Scales,
  Sparkle,
} from "@phosphor-icons/react";
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

// ── Mental load categories ───────────────────────────────────────
const CATEGORIES = [
  { name: "Remember", icon: CalendarBlank, emoji: "📅", color: "purple" },
  { name: "Organize", icon: TreeStructure, emoji: "📋", color: "blue" },
  { name: "Manage", icon: UsersThree, emoji: "👥", color: "teal" },
  { name: "Worry", icon: Heart, emoji: "💭", color: "pink" },
  { name: "Decide", icon: Scales, emoji: "⚖️", color: "orange" },
];

const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.name] = c;
  return acc;
}, {} as Record<string, (typeof CATEGORIES)[number]>);

// ── Floating thought bubble decoration ───────────────────────────
const ThoughtBubble = ({ top, left, size = 6, delay = 0 }: { top: string; left: string; size?: number; delay?: number }) => (
  <Box
    as={motion.div}
    position="absolute"
    top={top}
    left={left}
    width={`${size}px`}
    height={`${size}px`}
    borderRadius="full"
    bg="purple.200"
    opacity={0.15}
    pointerEvents="none"
    animate={{ y: [0, -8, 0], opacity: [0.15, 0.25, 0.15] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

// ── Single mental load item (subscribes to its own row only) ─────
const MentalLoadItem = memo(({ id }: { id: string }) => {
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
MentalLoadItem.displayName = "MentalLoadItem";

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
    if (totalCount === 0) return "Add thoughts weighing on your mind";
    if (progress === 100) return "Your mind is clear 🧘";
    if (progress >= 75) return "Almost there... 🌸";
    if (progress >= 50) return "Working through it 💜";
    if (progress >= 25) return "Just getting started 🌱";
    return "One step at a time 🫧";
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
            animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <DynamicIcon iconName={String(listData?.icon || "Brain")} size={36} weight="fill" color={headerColor} />
          </Box>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color={headerColor} lineHeight="1.2">
              {String(listData?.name || "Mental Load")}
            </Text>
            <Text fontSize="xs" color={subTextColor} fontStyle="italic">
              {readinessLabel}
            </Text>
          </Box>
        </HStack>
        <VStack spacing={0} align="flex-end">
          <Badge colorScheme={progress === 100 ? "green" : "purple"} fontSize="sm" px={3} py={1} borderRadius="full">
            {doneCount}/{totalCount} cleared
          </Badge>
        </VStack>
      </HStack>

      <Box mt={3} position="relative">
        <Box height="8px" bg={progressTrackBg} borderRadius="full" overflow="hidden">
          <Box
            as={motion.div}
            height="100%"
            borderRadius="full"
            bgGradient="linear(to-r, purple.300, pink.300, purple.400)"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </Box>
        {progress > 0 && progress < 100 && (
          <Box as={motion.div} position="absolute" top="-4px" style={{ left: `calc(${progress}% - 8px)` }} animate={{ y: [0, -2, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <Text fontSize="xs">💜</Text>
          </Box>
        )}
        {progress === 100 && (
          <Box as={motion.div} position="absolute" top="-6px" right="0" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <Text fontSize="sm">🧘</Text>
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
          {items.map((id) => (<MentalLoadItem key={id} id={id} />))}
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

// ── Main Mental Load Tracker ─────────────────────────────────────
const MentalLoadTracker = ({ listId = "mental-load" }) => {
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
      const cat = String(store?.getCell("todos", id, "category") || "Remember");
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
      emoji: data.emoji || CATEGORY_MAP[data.category || selectedCategory]?.emoji || "🧠",
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
    "linear-gradient(180deg, #E8D5F5 0%, #DCC5ED 25%, #F0E6F6 50%, #F5EFF9 100%)",
    "linear-gradient(180deg, #2D1B4E 0%, #362058 25%, #2A1B3D 50%, #1A1025 100%)"
  );
  const cardBg = useColorModeValue("rgba(255,255,255,0.85)", "rgba(26,32,44,0.85)");
  const headerColor = useColorModeValue("purple.800", "purple.200");
  const subTextColor = useColorModeValue("purple.600", "purple.300");
  const inputBg = useColorModeValue("white", "gray.700");
  const progressTrackBg = useColorModeValue("purple.100", "purple.900");

  return (
    <Box maxWidth="600px" margin="auto" borderRadius="xl" overflow="hidden" boxShadow="xl" bgGradient={gradientBg} position="relative">
      <ThoughtBubble top="15%" left="8%" size={8} delay={0} />
      <ThoughtBubble top="30%" left="88%" size={5} delay={1} />
      <ThoughtBubble top="50%" left="12%" size={6} delay={2} />
      <ThoughtBubble top="65%" left="82%" size={4} delay={0.5} />
      <ThoughtBubble top="80%" left="25%" size={7} delay={1.5} />
      <ThoughtBubble top="45%" left="92%" size={3} delay={3} />

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
            <Input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={handleKeyDown} placeholder="What's on your mind..." size="sm" bg={inputBg} borderRadius="md" flex={1} />
            <IconButton icon={<Plus weight="bold" />} onClick={handleAdd} aria-label="Add thought" size="sm" colorScheme="purple" borderRadius="md" />
          </HStack>
          <HStack spacing={1} mt={1.5} cursor="pointer" onClick={() => setShowNotes(!showNotes)}>
            <Sparkle size={12} weight="fill" color="var(--chakra-colors-purple-400)" />
            <Text fontSize="xs" color={subTextColor}>Add details</Text>
            {showNotes ? <CaretUp size={10} /> : <CaretDown size={10} />}
          </HStack>
          <Collapse in={showNotes}>
            <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes, context, or details..." size="sm" bg={inputBg} borderRadius="md" mt={1} rows={2} resize="none" fontSize="xs" />
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
                  <CategoryGroup key={cat} category={{ name: cat, icon: Brain, emoji: "🧠", color: "gray" }} items={items} isOpen={openCategories[cat] !== false} onToggle={toggleCategory} />
                );
              })}
          </VStack>
        </Box>

        {/* Empty state */}
        {todoIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -6, 0], scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🧠</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">Your mental load tracker is empty</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add the things weighing on your mind to start clearing the fog</Text>
          </VStack>
        )}

        {/* Bottom breathing decoration */}
        <Box position="relative" width="100%" height="24px" overflow="hidden" mt={2}>
          <Box
            as={motion.div}
            position="absolute"
            bottom="0"
            left="0"
            width="100%"
            height="24px"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 1200 24" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
              <path d="M0,12 C200,4 400,20 600,12 C800,4 1000,20 1200,12 L1200,24 L0,24 Z" fill="rgba(159, 122, 234, 0.2)" />
              <path d="M0,16 C150,10 350,22 600,16 C850,10 1050,22 1200,16 L1200,24 L0,24 Z" fill="rgba(159, 122, 234, 0.1)" />
            </svg>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default MentalLoadTracker;

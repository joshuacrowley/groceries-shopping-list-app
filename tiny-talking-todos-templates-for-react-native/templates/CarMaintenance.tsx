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
  Car,
  Wrench,
  Drop,
  Clipboard,
  GearSix,
  Engine,
  Sparkle,
  CalendarBlank,
} from "@phosphor-icons/react";
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

// ── Car maintenance categories ───────────────────────────────────
const CATEGORIES = [
  { name: "Service", icon: GearSix, emoji: "🔧", color: "blue" },
  { name: "Repair", icon: Wrench, emoji: "🛠️", color: "red" },
  { name: "Clean", icon: Drop, emoji: "🧽", color: "cyan" },
  { name: "Errand", icon: Clipboard, emoji: "📋", color: "orange" },
  { name: "Upgrade", icon: Engine, emoji: "⚡", color: "purple" },
];

const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.name] = c;
  return acc;
}, {} as Record<string, (typeof CATEGORIES)[number]>);

// ── Road stripe decoration ───────────────────────────────────────
const RoadStripe = ({ top, opacity = 0.12 }: { top: string; opacity?: number }) => (
  <Box
    position="absolute"
    top={top}
    left="50%"
    transform="translateX(-50%)"
    width="40px"
    height="4px"
    borderRadius="full"
    bg="yellow.400"
    opacity={opacity}
    pointerEvents="none"
  />
);

// ── Single car maintenance item (subscribes to its own row only) ─
const CarItem = memo(({ id }: { id: string }) => {
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
  const dateColor = useColorModeValue("gray.500", "gray.400");
  const isDone = Boolean(itemData?.done);
  const hasNotes = typeof itemData?.notes === "string" && itemData.notes.trim().length > 0;
  const hasDate = typeof itemData?.date === "string" && itemData.date.trim().length > 0;

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
          <HStack spacing={1} mb={hasNotes || hasDate ? 0.5 : 0}>
            <Text color={textColor} fontWeight="medium" textDecoration={isDone ? "line-through" : "none"} noOfLines={1} flex={1}>
              {String(itemData.text || "")}
            </Text>
            <Badge colorScheme={catInfo.color} fontSize="2xs" borderRadius="full" px={2}>{catInfo.name}</Badge>
          </HStack>
          {hasDate && (
            <HStack spacing={1} mb={0.5}>
              <CalendarBlank size={10} weight="bold" />
              <Text fontSize="xs" color={dateColor} fontWeight="medium">{String(itemData.date)}</Text>
            </HStack>
          )}
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
CarItem.displayName = "CarItem";

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
    if (totalCount === 0) return "Add tasks to keep your ride in shape";
    if (progress === 100) return "Road ready! 🚗";
    if (progress >= 75) return "Almost serviced 🔧";
    if (progress >= 50) return "Under the hood 🛠️";
    if (progress >= 25) return "Time for a tune-up 🔩";
    return "Engine's warming up 🏁";
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
            animate={{ x: [0, 3, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <DynamicIcon iconName={String(listData?.icon || "Car")} size={36} weight="fill" color={headerColor} />
          </Box>
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color={headerColor} lineHeight="1.2">
              {String(listData?.name || "Car Maintenance")}
            </Text>
            <Text fontSize="xs" color={subTextColor} fontStyle="italic">
              {readinessLabel}
            </Text>
          </Box>
        </HStack>
        <VStack spacing={0} align="flex-end">
          <Badge colorScheme={progress === 100 ? "green" : "blue"} fontSize="sm" px={3} py={1} borderRadius="full">
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
            bgGradient="linear(to-r, blue.500, cyan.400, blue.300)"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </Box>
        {progress > 0 && progress < 100 && (
          <Box as={motion.div} position="absolute" top="-4px" style={{ left: `calc(${progress}% - 8px)` }} animate={{ x: [0, 2, 0] }} transition={{ duration: 1, repeat: Infinity }}>
            <Text fontSize="xs">🚗</Text>
          </Box>
        )}
        {progress === 100 && (
          <Box as={motion.div} position="absolute" top="-6px" right="0" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
            <Text fontSize="sm">🏁</Text>
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
          {items.map((id) => (<CarItem key={id} id={id} />))}
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

// ── Main Car Maintenance List ────────────────────────────────────
const CarMaintenanceList = ({ listId = "car-maintenance" }) => {
  const [newTodo, setNewTodo] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDate, setNewDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].name);
  const [showDetails, setShowDetails] = useState(false);
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
      const cat = String(store?.getCell("todos", id, "category") || "Service");
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
      emoji: data.emoji || CATEGORY_MAP[data.category || selectedCategory]?.emoji || "🔧",
      notes: data.notes || "",
      date: data.date || "",
      done: false,
      list: listId,
    }),
    [listId, selectedCategory]
  );

  const handleAdd = useCallback(() => {
    if (newTodo.trim()) {
      addItem({ text: newTodo.trim(), category: selectedCategory, notes: newNotes.trim(), date: newDate });
      setNewTodo("");
      setNewNotes("");
      setNewDate("");
      setShowDetails(false);
      playAdd();
    }
  }, [newTodo, newNotes, newDate, selectedCategory, addItem, playAdd]);

  const handleKeyDown = useCallback(
    (e: any) => { if (e.key === "Enter" && !e.shiftKey) handleAdd(); },
    [handleAdd]
  );

  const toggleCategory = useCallback((cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }, []);

  // Colors
  const gradientBg = useColorModeValue(
    "linear-gradient(180deg, #2C3E50 0%, #34495E 20%, #415B76 50%, #4A6785 100%)",
    "linear-gradient(180deg, #1A202C 0%, #1E2A3A 20%, #253445 50%, #2D3E50 100%)"
  );
  const cardBg = useColorModeValue("rgba(255,255,255,0.88)", "rgba(26,32,44,0.88)");
  const headerColor = useColorModeValue("white", "blue.200");
  const subTextColor = useColorModeValue("blue.100", "blue.300");
  const inputBg = useColorModeValue("white", "gray.700");
  const progressTrackBg = useColorModeValue("whiteAlpha.300", "blue.900");

  return (
    <Box maxWidth="600px" margin="auto" borderRadius="xl" overflow="hidden" boxShadow="xl" bgGradient={gradientBg} position="relative">
      <RoadStripe top="20%" opacity={0.08} />
      <RoadStripe top="35%" opacity={0.06} />
      <RoadStripe top="50%" opacity={0.08} />
      <RoadStripe top="65%" opacity={0.06} />
      <RoadStripe top="80%" opacity={0.08} />

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
            <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} size="sm" width="130px" bg={inputBg} borderRadius="md" fontSize="xs">
              {CATEGORIES.map(({ name, emoji }) => (<option key={name} value={name}>{emoji} {name}</option>))}
            </Select>
            <Input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={handleKeyDown} placeholder="Add maintenance task..." size="sm" bg={inputBg} borderRadius="md" flex={1} />
            <IconButton icon={<Plus weight="bold" />} onClick={handleAdd} aria-label="Add task" size="sm" colorScheme="blue" borderRadius="md" />
          </HStack>
          <HStack spacing={1} mt={1.5} cursor="pointer" onClick={() => setShowDetails(!showDetails)}>
            <Sparkle size={12} weight="fill" color="var(--chakra-colors-blue-400)" />
            <Text fontSize="xs" color={useColorModeValue("blue.600", "blue.300")}>Add details & due date</Text>
            {showDetails ? <CaretUp size={10} /> : <CaretDown size={10} />}
          </HStack>
          <Collapse in={showDetails}>
            <VStack spacing={1.5} mt={1} align="stretch">
              <HStack spacing={2}>
                <CalendarBlank size={14} weight="bold" />
                <Input value={newDate} onChange={(e) => setNewDate(e.target.value)} placeholder="Due date (e.g. March 2026)" size="sm" bg={inputBg} borderRadius="md" flex={1} fontSize="xs" />
              </HStack>
              <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes or details..." size="sm" bg={inputBg} borderRadius="md" rows={2} resize="none" fontSize="xs" />
            </VStack>
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
                  <CategoryGroup key={cat} category={{ name: cat, icon: Car, emoji: "🚗", color: "gray" }} items={items} isOpen={openCategories[cat] !== false} onToggle={toggleCategory} />
                );
              })}
          </VStack>
        </Box>

        {/* Empty state */}
        {todoIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ x: [0, 4, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🚗</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">No car tasks yet</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add maintenance tasks to keep your ride running smooth</Text>
          </VStack>
        )}

        {/* Bottom tread decoration */}
        <Box position="relative" width="100%" height="20px" overflow="hidden" mt={2}>
          <Box
            as={motion.div}
            position="absolute"
            bottom="0"
            left="-50%"
            width="200%"
            height="20px"
            animate={{ x: ["0%", "-25%"] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <svg viewBox="0 0 1200 20" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
              <path d="M0,10 L30,10 L35,2 L45,2 L50,10 L80,10 L85,2 L95,2 L100,10 L130,10 L135,2 L145,2 L150,10 L180,10 L185,2 L195,2 L200,10 L230,10 L235,2 L245,2 L250,10 L280,10 L285,2 L295,2 L300,10 L330,10 L335,2 L345,2 L350,10 L380,10 L385,2 L395,2 L400,10 L430,10 L435,2 L445,2 L450,10 L480,10 L485,2 L495,2 L500,10 L530,10 L535,2 L545,2 L550,10 L580,10 L585,2 L595,2 L600,10 L630,10 L635,2 L645,2 L650,10 L680,10 L685,2 L695,2 L700,10 L730,10 L735,2 L745,2 L750,10 L780,10 L785,2 L795,2 L800,10 L830,10 L835,2 L845,2 L850,10 L880,10 L885,2 L895,2 L900,10 L930,10 L935,2 L945,2 L950,10 L980,10 L985,2 L995,2 L1000,10 L1030,10 L1035,2 L1045,2 L1050,10 L1080,10 L1085,2 L1095,2 L1100,10 L1130,10 L1135,2 L1145,2 L1150,10 L1180,10 L1185,2 L1195,2 L1200,10 L1200,20 L0,20 Z" fill="rgba(100, 130, 160, 0.15)" />
            </svg>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default CarMaintenanceList;

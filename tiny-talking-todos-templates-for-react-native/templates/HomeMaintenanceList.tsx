import React, { useState, useCallback, useMemo, memo } from "react";
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
} from "tinybase/ui-react";
import {
    Grid,
    Editable,
    EditablePreview,
    EditableInput,
    EditableTextarea,
    Box,
    VStack,
    HStack,
    Input,
    Button,
    Text,
    IconButton,
    useColorModeValue,
    Badge,
    Select,
    Collapse,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    Textarea,
    Checkbox,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HouseLine,
  Tree,
  Bathtub,
  Briefcase,
  Buildings,
  CaretDown,
  CaretUp,
  Plus,
  Trash,
  HouseSimple,
  CalendarCheck,
  Check,
  X,
  PencilSimple,
} from "@phosphor-icons/react";
import { useEditableControls } from "@chakra-ui/react";
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

const LOCATIONS = [
  { name: "Garden", icon: Tree },
  { name: "Outside House", icon: HouseLine },
  { name: "Kitchen", icon: Bathtub },
  { name: "Living Areas", icon: Buildings },
  { name: "Office", icon: Briefcase },
  { name: "Other", icon: HouseSimple },
];

const EditableControl = () => {
  const {
    isEditing,
    getSubmitButtonProps,
    getCancelButtonProps,
    getEditButtonProps,
  } = useEditableControls();

  return isEditing ? (
    <HStack spacing={2}>
      <IconButton
        icon={<Check weight="bold" />}
        {...getSubmitButtonProps()}
        aria-label="Confirm edit"
        size="sm"
        colorScheme="yellow"
        variant="ghost"
      />
      <IconButton
        icon={<X weight="bold" />}
        {...getCancelButtonProps()}
        aria-label="Cancel edit"
        size="sm"
        colorScheme="yellow"
        variant="ghost"
      />
    </HStack>
  ) : (
    <IconButton
      icon={<PencilSimple weight="bold" />}
      {...getEditButtonProps()}
      aria-label="Edit task"
      size="sm"
      colorScheme="yellow"
      variant="ghost"
      opacity={0.5}
      _hover={{ opacity: 1 }}
    />
  );
};

const MaintenanceItem = memo(({ id }) => {
  const { isOpen, onToggle } = useDisclosure();
  const itemData = useRow("todos", id);
  
  const updateItem = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...itemData, ...updates }),
    [itemData]
  );

  const deleteItem = useDelRowCallback("todos", id);

  const handleToggle = useCallback(() => {
    updateItem({ done: !itemData.done });
  }, [updateItem, itemData.done]);

  const bgColor = useColorModeValue("yellow.50", "yellow.800");
  const textColor = useColorModeValue("yellow.900", "yellow.100");
  
  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      opacity={itemData.done ? 0.6 : 1}
    >
      <VStack align="stretch" spacing={2}>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Checkbox
              isChecked={itemData.done}
              onChange={handleToggle}
              colorScheme="yellow"
            />
            <Text
              fontWeight="semibold"
              textDecoration={itemData.done ? "line-through" : "none"}
              color={textColor}
            >
              {itemData.text}
            </Text>
          </HStack>
          <HStack>
            <Badge colorScheme="yellow">{itemData.category}</Badge>
            <IconButton
              icon={isOpen ? <CaretUp /> : <CaretDown />}
              onClick={onToggle}
              aria-label="Toggle details"
              size="sm"
              variant="ghost"
              color={textColor}
            />
            <IconButton
              icon={<Trash />}
              onClick={deleteItem}
              aria-label="Delete task"
              size="sm"
              colorScheme="red"
              variant="ghost"
            />
          </HStack>
        </HStack>

        <Collapse in={isOpen}>
          <Box pl={8} pt={2}>
            <VStack align="stretch" spacing={4}>
              {/* Item Row */}
              <HStack spacing={0}>
                <Box minW="100px">
                  <Text fontWeight="bold" color={textColor}>Item:</Text>
                </Box>
                <Box flex={1}>
                  <Editable
                    defaultValue={itemData.url || ''}
                    onSubmit={(value) => updateItem({ url: value })}
                    display="flex"
                    gap={2}
                  >
                    <Box flex={1}>
                      <EditablePreview w="full" />
                      <EditableInput />
                    </Box>
                    <EditableControl />
                  </Editable>
                </Box>
              </HStack>

              {/* Details Row */}
              <HStack spacing={0} alignItems="start">
                <Box minW="100px">
                  <Text fontWeight="bold" color={textColor}>Details:</Text>
                </Box>
                <Box flex={1}>
                  <Editable
                    defaultValue={itemData.notes || ''}
                    onSubmit={(value) => updateItem({ notes: value })}
                    display="flex"
                    gap={2}
                  >
                    <Box flex={1}>
                      <EditablePreview whiteSpace="pre-wrap" w="full" />
                      <EditableTextarea minH="60px" />
                    </Box>
                    <EditableControl />
                  </Editable>
                </Box>
              </HStack>

              {/* Due Date Row */}
              <HStack spacing={0}>
                <Box minW="100px">
                  <Text fontWeight="bold" color={textColor}>Due Date:</Text>
                </Box>
                <Box flex={1}>
                  <Input
                    type="date"
                    value={itemData.date || ''}
                    onChange={(e) => updateItem({ date: e.target.value })}
                    size="sm"
                    maxW="200px"
                    bg={useColorModeValue("white", "yellow.800")}
                    border="1px solid"
                    borderColor={useColorModeValue("yellow.200", "yellow.600")}
                  />
                </Box>
              </HStack>
            </VStack>
          </Box>
        </Collapse>
      </VStack>
    </Box>
  );
});

MaintenanceItem.displayName = "MaintenanceItem";

const AddTaskModal = ({ isOpen, onClose, onAdd }) => {
  const [task, setTask] = useState({
    text: "",
    category: LOCATIONS[0].name,
    url: "",
    notes: "",
    date: "",
  });

  const handleSubmit = () => {
    if (task.text.trim()) {
      onAdd(task);
      setTask({
        text: "",
        category: LOCATIONS[0].name,
        url: "",
        notes: "",
        date: "",
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg={useColorModeValue("yellow.50", "yellow.900")}>
        <ModalHeader color={useColorModeValue("yellow.900", "yellow.100")}>Add Maintenance Task</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Input
              placeholder="Task name"
              value={task.text}
              onChange={(e) => setTask({ ...task, text: e.target.value })}
              bg={useColorModeValue("white", "yellow.800")}
            />
            <Select
              value={task.category}
              onChange={(e) => setTask({ ...task, category: e.target.value })}
              bg={useColorModeValue("white", "yellow.800")}
            >
              {LOCATIONS.map(({ name }) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Item (e.g., spa, oven, deck)"
              value={task.url}
              onChange={(e) => setTask({ ...task, url: e.target.value })}
              bg={useColorModeValue("white", "yellow.800")}
            />
            <Textarea
              placeholder="Details (e.g., order water filter, wood stain type)"
              value={task.notes}
              onChange={(e) => setTask({ ...task, notes: e.target.value })}
              bg={useColorModeValue("white", "yellow.800")}
            />
            <Input
              type="date"
              value={task.date}
              onChange={(e) => setTask({ ...task, date: e.target.value })}
              bg={useColorModeValue("white", "yellow.800")}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="yellow" mr={3} onClick={handleSubmit}>
            Add Task
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const CategorySection = ({ category, items, isOpen, onToggle }) => {
  const bgColor = useColorModeValue("yellow.100", "yellow.700");
  const textColor = useColorModeValue("yellow.900", "yellow.100");
  const IconComponent = category.icon;

  return (
    <Box mb={2}>
      <HStack
        onClick={onToggle}
        cursor="pointer"
        bg={bgColor}
        p={2}
        borderRadius="md"
        justify="space-between"
      >
        <HStack>
          <IconComponent size={24} weight="fill" />
          <Text fontWeight="bold" color={textColor}>{category.name}</Text>
          <Badge colorScheme="yellow">{items.length}</Badge>
        </HStack>
        {isOpen ? <CaretDown /> : <CaretUp />}
      </HStack>
      <Collapse in={isOpen}>
        <VStack align="stretch" mt={2} spacing={2}>
          {items.map((id) => (
            <MaintenanceItem key={id} id={id} />
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
};

const HomeMaintenanceList = ({ listId = "home-maintenance" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [openCategories, setOpenCategories] = useState(
    LOCATIONS.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {})
  );

  const todoIds = useLocalRowIds("todoList", listId) || [];
  
  const listData = useRow("lists", listId);
  const store = useStore();

  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });

  const addTask = useAddRowCallback(
    "todos",
    (task) => ({
      text: task.text.trim(),
      category: task.category,
      url: task.url,
      notes: task.notes,
      date: task.date,
      list: listId,
      done: false,
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) playAdd();
    }
  );

  const groupedItems = useMemo(() => {
    const grouped = {};
    todoIds.forEach((id) => {
      const item = store.getRow("todos", id);
      if (item) {
        const category = item.category || "Other";
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(id);
      }
    });
    return grouped;
  }, [todoIds, store]);

  const progressLabel = useMemo(() => {
    const count = todoIds.length;
    if (count === 0) return "Track home tasks! 🏠";
    if (count <= 3) return "A few things to do 🔧";
    return "On top of maintenance! 🏡";
  }, [todoIds.length]);

  const toggleCategory = useCallback((category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const bgGradient = useColorModeValue(
    `linear(to-br, ${listData?.color || 'yellow'}.100, ${listData?.color || 'yellow'}.200)`,
    `linear(to-br, ${listData?.color || 'yellow'}.900, ${listData?.color || 'yellow'}.800)`
  );
  const textColor = useColorModeValue(`${listData?.color || 'yellow'}.900`, `${listData?.color || 'yellow'}.100`);
  const subTextColor = useColorModeValue(`${listData?.color || 'yellow'}.600`, `${listData?.color || 'yellow'}.300`);

  return (
    <Box maxW="800px" mx="auto" p={5} bgGradient={bgGradient} borderRadius="xl" overflow="hidden" boxShadow="xl">
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Box as={motion.div} animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Box w="32px" h="32px">
                <DynamicIcon
                  iconName={listData?.icon || "HouseLine"}
                  style={{
                    width: "100%",
                    height: "100%",
                    color: useColorModeValue(
                      `${listData?.color || 'yellow'}.600`,
                      `${listData?.color || 'yellow'}.200`
                    )
                  }}
                />
              </Box>
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {listData?.name || "Home Maintenance"}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </VStack>
          </HStack>
          <HStack>
            <CalendarCheck size={24} weight="fill" />
            <Text fontWeight="bold" color={textColor}>
              Tasks: {todoIds.length}
            </Text>
          </HStack>
        </HStack>

        <Button
          leftIcon={<Plus weight="bold" />}
          colorScheme={listData?.color || 'yellow'}
          variant="solid"
          onClick={onOpen}
        >
          Add Maintenance Task
        </Button>

        {LOCATIONS.map((category) => {
          const items = groupedItems[category.name] || [];
          return items.length > 0 ? (
            <CategorySection
              key={category.name}
              category={category}
              items={items}
              isOpen={openCategories[category.name]}
              onToggle={() => toggleCategory(category.name)}
            />
          ) : null;
        })}

        {todoIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🏠</Text>
            </Box>
            <Text textAlign="center" color={textColor} fontWeight="medium" fontSize="lg">No maintenance tasks yet</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add home tasks to stay on top of repairs and upkeep</Text>
          </VStack>
        )}
      </VStack>

      <AddTaskModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={addTask}
      />
    </Box>
  );
};

export default HomeMaintenanceList;
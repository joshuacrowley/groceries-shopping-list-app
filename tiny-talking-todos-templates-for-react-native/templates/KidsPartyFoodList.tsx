import React, { useState, useCallback, useMemo, memo } from "react";
import {
  useStore,
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
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
  Editable,
  EditableInput,
  EditablePreview,
  EditableTextarea,
  useEditableControls,
  Select,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Collapse,
  FormControl,
  FormLabel,
  Textarea,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag,
  TagLabel,
  TagLeftIcon,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  PencilSimple,
  Check,
  CaretDown,
  CaretUp,
  Plus,
  CookingPot,
  ForkKnife,
  Coffee,
  Cake,
  Hamburger,
  Pizza,
  User,
  Calendar,
  ShoppingBag,
  Fire,
  Snowflake,
} from "@phosphor-icons/react";
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

// Map of the TYPES to preparation methods
const PREP_TYPES = {
  A: "Store Bought",
  B: "Homemade",
  C: "Needs Heating",
  D: "Needs Refrigeration",
  E: "Ready to Serve",
};

// Food categories
const CATEGORIES = [
  { name: "Sweet", icon: Cake },
  { name: "Savory", icon: Pizza },
  { name: "Drinks", icon: Coffee },
  { name: "Main Dishes", icon: ForkKnife },
  { name: "Snacks", icon: Hamburger },
];

// Food emojis for quick selection
const FOOD_EMOJIS = [
  "🍕", "🍔", "🍦", "🧁", "🍰", "🍪", "🍩", "🍫", "🍭", "🍬",
  "🥨", "🥪", "🌭", "🧃", "🥤", "🍿", "🍉", "🍇", "🍓", "🥗",
];

// Component for editable controls (edit/save buttons)
const EditableControls = () => {
  const { isEditing, getSubmitButtonProps, getEditButtonProps } = useEditableControls();

  return isEditing ? (
    <IconButton
      icon={<Check weight="bold" />}
      {...getSubmitButtonProps()}
      aria-label="Confirm edit"
      size="sm"
      colorScheme="green"
      variant="ghost"
    />
  ) : (
    <IconButton
      icon={<PencilSimple weight="bold" />}
      {...getEditButtonProps()}
      aria-label="Edit item"
      size="sm"
      colorScheme="blue"
      variant="ghost"
    />
  );
};

// Individual food item component
const FoodItem = memo(({ id }: { id: string }) => {
  const { isOpen, onToggle } = useDisclosure();
  const [playEdit] = useSound("/sounds/notification/Notification 2.m4a", { volume: 0.5 });
  const [playDelete] = useSound("/sounds/cancel/Cancel 1.m4a", { volume: 0.5 });

  const foodData = useRow("todos", id);
  
  const updateFood = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...foodData, ...updates }),
    [foodData]
  );
  
  const deleteFood = useDelRowCallback("todos", id);

  const handleEdit = useCallback(
    (field, value) => {
      updateFood({ [field]: value });
      playEdit();
    },
    [updateFood, playEdit]
  );

  const handleDelete = useCallback(() => {
    deleteFood();
    playDelete();
  }, [deleteFood, playDelete]);

  // Get the corresponding category icon component
  const getCategoryIcon = (categoryName) => {
    const category = CATEGORIES.find(cat => cat.name === categoryName);
    return category ? category.icon : ForkKnife;
  };
  
  // Get the corresponding prep type icon
  const getPrepTypeIcon = (type) => {
    switch (type) {
      case "A": return ShoppingBag;
      case "B": return CookingPot;
      case "C": return Fire;
      case "D": return Snowflake;
      case "E": return ForkKnife;
      default: return ForkKnife;
    }
  };

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const expandedBgColor = useColorModeValue("gray.50", "gray.600");
  const IconComponent = getCategoryIcon(foodData.category);
  const PrepIcon = getPrepTypeIcon(foodData.type);

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      opacity={foodData.done ? 0.7 : 1}
    >
      <VStack align="stretch" spacing={2}>
        <HStack justifyContent="space-between">
          <HStack>
            <Text fontSize="xl">{foodData.emoji || "🍽️"}</Text>
            <Editable
              defaultValue={foodData.text}
              onSubmit={(value) => handleEdit("text", value)}
              color={textColor}
            >
              <EditablePreview fontWeight="bold" />
              <EditableInput />
              <EditableControls />
            </Editable>
          </HStack>
          <HStack>
            <Checkbox
              isChecked={foodData.done}
              onChange={(e) => handleEdit("done", e.target.checked)}
              colorScheme="green"
            >
              Ready
            </Checkbox>
            <IconButton
              icon={isOpen ? <CaretUp /> : <CaretDown />}
              onClick={onToggle}
              aria-label="Toggle details"
              size="sm"
              variant="ghost"
            />
            <IconButton
              icon={<Trash weight="bold" />}
              onClick={handleDelete}
              aria-label="Delete food item"
              size="sm"
              colorScheme="red"
              variant="ghost"
            />
          </HStack>
        </HStack>
        
        <HStack wrap="wrap" spacing={2}>
          <Box borderRadius="md" bg="blue.100" color="blue.700" px={2} py={1} fontSize="sm">
            <HStack>
              <User size={14} />
              <Text>{foodData.email || "Unassigned"}</Text>
            </HStack>
          </Box>
          
          <Box borderRadius="md" bg="purple.100" color="purple.700" px={2} py={1} fontSize="sm">
            <HStack>
              <IconComponent size={14} />
              <Text>{foodData.category}</Text>
            </HStack>
          </Box>
          
          <Box borderRadius="md" bg="orange.100" color="orange.700" px={2} py={1} fontSize="sm">
            <HStack>
              <PrepIcon size={14} />
              <Text>{PREP_TYPES[foodData.type]}</Text>
            </HStack>
          </Box>
          
          <Box borderRadius="md" bg="green.100" color="green.700" px={2} py={1} fontSize="sm">
            <HStack>
              <Calendar size={14} />
              <Text>Qty: {foodData.number || 0}</Text>
            </HStack>
          </Box>
        </HStack>
        
        <Collapse in={isOpen} animateOpacity>
          <VStack align="stretch" mt={2} p={3} bg={expandedBgColor} borderRadius="md" spacing={3}>
            <FormControl>
              <FormLabel fontWeight="bold">Bringing:</FormLabel>
              <Input
                value={foodData.email || ""}
                onChange={(e) => handleEdit("email", e.target.value)}
                placeholder="Who's bringing this item"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="bold">Preparation:</FormLabel>
              <Select 
                value={foodData.type} 
                onChange={(e) => handleEdit("type", e.target.value)}
              >
                {Object.entries(PREP_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="bold">Category:</FormLabel>
              <Select 
                value={foodData.category || ""} 
                onChange={(e) => handleEdit("category", e.target.value)}
              >
                {CATEGORIES.map(({ name }) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="bold">Quantity/Servings:</FormLabel>
              <Input
                type="number"
                value={foodData.number || 0}
                onChange={(e) => handleEdit("number", parseInt(e.target.value, 10))}
                placeholder="Number of servings"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="bold">Rating:</FormLabel>
              <Select 
                value={foodData.fiveStarRating || 1} 
                onChange={(e) => handleEdit("fiveStarRating", parseInt(e.target.value, 10))}
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>
                    {"⭐".repeat(rating)} ({rating})
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="bold">Recipe Link:</FormLabel>
              <Input
                value={foodData.url || ""}
                onChange={(e) => handleEdit("url", e.target.value)}
                placeholder="Link to recipe (optional)"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel fontWeight="bold">Notes:</FormLabel>
              <Textarea
                value={foodData.notes || ""}
                onChange={(e) => handleEdit("notes", e.target.value)}
                placeholder="Any special instructions or notes"
                minHeight="100px"
              />
            </FormControl>
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
});
FoodItem.displayName = "FoodItem";

// Category group component
const CategoryGroup = memo(({ category, items, isOpen, onToggle }: any) => {
  const bgColor = useColorModeValue("pink.50", "pink.900");
  const textColor = useColorModeValue("pink.800", "pink.100");
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
          <Badge ml={2} colorScheme="pink" variant="solid">
            {items.length}
          </Badge>
        </HStack>
        {isOpen ? <CaretDown /> : <CaretUp />}
      </HStack>
      <Collapse in={isOpen}>
        <VStack align="stretch" mt={1} spacing={1}>
          {items.map((id) => (
            <FoodItem key={id} id={id} />
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
});
CategoryGroup.displayName = "CategoryGroup";

// Add Food Modal
const AddFoodModal = ({ isOpen, onClose, addFood }) => {
  const [newFood, setNewFood] = useState({
    text: "",
    emoji: "🍽️",
    email: "",
    type: "E",
    category: "Snacks",
    number: 1,
    notes: "",
    url: "",
    fiveStarRating: 3,
  });

  const handleChange = (field, value) => {
    setNewFood(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (newFood.text.trim()) {
      addFood(newFood);
      onClose();
      setNewFood({
        text: "",
        emoji: "🍽️",
        email: "",
        type: "E",
        category: "Snacks",
        number: 1,
        notes: "",
        url: "",
        fiveStarRating: 3,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Party Food Item</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <HStack width="100%">
              <Menu>
                <MenuButton as={Button} rightIcon={<CaretDown />}>
                  {newFood.emoji}
                </MenuButton>
                <MenuList>
                  <SimpleGrid columns={5} spacing={2} p={2}>
                    {FOOD_EMOJIS.map(emoji => (
                      <Box 
                        key={emoji} 
                        p={2} 
                        cursor="pointer"
                        onClick={() => handleChange("emoji", emoji)}
                        _hover={{ bg: "gray.100" }}
                        borderRadius="md"
                      >
                        {emoji}
                      </Box>
                    ))}
                  </SimpleGrid>
                </MenuList>
              </Menu>
              <Input
                placeholder="Food item name"
                value={newFood.text}
                onChange={(e) => handleChange("text", e.target.value)}
              />
            </HStack>

            <FormControl>
              <FormLabel>Who's bringing this?</FormLabel>
              <Input
                placeholder="Name or contact info"
                value={newFood.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                value={newFood.category}
                onChange={(e) => handleChange("category", e.target.value)}
              >
                {CATEGORIES.map(({ name }) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Preparation</FormLabel>
              <Select
                value={newFood.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                {Object.entries(PREP_TYPES).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Quantity/Servings</FormLabel>
              <Input
                type="number"
                value={newFood.number}
                onChange={(e) => handleChange("number", parseInt(e.target.value, 10))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea
                placeholder="Any special instructions or notes"
                value={newFood.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Recipe Link (optional)</FormLabel>
              <Input
                placeholder="URL for recipe"
                value={newFood.url}
                onChange={(e) => handleChange("url", e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="pink" mr={3} onClick={handleSubmit}>
            Add Food Item
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Main component
const KidsPartyFoodList = ({ listId = "kids-party-food" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.5 });
  const [openCategories, setOpenCategories] = useState(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {})
  );

  const store = useStore();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);
  
  const addFood = useAddRowCallback(
    "todos",
    (food) => ({
      text: food.text.trim(),
      emoji: food.emoji,
      email: food.email,
      type: food.type,
      category: food.category,
      number: food.number,
      notes: food.notes,
      url: food.url,
      fiveStarRating: food.fiveStarRating,
      list: listId,
      done: false,
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) {
        playAdd();
      }
    }
  );

  // Group items by category
  const groupedItems = useMemo(() => {
    return todoIds.reduce((acc, id) => {
      const item = store.getRow("todos", id);
      if (item) {
        const category = item.category || "Snacks";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(id);
      }
      return acc;
    }, {});
  }, [todoIds, store]);

  const toggleCategory = useCallback((category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  const color = String(listData?.color || "pink");
  const bgGradient = useColorModeValue(
    `linear-gradient(180deg, ${color}.50 0%, white 100%)`,
    `linear-gradient(180deg, #3d1a2a 0%, #1A202C 100%)`
  );
  const textColor = useColorModeValue(`${color}.800`, `${color}.100`);
  const subTextColor = useColorModeValue(`${color}.500`, `${color}.300`);

  const progressLabel = useMemo(() => {
    if (todoIds.length === 0) return "Let's plan some party food! 🎈";
    if (todoIds.length <= 5) return "Menu coming together 🍕";
    if (todoIds.length <= 10) return "That's a feast! 🎉";
    return "Party food sorted! 🥳";
  }, [todoIds.length]);

  return (
    <Box
      maxWidth="800px"
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
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <DynamicIcon iconName={String(listData?.icon || "CookingPot")} size={36} weight="fill" />
            </Box>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {String(listData?.name || "Kids Party Food Planner")}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </Box>
          </HStack>
          <Badge colorScheme={color} fontSize="sm" px={3} py={1} borderRadius="full">
            {todoIds.length} {todoIds.length === 1 ? "item" : "items"}
          </Badge>
        </HStack>
        
        <Button 
          leftIcon={<Plus />} 
          onClick={onOpen} 
          colorScheme={listData?.color || 'pink'} 
          size="md"
        >
          Add Food Item
        </Button>
        
        <VStack spacing={2} align="stretch">
          <AnimatePresence>
            {CATEGORIES.map((category) => {
              const items = groupedItems[category.name] || [];
              return (
                <CategoryGroup
                  key={category.name}
                  category={category}
                  items={items}
                  isOpen={openCategories[category.name]}
                  onToggle={() => toggleCategory(category.name)}
                />
              );
            })}
          </AnimatePresence>
        </VStack>
        
        {todoIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🎂</Text>
            </Box>
            <Text textAlign="center" color={textColor} fontWeight="medium" fontSize="lg">No party food yet!</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add items to start planning your party menu</Text>
          </VStack>
        )}
      </VStack>
      
      <AddFoodModal isOpen={isOpen} onClose={onClose} addFood={addFood} />
    </Box>
  );
};

export default KidsPartyFoodList;
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
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Checkbox,
  IconButton,
  useColorModeValue,
  Badge,
  Flex,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftElement,
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  Gift,
  Balloon,
  Confetti,
  Package,
  ShoppingBag,
  Cookie,
  Cake,
  Plus,
} from "@phosphor-icons/react";
import DynamicIcon from "@/components/catalogue/DynamicIcon";
import useSound from "use-sound";

const CATEGORIES = [
  { name: "Sweets", icon: Cookie, color: "pink" },
  { name: "Toys", icon: Gift, color: "blue" },
  { name: "Decorations", icon: Balloon, color: "purple" },
  { name: "Other", icon: Package, color: "gray" },
];

const PartyBagItem = memo(({ id }) => {
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

  const handleDelete = useCallback(() => {
    deleteItem();
  }, [deleteItem]);

  const handleQuantityChange = useCallback(
    (value) => {
      updateItem({ number: parseInt(value) });
    },
    [updateItem]
  );

  // Find category color
  const categoryObj = CATEGORIES.find(cat => cat.name === itemData.category) || CATEGORIES[3];
  const categoryColor = categoryObj.color;

  const bgColor = useColorModeValue(
    itemData.done ? "green.50" : `${categoryColor}.50`,
    itemData.done ? "green.900" : `${categoryColor}.900`
  );
  const borderColor = useColorModeValue(
    itemData.done ? "green.200" : `${categoryColor}.200`,
    itemData.done ? "green.700" : `${categoryColor}.700`
  );

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      borderWidth="2px"
      borderColor={borderColor}
      boxShadow="sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
    >
      <Flex justify="space-between" align="center">
        <HStack spacing={4} flex={1}>
          <Checkbox
            isChecked={itemData.done}
            onChange={handleToggle}
            colorScheme={categoryColor}
            size="lg"
            iconColor="white"
          />
          <Text
            fontWeight="medium"
            fontSize="lg"
            textDecoration={itemData.done ? "line-through" : "none"}
            opacity={itemData.done ? 0.7 : 1}
          >
            {itemData.text}
          </Text>
        </HStack>

        <HStack spacing={2}>
          <NumberInput
            value={itemData.number}
            onChange={handleQuantityChange}
            min={1}
            max={100}
            maxW="100px"
            size="sm"
          >
            <NumberInputField textAlign="center" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>

          <IconButton
            icon={<Trash weight="bold" />}
            onClick={handleDelete}
            aria-label="Delete item"
            size="sm"
            colorScheme="red"
            variant="ghost"
          />
        </HStack>
      </Flex>
    </Box>
  );
});
PartyBagItem.displayName = "PartyBagItem";

const AddItemModal = ({ isOpen, onClose, addItem, listData }) => {
  const [newItem, setNewItem] = useState({
    text: "",
    category: CATEGORIES[0].name,
    number: 10,
  });

  const handleSubmit = useCallback(() => {
    if (newItem.text.trim()) {
      addItem(newItem);
      setNewItem({
        text: "",
        category: CATEGORIES[0].name,
        number: 10,
      });
      onClose();
    }
  }, [addItem, newItem, onClose]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && newItem.text.trim()) {
        handleSubmit();
      }
    },
    [handleSubmit, newItem.text]
  );

  const getCategoryIcon = (categoryName) => {
    const category = CATEGORIES.find(cat => cat.name === categoryName);
    if (!category) return null;
    
    const Icon = category.icon;
    return <Icon weight="fill" />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent>
        <ModalHeader background="linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)" color="white">
          Add Fun Party Bag Item
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <VStack spacing={4} py={2}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <ShoppingBag />
              </InputLeftElement>
              <Input
                placeholder="Item name"
                value={newItem.text}
                onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
                onKeyPress={handleKeyPress}
              />
            </InputGroup>

            <Select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              icon={getCategoryIcon(newItem.category)}
            >
              {CATEGORIES.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </Select>

            <NumberInput
              value={newItem.number}
              onChange={(value) => setNewItem({ ...newItem, number: parseInt(value) })}
              min={1}
              max={100}
            >
              <NumberInputField placeholder="Quantity" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </VStack>
        </ModalBody>
        <ModalFooter bgColor="gray.50">
          <Button 
            colorScheme={listData?.backgroundColour || 'pink'} 
            mr={3} 
            onClick={handleSubmit}
            rightIcon={<Plus weight="bold" />}
          >
            Add Item
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const PartyBagList = ({ listId = "party-bag-list" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [playAdd] = useSound("/sounds/complete/Complete 2.m4a", { volume: 0.5 });
  const store = useStore();
  const listData = useRow("lists", listId);
  const listName = listData?.name || "Party Bag List";
  
  const itemIds = useLocalRowIds("todoList", listId) || [];
  const completedCount = useMemo(() => {
    return itemIds.reduce((count, id) => {
      const item = store.getRow("todos", id);
      return item.done ? count + 1 : count;
    }, 0);
  }, [itemIds, store]);

  const addItem = useAddRowCallback(
    "todos",
    (item) => ({
      text: item.text,
      category: item.category,
      number: item.number,
      done: false,
      list: listId,
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) {
        playAdd();
      }
    }
  );

  const bgGradient = useColorModeValue(
    "linear-gradient(180deg, #FED7E2 0%, #FFFFF0 100%)",
    "linear-gradient(180deg, #521B41 0%, #1A202C 100%)"
  );
  const cardBgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue(`${listData?.backgroundColour || 'pink'}.800`, `${listData?.backgroundColour || 'pink'}.100`);
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const headerColor = useColorModeValue(`${listData?.backgroundColour || 'pink'}.600`, `${listData?.backgroundColour || 'pink'}.200`);

  const progressLabel = useMemo(() => {
    if (itemIds.length === 0) return "Start filling those bags! 🎁";
    if (itemIds.length < 5) return "Getting festive 🎊";
    return "Party bags ready! 🥳";
  }, [itemIds.length]);

  const categories = useMemo(() => {
    const categorizedItems = {};
    
    CATEGORIES.forEach(category => {
      categorizedItems[category.name] = {
        icon: category.icon,
        color: category.color,
        items: [],
      };
    });
    
    itemIds.forEach(id => {
      const item = store.getRow("todos", id);
      if (item && item.category) {
        if (categorizedItems[item.category]) {
          categorizedItems[item.category].items.push(id);
        } else {
          categorizedItems["Other"].items.push(id);
        }
      }
    });
    
    return categorizedItems;
  }, [itemIds, store]);

  return (
    <Box
      maxWidth="800px"
      margin="auto"
      p={5}
      background={bgGradient}
      borderRadius="lg"
      boxShadow="lg"
      position="relative"
      overflow="hidden"
    >
      {/* Confetti decorations */}
      <Box position="absolute" top="10px" right="10px" opacity="0.6">
        <Confetti size={30} weight="fill" color="#FF6B6B" />
      </Box>
      <Box position="absolute" top="30px" right="50px" opacity="0.4">
        <Confetti size={20} weight="fill" color="#5E60CE" />
      </Box>
      <Box position="absolute" bottom="20px" left="20px" opacity="0.5">
        <Confetti size={25} weight="fill" color="#FFE66D" />
      </Box>
      
      <VStack spacing={5} align="stretch">
        <Flex 
          justify="space-between" 
          align="center"
          bg="white"
          p={4}
          borderRadius="lg"
          boxShadow="sm"
        >
          <HStack spacing={3}>
            <Box as={motion.div} animate={{ rotate: [0, 5, -5, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}>
              <DynamicIcon 
                iconName={listData?.icon || "ShoppingBag"} 
                size={32} 
                weight="fill"
                color={`${listData?.backgroundColour || 'pink'}.500`}
              />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" bgGradient={`linear(to-r, ${listData?.backgroundColour || 'pink'}.500, purple.500)`} bgClip="text">
                {listName}
              </Text>
              <Text fontSize="xs" color={headerColor} fontWeight="medium">
                {progressLabel}
              </Text>
            </VStack>
          </HStack>
          <Badge 
            colorScheme={listData?.backgroundColour || 'pink'} 
            fontSize="lg" 
            p={2} 
            borderRadius="md"
            boxShadow="sm"
          >
            Items: {completedCount}/{itemIds.length}
          </Badge>
        </Flex>

        <Button
          leftIcon={<Plus weight="bold" />}
          rightIcon={<Gift weight="fill" />}
          colorScheme={listData?.backgroundColour || 'pink'}
          onClick={onOpen}
          size="lg"
          borderRadius="full"
          boxShadow="md"
          _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
        >
          Add Party Bag Item
        </Button>

        <VStack spacing={4} align="stretch">
          {Object.entries(categories).map(([categoryName, category]) => {
            if (category.items.length === 0) return null;
            
            const CategoryIcon = category.icon;
            
            return (
              <Box key={categoryName}>
                <HStack 
                  mb={2} 
                  spacing={2} 
                  bg={`${category.color}.100`} 
                  p={2} 
                  borderRadius="md"
                  boxShadow="sm"
                >
                  <CategoryIcon size={24} weight="fill" />
                  <Text fontWeight="bold" fontSize="lg">{categoryName}</Text>
                  <Badge colorScheme={category.color} ml="auto">
                    {category.items.length}
                  </Badge>
                </HStack>
                <VStack spacing={3} align="stretch">
                  <AnimatePresence>
                    {category.items.map((id) => (
                      <PartyBagItem key={id} id={id} />
                    ))}
                  </AnimatePresence>
                </VStack>
              </Box>
            );
          })}
        </VStack>

        {itemIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}>
              <Text fontSize="5xl">🎁</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">
              Your party bag list is empty!
            </Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">
              Add some fun items to make your party bags amazing
            </Text>
          </VStack>
        )}
      </VStack>

      <AddItemModal isOpen={isOpen} onClose={onClose} addItem={addItem} listData={listData} />
    </Box>
  );
};

export default PartyBagList;
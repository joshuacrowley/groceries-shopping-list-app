import React, { useState, useCallback } from "react";
import {
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
  Badge,
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Collapse,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Editable,
  EditablePreview,
  EditableInput,
  EditableTextarea,
  useEditableControls,
  Textarea,
  FormErrorMessage,
  FormControl,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash,
  Cookie,
  CookingPot,
  Package,
  CaretDown,
  CaretUp,
  ForkKnife,
  Timer,
  BookOpen,
  Fire,
  Scales,
  PencilSimple,
  Check,
} from "@phosphor-icons/react";

const FOOD_EMOJIS = ["🥩", "🍄", "🧀", "🧄", "🥕", "🥘", "🥛", "🍅", "🍖", "🍝", "👩‍🍳", "⏲️", "🌿", "🍞", "🥡", "📝", "❄️", "🧈", "🥜", "🍫", "⚖️", "🥚", "🍪", "🔥", "⚪", "🍽️", "🥛", "📸", "📄", "🔒"];

const CATEGORIES = [
  { name: "Main Dishes", icon: ForkKnife, color: "blue" },
  { name: "Quick Meals", icon: Timer, color: "green" },
  { name: "Family Recipes", icon: BookOpen, color: "purple" },
  { name: "Special Diet", icon: Scales, color: "pink" },
  { name: "Baking", icon: Fire, color: "orange" },
];

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
      aria-label="Edit field"
      size="sm"
      colorScheme="blue"
      variant="ghost"
    />
  );
};

const RecipeItem = ({ id }) => {
  const { isOpen, onToggle } = useDisclosure();
  const recipeData = useRow("todos", id);

  const updateRecipe = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...recipeData, ...updates }),
    [recipeData]
  );

  const deleteRecipe = useDelRowCallback("todos", id);

  const handleEdit = useCallback(
    (field, value) => {
      updateRecipe({ [field]: value });
    },
    [updateRecipe]
  );

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const category = CATEGORIES.find(c => c.name === recipeData.category);

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <VStack align="stretch" spacing={3}>
        <HStack spacing={3}>
          <Menu>
            <MenuButton as={Button} variant="ghost" p={1}>
              <Text fontSize="xl">{recipeData.emoji || "🍳"}</Text>
            </MenuButton>
            <MenuList maxH="200px" overflowY="auto">
              {FOOD_EMOJIS.map((emoji) => (
                <MenuItem
                  key={emoji}
                  onClick={() => handleEdit("emoji", emoji)}
                >
                  {emoji}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Editable
            flex={1}
            defaultValue={recipeData.text}
            onSubmit={(value) => handleEdit("text", value)}
            display="flex"
            alignItems="center"
          >
            <EditablePreview flex={1} fontWeight="bold" color={textColor} />
            <EditableInput flex={1} />
            <EditableControls />
          </Editable>
          <Badge colorScheme={category?.color || "gray"}>
            {recipeData.category}
          </Badge>
          <IconButton
            icon={isOpen ? <CaretUp /> : <CaretDown />}
            onClick={onToggle}
            aria-label="Toggle details"
            size="sm"
            variant="ghost"
          />
          <IconButton
            icon={<Trash />}
            onClick={deleteRecipe}
            aria-label="Delete recipe"
            size="sm"
            colorScheme="red"
            variant="ghost"
          />
        </HStack>

        <Collapse in={isOpen}>
          <VStack align="stretch" spacing={3} pt={2}>
            <Box>
              <Text fontWeight="bold" mb={2}>Instructions:</Text>
              <Editable
                key={`${id}-notes-${recipeData.notes}`}
                defaultValue={recipeData.notes}
                onSubmit={(value) => handleEdit("notes", value)}
              >
                <EditablePreview
                  whiteSpace="pre-wrap"
                  p={2}
                  borderRadius="md"
                  bg={useColorModeValue("gray.50", "gray.600")}
                  minH="100px"
                  width="100%"
                />
                <EditableTextarea
                  minH="100px"
                  p={2}
                />
                <EditableControls />
              </Editable>
            </Box>

            <HStack spacing={4}>
              <Box flex={1}>
                <Text fontWeight="bold" mb={2}>Category:</Text>
                <Select
                  value={recipeData.category}
                  onChange={(e) => handleEdit("category", e.target.value)}
                  size="sm"
                >
                  {CATEGORIES.map(({ name }) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </Select>
              </Box>
              <Box>
                <Text fontWeight="bold" mb={2}>Serves:</Text>
                <NumberInput
                  value={recipeData.number}
                  onChange={(_, value) => handleEdit("number", value)}
                  min={1}
                  max={100}
                  size="sm"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
            </HStack>

            <Box>
              <Text fontWeight="bold" mb={2}>URL:</Text>
              <Editable
                key={`${id}-url-${recipeData.url}`}
                defaultValue={recipeData.url || ""}
                placeholder="Add recipe URL"
                onSubmit={(value) => handleEdit("url", value)}
              >
                <EditablePreview width="100%" />
                <EditableInput />
                <EditableControls />
              </Editable>
            </Box>
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};

const AddRecipeModal = ({ isOpen, onClose, onAdd }) => {
  const [newRecipe, setNewRecipe] = useState({
    text: "",
    category: CATEGORIES[0].name,
    notes: "",
    emoji: "🍳",
    number: 1,
    url: "",
    done: false,
    type: "A",
  });
  const [nameError, setNameError] = useState(false);

  const handleSubmit = () => {
    if (!newRecipe.text.trim()) {
      setNameError(true);
      return;
    } else {
      setNameError(false);
    }

    onAdd(newRecipe);
    setNewRecipe({
      text: "",
      category: CATEGORIES[0].name,
      notes: "",
      emoji: "🍳",
      number: 1,
      url: "",
      done: false,
      type: "A",
    });
    onClose();

  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Recipe</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isInvalid={nameError} isRequired>
              <HStack width="100%">
                <Menu>
                  <MenuButton as={Button}>
                    <HStack>
                      <Text>{newRecipe.emoji}</Text>
                      <CaretDown />
                    </HStack>
                  </MenuButton>
                  <MenuList maxH="200px" overflowY="auto">
                    {FOOD_EMOJIS.map((emoji) => (
                      <MenuItem
                        key={emoji}
                        onClick={() => setNewRecipe({ ...newRecipe, emoji })}
                      >
                        {emoji}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
                <Input
                  flex={1}
                  placeholder="Recipe name"
                  value={newRecipe.text}
                  onChange={(e) => setNewRecipe({ ...newRecipe, text: e.target.value })}
                />
              </HStack>
              {nameError && (
                <FormErrorMessage>
                  Recipe name is required.
                </FormErrorMessage>
              )}
            </FormControl>


            <Select
              value={newRecipe.category}
              onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
            >
              {CATEGORIES.map(({ name }) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>

            <Box width="100%">
              <Text mb={2}>Instructions:</Text>
              <Textarea
                value={newRecipe.notes}
                onChange={(e) => setNewRecipe({ ...newRecipe, notes: e.target.value })}
                placeholder="Enter recipe instructions..."
                minH="150px"
              />
            </Box>

            <Box width="100%">
              <Text mb={2}>URL:</Text>
              <Input
                value={newRecipe.url}
                onChange={(e) => setNewRecipe({ ...newRecipe, url: e.target.value })}
                placeholder="Recipe URL (optional)"
              />
            </Box>

            <Box width="100%">
              <Text mb={2}>Serves:</Text>
              <NumberInput
                value={newRecipe.number}
                onChange={(_, value) => setNewRecipe({ ...newRecipe, number: value })}
                min={1}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Add Recipe
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const RecipeList = ({ listId = "default-recipe-list" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addRecipe = useAddRowCallback(
    "todos",
    (recipe) => ({
      text: recipe.text.trim(),
      category: recipe.category,
      notes: recipe.notes,
      emoji: recipe.emoji,
      number: recipe.number,
      url: recipe.url,
      done: false,
      type: "A",
      list: listId,
    }),
    [listId]
  );

  const bgColor = useColorModeValue("blue.50", "blue.900");
  const headerBgColor = useColorModeValue("white", "gray.700");

  return (
    <Box maxW="800px" mx="auto" p={4}>
      <VStack spacing={6} align="stretch">
        <Box bg={headerBgColor} p={4} borderRadius="lg" boxShadow="sm">
          <HStack justify="space-between">
            <HStack>
              <CookingPot size={32} />
              <Text fontSize="2xl" fontWeight="bold">
                {listData?.name || "Recipe Collection"}
              </Text>
            </HStack>
            <Button
              leftIcon={<Plus />}
              colorScheme="blue"
              onClick={onOpen}
            >
              Add Recipe
            </Button>
          </HStack>
        </Box>

        <VStack spacing={4} align="stretch">
          <AnimatePresence>
            {todoIds.map((id) => (
              <RecipeItem key={id} id={id} />
            ))}
          </AnimatePresence>

          {todoIds.length === 0 && (
            <Box textAlign="center" p={8}>
              <Cookie size={48} />
              <Text mt={2}>No recipes yet. Start by adding your favorite recipe!</Text>
            </Box>
          )}
        </VStack>
      </VStack>

      <AddRecipeModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={addRecipe}
      />
    </Box>
  );
};

export default RecipeList;
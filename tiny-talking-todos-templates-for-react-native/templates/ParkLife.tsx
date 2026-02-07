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
  IconButton,
  useColorModeValue,
  Badge,
  Collapse,
  useDisclosure,
  FormControl,
  FormLabel,
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
  Tooltip,
  InputGroup,
  InputLeftElement,
  Grid,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tree,
  MapPin,
  Calendar,
  Plus,
  Trash,
  CaretDown,
  CaretUp,
  Smiley,
} from "@phosphor-icons/react";
import DynamicIcon from "@/components/catalogue/DynamicIcon";
import useSound from "use-sound";

const PARK_EMOJIS = ["🌳", "🌲", "🌴", "🌸", "🌺", "🌻", "🌹", "🌿", "🍂", "🎋", "⛲", "🏞️", "🗺️", "🏡", "🎡", "🎢", "🎪", "⛰️", "🌅", "🌄"];

const EmojiPicker = ({ value, onChange }) => {
  const [customEmoji, setCustomEmoji] = useState("");

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<CaretDown />}>
        {value || "Select emoji"}
      </MenuButton>
      <MenuList maxH="200px" overflowY="auto">
        <Box p={2}>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none">
              <Smiley />
            </InputLeftElement>
            <Input
              placeholder="Custom emoji"
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && customEmoji) {
                  onChange(customEmoji);
                  setCustomEmoji("");
                }
              }}
            />
          </InputGroup>
        </Box>
        <Grid p={2}>
          {PARK_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              onClick={() => onChange(emoji)}
              variant="ghost"
              size="sm"
              m={1}
            >
              {emoji}
            </Button>
          ))}
        </Grid>
      </MenuList>
    </Menu>
  );
};

const ParkCard = memo(({ id, listData }: { id: string; listData: any }) => {
  const { isOpen, onToggle } = useDisclosure();
  const parkData = useRow("todos", id);
  
  const updatePark = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...parkData, ...updates }),
    [parkData]
  );
  
  const deletePark = useDelRowCallback("todos", id);

  const bgColor = useColorModeValue(`${listData?.backgroundColour || 'green'}.50`, `${listData?.backgroundColour || 'green'}.900`);
  const textColor = useColorModeValue(`${listData?.backgroundColour || 'green'}.800`, `${listData?.backgroundColour || 'green'}.100`);

  return (
    <Box
      width="100%"
      bg={bgColor}
      p={4}
      borderRadius="md"
      boxShadow="sm"
      opacity={1}
      css={{ transition: "opacity 0.2s, border-color 0.2s" }}
    >
      <HStack justify="space-between">
        <HStack spacing={3}>
          <Text fontSize="xl">{parkData.emoji}</Text>
          <VStack gap={1} align={'flex-start'}>
            <Text fontWeight="bold" fontSize="lg">
              {parkData.text}
            </Text>
            <Text fontSize="sm" color={textColor}>
              <MapPin weight="fill" style={{ display: "inline" }} /> {parkData.notes}
            </Text>

            <Badge colorScheme={listData?.backgroundColour || 'green'}>
            <Calendar weight="fill" style={{ display: "inline" }} />
            {" "}
            {new Date(parkData.date).toLocaleDateString()}
          </Badge>
          </VStack>
          
        </HStack>
        <HStack>
        
          <IconButton
            icon={isOpen ? <CaretUp /> : <CaretDown />}
            onClick={onToggle}
            aria-label="Toggle details"
            variant="ghost"
            size="sm"
          />
 
        </HStack>
      </HStack>
      <Collapse in={isOpen}>
        <VStack align="stretch" mt={4} spacing={2}>
          <HStack>
            <EmojiPicker
              value={parkData.emoji}
              onChange={(emoji) => updatePark({ emoji })}
            />
            <Input
              value={parkData.text}
              onChange={(e) => updatePark({ text: e.target.value })}
              placeholder="Park name"
            />
          </HStack>
          <Input
            value={parkData.notes}
            onChange={(e) => updatePark({ notes: e.target.value })}
            placeholder="Location"
          />
          <Input
            type="date"
            value={parkData.date}
            onChange={(e) => updatePark({ date: e.target.value })}
          />
        <IconButton
            icon={<Trash />}
            onClick={deletePark}
            aria-label="Delete park"
            colorScheme="red"
            variant="ghost"
            size="sm"
          />
        </VStack>
      </Collapse>
    </Box>
  );
});
ParkCard.displayName = "ParkCard";

const AddParkModal = ({ isOpen, onClose, onAdd, listData }) => {
  const [newPark, setNewPark] = useState({
    text: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
    emoji: "🌳"
  });

  const handleSubmit = () => {
    onAdd(newPark);
    setNewPark({
      text: "",
      notes: "",
      date: new Date().toISOString().split('T')[0],
      emoji: "🌳"
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Park</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Park Icon</FormLabel>
              <EmojiPicker
                value={newPark.emoji}
                onChange={(emoji) => setNewPark({ ...newPark, emoji })}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Park Name</FormLabel>
              <Input
                value={newPark.text}
                onChange={(e) => setNewPark({ ...newPark, text: e.target.value })}
                placeholder="Enter park name"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Location</FormLabel>
              <Input
                value={newPark.notes}
                onChange={(e) => setNewPark({ ...newPark, notes: e.target.value })}
                placeholder="Enter location"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Date Visited</FormLabel>
              <Input
                type="date"
                value={newPark.date}
                onChange={(e) => setNewPark({ ...newPark, date: e.target.value })}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme={listData?.backgroundColour || 'green'} mr={3} onClick={handleSubmit}>
            Add Park
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const ParkLife = ({ listId = "park-life" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.5 });
  const store = useStore();
  const listData = useRow("lists", listId);
  const parkIds = useLocalRowIds("todoList", listId) || [];

  const addPark = useAddRowCallback(
    "todos",
    (park) => ({
      text: park.text,
      notes: park.notes,
      date: park.date,
      list: listId,
      emoji: park.emoji
    }),
    [listId],
    undefined,
    (store, rowId) => {
      if (rowId) {
        playAdd();
      }
    }
  );

  const bgGradient = useColorModeValue(
    `linear-gradient(180deg, ${listData?.backgroundColour || 'green'}.50 0%, white 100%)`,
    `linear-gradient(180deg, #1a3d2a 0%, #1A202C 100%)`
  );
  const textColor = useColorModeValue(`${listData?.backgroundColour || 'green'}.900`, `${listData?.backgroundColour || 'green'}.100`);
  const headerColor = useColorModeValue(`${listData?.backgroundColour || 'green'}.700`, `${listData?.backgroundColour || 'green'}.200`);
  const subTextColor = useColorModeValue(`${listData?.backgroundColour || 'green'}.500`, `${listData?.backgroundColour || 'green'}.300`);

  const progressLabel = useMemo(() => {
    if (parkIds.length === 0) return "Head to the park! 🌳";
    if (parkIds.length <= 3) return "Packing for the park 🧺";
    return "Park day sorted! 🌿";
  }, [parkIds.length]);

  return (
    <Box
      maxWidth="600px"
      margin="auto"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xl"
      bgGradient={bgGradient}
    >
      <VStack spacing={4} align="stretch" p={5}>
        <HStack justify="space-between" align="center">
          <HStack>
            <Box
              as={motion.div}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <DynamicIcon 
                iconName={listData?.icon || "Tree"} 
                size={32} 
                weight="fill"
                color={`${listData?.backgroundColour || 'green'}.500`}
              />
            </Box>
            <Text fontSize="3xl" fontWeight="bold" color={textColor}>
              {listData?.name || "Park Life"}
            </Text>
          </HStack>
          <Button
            leftIcon={<Plus />}
            onClick={onOpen}
            colorScheme={listData?.backgroundColour || 'green'}
            size="sm"
          >
            Add Park
          </Button>
        </HStack>

        <Badge colorScheme={listData?.backgroundColour || 'green'} p={2} borderRadius="md" alignSelf="flex-start">
          {progressLabel}
        </Badge>

        <VStack spacing={3} align="stretch">
          <AnimatePresence>
            {parkIds.map((id) => (
              <ParkCard key={id} id={id} listData={listData} />
            ))}
          </AnimatePresence>
          {parkIds.length === 0 && (
            <VStack py={8} spacing={3}>
              <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <Text fontSize="5xl">🌳</Text>
              </Box>
              <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">No park items yet</Text>
              <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add everything you need for a perfect park day</Text>
            </VStack>
          )}
        </VStack>
      </VStack>

      <AddParkModal isOpen={isOpen} onClose={onClose} onAdd={addPark} listData={listData} />
    </Box>
  );
};

export default ParkLife;

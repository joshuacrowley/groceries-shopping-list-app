import React, { useState, useCallback, useMemo, memo } from "react";
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
  useCreateQueries,
  useResultCell,
} from "tinybase/ui-react";
import { createQueries } from "tinybase";
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
  Flex,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Collapse,
  useDisclosure,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  NotePencil,
  Check,
  X,
  CalendarCheck,
  User,
  UsersThree,
  Baby,
  CaretDown,
  CaretUp,
  Confetti,
  Plus,
} from "@phosphor-icons/react";
import DynamicIcon from "@/components/catalogue/DynamicIcon";
import useSound from "use-sound";

const RSVPItem = memo(({ id }) => {
  const { isOpen, onToggle } = useDisclosure();
  const [playConfirm] = useSound("/sounds/complete/Complete 1.m4a", { volume: 0.5 });
  const [playCancel] = useSound("/sounds/cancel/Cancel 1.m4a", { volume: 0.5 });
  const [playToggle] = useSound("/sounds/notification/Notification 2.m4a", { volume: 0.3 });

  const rsvpData = useRow("todos", id);

  const updateRSVP = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...rsvpData, ...updates }),
    [rsvpData]
  );

  const deleteRSVP = useDelRowCallback("todos", id);

  const handleConfirmChange = useCallback(() => {
    const newStatus = !rsvpData.done;
    updateRSVP({ done: newStatus });
    if (newStatus) {
      playConfirm();
    } else {
      playCancel();
    }
  }, [updateRSVP, rsvpData.done, playConfirm, playCancel]);

  const handleDelete = useCallback(() => {
    deleteRSVP();
    playCancel();
  }, [deleteRSVP, playCancel]);

  const handleAdultsChange = useCallback(
    (value) => {
      updateRSVP({ number: parseInt(value, 10) || 0 });
    },
    [updateRSVP]
  );

  const handleChildrenChange = useCallback(
    (value) => {
      updateRSVP({ amount: parseInt(value, 10) || 0 });
    },
    [updateRSVP]
  );

  const handleNotesChange = useCallback(
    (e) => {
      updateRSVP({ notes: e.target.value });
    },
    [updateRSVP]
  );

  const bgColor = useColorModeValue(
    rsvpData.done ? "green.50" : "white",
    rsvpData.done ? "green.900" : "gray.700"
  );
  const borderColor = useColorModeValue(
    rsvpData.done ? "green.200" : "gray.200",
    rsvpData.done ? "green.700" : "gray.600"
  );
  
  const textColor = useColorModeValue("gray.800", "white");

  return (
    <Box
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={4}
      borderRadius="md"
      boxShadow="sm"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <VStack spacing={2} align="stretch">
        <HStack justifyContent="space-between">
          <HStack>
            <IconButton
              icon={rsvpData.done ? <Check weight="bold" /> : <X weight="bold" />}
              onClick={handleConfirmChange}
              aria-label={rsvpData.done ? "Confirmed" : "Not confirmed"}
              colorScheme={rsvpData.done ? "green" : "gray"}
              size="sm"
            />
            <Text fontWeight="bold" fontSize="lg" color={textColor}>
              {rsvpData.text}
            </Text>
            <Badge colorScheme={rsvpData.done ? "green" : "gray"}>
              {rsvpData.done ? "Confirmed" : "Pending"}
            </Badge>
          </HStack>
          
          <HStack>
            <IconButton
              icon={isOpen ? <CaretUp /> : <CaretDown />}
              onClick={() => {
                onToggle();
                playToggle();
              }}
              aria-label="Toggle details"
              size="sm"
              variant="ghost"
            />
            <IconButton
              icon={<Trash weight="bold" />}
              onClick={handleDelete}
              aria-label="Delete RSVP"
              size="sm"
              colorScheme="red"
              variant="ghost"
            />
          </HStack>
        </HStack>

        <HStack>
          <InputGroup size="sm" maxW="140px">
            <InputLeftElement pointerEvents="none">
              <User size={16} color={useColorModeValue("gray.500", "gray.300")} />
            </InputLeftElement>
            <NumberInput
              value={rsvpData.number || 0}
              onChange={handleAdultsChange}
              min={0}
              max={10}
              size="sm"
            >
              <NumberInputField pl="30px" placeholder="Adults" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>

          <InputGroup size="sm" maxW="140px">
            <InputLeftElement pointerEvents="none">
              <Baby size={16} color={useColorModeValue("gray.500", "gray.300")} />
            </InputLeftElement>
            <NumberInput
              value={rsvpData.amount || 0}
              onChange={handleChildrenChange}
              min={0}
              max={10}
              size="sm"
            >
              <NumberInputField pl="30px" placeholder="Children" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>

          <Text fontSize="sm" fontWeight="medium">
            Total: {(rsvpData.number || 0) + (rsvpData.amount || 0) + 1} people
          </Text>
        </HStack>

        <Collapse in={isOpen} animateOpacity>
          <Box mt={2}>
            <Text mb={1} fontSize="sm" fontWeight="medium">
              <NotePencil size={16} style={{ display: "inline", marginRight: "4px" }} />
              Notes:
            </Text>
            <Textarea
              value={rsvpData.notes || ""}
              onChange={handleNotesChange}
              placeholder="Add notes here (allergies, special needs, etc.)"
              size="sm"
              rows={3}
            />
          </Box>
        </Collapse>
      </VStack>
    </Box>
  );
});
RSVPItem.displayName = "RSVPItem";

const AddRSVPModal = ({ isOpen, onClose, onAdd, listData }) => {
  const [name, setName] = useState("");
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd({
        text: name.trim(),
        number: adults,
        amount: children,
        notes: notes,
        done: false,
      });
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setName("");
    setAdults(0);
    setChildren(0);
    setNotes("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Guest</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <Box width="100%">
              <Text mb={1}>Child's Name</Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
              />
            </Box>
            
            <HStack width="100%">
              <Box width="50%">
                <Text mb={1}>Adults</Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <User size={18} color={useColorModeValue("gray.500", "gray.300")} />
                  </InputLeftElement>
                  <NumberInput
                    value={adults}
                    onChange={(_, valueAsNumber) => setAdults(valueAsNumber)}
                    min={0}
                    max={10}
                    width="100%"
                  >
                    <NumberInputField pl="35px" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </InputGroup>
              </Box>
              
              <Box width="50%">
                <Text mb={1}>Additional Children</Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Baby size={18} color={useColorModeValue("gray.500", "gray.300")} />
                  </InputLeftElement>
                  <NumberInput
                    value={children}
                    onChange={(_, valueAsNumber) => setChildren(valueAsNumber)}
                    min={0}
                    max={10}
                    width="100%"
                  >
                    <NumberInputField pl="35px" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </InputGroup>
              </Box>
            </HStack>
            
            <Box width="100%">
              <Text mb={1}>Notes</Text>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, special needs, etc."
                rows={3}
              />
            </Box>
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme={listData?.backgroundColour || 'pink'} onClick={handleSubmit}>
            Add Guest
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const KidsPartyRSVP = ({ listId = "kids-party-rsvp" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [playAdd] = useSound("/sounds/complete/Complete 2.m4a", { volume: 0.5 });

  const store = useStore();
  const rsvpIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  // Create queries for summaries
  const queries = useCreateQueries(store, (store) => {
    return createQueries(store)
      .setQueryDefinition(
        "confirmedCount",
        "todos",
        ({ select, where, group }) => {
          select("done");
          where("list", listId);
          where("done", true);
          group("done", "count").as("confirmed");
        }
      )
      .setQueryDefinition(
        "totalAdults",
        "todos",
        ({ select, where, group }) => {
          select("number");
          where("list", listId);
          group("number", "sum").as("adults");
        }
      )
      .setQueryDefinition(
        "totalChildren",
        "todos",
        ({ select, where, group }) => {
          select("amount");
          where("list", listId);
          group("amount", "sum").as("children");
        }
      );
  });

  const confirmedCountCell = useResultCell(
    "confirmedCount",
    "0",
    "confirmed",
    queries
  );
  const confirmedCount = Number(confirmedCountCell) || 0;
  
  const totalAdultsCell = useResultCell(
    "totalAdults",
    "0",
    "adults",
    queries
  );
  const totalAdults = Number(totalAdultsCell) || 0;
  
  const totalChildrenCell = useResultCell(
    "totalChildren",
    "0",
    "children",
    queries
  );
  const totalChildren = Number(totalChildrenCell) || 0;

  // Calculate total attendance (add each child from the RSVP list)
  const totalAttendance = totalAdults + totalChildren + rsvpIds.length;

  // Add new RSVP
  const addRSVP = useAddRowCallback(
    "todos",
    (rsvp) => ({
      ...rsvp,
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
    "linear-gradient(180deg, #FED7E2 0%, white 100%)",
    "linear-gradient(180deg, #521B41 0%, #1A202C 100%)"
  );
  const cardBgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const headerBgColor = useColorModeValue(`${listData?.backgroundColour || 'pink'}.100`, `${listData?.backgroundColour || 'pink'}.800`);
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const headerColor = useColorModeValue(`${listData?.backgroundColour || 'pink'}.600`, `${listData?.backgroundColour || 'pink'}.200`);

  const progressLabel = useMemo(() => {
    if (rsvpIds.length === 0) return "Planning the guest list! 🎈";
    if (rsvpIds.length < 5) return "Party's filling up! 🎉";
    return "Full house! 🏠";
  }, [rsvpIds.length]);

  return (
    <Box
      maxWidth="600px"
      margin="auto"
      p={5}
      background={bgGradient}
      borderRadius="lg"
      boxShadow="lg"
    >
      <VStack spacing={4} align="stretch">
        <Box
          p={4}
          bg={headerBgColor}
          borderRadius="md"
          boxShadow="sm"
        >
          <HStack justifyContent="space-between" alignItems="center">
            <HStack>
              <Box as={motion.div} animate={{ rotate: [0, 5, -5, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}>
                <DynamicIcon 
                  iconName={listData?.icon || "Confetti"} 
                  size={32} 
                  weight="fill"
                  color={`${listData?.backgroundColour || 'pink'}.500`}
                />
              </Box>
              <Text fontSize="2xl" fontWeight="bold">
                {listData?.name || "Kid's Party RSVPs"}
              </Text>
            </HStack>
            <Text fontSize="sm" color={headerColor} fontWeight="medium">
              {progressLabel}
            </Text>
            <Button
              leftIcon={<Plus />}
              colorScheme={listData?.backgroundColour || 'pink'}
              onClick={onOpen}
              size="sm"
            >
              Add Guest
            </Button>
          </HStack>
        </Box>

        <Flex justify="space-between" wrap="wrap" gap={2}>
          <Box
            bg={cardBgColor}
            p={3}
            borderRadius="md"
            boxShadow="sm"
            flex="1"
            minW="150px"
          >
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              <UsersThree size={16} style={{ display: "inline", marginRight: "4px" }} />
              Total Guests
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={`${listData?.backgroundColour || 'pink'}.500`}>
              {totalAttendance}
            </Text>
          </Box>
          
          <Box
            bg={cardBgColor}
            p={3}
            borderRadius="md"
            boxShadow="sm"
            flex="1"
            minW="150px"
          >
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              <Baby size={16} style={{ display: "inline", marginRight: "4px" }} />
              Children
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={`${listData?.backgroundColour || 'pink'}.500`}>
              {rsvpIds.length + totalChildren}
            </Text>
          </Box>
          
          <Box
            bg={cardBgColor}
            p={3}
            borderRadius="md"
            boxShadow="sm"
            flex="1"
            minW="150px"
          >
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              <User size={16} style={{ display: "inline", marginRight: "4px" }} />
              Adults
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={`${listData?.backgroundColour || 'pink'}.500`}>
              {totalAdults}
            </Text>
          </Box>
          
          <Box
            bg={cardBgColor}
            p={3}
            borderRadius="md"
            boxShadow="sm"
            flex="1"
            minW="150px"
          >
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              <CalendarCheck size={16} style={{ display: "inline", marginRight: "4px" }} />
              Confirmed
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={`${listData?.backgroundColour || 'pink'}.500`}>
              {confirmedCount} / {rsvpIds.length}
            </Text>
          </Box>
        </Flex>

        <Divider />

        <Text fontWeight="bold" fontSize="lg">
          Guest List
        </Text>

        <VStack spacing={3} align="stretch">
          <AnimatePresence>
            {rsvpIds.map((id) => (
              <RSVPItem key={id} id={id} />
            ))}
          </AnimatePresence>
          
          {rsvpIds.length === 0 && (
            <VStack py={8} spacing={3}>
              <Box as={motion.div} animate={{ y: [0, -5, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}>
                <Text fontSize="5xl">🎈</Text>
              </Box>
              <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">
                No guests yet — time to start the party!
              </Text>
              <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">
                Add your first guest and watch the celebration come together
              </Text>
            </VStack>
          )}
        </VStack>
      </VStack>

      <AddRSVPModal
        isOpen={isOpen}
        onClose={onClose}
        onAdd={addRSVP}
        listData={listData}
      />
    </Box>
  );
};

export default KidsPartyRSVP;
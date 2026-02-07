import React, { useState, useCallback, useMemo, memo } from "react";
import {
  useStore,
  useCreateQueries,
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
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
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Collapse,
  useDisclosure,
  InputGroup,
  InputLeftAddon,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash,
  CaretDown,
  CaretUp,
  CreditCard,
  PencilSimple,
  Check,
} from "@phosphor-icons/react";
import useSound from "use-sound";

const TYPES = ["Monthly", "Yearly", "Weekly", "Daily"];
const FREQUENCIES = {
  Monthly: 12,
  Yearly: 1,
  Weekly: 52,
  Daily: 365,
};

const SubscriptionItem = memo(({ id }: { id: string }) => {
  const { isOpen, onToggle } = useDisclosure();
  const itemData = useRow("todos", id);
  const updateItem = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...itemData, ...updates }),
    [itemData]
  );
  const deleteItem = useDelRowCallback("todos", id);

  const handleUpdate = useCallback(
    (field, value) => {
      updateItem({ [field]: value });
    },
    [updateItem]
  );

  const bgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const inputBgColor = useColorModeValue("gray.100", "gray.600");

  return (
    <Box
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      opacity={1}
      css={{ transition: "opacity 0.2s, border-color 0.2s" }}
    >
      <HStack justifyContent="space-between">
        <Text fontWeight="bold" color={textColor}>
          {itemData.text}
        </Text>
        <HStack>
          <Badge colorScheme="purple">{TYPES[parseInt(itemData.type) - 1]}</Badge>
          <Text fontWeight="bold" color={textColor}>
            ${itemData.amount.toFixed(2)}
          </Text>
          <IconButton
            icon={isOpen ? <CaretUp /> : <CaretDown />}
            onClick={onToggle}
            aria-label="Toggle subscription details"
            size="sm"
            variant="ghost"
          />
        </HStack>
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <VStack align="stretch" mt={4} spacing={3}>
          <Input
            value={itemData.text}
            onChange={(e) => handleUpdate("text", e.target.value)}
            placeholder="Product name"
            bg={inputBgColor}
          />
          <Select
            value={itemData.type}
            onChange={(e) => handleUpdate("type", e.target.value)}
            bg={inputBgColor}
          >
            {TYPES.map((type, index) => (
              <option key={type} value={index + 1}>
                {type}
              </option>
            ))}
          </Select>
          <InputGroup>
            <InputLeftAddon children="$" />
            <NumberInput
              value={itemData.amount}
              onChange={(valueString) =>
                handleUpdate("amount", parseFloat(valueString))
              }
              min={0}
              precision={2}
              step={0.01}
            >
              <NumberInputField
                bg={inputBgColor}
              />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
          <Button
            leftIcon={<Trash />}
            onClick={deleteItem}
            colorScheme="red"
            size="sm"
          >
            Delete
          </Button>
        </VStack>
      </Collapse>
    </Box>
  );
});
SubscriptionItem.displayName = "SubscriptionItem";

const SubscriptionTracker = ({ listId = "subscription-tracker" }) => {
  const [newItem, setNewItem] = useState({
    text: "",
    type: "1",
    amount: 0,
  });
  const [totalInterval, setTotalInterval] = useState("Monthly");
  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.5 });

  const store = useStore();
  const listData = useRow("lists", listId);
  const itemIds = useLocalRowIds("todoList", listId) || [];

  const queries = useCreateQueries(store, (store) => {
    return createQueries(store).setQueryDefinition(
      "totalAmount",
      "todos",
      ({ select, where }) => {
        select("amount");
        select("type");
        where("list", listId);
      }
    );
  });

  const totalAmountCell = useResultCell("totalAmount", "0", "amount", queries);
  const totalTypeCell = useResultCell("totalAmount", "0", "type", queries);

  const totalAmount = useMemo(() => {
    let total = 0;
    itemIds.forEach((id) => {
      const item = store.getRow("todos", id);
      const frequency = FREQUENCIES[TYPES[parseInt(item.type) - 1]];
      total += (item.amount * frequency) / 12;
    });
    return total;
  }, [itemIds, store, totalAmountCell, totalTypeCell]);

  const addItem = useAddRowCallback(
    "todos",
    (item) => ({
      ...item,
      list: listId,
    }),
    [listId],
    undefined,
    (store, rowId) => {
      if (rowId) {
        setNewItem({ text: "", type: "1", amount: 0 });
        playAdd();
      }
    }
  );

  const handleAddItem = useCallback(() => {
    if (newItem.text.trim() !== "") {
      addItem(newItem);
    }
  }, [addItem, newItem]);

  const bgGradient = useColorModeValue(
    "linear-gradient(180deg, purple.50 0%, white 100%)",
    "linear-gradient(180deg, #2D1B4E 0%, #1A202C 100%)"
  );
  const textColor = useColorModeValue("purple.800", "purple.100");
  const headerColor = useColorModeValue("purple.700", "purple.200");
  const subTextColor = useColorModeValue("purple.500", "purple.300");
  const inputBgColor = useColorModeValue("white", "gray.700");
  const totalBg = useColorModeValue("purple.100", "purple.800");

  const getTotalForInterval = useCallback(
    (interval) => {
      const multiplier = FREQUENCIES[interval] / 12;
      return totalAmount * multiplier;
    },
    [totalAmount]
  );

  const progressLabel = useMemo(() => {
    if (itemIds.length === 0) return "Track your subscriptions! 💳";
    if (itemIds.length <= 3) return "A few subs tracked 📊";
    return "Subscriptions under control! 💰";
  }, [itemIds.length]);

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
        <HStack justifyContent="space-between" alignItems="center">
          <HStack>
            <Box
              as={motion.div}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <CreditCard size={32} color={useColorModeValue("purple.700", "purple.200")} />
            </Box>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              {listData?.name || "Subscription Tracker"}
            </Text>
          </HStack>
          <Badge colorScheme="purple" p={2} borderRadius="md">
            {progressLabel}
          </Badge>
        </HStack>
        <VStack spacing={3}>
          <Input
            value={newItem.text}
            onChange={(e) =>
              setNewItem((prev) => ({ ...prev, text: e.target.value }))
            }
            placeholder="Product name"
            bg={inputBgColor}
          />
          <Select
            value={newItem.type}
            onChange={(e) =>
              setNewItem((prev) => ({ ...prev, type: e.target.value }))
            }
            bg={inputBgColor}
          >
            {TYPES.map((type, index) => (
              <option key={type} value={index + 1}>
                {type}
              </option>
            ))}
          </Select>
          <InputGroup>
            <InputLeftAddon children="$" />
            <NumberInput
              value={newItem.amount}
              onChange={(valueString) =>
                setNewItem((prev) => ({
                  ...prev,
                  amount: parseFloat(valueString),
                }))
              }
              min={0}
              precision={2}
              step={0.01}
            >
              <NumberInputField
                bg={inputBgColor}
              />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
          <Button
            onClick={handleAddItem}
            colorScheme="purple"
            leftIcon={<PencilSimple />}
            size="md"
          >
            Add Subscription
          </Button>
        </VStack>
        <VStack spacing={2} align="stretch">
          <AnimatePresence>
            {itemIds.map((id) => (
              <SubscriptionItem key={id} id={id} />
            ))}
          </AnimatePresence>
        </VStack>

        {itemIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">💳</Text>
            </Box>
            <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">No subscriptions tracked</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add your subscriptions to keep on top of recurring costs</Text>
          </VStack>
        )}

        <Box
          bg={totalBg}
          p={4}
          borderRadius="md"
        >
          <HStack justifyContent="space-between">
            <Text fontWeight="bold" color={textColor}>
              Total:
            </Text>
            <Select
              value={totalInterval}
              onChange={(e) => setTotalInterval(e.target.value)}
              width="120px"
              size="sm"
            >
              {Object.keys(FREQUENCIES).map((interval) => (
                <option key={interval} value={interval}>
                  Per {interval}
                </option>
              ))}
            </Select>
          </HStack>
          <Text fontSize="2xl" fontWeight="bold" color={textColor} mt={2}>
            ${getTotalForInterval(totalInterval).toFixed(2)}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default SubscriptionTracker;

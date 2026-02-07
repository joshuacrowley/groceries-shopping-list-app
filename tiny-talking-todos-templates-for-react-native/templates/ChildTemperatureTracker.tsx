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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash, Thermometer, Clock } from "@phosphor-icons/react";
import useSound from "use-sound";
import DynamicIcon from "@/components/catalogue/DynamicIcon";

const TemperatureReading = memo(({ id }) => {
  const readingData = useRow("todos", id);

  const updateReading = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...readingData, ...updates }),
    [readingData]
  );

  const deleteReading = useDelRowCallback("todos", id);

  const handleTempChange = useCallback(
    (value) => {
      updateReading({ number: parseFloat(value) });
    },
    [updateReading]
  );

  const handleDateTimeChange = useCallback(
    (e) => {
      updateReading({ text: e.target.value });
    },
    [updateReading]
  );

  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("red.700", "red.200");
  const iconColor = useColorModeValue("red.500", "red.300");

  return (
    <HStack
      as={motion.div}
      layout
      width="100%"
      bg={bgColor}
      p={3}
      borderRadius="md"
      boxShadow="sm"
      spacing={4}
      borderColor={useColorModeValue("red.100", "red.700")}
      borderWidth={1}
    >
      <HStack flex={1}>
        <Thermometer size={24} color={iconColor} />
        <NumberInput
          value={readingData.number}
          onChange={handleTempChange}
          min={35}
          max={42}
          step={0.1}
          precision={1}
          width="100px"
        >
          <NumberInputField color={textColor} />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Text color={textColor}>°C</Text>
      </HStack>
      <HStack flex={2}>
        <Clock size={24} color={iconColor} />
        <Input
          type="datetime-local"
          value={readingData.text}
          onChange={handleDateTimeChange}
          color={textColor}
        />
      </HStack>
      <IconButton
        icon={<Trash weight="bold" />}
        onClick={deleteReading}
        aria-label="Delete temperature reading"
        size="sm"
        colorScheme="red"
        variant="ghost"
      />
    </HStack>
  );
});

TemperatureReading.displayName = "TemperatureReading";

const ChildTemperatureTracker = ({ listId }) => {
  const [newTemp, setNewTemp] = useState(37.0);
  const [newDateTime, setNewDateTime] = useState("");

  const readingIds = useLocalRowIds("todoList", listId) || [];
  const store = useStore();

  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });

  const addReading = useAddRowCallback(
    "todos",
    () => ({
      number: newTemp,
      text: newDateTime,
      list: listId,
    }),
    [listId, newTemp, newDateTime],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewTemp(37.0);
        setNewDateTime("");
        playAdd();
      }
    }
  );

  const handleTempChange = useCallback((value) => {
    setNewTemp(parseFloat(value));
  }, []);

  const handleDateTimeChange = useCallback((e) => {
    setNewDateTime(e.target.value);
  }, []);

  const handleAddClick = useCallback(() => {
    if (newDateTime !== "") {
      addReading();
    }
  }, [addReading, newDateTime]);

  const queries = useCreateQueries(store, (store) => {
    return createQueries(store).setQueryDefinition(
      "averageTemp",
      "todos",
      ({ select, where, group }) => {
        select("number");
        where("list", listId);
        group("number", "avg").as("average");
      }
    );
  });

  const averageTempCell = useResultCell("averageTemp", "0", "average", queries);
  const averageTemp = Number(averageTempCell) || 0;

  const listData = useRow("lists", listId);
  const listName = listData?.name || "Temperature Tracker";

  const progressLabel = useMemo(() => {
    const count = readingIds.length;
    if (count === 0) return "Ready to track temps 🌡️";
    if (count <= 3) return "Monitoring... 📊";
    return "Good tracking! 👍";
  }, [readingIds.length]);

  const bgGradient = useColorModeValue(
    `linear(to-br, ${listData?.color || "blue"}.50, ${listData?.color || "blue"}.100)`,
    `linear(to-br, ${listData?.color || "blue"}.900, ${listData?.color || "blue"}.800)`
  );
  const cardBgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue(`${listData?.color || "blue"}.700`, `${listData?.color || "blue"}.100`);
  const subTextColor = useColorModeValue(`${listData?.color || "blue"}.500`, `${listData?.color || "blue"}.300`);
  const accentColor = useColorModeValue(`${listData?.color || "blue"}.600`, `${listData?.color || "blue"}.300`);

  return (
    <Box
      maxWidth="600px"
      margin="auto"
      p={5}
      bgGradient={bgGradient}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xl"
    >
      <VStack spacing={4} align="stretch">
        <HStack justifyContent="space-between">
          <HStack spacing={3}>
            <Box as={motion.div} animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <DynamicIcon iconName={listData?.icon || "Thermometer"} size={32} weight="fill" color={textColor}/>
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="3xl" fontWeight="bold" color={textColor}>
                {listName}
              </Text>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">{progressLabel}</Text>
            </VStack>
          </HStack>
          <Badge colorScheme={listData?.color || "blue"} fontSize="md" p={2} borderRadius="md">
            Avg: {averageTemp.toFixed(1)}°C
          </Badge>
        </HStack>
        <HStack spacing={4}>
          <NumberInput
            value={newTemp}
            onChange={handleTempChange}
            min={35}
            max={42}
            step={0.1}
            precision={1}
            width="120px"
          >
            <NumberInputField color={textColor} />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Input
            type="datetime-local"
            value={newDateTime}
            onChange={handleDateTimeChange}
            bg={cardBgColor}
            color={textColor}
          />
          <Button onClick={handleAddClick} colorScheme={listData?.color || "blue"} size="md">
            Add
          </Button>
        </HStack>
        <VStack spacing={2} align="stretch">
          <AnimatePresence>
            {readingIds.map((id) => (
              <TemperatureReading key={id} id={id} />
            ))}
          </AnimatePresence>
        </VStack>
        {readingIds.length === 0 && (
          <VStack py={8} spacing={3}>
            <Box as={motion.div} animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
              <Text fontSize="5xl">🌡️</Text>
            </Box>
            <Text textAlign="center" color={textColor} fontWeight="medium" fontSize="lg">No temperature readings yet</Text>
            <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="280px">Add readings to monitor temperature over time</Text>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default ChildTemperatureTracker;

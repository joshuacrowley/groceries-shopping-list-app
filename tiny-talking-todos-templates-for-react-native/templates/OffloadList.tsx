import React, { useState, useCallback, useMemo, useEffect, createContext, memo } from "react";
import {
  useLocalRowIds,
  useRow,
  useRowIds,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
  useSetValueCallback,
  useStore,
  useValue
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
  Select,
  Badge,
  Heading,
  Card,
  CardBody,
  Textarea,
  Center,
  useDisclosure,
  Collapse,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  UnorderedList,
  ListItem,
  useBreakpointValue
} from "@chakra-ui/react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Trash,
  PencilSimple,
  CaretRight,
  CaretLeft,
  Microphone,
  CaretDown,
  CaretUp,
  ColumnsPlusRight,
} from "@phosphor-icons/react";
import { Sparkle } from "@phosphor-icons/react";
import DynamicIcon from "@/components/catalogue/DynamicIcon";
import getCatalogueItem from "@/utils/catalogueUtils";
import { ThinkNow } from "@/components/chat/ThinkNow";
import StreamToggle from "@/components/stream-toggle/StreamToggle";
import useSound from "use-sound";


const CreateListModal = ({ isOpen, onClose, templateName, onListCreated }) => {
  const [name, setName] = useState("");
  const store = useStore();
  const catalogueItem = templateName ? getCatalogueItem(templateName) : null;

  const handleCreate = useCallback(() => {
    const newListId = `${templateName}-${Date.now()}`;
    store.setRow("lists", newListId, {
      name,
      systemPrompt: catalogueItem?.systemPrompt,
      purpose: catalogueItem?.purpose,
      number: catalogueItem?.number,
      template: templateName,
      type: catalogueItem?.type || "Food",
      icon: catalogueItem?.icon || "ListChecks",
      backgroundColour: catalogueItem?.backgroundColour || "blue",
    });
    onListCreated(newListId);
    onClose();
  }, [store, name, templateName, catalogueItem, onListCreated, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={2}>
            {catalogueItem && (
              <DynamicIcon 
                iconName={catalogueItem.icon} 
                size={24} 
                weight="fill"
                color={`${catalogueItem.backgroundColour}.500`} 
              />
            )}
            <Text>Create New {catalogueItem?.name || templateName} List</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder="List name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {catalogueItem?.purpose && (
            <Text mt={2} fontSize="sm" color="gray.500">
              {catalogueItem.purpose}
            </Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button 
            colorScheme={catalogueItem?.backgroundColour || "blue"} 
            mr={3} 
            onClick={handleCreate}
            leftIcon={
              <DynamicIcon 
                iconName={catalogueItem?.icon || "ListChecks"} 
                size={20} 
                weight="fill" 
              />
            }
          >
            Create List
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const OffloadItem = memo(({ id, onEdit, listTable }: { id: string; onEdit: (id: string) => void; listTable: Record<string, any> }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const store = useStore();
  
  const itemData = useRow("todos", id) as {
    text: string;
    notes: string;
    number: number;
    url?: string;
    streetAddress?: string;
    email?: string;
  };

  const deleteItem = useDelRowCallback("todos", id, store);
  const updateItem = useSetRowCallback(
    "todos", 
    id,
    (updates: any) => ({
      text: String(itemData.text || ""),
      notes: String(itemData.notes || ""),
      number: Number(itemData.number || 0),
      url: String(itemData.url || ""),
      streetAddress: String(itemData.streetAddress || ""),
      ...updates
    }),
    [itemData],
    store
  );

  const handleDelete = useCallback(() => {
    deleteItem();
  }, [deleteItem]);

  const findMatchingList = useCallback(() => {
    if (!itemData.streetAddress) return null;
    return Object.entries(listTable || {}).find(([_, list]: [string, any]) => 
      list.template === itemData.streetAddress
    )?.[0] || null;
  }, [itemData.streetAddress, listTable]);

  const matchedListId = useMemo(() => {
    return itemData.url || findMatchingList();
  }, [itemData.url, findMatchingList]);

  const handleListCreated = useCallback((newListId) => {
    updateItem({ ...itemData, url: newListId });
  }, [updateItem, itemData]);

  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const notesColor = useColorModeValue("gray.500", "gray.400");
  const catalogueItem = itemData.streetAddress ? getCatalogueItem(itemData.streetAddress) : null;
  const referencedList = matchedListId ? listTable[matchedListId] as any : null;

  return (
    <Reorder.Item 
      value={id}
      style={{ 
        listStyle: 'none',
        position: 'relative'
      }}
    >
      <Card 
        bg={bgColor} 
        size="sm" 
        cursor="grab"
        mb={3}
        position="relative"
        zIndex={1}
        borderWidth="1px"
        borderColor={borderColor}
        _hover={{ boxShadow: "md" }}
        css={{ transition: "box-shadow 0.2s" }}
      >
        <CardBody>
          <VStack align="stretch" spacing={3}>
            {referencedList && catalogueItem && (
              <Badge 
                size="sm" 
                colorScheme={catalogueItem.backgroundColour}
                display="flex"
                alignItems="center"
                gap={1}
                width="fit-content"
              >
                <DynamicIcon 
                  iconName={catalogueItem.icon} 
                  size={14} 
                  weight="fill" 
                />
                {referencedList.name}
              </Badge>
            )}
            
            <Text fontSize="md" fontWeight="medium" color={textColor}>
              {itemData.text}
            </Text>

            {itemData.notes && (
              <Text fontSize="sm" color={notesColor}>
                {itemData.notes}
              </Text>
            )}

            {itemData.streetAddress && !referencedList && catalogueItem && (
              <Button
                size="sm"
                colorScheme={catalogueItem.backgroundColour}
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={
                  <DynamicIcon 
                    iconName={catalogueItem.icon} 
                    size={14} 
                    weight="fill" 
                  />
                }
                width="fit-content"
              >
                Create {catalogueItem.name} List
              </Button>
            )}

            <HStack spacing={1} justify="flex-end">
              <IconButton
                icon={<PencilSimple size={16} />}
                onClick={() => onEdit(id)}
                aria-label="Edit item"
                size="xs"
                variant="ghost"
              />
              <IconButton
                icon={<Trash size={16} />}
                onClick={handleDelete}
                aria-label="Delete item"
                size="xs"
                colorScheme="red"
                variant="ghost"
              />
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        templateName={itemData.streetAddress}
        onListCreated={handleListCreated}
      />
    </Reorder.Item>
  );
});
OffloadItem.displayName = "OffloadItem";

const CompletionScreen = ({ onBack, listData }) => (
  <Center minH="60vh">
    <VStack spacing={6}>
      <DynamicIcon 
        iconName={listData?.icon || "ListChecks"} 
        size={64} 
        weight="fill"
        color={`${listData?.backgroundColour || 'blue'}.500`}
      />
      <Heading size="lg">All Done!</Heading>
      <Text fontSize="lg">You've completed reviewing all items.</Text>
      <Button
        size="lg"
        leftIcon={<CaretLeft className="rotate-180" />}
        onClick={onBack}
        colorScheme={listData?.backgroundColour || 'blue'}
        mt={4}
      >
        Back to List
      </Button>
    </VStack>
  </Center>
);

const TipsModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} size="lg">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Tips for a Great Experience</ModalHeader>
      <ModalCloseButton />
      <ModalBody pb={6}>
        <UnorderedList spacing={3}>
          <ListItem>
            Don't hold back - the more you say, the better your suggestions will be
          </ListItem>
          <ListItem>
            If you have questions about items on other lists as you go, don't break your flow - 
            just hit the Ask question button
          </ListItem>
          <ListItem>
            Use the "Don't interrupt" button when you need time to think - 
            the operator won't take any actions until you click again
          </ListItem>
        </UnorderedList>
      </ModalBody>
    </ModalContent>
  </Modal>
);

const OffloadMode = ({ 
  items, 
  onBack, 
  listTable, 
  listId,
  currentItem,
  setCurrentItem,
  isComplete,
  setIsComplete
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const store = useStore();
  const { isOpen: isTipsOpen, onOpen: onTipsOpen, onClose: onTipsClose } = useDisclosure();
  const setIsMuted = useSetValueCallback(
    'isMuted',
    (isMuted: boolean) => isMuted,
    [],
    'tempStore'
  );

  
  
  const setShowSecondary = useSetValueCallback(
    "showSecondary",
    (show: boolean) => show,
    [],
    "deskStore"
  );

  const setSecondaryList = useSetValueCallback(
    "secondaryList",
    (listId: string | null) => listId,
    [],
    "deskStore"
  );

  const setListType = useSetValueCallback(
    "listType",
    (listType) => listType,
    [],
    "tempStore"
  );

  const findMatchingList = useCallback((templateName: string) => {
    if (!templateName || !listTable) return null;
    
    const matchingListEntry = Object.entries(listTable).find(([_, list]: [string, any]) => 
      list.template === templateName
    );
    
    return matchingListEntry ? matchingListEntry[0] : null;
  }, [listTable]);

  useEffect(() => {
    const currentItemData = items[currentItem];
    if (currentItemData) {
      if (currentItemData.url) {
        setShowSecondary(true);
        setSecondaryList(currentItemData.url);
        const referencedList = listTable[currentItemData.url];
        if (referencedList?.type) {
          setListType(referencedList.type);
        }
      } 
      else if (currentItemData.streetAddress) {
        const matchedListId = findMatchingList(currentItemData.streetAddress);
        if (matchedListId) {
          setShowSecondary(true);
          setSecondaryList(matchedListId);
          const matchedList = listTable[matchedListId];
          if (matchedList?.type) {
            setListType(matchedList.type);
          }
        } else {
          setShowSecondary(false);
          setSecondaryList(null);
          
        }
      } 
      else {
        setShowSecondary(false);
        setSecondaryList(null);
        
      }
    }
  }, [currentItem, items, findMatchingList, setShowSecondary, setSecondaryList, listTable, setListType]);

  const handleNext = useCallback(() => {
    if (currentItem < items.length - 1) {
      setCurrentItem(currentItem + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentItem, items.length]);

  const handleListCreated = useCallback((newListId) => {
    const currentItemData = items[currentItem];
    store.setRow("todos", currentItemData.id, {
      ...currentItemData,
      url: newListId
    });
    setShowSecondary(true);
    setSecondaryList(newListId);
  }, [items, currentItem, store, setShowSecondary, setSecondaryList]);

  const listData = useRow("lists", listId);


  if (items.length === 0) {
    return null;
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [items]);

  const currentItemData = sortedItems[currentItem];
  const matchedListId = currentItemData?.url || findMatchingList(currentItemData?.streetAddress);
  const referencedList = matchedListId ? listTable[matchedListId] : null;
  const catalogueItem = currentItemData?.streetAddress ? getCatalogueItem(currentItemData.streetAddress) : null;

  console.log('Current item data:', currentItemData);

  if (isComplete) {
    return <CompletionScreen onBack={onBack} listData={listData} />;
  }


  return (
    <VStack 
      spacing={8} 
      align="stretch" 
      minH="60vh" 
      bg="white" 
      p={8} 
      borderRadius="lg" 
      maxW="800px" 
      mx="auto"
      borderWidth="1px"
      borderColor={`${currentItemData?.category ? listTable[matchedListId]?.backgroundColour || 'blue' : 'blue'}.200`}
    >
      <HStack justify="space-between">
        <HStack>
          <IconButton
            icon={<CaretLeft className="rotate-180" />}
            onClick={onBack}
            aria-label="Back to list"
            variant="ghost"
            colorScheme={listTable[matchedListId]?.backgroundColour || 'blue'}
          />
          <Badge 
            colorScheme={listTable[matchedListId]?.backgroundColour || 'blue'} 
            p={3} 
            borderRadius="lg" 
            fontSize="lg"
          >
            <HStack spacing={3}>
              <DynamicIcon 
                iconName={listData?.icon || "ListChecks"}
                size={24} 
                weight="fill" 
              />
              {/* <Text>{currentItemData.text}</Text> */}
            </HStack>
          </Badge>
        </HStack>
        <Text fontSize="lg">
          {currentItem + 1} of {items.length}
        </Text>
      </HStack>

      <Card
        as={motion.div}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -100, opacity: 0 }}
        key={currentItemData.id}
        size="lg"
        variant="outline"
        minH="200px"
        maxW="700px"
        mx="auto"
        w="100%"
        borderColor={`${listTable[matchedListId]?.backgroundColour || 'blue'}.200`}
      >
        <CardBody>
          <VStack align="start" spacing={6}>
            <Heading size="lg">{currentItemData.text}</Heading>
            <Text fontSize="lg">{currentItemData.notes}</Text>
            <Box data-testid="think-now-wrapper">
               <ThinkNow
                key={currentItemData.email}
                question={currentItemData.email}
                tooltip="Think about this point"
              />
            </Box>
      

            {referencedList ? (
              <Badge 
                colorScheme={listTable[matchedListId]?.backgroundColour || 'blue'} 
                p={2} 
                borderRadius="md"
              >
                 {referencedList.name}
              </Badge>
            ) : currentItemData.streetAddress && catalogueItem ? (
              <Button
                colorScheme={catalogueItem.backgroundColour}
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={
                  <DynamicIcon 
                    iconName={catalogueItem.icon} 
                    size={20} 
                    weight="fill" 
                  />
                }
              >
                Create {catalogueItem.name} List
              </Button>
            ) : null}
          </VStack>
        </CardBody>
      </Card>

      <Button
        size="lg"
        rightIcon={<CaretRight />}
        onClick={handleNext}
        colorScheme={listTable[matchedListId]?.backgroundColour || 'blue'}
        maxW="300px"
        mx="auto"
        w="100%"
      >
        Next
      </Button>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        templateName={currentItemData?.streetAddress}
        onListCreated={handleListCreated}
      />
    </VStack>
  );
};

const ReorderableItem = Reorder.Item as unknown as React.FC<{
  value: string;
  children: React.ReactNode;
}>;

const CreateListContext = createContext({
  onCreateList: (templateName: string) => {},
});

const OffloadList = ({ listId }) => {
  const store = useStore();
  const listData = useRow("lists", listId);
  const listRowIds = useRowIds("lists");
  const listTable = useMemo(() => {
    const table: Record<string, any> = {};
    (listRowIds || []).forEach((id) => {
      table[id] = store?.getRow("lists", id);
    });
    return table;
  }, [listRowIds, store]);
  const showSecondary = useValue("showSecondary", "deskStore");

  const [playAdd] = useSound("/sounds/notification/Notification 1.m4a", { volume: 0.4 });

  const [currentItem, setCurrentItem] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [createListTemplate, setCreateListTemplate] = useState<string | null>(null);

  const { isOpen: isInputsOpen, onToggle: onInputsToggle } = useDisclosure();
  const { isOpen: isTipsOpen, onOpen: onTipsOpen, onClose: onTipsClose } = useDisclosure();
  const [editingId, setEditingId] = useState(null);
  const [isOffloadMode, setIsOffloadMode] = useState(false);
  const [newItem, setNewItem] = useState({ 
    text: "", 
    notes: "", 
    url: "",
    email: "",
    number: 0
  });

  interface TodoItem {
    id: string;
    text: string;
    notes: string;
    number: number;
    url?: string;
    streetAddress?: string;
    category?: string;
    email?: string;
  }

  const [items, setItems] = useState<TodoItem[]>([]);
  const [localTodoIds, setLocalTodoIds] = useState<string[]>([]);
  
  const todoIds = useLocalRowIds("todoList", listId) || [];
  
  useEffect(() => {
    const newItems = todoIds.map((id): TodoItem => {
      const row = store.getRow("todos", id);
      return {
        id,
        text: String(row.text || ""),
        notes: String(row.notes || ""),
        number: Number(row.number || 0),
        url: String(row.url || ""),
        streetAddress: String(row.streetAddress || ""),
        category: String(row.category || ""),
        email: String(row.email || "")
      };
    }).sort((a, b) => a.number - b.number);
    
    setItems(newItems);
    setLocalTodoIds(newItems.map(item => item.id));
  }, [todoIds, store]);

  const lists = useMemo(() => {
    if (!listTable) return [];
    return Object.entries(listTable).map(([id, list]) => ({
      id,
      ...list
    }));
  }, [listTable]);

  const addItem = useAddRowCallback(
    "todos",
    (item: { text: string; notes: string; url: string; email: string }) => ({
      text: item.text,
      notes: item.notes,
      url: item.url,
      email: item.email,
      number: items.length,
      list: listId,
    }),
    [listId, items.length]
  );

  const handleSubmit = useCallback(() => {
    if (newItem.text.trim()) {
      if (editingId) {
        store.setRow("todos", editingId, {
          ...store.getRow("todos", editingId),
          text: newItem.text,
          notes: newItem.notes,
          url: newItem.url,
          email: newItem.email,
          number: newItem.number
        });
      } else {
        addItem(newItem);
        playAdd();
      }
      setNewItem({ text: "", notes: "", url: "", email: "", number: 0 });
      setEditingId(null);
    }
  }, [addItem, newItem, editingId, store, playAdd]);

  const handleEditItem = useCallback(
    (id: string) => {
      const item = store.getRow("todos", id);
      setNewItem({
        text: String(item.text || ""),
        notes: String(item.notes || ""),
        url: String(item.url || ""),
        email: String(item.email || ""),
        number: Number(item.number || 0)
      });
      setEditingId(id);
      onInputsToggle();
    },
    [store, onInputsToggle]
  );

  const setListType = useSetValueCallback(
    "listType",
    (listType) => listType,
    [],
    "tempStore"
  );

  const setIsMuted = useSetValueCallback(
    'isMuted',
    (isMuted: boolean) => isMuted,
    [],
    'tempStore'
  );

  const setShowSecondary = useSetValueCallback(
    "showSecondary",
    (show: boolean) => show,
    [],
    "deskStore"
  );

  const setSecondaryList = useSetValueCallback(
    "secondaryList",
    (listId: string | null) => listId,
    [],
    "deskStore"
  );

  const findMatchingList = useCallback((templateName: string) => {
    if (!templateName || !listTable) return null;
    
    const matchingListEntry = Object.entries(listTable).find(([_, list]: [string, any]) => 
      list.template === templateName
    );
    
    return matchingListEntry ? matchingListEntry[0] : null;
  }, [listTable]);

  const handleNext = useCallback(() => {
    if (currentItem < items.length - 1) {
      setCurrentItem(currentItem + 1);
    } else {
      setIsComplete(true);
    }
  }, [currentItem, items.length]);

  const handleListCreated = useCallback((newListId) => {
    const currentItemData = items[currentItem];
    store.setRow("todos", currentItemData.id, {
      ...currentItemData,
      url: newListId
    });
    setShowSecondary(true);
    setSecondaryList(newListId);
  }, [items, currentItem, store, setShowSecondary, setSecondaryList]);

  const updateTodoOrder = useSetRowCallback(
    "todoList",
    listId,
    (orderUpdate: any) => orderUpdate,
    [],
    store
  );

  const handleReorder = useCallback((newOrder: string[]) => {
    console.log('Reordering...', newOrder);
    setLocalTodoIds(newOrder);
    
    const newItems = newOrder.map((id, index) => {
      const item = items.find(item => item.id === id)!;
      return { ...item, number: index };
    });
    setItems(newItems);
  }, [items]);

  const handleReorderEnd = useCallback(() => {
    console.log('Reorder ended, saving to store...');
    
    store.transaction(() => {
      localTodoIds.forEach((id, index) => {
        store.setRow("todos", id, {
          ...store.getRow("todos", id),
          number: index
        });
      });

      const orderUpdate = localTodoIds.reduce((acc, id, index) => {
        acc[index] = id;
        return acc;
      }, {} as Record<number, string>);
      
      store.setRow("todoList", listId, orderUpdate);
    });
  }, [store, listId, localTodoIds]);

  const handleCreateList = useCallback((templateName: string) => {
    setCreateListTemplate(templateName);
  }, []);

  if (isOffloadMode) {
    return (
      <OffloadMode 
        items={items} 
        onBack={() => {
          setIsOffloadMode(false);
          setCurrentItem(0);
          setIsComplete(false);
        }}
        listTable={listTable}
        listId={listId}
        currentItem={currentItem}
        setCurrentItem={setCurrentItem}
        isComplete={isComplete}
        setIsComplete={setIsComplete}
      />
    );
  }

  const color = String(listData?.backgroundColour || "blue");
  const bgGradient = useColorModeValue(
    `linear-gradient(180deg, ${color === "blue" ? "#EBF4FF" : color === "green" ? "#F0FFF4" : color === "purple" ? "#FAF5FF" : color === "orange" ? "#FFFAF0" : color === "red" ? "#FFF5F5" : color === "cyan" ? "#E0F7FA" : color === "yellow" ? "#FFFFF0" : color === "pink" ? "#FFF5F7" : "#EBF4FF"} 0%, white 100%)`,
    `linear-gradient(180deg, ${color === "blue" ? "#1a365d" : color === "green" ? "#1a3a2a" : color === "purple" ? "#2d1a4e" : color === "orange" ? "#3d2a1a" : color === "red" ? "#3d1a1a" : color === "cyan" ? "#1a3a3d" : color === "yellow" ? "#3d3a1a" : color === "pink" ? "#3d1a2a" : "#1a365d"} 0%, #1A202C 100%)`
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const headerColor = useColorModeValue(`${color}.700`, `${color}.200`);
  const subTextColor = useColorModeValue(`${color}.500`, `${color}.300`);
  const inputBg = useColorModeValue("white", "gray.700");
  const inputSectionBg = useColorModeValue(`${color}.50`, "gray.700");

  const itemCount = items.length;
  const progressLabel = useMemo(() => {
    if (itemCount === 0) return "Ready to brainstorm? 💭";
    if (itemCount === 1) return "One talking point — just getting started 📝";
    if (itemCount <= 3) return "A few ideas brewing ☕";
    if (itemCount <= 6) return "Solid agenda taking shape 📋";
    if (itemCount <= 10) return "Lots to talk about! 🗣️";
    return "Packed agenda — let's go! 🚀";
  }, [itemCount]);

  return (
    <CreateListContext.Provider value={{ onCreateList: handleCreateList }}>
      <Box 
        maxW="800px" 
        mx="auto" 
        borderRadius="xl" 
        overflow="hidden"
        boxShadow="xl"
        bgGradient={bgGradient}
        position="relative"
      >
        {/* Decorative sparkle dots */}
        <Box position="absolute" top="12%" right="8%" opacity={0.15} pointerEvents="none">
          <Sparkle size={20} weight="fill" />
        </Box>
        <Box position="absolute" top="25%" left="5%" opacity={0.1} pointerEvents="none">
          <Sparkle size={14} weight="fill" />
        </Box>
        <Box position="absolute" bottom="15%" right="12%" opacity={0.12} pointerEvents="none">
          <Sparkle size={16} weight="fill" />
        </Box>

        <VStack spacing={6} align="stretch" p={6}>
          {/* Header */}
          <VStack align="center" spacing={2} pt={2}>
            <Box
              as={motion.div}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <DynamicIcon 
                iconName={String(listData?.icon || "ListChecks")} 
                size={36} 
                weight="fill"
              />
            </Box>
            <Heading size="lg" color={headerColor}>
              {String(listData?.name || "List")}
            </Heading>
            <HStack spacing={2}>
              <Badge colorScheme={color} fontSize="xs" px={2} py={0.5} borderRadius="full">
                {itemCount} {itemCount === 1 ? "point" : "points"}
              </Badge>
              <Text fontSize="xs" color={subTextColor} fontStyle="italic">
                {progressLabel}
              </Text>
            </HStack>
          </VStack>

          <VStack justify="center" spacing={2}>
            <Button
              size="lg"
              height="16"
              colorScheme={color}
              width={250}
              leftIcon={<ColumnsPlusRight weight="fill" size={24} />}
              onClick={() => {
                setListType(listData?.type || "Food");
                setIsOffloadMode(true);
                if(showSecondary){
                  // setIsMuted(false);
                }
              }}
              display={showSecondary ? "none" : "flex"}
            >
              Show List
            </Button>

            {showSecondary && (
              <StreamToggle
              key="StreamToggle" 
                onStart={() => {
                  setListType(listData?.type || "Food");
                  setIsOffloadMode(true);
                }}
                onStop={() => {
                  setIsOffloadMode(false);
                  setCurrentItem(0);
                  setIsComplete(false);
                }}
                size="lg"
                tooltipLabel="Start conversation"
              />
            )}
          </VStack>

          {/* Items list */}
          {items.length > 0 ? (
            <VStack spacing={3} align="stretch">
              <Reorder.Group
                axis="y"
                values={localTodoIds}
                onReorder={handleReorder}
                onDragEnd={handleReorderEnd}
                layoutScroll
                style={{ 
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}
              >
                <AnimatePresence>
                  {items.map((item) => (
                    <OffloadItem 
                      key={item.id} 
                      id={item.id} 
                      onEdit={handleEditItem}
                      listTable={listTable}
                    />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            </VStack>
          ) : (
            <VStack py={8} spacing={3}>
              <Box
                as={motion.div}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <DynamicIcon 
                  iconName={String(listData?.icon || "ListChecks")} 
                  size={48} 
                  weight="duotone"
                />
              </Box>
              <Text textAlign="center" color={headerColor} fontWeight="medium" fontSize="lg">
                No talking points yet
              </Text>
              <Text textAlign="center" color={subTextColor} fontSize="sm" maxW="300px">
                Add some items below to build your agenda, then step through them one at a time
              </Text>
            </VStack>
          )}

          {/* Add item section */}
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between">
              <Text fontWeight="medium" color={headerColor}>Add Talking Point</Text>
              <IconButton
                icon={isInputsOpen ? <CaretUp /> : <CaretDown />}
                onClick={onInputsToggle}
                aria-label="Toggle inputs"
                variant="ghost"
                size="sm"
              />
            </HStack>

            <Collapse in={isInputsOpen}>
              <VStack spacing={4} align="stretch" p={4} bg={inputSectionBg} borderRadius="lg">
                <Input
                  placeholder="Add a new item..."
                  value={newItem.text}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, text: e.target.value }))
                  }
                  bg={inputBg}
                  borderRadius="md"
                />
                <Textarea
                  placeholder="Additional notes..."
                  value={newItem.notes}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  bg={inputBg}
                  borderRadius="md"
                />
                <Select
                  value={newItem.url}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="Reference a list (optional)"
                  bg={inputBg}
                  borderRadius="md"
                >
                  {lists.map((list: any) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </Select>
                <Textarea
                  placeholder="Think prompt (optional) - What would you like to know about this point?"
                  value={newItem.email}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, email: e.target.value }))
                  }
                  bg={inputBg}
                  borderRadius="md"
                />
                <Button 
                  colorScheme={color} 
                  onClick={handleSubmit}
                  borderRadius="md"
                >
                  {editingId ? "Save Changes" : "Add Item"}
                </Button>
              </VStack>
            </Collapse>
          </VStack>
        </VStack>

        <TipsModal isOpen={isTipsOpen} onClose={onTipsClose} />

        <CreateListModal
          isOpen={createListTemplate !== null}
          onClose={() => setCreateListTemplate(null)}
          templateName={createListTemplate}
          onListCreated={handleListCreated}
        />
      </Box>
    </CreateListContext.Provider>
  );
};

export default OffloadList;
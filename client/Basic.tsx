import React, { useState, useCallback } from "react";
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
} from "tinybase/ui-react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { randomUUID } from "expo-crypto";

const TodoItem = ({ id }) => {
  const todoData = useRow("todos", id);

  const updateTodo = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...todoData, ...updates }),
    [todoData]
  );

  const deleteTodo = useDelRowCallback("todos", id);

  const handleToggle = useCallback(() => {
    updateTodo({ done: !todoData.done });
  }, [updateTodo, todoData.done]);

  const handleDelete = useCallback(() => {
    deleteTodo();
  }, [deleteTodo]);

  return (
    <View style={styles.todoItem}>
      <Pressable onPress={handleToggle} style={styles.checkbox}>
        {todoData.done ? (
          <Feather name="check-square" size={20} color="#4CAF50" />
        ) : (
          <Feather name="square" size={20} color="#757575" />
        )}
      </Pressable>
      <Text 
        style={[styles.todoText, todoData.done && styles.todoTextDone]}
      >
        {todoData.text}
      </Text>
      <Pressable onPress={handleDelete} style={styles.deleteButton}>
        <Feather name="trash-2" size={20} color="#F44336" />
      </Pressable>
    </View>
  );
};

const TodoList = ({ listId }) => {
  const [newTodo, setNewTodo] = useState("");

  const listData = useRow("lists", listId);
  const todoIds = useLocalRowIds("todoList", listId) || [];

  const addTodo = useAddRowCallback(
    "todos",
    (text) => ({
      text: text.trim(),
      done: false,
      list: listId,
    }),
    [listId],
    undefined,
    (rowId) => {
      if (rowId) {
        setNewTodo("");
      }
    }
  );

  const handleInputChange = useCallback((text) => {
    setNewTodo(text);
  }, []);

  const handleAddClick = useCallback(() => {
    if (newTodo.trim() !== "") {
      addTodo(newTodo);
    }
  }, [addTodo, newTodo]);

  // Get background color from the list or default to blue
  const bgColor = listData?.backgroundColour || "blue";
  const colorMap = {
    blue: "#E3F2FD",
    green: "#E8F5E9",
    red: "#FFEBEE",
    yellow: "#FFF8E1",
    purple: "#F3E5F5"
  };
  
  const backgroundColor = colorMap[bgColor] || colorMap.blue;
  const textColor = bgColor === "yellow" ? "#5D4037" : "#2196F3";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>
          {listData?.name || "Todo List"}
        </Text>
        <Text style={[styles.count, { color: textColor }]}>
          Total: {todoIds.length}
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          value={newTodo}
          onChangeText={handleInputChange}
          placeholder="Add a new task"
          style={styles.input}
          onSubmitEditing={handleAddClick}
        />
        <Pressable onPress={handleAddClick} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>
      <ScrollView style={styles.todoList}>
        {todoIds.map((id) => (
          <TodoItem key={id} id={id} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 500,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  count: {
    fontSize: 14,
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: "#2196F3",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  todoList: {
    marginTop: 8,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    padding: 4,
  },
  todoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#212121",
  },
  todoTextDone: {
    textDecorationLine: "line-through",
    color: "#9E9E9E",
  },
  deleteButton: {
    padding: 4,
  },
});

export default TodoList;
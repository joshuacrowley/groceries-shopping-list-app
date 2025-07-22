import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore, useRowIds, useRow, useAddRowCallback } from 'tinybase/ui-react';
import { randomUUID } from 'expo-crypto';

export default function TestScreen() {
  const store = useStore();
  const listIds = useRowIds('lists') || [];
  
  const addTestList = useAddRowCallback(
    'lists',
    () => {
      const id = randomUUID();
      return {
        name: `Test List ${Date.now().toString().slice(-4)}`,
        purpose: 'A test list created manually',
        backgroundColour: 'blue',
        icon: '🧪',
        type: 'Info',
      };
    }
  );
  
  const addTestTodo = useAddRowCallback(
    'todos',
    (listId) => {
      return {
        list: listId,
        text: `Test Todo ${Date.now().toString().slice(-4)}`,
        done: false,
        type: 'A',
      };
    }
  );
  
  const handleCreateList = () => {
    addTestList();
  };
  
  const handleAddTodo = (listId) => {
    addTestTodo(listId);
  };
  
  const renderList = (listId) => {
    const list = useRow('lists', listId);
    if (!list) return null;
    
    const todoIds = useRowIds('todos') || [];
    const listTodos = todoIds.filter(todoId => {
      const todo = useRow('todos', todoId);
      return todo && todo.list === listId;
    });
    
    return (
      <View key={listId} style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listName}>{list.name} ({list.icon})</Text>
          <Pressable onPress={() => handleAddTodo(listId)} style={styles.addButton}>
            <Text style={styles.buttonText}>Add Todo</Text>
          </Pressable>
        </View>
        
        {listTodos.map(todoId => {
          const todo = useRow('todos', todoId);
          return (
            <View key={todoId} style={styles.todoItem}>
              <Text>{todo.text} - {todo.done ? 'Done' : 'Not Done'}</Text>
            </View>
          );
        })}
        
        {listTodos.length === 0 && (
          <Text style={styles.emptyMessage}>No todos in this list</Text>
        )}
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#2196F3" />
        </Pressable>
        <Text style={styles.title}>Test Data Screen</Text>
      </View>
      
      <Pressable onPress={handleCreateList} style={styles.createButton}>
        <Text style={styles.buttonText}>Create Test List</Text>
      </Pressable>
      
      <ScrollView style={styles.content}>
        {listIds.map(renderList)}
        
        {listIds.length === 0 && (
          <Text style={styles.emptyMessage}>No lists created yet</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  createButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
  },
  todoItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#757575',
    padding: 16,
  },
});
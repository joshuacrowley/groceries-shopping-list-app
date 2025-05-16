import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useRow } from 'tinybase/ui-react';
import TodoList from '@/Basic';

export default function ListDetailScreen() {
  const { listId } = useLocalSearchParams();
  const list = useRow('lists', listId as string);
  
  if (!list) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#2196F3" />
          </Pressable>
          <Text style={styles.title}>List not found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>The requested list couldn't be found.</Text>
          <Pressable 
            style={styles.button} 
            onPress={() => router.push('/(index)')}
          >
            <Text style={styles.buttonText}>Go to Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#2196F3" />
        </Pressable>
        <Text style={styles.title}>{list.name}</Text>
        <Pressable style={styles.menuButton}>
          <Feather name="more-vertical" size={24} color="#757575" />
        </Pressable>
      </View>
      
      <TodoList listId={listId as string} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginLeft: 8,
  },
  menuButton: {
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
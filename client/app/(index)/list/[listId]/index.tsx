import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useRow } from 'tinybase/ui-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TodoList from '@/Basic';
import ShoppingListv2 from '@/templates/ShoppingListv2';
import Today from '@/templates/Today';
import WeeklyMealPlanner from '@/templates/WeeklyMealPlanner';
import WeekendPlanner from '@/templates/WeekendPlanner';
import Recipes from '@/templates/Recipes';
import RecipeCard from '@/templates/RecipeCard';
import PhotoUploader from '@/components/PhotoUploader';

export default function ListDetailScreen() {
  const { listId } = useLocalSearchParams();
  const list = useRow('lists', listId as string);
  const insets = useSafeAreaInsets();
  
  if (!list) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={() => router.push('/(index)')} style={styles.backButton}>
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

  // Template-based rendering
  const renderListTemplate = () => {
    const template = list.template;
    
    switch (template) {
      case 'ShoppingListv2':
        return <ShoppingListv2 listId={listId as string} />;
      case 'Today':
        return <Today listId={listId as string} />;
      case 'WeeklyMealPlanner':
        return <WeeklyMealPlanner listId={listId as string} />;
      case 'WeekendPlanner':
        return <WeekendPlanner listId={listId as string} />;
      case 'Recipes':
        return <Recipes listId={listId as string} />;
      case 'RecipeCard':
        return <RecipeCard listId={listId as string} />;
      default:
        // Fallback to default TodoList for unrecognized templates
        return <TodoList listId={listId as string} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.push('/(index)')} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#2196F3" />
        </Pressable>
        <Text style={styles.title}>{list.name}</Text>
        <PhotoUploader listId={listId as string} />
        <Pressable style={styles.menuButton}>
          <Feather name="more-vertical" size={24} color="#757575" />
        </Pressable>
      </View>
      
      {renderListTemplate()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
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
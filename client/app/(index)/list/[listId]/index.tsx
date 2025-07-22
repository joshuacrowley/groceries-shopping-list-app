import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useRow, useStore, useAddRowCallback } from 'tinybase/ui-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TodoList from '@/Basic';
import ShoppingListv2 from '@/templates/ShoppingListv2';
import Today from '@/templates/Today';
import WeeklyMealPlanner from '@/templates/WeeklyMealPlanner';
import WeekendPlanner from '@/templates/WeekendPlanner';
import Recipes from '@/templates/Recipes';
import RecipeCard from '@/templates/RecipeCard';
import PhotoUploader from '@/components/PhotoUploader';
import Constants from 'expo-constants';

export default function ListDetailScreen() {
  const { 
    listId, 
    generateTodos, 
    fromPhoto, 
    photoAnalysis, 
    templateId,
    systemPrompt 
  } = useLocalSearchParams();
  const list = useRow('lists', listId as string);
  const insets = useSafeAreaInsets();
  const store = useStore();
  
  const [isGeneratingTodos, setIsGeneratingTodos] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  
  const addTodo = useAddRowCallback(
    'todos',
    (todoData: any) => ({
      text: todoData.text || '',
      notes: todoData.notes || '',
      emoji: todoData.emoji || '',
      category: todoData.category || '',
      type: todoData.type || 'A',
      done: todoData.done || false,
      list: listId as string,
      // Add optional fields if present
      ...(todoData.date && { date: todoData.date }),
      ...(todoData.time && { time: todoData.time }),
      ...(todoData.amount && { amount: todoData.amount }),
      ...(todoData.url && { url: todoData.url }),
      ...(todoData.email && { email: todoData.email }),
      ...(todoData.streetAddress && { streetAddress: todoData.streetAddress }),
      ...(todoData.number && { number: todoData.number }),
      ...(todoData.fiveStarRating && { fiveStarRating: todoData.fiveStarRating }),
    }),
    [listId]
  );
  
  useEffect(() => {
    // Generate todos if requested
    if (generateTodos === 'true' && list) {
      generateTodosForList();
    }
  }, [generateTodos, list]);
  
  const generateTodosForList = async () => {
    try {
      setIsGeneratingTodos(true);
      setGenerationMessage('Analyzing your photo and creating todos...');
      
      // Determine API URL
      let apiBaseUrl = '';
      if (__DEV__) {
        const bundleUrl = Constants.experienceUrl;
        if (bundleUrl) {
          try {
            const url = new URL(bundleUrl);
            apiBaseUrl = `http://${url.hostname}:8081`;
          } catch (e) {
            apiBaseUrl = 'http://localhost:8081';
          }
        }
      }
      
      const requestBody = {
        systemPrompt: systemPrompt || list.systemPrompt || '',
        description: list.purpose || '',
        listName: list.name,
        listType: list.type,
        template: templateId || list.template,
        photoData: photoAnalysis || '',
        fromVoice: 'false',
        fromPhoto: fromPhoto || 'false'
      };
      
      console.log('Generating todos with:', requestBody);
      
      const response = await fetch(`${apiBaseUrl}/api/generate-todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate todos: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Generated todos:', result);
      
      if (result.todos && result.todos.length > 0) {
        setGenerationMessage(`Adding ${result.todos.length} todos to your list...`);
        
        // Add todos in a transaction
        store.transaction(() => {
          result.todos.forEach((todo: any) => {
            addTodo(todo);
          });
        });
        
        setGenerationMessage('All done! Your todos have been added.');
        
        // Hide the success message after a short delay
        setTimeout(() => {
          setIsGeneratingTodos(false);
        }, 1500);
      } else {
        throw new Error('No todos were generated');
      }
      
    } catch (error) {
      console.error('Error generating todos:', error);
      Alert.alert(
        'Generation Failed',
        'Unable to generate todos from your photo. You can add todos manually.',
        [{ text: 'OK', onPress: () => setIsGeneratingTodos(false) }]
      );
    }
  };
  
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
      
      {/* Todo Generation Loading Overlay */}
      {isGeneratingTodos && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2196F3" style={styles.loadingSpinner} />
            <Text style={styles.loadingTitle}>Creating your list...</Text>
            <Text style={styles.loadingMessage}>{generationMessage}</Text>
          </View>
        </View>
      )}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, PencilSimple } from 'phosphor-react-native';
import { useRow, useStore, useAddRowCallback } from 'tinybase/ui-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TodoList from '@/Basic';
import ShoppingListv2 from '@/templates/ShoppingListv2';
import Today from '@/templates/Today';
import WeeklyMealPlanner from '@/templates/WeeklyMealPlanner';
import WeekendPlanner from '@/templates/WeekendPlanner';
import Recipes from '@/templates/Recipes';
import RecipeCard from '@/templates/RecipeCard';
import AfterSchoolRoutine from '@/templates/AfterSchoolRoutine';
import Beach from '@/templates/Beach';
import BirthdayTracker from '@/templates/BirthdayTracker';
import CarMaintenance from '@/templates/CarMaintenance';
import ChildTemperatureTracker from '@/templates/ChildTemperatureTracker';
import Clothes from '@/templates/Clothes';
import DateNightList from '@/templates/DateNightList';
import Expiry from '@/templates/Expiry';
import GiveAwayList from '@/templates/GiveAwayList';
import HomeMaintenanceList from '@/templates/HomeMaintenanceList';
import KidsPartyFoodList from '@/templates/KidsPartyFoodList';
import LaundryTracker from '@/templates/LaundryTracker';
import Leftovers from '@/templates/Leftovers';
import LunchPlanner from '@/templates/LunchPlanner';
import MentalLoad from '@/templates/MentalLoad';
import MorningRoutine from '@/templates/MorningRoutine';
import OffloadList from '@/templates/OffloadList';
import ParkLife from '@/templates/ParkLife';
import PartyBags from '@/templates/PartyBags';
import PartyGuestList from '@/templates/PartyGuestList';
import SchoolCalendarTodo from '@/templates/SchoolCalendarTodo';
import SchoolHolidayPlanner from '@/templates/SchoolHolidayPlanner';
import SchoolPickupRoster from '@/templates/SchoolPickupRoster';
import SubscriptionTracker from '@/templates/SubscriptionTracker';
import TidyUp from '@/templates/TidyUp';
import PhotoUploader from '@/components/PhotoUploader';
import { Type } from '@google/genai';
import { callGeminiProxy } from '@/lib/geminiProxy';
import { useAuth } from '@clerk/clerk-expo';

const COLOR_MAP: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: '#ebf8ff', icon: '#2b6cb0' },
  green:  { bg: '#F0FFF4', icon: '#2F855A' },
  red:    { bg: '#FFF5F5', icon: '#C53030' },
  yellow: { bg: '#FFFFF0', icon: '#B7791F' },
  purple: { bg: '#FAF5FF', icon: '#6B46C1' },
  teal:   { bg: '#E6FFFA', icon: '#2C7A7B' },
  orange: { bg: '#FFFAF0', icon: '#C05621' },
  pink:   { bg: '#FFF5F7', icon: '#B83280' },
  cyan:   { bg: '#EDFDFD', icon: '#0987A0' },
  gray:   { bg: '#F7FAFC', icon: '#4A5568' },
};

const DEFAULT_COLORS = { bg: '#ebf8ff', icon: '#2b6cb0' };

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
  const { getToken } = useAuth();
  
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
      
      // Define the response schema for structured output
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          todos: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: "The main text/title of the todo item"
                },
                notes: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Additional notes or details about the todo"
                },
                emoji: {
                  type: Type.STRING,
                  nullable: true,
                  description: "A relevant emoji for the todo"
                },
                category: {
                  type: Type.STRING,
                  nullable: true,
                  description: "The category or grouping for the todo"
                },
                type: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Priority type (A-E)"
                },
                done: {
                  type: Type.BOOLEAN,
                  description: "Whether the todo is completed"
                },
                date: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Date associated with the todo"
                },
                time: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Time associated with the todo"
                },
                url: {
                  type: Type.STRING,
                  nullable: true,
                  description: "URL associated with the todo"
                },
                email: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Email address associated with the todo"
                },
                streetAddress: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Street address associated with the todo"
                },
                number: {
                  type: Type.NUMBER,
                  nullable: true,
                  description: "A numeric value associated with the todo"
                },
                amount: {
                  type: Type.NUMBER,
                  nullable: true,
                  description: "A monetary amount associated with the todo"
                },
                fiveStarRating: {
                  type: Type.NUMBER,
                  nullable: true,
                  description: "A rating from 1 to 5"
                }
              },
              required: ["text", "done"],
              propertyOrdering: ["text", "notes", "emoji", "category", "type", "done", "date", "time", "url", "email", "streetAddress", "number", "amount", "fiveStarRating"]
            }
          }
        },
        required: ["todos"],
        propertyOrdering: ["todos"]
      };
      
      // Build the prompt based on list information
      const prompt = `You are a helpful assistant generating todos for a list.
    
List Information:
- List Name: "${list.name}"
- List Purpose: "${list.purpose}"
- List Template: "${templateId || list.template}"
- Special Instructions: "${systemPrompt || list.systemPrompt || ''}"

Generate relevant, specific, and contextual todo items that match the style and purpose of the current list.

${photoAnalysis ? `Context from photo: ${photoAnalysis}` : ''}`;

      const text = await callGeminiProxy(
        {
          model: 'gemini-2.5-flash',
          contents: [{ text: prompt }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema
          }
        },
        getToken
      );
      
      const result = JSON.parse(text);
      
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
      Alert.alert(
        'Generation Failed',
        'Unable to generate todos from your photo. You can add todos manually.',
        [{ text: 'OK', onPress: () => setIsGeneratingTodos(false) }]
      );
    }
  };
  
  // Derive colors from list's backgroundColour
  const listColor = String(list?.backgroundColour || 'blue');
  const colors = COLOR_MAP[listColor] || DEFAULT_COLORS;

  if (!list) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable onPress={() => router.push('/(index)')} style={styles.headerIcon}>
            <ArrowLeft size={22} color="#4A5568" weight="regular" />
          </Pressable>
          <Text style={styles.errorTitle}>List not found</Text>
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
      case 'AfterSchoolRoutine':
        return <AfterSchoolRoutine listId={listId as string} />;
      case 'Beach':
        return <Beach listId={listId as string} />;
      case 'BirthdayTracker':
        return <BirthdayTracker listId={listId as string} />;
      case 'CarMaintenance':
        return <CarMaintenance listId={listId as string} />;
      case 'ChildTemperatureTracker':
        return <ChildTemperatureTracker listId={listId as string} />;
      case 'Clothes':
        return <Clothes listId={listId as string} />;
      case 'DateNightList':
        return <DateNightList listId={listId as string} />;
      case 'Expiry':
        return <Expiry listId={listId as string} />;
      case 'GiveAwayList':
        return <GiveAwayList listId={listId as string} />;
      case 'HomeMaintenanceList':
        return <HomeMaintenanceList listId={listId as string} />;
      case 'KidsPartyFoodList':
        return <KidsPartyFoodList listId={listId as string} />;
      case 'LaundryTracker':
        return <LaundryTracker listId={listId as string} />;
      case 'Leftovers':
        return <Leftovers listId={listId as string} />;
      case 'LunchPlanner':
        return <LunchPlanner listId={listId as string} />;
      case 'MentalLoad':
        return <MentalLoad listId={listId as string} />;
      case 'MorningRoutine':
        return <MorningRoutine listId={listId as string} />;
      case 'OffloadList':
        return <OffloadList listId={listId as string} />;
      case 'ParkLife':
        return <ParkLife listId={listId as string} />;
      case 'PartyBags':
        return <PartyBags listId={listId as string} />;
      case 'PartyGuestList':
        return <PartyGuestList listId={listId as string} />;
      case 'SchoolCalendarTodo':
        return <SchoolCalendarTodo listId={listId as string} />;
      case 'SchoolHolidayPlanner':
        return <SchoolHolidayPlanner listId={listId as string} />;
      case 'SchoolPickupRoster':
        return <SchoolPickupRoster listId={listId as string} />;
      case 'SubscriptionTracker':
        return <SubscriptionTracker listId={listId as string} />;
      case 'TidyUp':
        return <TidyUp listId={listId as string} />;
      default:
        // Fallback to default TodoList for unrecognized templates
        return <TodoList listId={listId as string} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.bg }]}>
        <Pressable onPress={() => router.push('/(index)')} style={styles.headerIcon}>
          <ArrowLeft size={22} color={colors.icon} weight="regular" />
        </Pressable>
        <View style={styles.spacer} />
        <PhotoUploader listId={listId as string} iconOnly color={colors.icon} />
        <Pressable 
          onPress={() => router.push(`/list/${listId}/edit`)} 
          style={styles.headerIcon}
        >
          <PencilSimple size={22} color={colors.icon} weight="regular" />
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
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 8,
  },
  spacer: {
    flex: 1,
  },
  errorTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginLeft: 8,
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
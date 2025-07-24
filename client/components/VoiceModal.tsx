import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GoogleGenAI, Type } from '@google/genai';
import Constants from 'expo-constants';
import { createChatContextGenerator } from '../app/api/chatContext';
import PhosphorIcon from './PhosphorIcon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { 
  useAudioRecorder, 
  useAudioRecorderState, 
  RecordingPresets,
  AudioModule,
  setAudioModeAsync 
} from 'expo-audio';
import { useStore, useAddRowCallback, useRow } from 'tinybase/ui-react';
import { getUniqueId } from 'tinybase';

const { height: screenHeight } = Dimensions.get('window');

// Initialize Gemini with API key from environment
const getGeminiAPI = () => {
  const apiKey = Constants.expoConfig?.extra?.GOOGLE_AI_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Google AI API key not found. Please set EXPO_PUBLIC_GOOGLE_AI_API_KEY in your environment.");
  }
  
  // Log the API endpoint being used (without the key)
  console.log('[VoiceModal] Gemini API endpoint:', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent');
  console.log('[VoiceModal] API Key present:', !!apiKey);
  console.log('[VoiceModal] API Key length:', apiKey.length);
  console.log('[VoiceModal] API Key prefix:', apiKey.substring(0, 8) + '...');
  
  return new GoogleGenAI({ apiKey });
};

// Call Gemini API directly for voice processing
const callGeminiVoiceAPI = async (
  audioBase64: string,
  mimeType: string,
  contextData: any,
  modelName: string = 'gemini-2.5-flash-lite'
) => {
  console.log("[VoiceModal] Initializing Gemini API for voice...");
  console.log("[VoiceModal] Audio format:", mimeType);
  console.log("[VoiceModal] Audio base64 length:", audioBase64.length);
  console.log("[VoiceModal] Using model:", modelName);
  
  const genAI = getGeminiAPI();

  // Prepare context information using XML format
  const contextGenerator = createChatContextGenerator({
    lists: contextData?.lists || {},
    todos: contextData?.todos || {}
  });
  
  const xmlContext = contextGenerator.getSystemMessage();

  // Create the full prompt with XML context and structured output instructions
  const prompt = `You are a helpful voice assistant for a shopping list app. Listen to the user's audio and help them by answering their questions using the information in their lists and todos.

${xmlContext}

INSTRUCTIONS:
1. First, transcribe what the user said in the audio
2. Treat the user's input as a QUESTION that needs an answer
3. Search through the todos FIRST to find specific items that answer their question
4. If no specific todo answers the question, look for relevant lists
5. Provide a natural, conversational response that directly answers their question
6. Return ONLY valid JSON (no markdown, no code blocks, no extra text)

PRIORITY ORDER:
1. If the user asks a question (e.g., "What's for dinner?"), find the SPECIFIC TODO that answers it
2. If multiple todos might answer, pick the most relevant one
3. If no specific todo answers the question, show the most relevant list
4. Only use navigation/create actions for explicit requests

Your response must be pure JSON in this format:
{
  "transcription": "Exact transcription of what the user said",
  "message": "A natural answer to their question, mentioning the specific item or list found",
  "action": {
    "type": "action_type",
    "target": "list_id, todo_id, or route",
    "data": {}
  }
}

Action types and their data:
- "show_todo": Show a specific todo that answers their question
  - target: The list ID containing the todo
  - data: { "todoId": "todo_id", "todoText": "todo text", "listId": "list_id", "listName": "list name" }

- "show_list": Show a list when no specific todo answers the question
  - target: The list ID from the XML
  - data: { "listName": "human-readable name" }

- "create_todo": Add one or more items to a list (for explicit add/create requests)
  - target: The list ID
  - data: { "texts": ["item1", "item2"], "listId": "list_id", "listName": "list name" }

- "navigate": Navigate to a route (only for explicit navigation requests)
  - target: Route path (e.g., "/lists", "/profile")
  - data: {} (empty)

- "create_list": Create new list (only for explicit create requests)
  - target: null
  - data: { "name": "list name", "template": "optional template name" }

Examples:
- User: "What's for dinner tonight?" → Find todo "Chicken Parmesan" in "Meal Plan" list → 
  Response: { "transcription": "What's for dinner tonight?", "message": "For dinner tonight, you have Chicken Parmesan planned.", "action": { "type": "show_todo", "target": "meal-plan-list-id", "data": { "todoId": "todo-123", "todoText": "Chicken Parmesan", "listId": "meal-plan-list-id", "listName": "Meal Plan" } } }

- User: "Do I need milk?" → Search todos for "milk" → 
  Response: { "transcription": "Do I need milk?", "message": "Yes, milk is on your Grocery list.", "action": { "type": "show_todo", "target": "grocery-list-id", "data": { "todoId": "todo-456", "todoText": "Milk", "listId": "grocery-list-id", "listName": "Grocery" } } }

- User: "Add apples, oranges, and bananas to my shopping list" → Parse multiple items →
  Response: { "transcription": "Add apples, oranges, and bananas to my shopping list", "message": "I'll add these 3 items to your Shopping list: apples, oranges, and bananas.", "action": { "type": "create_todo", "target": "shopping-list-id", "data": { "texts": ["apples", "oranges", "bananas"], "listId": "shopping-list-id", "listName": "Shopping" } } }

- User: "Add go to the post office to my today list" → Single item →
  Response: { "transcription": "Add go to the post office to my today list", "message": "I'll add 'Go to the post office' to your Today list.", "action": { "type": "create_todo", "target": "today-list-id", "data": { "texts": ["Go to the post office"], "listId": "today-list-id", "listName": "Today" } } }

- User: "What do I need to buy?" → No specific item, show relevant list →
  Response: { "transcription": "What do I need to buy?", "message": "Here's your shopping list with 5 items to buy.", "action": { "type": "show_list", "target": "shopping-list-id", "data": { "listName": "Shopping" } } }

Remember: Always try to ANSWER THE QUESTION with specific information. Output ONLY valid JSON, nothing else.`;

  console.log("[VoiceModal] Making request to Gemini API...");
  console.log("[VoiceModal] Using model: gemini-2.5-flash-lite");
  console.log("[VoiceModal] Context lists:", Object.keys(contextData?.lists || {}).length);
  console.log("[VoiceModal] Context todos:", Object.keys(contextData?.todos || {}).length);

  try {
    // Define the response schema for structured output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        transcription: {
          type: Type.STRING,
          description: "The exact transcription of what the user said"
        },
        message: {
          type: Type.STRING,
          description: "The response message to show to the user"
        },
        action: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            type: {
              type: Type.STRING,
              enum: ["show_list", "show_todo", "create_todo", "mark_done", "mark_undone", "navigate", "create_list"]
            },
            target: {
              type: Type.STRING,
              description: "The list ID or todo ID to target"
            },
                    data: {
          type: Type.OBJECT,
          nullable: true,
          description: "Additional data for the action",
          properties: {
            // For todos
            todoId: {
              type: Type.STRING,
              nullable: true
            },
            todoText: {
              type: Type.STRING,
              nullable: true
            },
            text: {
              type: Type.STRING,
              nullable: true
            },
            texts: { // Added for multiple todos
              type: Type.ARRAY,
              nullable: true,
              items: {
                type: Type.STRING,
                nullable: true
              }
            },
            notes: {
              type: Type.STRING,
              nullable: true
            },
            category: {
              type: Type.STRING,
              nullable: true
            },
            date: {
              type: Type.STRING,
              nullable: true
            },
            time: {
              type: Type.STRING,
              nullable: true
            },
            url: {
              type: Type.STRING,
              nullable: true
            },
            emoji: {
              type: Type.STRING,
              nullable: true
            },
            email: {
              type: Type.STRING,
              nullable: true
            },
            streetAddress: {
              type: Type.STRING,
              nullable: true
            },
            number: {
              type: Type.NUMBER,
              nullable: true
            },
            amount: {
              type: Type.NUMBER,
              nullable: true
            },
            fiveStarRating: {
              type: Type.NUMBER,
              nullable: true
            },
            // For lists
            listId: {
              type: Type.STRING,
              nullable: true
            },
            listName: {
              type: Type.STRING,
              nullable: true
            },
            // For create_list
            template: {
              type: Type.STRING,
              nullable: true
            },
            name: {
              type: Type.STRING,
              nullable: true
            },
            purpose: {
              type: Type.STRING,
              nullable: true
            },
            // Generic fields
            itemName: {
              type: Type.STRING,
              nullable: true
            }
          }
        }
          },
          required: ["type", "target"]
        }
      },
      required: ["transcription", "message"],
      propertyOrdering: ["transcription", "message", "action"]
    };
    
    // Log the full request details
    const requestData = {
      model: modelName,
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: audioBase64, // Make sure this is base64 without the data URL prefix
              }
            },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    };
    
    console.log("[VoiceModal] Request structure:", JSON.stringify({
      ...requestData,
      contents: requestData.contents.map(content => ({
        parts: content.parts.map((part, idx) => 
          idx === 0 && part.inlineData 
            ? { inlineData: { ...part.inlineData, data: part.inlineData.data.substring(0, 100) + '...(truncated)' } }
            : part
        )
      }))
    }, null, 2));
    
    // Make the actual request with the new API pattern
    const response = await genAI.models.generateContent(requestData);

    // Get the response text directly - it will be valid JSON due to structured output
    const text = response.text;
    
    console.log("[VoiceModal] Gemini structured response:", text);
    
    // Parse the JSON response directly
    const parsedResponse = JSON.parse(text);
    
    console.log("[VoiceModal] Parsed response:", parsedResponse);
    
    // Return the structured response
    return {
      transcription: parsedResponse.transcription,
      message: parsedResponse.message,
      action: parsedResponse.action || null
    };

  } catch (error) {
    console.error("[VoiceModal] Gemini API error:", error);
    
    // Log the full error object
    console.error("[VoiceModal] Full error object:", JSON.stringify(error, null, 2));
    
    // Log specific error properties
    if (error.response) {
      console.error("[VoiceModal] Error response status:", error.response.status);
      console.error("[VoiceModal] Error response headers:", error.response.headers);
      console.error("[VoiceModal] Error response data:", error.response.data);
    }
    
    // Log the specific error for debugging
    console.error("[VoiceModal] Error details:", error.message || error);
    console.error("[VoiceModal] Error stack:", error.stack);
    
    // Check for specific error types
    if (error.message?.includes('500')) {
      throw new Error('The AI service is temporarily unavailable. Please try again in a moment.');
    } else if (error.message?.includes('API key')) {
      throw new Error('There is an issue with the API configuration. Please contact support.');
    } else if (error.message?.includes('model')) {
      throw new Error('The AI model is not available. Please try again later.');
    }
    
    throw error;
  }
};

// Generate todos using structured output based on list's system prompt
const generateTodosWithStructuredOutput = async (
  todoTexts: string[],
  listInfo: any,
  existingTodos: any[]
) => {
  console.log("[VoiceModal] Generating structured todos for list:", listInfo.name);
  const genAI = getGeminiAPI();

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
              description: "The main text of the todo item"
            },
            notes: {
              type: Type.STRING,
              nullable: true,
              description: "Additional notes about the todo"
            },
            emoji: {
              type: Type.STRING,
              nullable: true,
              description: "A relevant emoji for the todo"
            },
            category: {
              type: Type.STRING,
              nullable: true,
              description: "The category of the todo"
            },
            type: {
              type: Type.STRING,
              nullable: true,
              description: "The type of the todo (A-E)"
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

  const prompt = `You are creating todo items for a specific list. Follow the list's system instructions carefully.
  
  List Information:
  - List Name: "${listInfo.name}"
  - List Purpose: "${listInfo.purpose}"
  - List Template: "${listInfo.template}"
  - System Instructions: "${listInfo.systemPrompt || 'Standard todo list'}"
  
  Current todos in this list (for context on format and style):
  ${JSON.stringify(existingTodos.slice(0, 5))}
  
  Create todo items for the following:
  ${todoTexts.map((text, i) => `${i + 1}. ${text}`).join('\n')}
  
  IMPORTANT: Follow the system instructions exactly. Each list type has specific requirements for how todos should be formatted, what fields to include, and what style to use.
  
  Return ONLY the new todos, not the existing ones. Each todo should match the style and structure of the existing todos in the list.`;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    const parsedResponse = JSON.parse(text);
    
    console.log("[VoiceModal] Generated todos:", parsedResponse.todos);
    return parsedResponse.todos;
  } catch (error) {
    console.error("[VoiceModal] Error generating structured todos:", error);
    throw error;
  }
};

export interface VoiceResponse {
  transcription: string;
  message: string;
  action?: {
    type: 'navigate' | 'show_list' | 'show_items' | 'show_todo' | 'add_todo' | 'update_todo' | 'delete_todo' | 'create_list' | 'create_todo';
    target?: string;
    data?: {
      // For todos
      todoId?: string;
      todoText?: string;
      text?: string;
      texts?: string[]; // For multiple todos
      notes?: string;
      category?: string;
      date?: string;
      time?: string;
      url?: string;
      emoji?: string;
      email?: string;
      streetAddress?: string;
      number?: number;
      amount?: number;
      fiveStarRating?: number;
      
      // For lists
      listId?: string;
      listName?: string;
      
      // For create_list
      template?: string;
      name?: string;
      purpose?: string;
      
      // Generic fields
      itemName?: string;
    };
  };
}

interface VoiceModalProps {
  visible: boolean;
  isRecording: boolean;
  onClose: () => void;
  contextData?: {
    lists: Record<string, any>;
    todos: Record<string, any>;
  };
}

export default function VoiceModal({ visible, isRecording, onClose, contextData }: VoiceModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<VoiceResponse | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isActivelyRecording, setIsActivelyRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);
  const [isConfirmingTodos, setIsConfirmingTodos] = useState(false);
  const [isCreatingTodos, setIsCreatingTodos] = useState(false);
  const [createdTodosCount, setCreatedTodosCount] = useState(0);
  const [todoCreationError, setTodoCreationError] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const volumeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Theme colors
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  // Store access
  const store = useStore();

  // Audio recording setup with high quality settings
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 100); // Update every 100ms

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      setHasPermission(status.granted);
      
      if (status.granted) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
          interruptionMode: 'doNotMix',
          shouldPlayInBackground: false,
        });
      } else {
        console.error('[VoiceModal] Microphone permission denied');
      }
    } catch (error) {
      console.error('[VoiceModal] Permission error:', error);
      setHasPermission(false);
    }
  };

  // Handle recording state changes based on prop
  useEffect(() => {
    if (visible && isRecording && !isActivelyRecording && !isInitializing && !isProcessing) {
      // Start recording when prop changes to true
      startRecording();
    } else if (visible && !isRecording && isActivelyRecording) {
      // Stop recording when prop changes to false
      stopRecording();
    }
  }, [isRecording, visible, isActivelyRecording, isInitializing, isProcessing]);

  // Start/stop modal animations when visibility changes
  useEffect(() => {
    if (visible) {
      // Check permission before recording
      if (!hasPermission) {
        Alert.alert(
          'Microphone Permission Required',
          'Please grant microphone access to use voice commands.',
          [{ text: 'OK', onPress: onClose }]
        );
        return;
      }
      
      // Reset state when opening
      setResponse(null);
      setIsProcessing(false);
      setIsTranscriptionExpanded(false);
      setIsConfirmingTodos(false);
      setIsCreatingTodos(false);
      setCreatedTodosCount(0);
      setTodoCreationError(null);
      
      // Animate sheet sliding up
      Animated.spring(slideAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
      
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Animate sheet sliding down
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Reset states after animation completes
        setIsActivelyRecording(false);
        setIsInitializing(false);
        setRecordingStartTime(null);
      });
      
      // Stop pulse animation
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [visible, hasPermission]);

  // Monitor audio levels for volume visualization
  useEffect(() => {
    if (isActivelyRecording) {
      // Create a dynamic volume animation since metering might not be available
      const volumeAnimation = () => {
        // Random volume levels to simulate voice input
        const randomVolume = 0.3 + Math.random() * 0.7;
        
        Animated.timing(volumeAnim, {
          toValue: randomVolume,
          duration: 200,
          useNativeDriver: false,
        }).start();
      };
      
      // Start with a base level
      volumeAnimation();
      const interval = setInterval(volumeAnimation, 200);
      
      return () => {
        clearInterval(interval);
        Animated.timing(volumeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      };
    }
  }, [isActivelyRecording]);

  const startRecording = async () => {
    try {
      console.log('[VoiceModal] Starting recording...');
      
      setIsInitializing(true);
      
      // Configure audio session for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
      });
      
      await audioRecorder.prepareToRecordAsync();
      
      await audioRecorder.record();
      
      // Set our local state
      setIsActivelyRecording(true);
      setIsInitializing(false);
      setRecordingStartTime(Date.now());
      
      console.log('[VoiceModal] Recording started successfully');
      
    } catch (error) {
      console.error('[VoiceModal] Recording start error:', error);
      setIsInitializing(false);
      setIsActivelyRecording(false);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please check microphone permissions.',
        [{ text: 'OK', onPress: onClose }]
      );
    }
  };

  const stopRecording = async () => {
    try {
      // Update our local state immediately
      setIsActivelyRecording(false);
      
      // Check minimum recording time
      const recordingDuration = recordingStartTime ? Date.now() - recordingStartTime : 0;
      console.log('[VoiceModal] Recording duration:', recordingDuration, 'ms');
      
      if (recordingDuration < 500) { // Minimum 500ms recording
        Alert.alert(
          'Too Quick!',
          'Please hold the button longer while speaking.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('[VoiceModal] Stopping recording...');
      console.log('[VoiceModal] audioRecorder.isRecording:', audioRecorder.isRecording);
      console.log('[VoiceModal] audioRecorder.uri before stop:', audioRecorder.uri);
      
      await audioRecorder.stop();
      
      // Get the recording URI
      const recordingUri = audioRecorder.uri;
      
      console.log('[VoiceModal] Recording stopped');
      console.log('[VoiceModal] Recording URI:', recordingUri);
      
      if (recordingUri) {
        console.log('[VoiceModal] Recording completed, URI:', recordingUri);
        // Process the recording
        handleRecordingComplete(recordingUri);
      } else {
        console.error('[VoiceModal] No recording URI available after stop');
        Alert.alert(
          'Recording Error',
          'Failed to capture audio. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[VoiceModal] Recording stop error:', error);
      Alert.alert(
        'Recording Error',
        'Failed to stop recording. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRecordingComplete = async (audioUri: string) => {
    console.log('[VoiceModal] Starting to process audio:', audioUri);
    
    try {
      setIsProcessing(true);
      
      // Convert audio file to base64 for upload
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      console.log('[VoiceModal] Audio blob type:', blob.type);
      console.log('[VoiceModal] Audio blob size:', blob.size);
      
      // Check if the audio file is too large (Gemini has limits)
      if (blob.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Audio recording is too large. Please try a shorter recording.');
      }
      
      // Check if the audio is too small (likely corrupted)
      if (blob.size < 1000) { // Less than 1KB is suspicious
        console.error('[VoiceModal] Audio file is too small, likely corrupted');
        throw new Error('Audio recording failed. Please try again.');
      }
      
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          console.log('[VoiceModal] Audio base64 length:', base64Audio?.length);
          console.log('[VoiceModal] Audio base64 preview:', base64Audio?.substring(0, 100) + '...');
          
          // Ensure we have valid base64 data
          if (!base64Audio) {
            throw new Error('Failed to convert audio to base64');
          }
          
          // Determine the correct MIME type
          let mimeType = blob.type || 'audio/m4a';
          
          // Map common audio types to ensure compatibility
          if (mimeType === 'audio/x-m4a') {
            mimeType = 'audio/m4a';
          } else if (mimeType === 'audio/mp4') {
            mimeType = 'audio/m4a'; // iOS often records as mp4 but it's actually m4a
          } else if (!mimeType || mimeType === 'application/octet-stream') {
            // Default to m4a if mime type is unknown
            mimeType = 'audio/m4a';
          }
          
          console.log('[VoiceModal] Using MIME type:', mimeType);
          
          // Log the actual prompt being sent
          console.log('[VoiceModal] Sending audio with simplified prompt for testing');
          
          // Call Gemini API with structured output
          const result = await callGeminiVoiceAPI(
            base64Audio,
            mimeType,
            contextData
          );
          
          setResponse(result);
        } catch (innerError) {
          console.error('[VoiceModal] Error in FileReader onloadend:', innerError);
          throw innerError;
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('[VoiceModal] FileReader error:', error);
        setIsProcessing(false);
        throw new Error('Failed to read audio file');
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('[VoiceModal] Voice processing error:', error);
      
      // Show a more user-friendly error message
      const errorMessage = error.message?.includes('temporarily unavailable') 
        ? error.message 
        : 'Failed to process your voice command. Please try again.';
      
      Alert.alert(
        'Processing Error',
        errorMessage,
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
    }
  };

  const handleActionPress = () => {
    if (!response?.action) return;

    const { action } = response;
    
    // Handle create_todo differently - show confirmation
    if (action.type === 'create_todo') {
      setIsConfirmingTodos(true);
      return;
    }
    
    // Validate that we have a valid target before navigating
    if (!action.target && (action.type === 'show_list' || action.type === 'show_items' || action.type === 'navigate')) {
      console.error('[VoiceModal] No target specified for navigation action');
      Alert.alert(
        'Navigation Error',
        'I couldn\'t determine which list to show. Please try again.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    switch (action.type) {
      case 'navigate':
        if (action.target) {
          onClose();
          // Ensure the route is properly formatted
          if (action.target.startsWith('/')) {
            router.push(action.target as any);
          } else {
            router.push(`/(index)/${action.target}` as any);
          }
        }
        break;
      case 'show_list':
      case 'show_items':
        if (action.target) {
          onClose();
          // Navigate to the list detail page with the list ID
          router.push(`/(index)/list/${action.target}`);
        }
        break;
      case 'show_todo':
        if (action.target && action.data?.todoId) {
          onClose();
          // Navigate to the list containing the todo
          router.push(`/(index)/list/${action.target}`);
          // In a future implementation, you could highlight or scroll to the specific todo
        }
        break;
      case 'add_todo':
        if (action.data?.listId) {
          // Navigate to the list where the todo would be added
          onClose();
          router.push(`/(index)/list/${action.data.listId}`);
          // In a real implementation, you'd also trigger the add todo action
          // For now, just navigate to the list
        } else {
          Alert.alert(
            'Add Todo',
            `Would add "${action.data?.text || action.data?.itemName}" to ${action.data?.listName || 'the list'}`,
            [{ text: 'OK' }]
          );
        }
        break;
      case 'update_todo':
        Alert.alert(
          'Update Todo',
          `Would update todo ${action.data?.todoId}`,
          [{ text: 'OK' }]
        );
        // TODO: Integrate with actual update_todo tool
        break;
      case 'delete_todo':
        Alert.alert(
          'Delete Todo',
          `Would delete todo ${action.data?.todoId}`,
          [{ text: 'OK' }]
        );
        // TODO: Integrate with actual delete_todo tool
        break;
      case 'create_list':
        Alert.alert(
          'Create List',
          `Would create list with template "${action.data?.template}"`,
          [{ text: 'OK' }]
        );
        // TODO: Integrate with actual create_list tool
        break;
      default:
        console.warn('[VoiceModal] Unknown action type:', action.type);
        break;
    }
  };

  const handleCreateTodos = async () => {
    if (!response?.action || response.action.type !== 'create_todo') return;
    
    const { action } = response;
    const listId = action.target;
    const texts = action.data?.texts || [action.data?.text].filter(Boolean);
    
    if (!listId || texts.length === 0) {
      setTodoCreationError('Invalid todo data');
      return;
    }
    
    setIsCreatingTodos(true);
    setTodoCreationError(null);
    
    try {
      // Get list info
      const list = store.getRow('lists', listId);
      if (!list) {
        throw new Error('List not found');
      }
      
      // Get existing todos for context
      const allTodos = store.getTable('todos');
      const existingTodos = Object.entries(allTodos)
        .filter(([_, todo]: [string, any]) => todo.list === listId)
        .map(([_, todo]) => todo)
        .slice(0, 5); // Get recent todos for context
      
      // Generate structured todos
      const generatedTodos = await generateTodosWithStructuredOutput(
        texts,
        list,
        existingTodos
      );
      
      // Add todos to the store
      let addedCount = 0;
      store.transaction(() => {
        for (const todoData of generatedTodos) {
          const todoId = getUniqueId();
          store.setRow('todos', todoId, {
            ...todoData,
            list: listId,
            done: false,
          });
          addedCount++;
        }
      });
      
      setCreatedTodosCount(addedCount);
      setIsCreatingTodos(false);
      setIsConfirmingTodos(false);
      
    } catch (error) {
      console.error('[VoiceModal] Error creating todos:', error);
      setTodoCreationError('Failed to create todos. Please try again.');
      setIsCreatingTodos(false);
    }
  };

  const getActionButtonText = () => {
    if (!response?.action) return '';
    
    switch (response.action.type) {
      case 'navigate':
        return 'Go There';
      case 'show_list':
      case 'show_items':
        return 'Open List';
      case 'show_todo':
        return 'View in List';
      case 'add_todo':
        return 'Add to List';
      case 'create_todo':
        const count = response.action.data?.texts?.length || 1;
        return count > 1 ? `Add ${count} items` : 'Add item';
      case 'update_todo':
        return 'Update Todo';
      case 'delete_todo':
        return 'Delete Todo';
      case 'create_list':
        return 'Create List';
      default:
        return 'Take Action';
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  // Calculate content height based on state
  const getContentHeight = () => {
    if (createdTodosCount > 0) {
      return 280; // Success state
    }
    if (isConfirmingTodos || isCreatingTodos) {
      return 380; // Confirmation/creating state
    }
    if (response) {
      let baseHeight = 300;
      // Extra height for visual representations
      if (response.action && (response.action.type === 'show_list' || response.action.type === 'show_items' || response.action.type === 'add_todo' || response.action.type === 'show_todo' || response.action.type === 'create_todo')) {
        baseHeight = 380;
      }
      // Add extra height when transcription is expanded
      if (isTranscriptionExpanded) {
        baseHeight += 40;
      }
      return baseHeight;
    }
    if (isProcessing) return 220;
    return 240; // Compact height for listening
  };

  const isListening = isActivelyRecording && !isProcessing;
  const isPreparing = isInitializing || (visible && !isActivelyRecording && !isProcessing && !response);
  
  // Debug component state changes only
  useEffect(() => {
    if (visible || isActivelyRecording || isProcessing) {
      console.log('[VoiceModal] State:', {
        visible,
        isListening,
        isPreparing,
        isProcessing,
        isActivelyRecording,
      });
    }
  }, [visible, isListening, isPreparing, isProcessing, isActivelyRecording]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Backdrop */}
        <Pressable 
          style={styles.backdrop} 
          onPress={onClose}
        />
        
        {/* Bottom Sheet */}
        <Animated.View 
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
              minHeight: getContentHeight(),
            }
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isListening ? 'Listening...' : 
               isProcessing ? 'Processing...' : 
               response ? 'Here\'s what I found' : 
               isPreparing ? 'Getting ready...' : 
               'Voice Assistant'}
            </Text>
            {/* Close button - show when we have a response or error */}
            {(response || (!isListening && !isProcessing && !isPreparing)) && (
              <Pressable 
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={24} color="#6B7280" />
              </Pressable>
            )}
          </View>
          
          {/* Content */}
          <View style={[styles.content, { minHeight: getContentHeight() - 80 }]}>
            {/* Listening visualization */}
            {(isListening || isPreparing) && !response && (
              <View style={styles.listeningContainer}>
                {/* Animated mic icon with pulse */}
                <Animated.View style={[
                  styles.micContainer,
                  { transform: [{ scale: pulseAnim }] }
                ]}>
                  <Feather name="mic" size={48} color="#2196F3" />
                </Animated.View>
                
                {/* Volume visualization bars - only show when actually recording */}
                {isListening && (
                  <View style={styles.volumeBars}>
                    {[...Array(5)].map((_, index) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.volumeBar,
                          {
                            height: volumeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [10, 40 - index * 5],
                            }),
                            opacity: volumeAnim.interpolate({
                              inputRange: [0, (index + 1) * 0.2],
                              outputRange: [0.3, 1],
                              extrapolate: 'clamp',
                            }),
                            backgroundColor: index < 3 ? '#2196F3' : index < 4 ? '#FF9800' : '#F44336',
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
                
                <Text style={styles.listeningText}>
                  {isPreparing ? 'Preparing microphone...' : 'Keep holding to speak'}
                </Text>
              </View>
            )}
            
            {/* Processing indicator */}
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.processingText}>Understanding your request...</Text>
              </View>
            )}
            
            {/* Response content */}
            {response && !isProcessing && !isListening && (
              <View style={styles.responseContainer}>
                {/* Show different UI based on state */}
                {createdTodosCount > 0 ? (
                  // Success state
                  <View style={styles.successContainer}>
                    <View style={styles.successIcon}>
                      <Feather name="check-circle" size={48} color="#059669" />
                    </View>
                    <Text style={styles.successTitle}>
                      {createdTodosCount === 1 ? 'Item added!' : `${createdTodosCount} items added!`}
                    </Text>
                    <Text style={styles.successMessage}>
                      Successfully added to {response.action?.data?.listName || 'your list'}
                    </Text>
                    <View style={styles.actionButtons}>
                      <Pressable 
                        style={[styles.actionButton, styles.primaryButton]} 
                        onPress={() => {
                          onClose();
                          router.push(`/(index)/list/${response.action?.target}`);
                        }}
                      >
                        <Text style={styles.actionButtonText}>View List</Text>
                        <Feather name="arrow-right" size={16} color="#FFFFFF" />
                      </Pressable>
                      <Pressable 
                        style={[styles.actionButton, styles.secondaryButton]} 
                        onPress={onClose}
                      >
                        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Done</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : isConfirmingTodos && response.action?.type === 'create_todo' ? (
                  // Confirmation state
                  <View style={styles.confirmationContainer}>
                    <View style={styles.confirmationHeader}>
                      <PhosphorIcon name="ListPlus" size={24} color="#2196F3" weight="duotone" />
                      <Text style={styles.confirmationTitle}>Ready to add items</Text>
                    </View>
                    
                    <View style={styles.itemsToAddContainer}>
                      <Text style={styles.itemsToAddLabel}>
                        Adding to {response.action.data?.listName}:
                      </Text>
                      {(response.action.data?.texts || [response.action.data?.text].filter(Boolean)).map((text, index) => (
                        <View key={index} style={styles.itemToAdd}>
                          <View style={styles.itemBullet} />
                          <Text style={styles.itemText}>{text}</Text>
                        </View>
                      ))}
                    </View>
                    
                    {todoCreationError && (
                      <View style={styles.errorBanner}>
                        <Feather name="alert-circle" size={16} color="#EF4444" />
                        <Text style={styles.errorBannerText}>{todoCreationError}</Text>
                      </View>
                    )}
                    
                    <View style={styles.confirmationButtons}>
                      <Pressable 
                        style={[styles.actionButton, styles.primaryButton, isCreatingTodos && styles.buttonDisabled]} 
                        onPress={handleCreateTodos}
                        disabled={isCreatingTodos}
                      >
                        {isCreatingTodos ? (
                          <>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Creating...</Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.actionButtonText}>Confirm</Text>
                            <Feather name="check" size={16} color="#FFFFFF" />
                          </>
                        )}
                      </Pressable>
                      <Pressable 
                        style={[styles.actionButton, styles.secondaryButton]} 
                        onPress={() => {
                          setIsConfirmingTodos(false);
                          setTodoCreationError(null);
                        }}
                        disabled={isCreatingTodos}
                      >
                        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  // Default response state
                  <>
                    <View style={styles.responseHeader}>
                      <Feather name="check-circle" size={24} color="#059669" />
                      <Text style={styles.responseHeaderText}>Response ready</Text>
                    </View>
                    
                    {/* Transcription disclosure */}
                    <Pressable 
                      style={styles.transcriptionDisclosure} 
                      onPress={() => setIsTranscriptionExpanded(!isTranscriptionExpanded)}
                    >
                      <View style={styles.transcriptionHeader}>
                        <Feather 
                          name={isTranscriptionExpanded ? "chevron-down" : "chevron-right"} 
                          size={16} 
                          color="#6B7280" 
                        />
                        <Text style={styles.transcriptionLabel}>What I heard</Text>
                      </View>
                      {isTranscriptionExpanded && (
                        <Text style={styles.transcriptionText}>"{response.transcription}"</Text>
                      )}
                    </Pressable>
                    
                    <View style={styles.responseMessageContainer}>
                      <Text style={styles.responseText}>{response.message}</Text>
                    </View>
                    
                    {/* Visual representation based on action type */}
                    {response.action && (response.action.type === 'show_list' || response.action.type === 'show_items') && response.action.target && (
                  <View style={styles.visualContainer}>
                    {(() => {
                      const list = contextData?.lists[response.action.target];
                      if (!list) return null;
                      
                      const colorMap = {
                        blue: '#2196F3',
                        green: '#4CAF50',
                        red: '#F44336',
                        yellow: '#FFC107',
                        purple: '#9C27B0',
                        teal: '#009688',
                        gray: '#757575',
                        orange: '#FF9800',
                        pink: '#E91E63',
                        cyan: '#00BCD4',
                      };
                      
                      const bgColor = colorMap[list.backgroundColour as keyof typeof colorMap] || '#2196F3';
                      
                      return (
                        <View style={[styles.listPreview, { backgroundColor: isDark ? bgColor + '20' : bgColor + '10' }]}>
                          <View style={[styles.listIconPreview, { backgroundColor: bgColor }]}>
                            <PhosphorIcon 
                              name={(list.icon || 'ClipboardText') as string} 
                              size={20} 
                              color="#FFFFFF" 
                            />
                          </View>
                          <Text style={[styles.listNamePreview, { color: '#000000' }]}>
                            {list.name}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                )}
                
                {/* Todo visual representation - for both show_todo and add_todo */}
                {response.action && (response.action.type === 'add_todo' || response.action.type === 'show_todo') && response.action.data && (
                  <View style={styles.visualContainer}>
                    <View style={[styles.todoPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                      <View style={[
                        styles.todoCheckbox, 
                        { 
                          borderColor: isDark ? '#666' : '#D1D5DB',
                          backgroundColor: response.action.type === 'show_todo' ? 'transparent' : 'transparent'
                        }
                      ]} />
                      <View style={styles.todoContent}>
                        <Text style={[styles.todoText, { color: '#000000' }]}>
                          {response.action.data.todoText || response.action.data.text || response.action.data.itemName}
                        </Text>
                        {response.action.data.listName && (
                          <Text style={[styles.todoListName, { color: '#000000' }]}>
                            {response.action.type === 'show_todo' ? 'from' : 'in'} {response.action.data.listName}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Create todo visual representation */}
                {response.action && response.action.type === 'create_todo' && response.action.data && (
                  <View style={styles.visualContainer}>
                    <View style={[styles.itemsPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                      <Text style={[styles.itemsPreviewLabel, { color: '#6B7280' }]}>
                        Items to add:
                      </Text>
                      {(response.action.data.texts || [response.action.data.text].filter(Boolean)).slice(0, 3).map((text, index) => (
                        <View key={index} style={styles.itemPreviewRow}>
                          <View style={[styles.itemPreviewCheckbox, { borderColor: isDark ? '#666' : '#D1D5DB' }]} />
                          <Text style={[styles.itemPreviewText, { color: '#374151' }]} numberOfLines={1}>
                            {text}
                          </Text>
                        </View>
                      ))}
                      {(response.action.data.texts?.length || 1) > 3 && (
                        <Text style={[styles.itemsPreviewMore, { color: '#6B7280' }]}>
                          +{(response.action.data.texts?.length || 1) - 3} more
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                
                {response.action && (
                  <Pressable 
                    style={styles.actionButton} 
                    onPress={handleActionPress}
                  >
                    <Text style={styles.actionButtonText}>
                      {getActionButtonText()}
                    </Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </Pressable>
                )}
                  </>
                )}
              </View>
            )}
            

          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Account for safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  content: {
    paddingHorizontal: 24,
  },
  listeningContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  micContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  volumeBars: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    height: 40,
    alignItems: 'center',
  },
  volumeBar: {
    width: 6,
    backgroundColor: '#2196F3',
    borderRadius: 3,
    minHeight: 10,
  },
  listeningText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  processingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  responseContainer: {
    paddingTop: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  responseHeaderText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  responseMessageContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  responseText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  visualContainer: {
    marginVertical: 12,
  },
  listPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  listIconPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listNamePreview: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  todoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  todoCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
  },
  todoContent: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    fontWeight: '500',
  },
  todoListName: {
    fontSize: 12,
    marginTop: 2,
  },
  transcriptionDisclosure: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transcriptionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  transcriptionText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    marginLeft: 22,
    fontStyle: 'italic',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#374151',
  },
  confirmationContainer: {
    paddingVertical: 20,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemsToAddContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  itemsToAddLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemToAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2196F3',
    marginRight: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#374151',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 4,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  itemsPreview: {
    padding: 16,
    borderRadius: 12,
  },
  itemsPreviewLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPreviewCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 8,
  },
  itemPreviewText: {
    fontSize: 14,
    flex: 1,
  },
  itemsPreviewMore: {
    fontSize: 12,
    marginTop: 8,
  },
});
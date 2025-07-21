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
import VoiceRecordingButton from './VoiceRecordingButton';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import Constants from 'expo-constants';
import { createChatContextGenerator } from '../app/api/chatContext';

const { height: screenHeight } = Dimensions.get('window');

// Initialize Gemini with API key from environment
const getGeminiAPI = () => {
  const apiKey = Constants.expoConfig?.extra?.GOOGLE_AI_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Google AI API key not found. Please set EXPO_PUBLIC_GOOGLE_AI_API_KEY in your environment.");
  }
  return new GoogleGenerativeAI(apiKey);
};

// Call Gemini API directly for voice processing
const callGeminiVoiceAPI = async (
  audioBase64: string,
  mimeType: string,
  contextData: any
) => {
  console.log("[VoiceModal] Initializing Gemini API for voice...");
  const genAI = getGeminiAPI();

  // Define the response schema for structured output
  const responseSchema = {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "A natural language response to the user's query"
      },
      action: {
        type: "object",
        nullable: true,
        properties: {
          type: {
            type: "string",
            enum: ["navigate", "show_list", "show_items", "add_todo", "update_todo", "delete_todo", "create_list"],
            description: "The type of action to perform"
          },
          target: {
            type: "string",
            nullable: true,
            description: "The list ID or route to navigate to"
          },
          data: {
            type: "object",
            nullable: true,
            properties: {
              text: {
                type: "string",
                nullable: true,
                description: "Todo text content"
              },
              notes: {
                type: "string",
                nullable: true,
                description: "Additional notes"
              },
              category: {
                type: "string",
                nullable: true,
                description: "Category for the todo"
              },
              listId: {
                type: "string",
                nullable: true,
                description: "ID of the list for the todo"
              },
              todoId: {
                type: "string",
                nullable: true,
                description: "ID of the todo to update/delete"
              },
              template: {
                type: "string",
                nullable: true,
                description: "Template name for new list"
              },
              name: {
                type: "string",
                nullable: true,
                description: "Name for new list or item"
              },
              purpose: {
                type: "string",
                nullable: true,
                description: "Purpose for new list"
              },
              itemName: {
                type: "string",
                nullable: true,
                description: "Generic item name"
              },
              listName: {
                type: "string",
                nullable: true,
                description: "Generic list name"
              }
            }
          }
        },
        required: ["type"]
      }
    },
    required: ["message"]
  } as any; // Type assertion to bypass strict typing while using structured output

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });

  // Prepare context information using XML format
  const contextGenerator = createChatContextGenerator({
    lists: contextData?.lists || {},
    todos: contextData?.todos || {}
  });
  
  const xmlContext = contextGenerator.getSystemMessage();

  // No need to specify JSON format in the prompt - structured output handles it
  const prompt = `You are a helpful shopping list assistant. Analyze the user's voice command and respond appropriately.

Here is the current state of lists and their items:
${xmlContext}

Instructions:
- Provide a natural, conversational response message
- If the user wants to navigate or view a list, include an action with the list ID
- If the user asks about items or contents, suggest showing the relevant list
- If the user asks about specific items, you can see them in the <todo> elements within each list
- Always use the exact list ID from the available lists above
- Be helpful and friendly in your response`;

  console.log("[VoiceModal] Making request to Gemini API with structured output...");

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType || 'audio/webm',
        }
      },
      prompt
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log("[VoiceModal] Gemini response:", text);
    
    // With structured output, the response should already be valid JSON
    try {
      const parsedResponse = JSON.parse(text);
      console.log("[VoiceModal] Parsed structured response:", parsedResponse);
      
      // Validate the response structure
      if (!parsedResponse.message) {
        parsedResponse.message = "I understood your request.";
      }
      
      return parsedResponse;
    } catch (parseError) {
      console.error("[VoiceModal] Failed to parse structured JSON response:", parseError);
      console.log("[VoiceModal] Raw text:", text);
      
      // This shouldn't happen with structured output, but keep as fallback
      return {
        message: "I heard your request but couldn't process it properly. Please try again.",
        action: null
      };
    }
  } catch (error) {
    console.error("[VoiceModal] Gemini API error:", error);
    
    // Log the specific error for debugging
    console.error("[VoiceModal] Error details:", error.message || error);
    
    throw error;
  }
};

export interface VoiceResponse {
  message: string;
  action?: {
    type: 'navigate' | 'show_list' | 'show_items' | 'add_todo' | 'update_todo' | 'delete_todo' | 'create_list';
    target?: string;
    data?: {
      // For add_todo action
      text?: string;
      notes?: string;
      category?: string;
      listId?: string;
      
      // For update_todo/delete_todo
      todoId?: string;
      
      // For create_list
      template?: string;
      name?: string;
      purpose?: string;
      
      // Generic fields
      itemName?: string;
      listName?: string;
    };
  };
}

interface VoiceModalProps {
  visible: boolean;
  onClose: () => void;
  contextData?: {
    lists: Record<string, any>;
    todos: Record<string, any>;
  };
}

export default function VoiceModal({ visible, onClose, contextData }: VoiceModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<VoiceResponse | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Calculate content height based on state
  const getContentHeight = () => {
    if (showHelp) return 400;
    if (response) return 350;
    return 220;
  };

  useEffect(() => {
    if (visible) {
      // Reset state when opening
      setResponse(null);
      setIsProcessing(false);
      setIsRecording(false);
      setShowHelp(false);
      
      // Animate sheet sliding up
      Animated.spring(slideAnim, {
        toValue: 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate sheet sliding down
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleRecordingStart = () => {
    setIsRecording(true);
    setResponse(null);
    setShowHelp(false);
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
    setIsProcessing(true);
  };

  const handleRecordingComplete = async (audioUri: string) => {
    console.log('[VoiceModal] Starting to process audio:', audioUri);
    
    try {
      setIsProcessing(true);
      
      // Convert audio file to base64 for upload
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          // Call Gemini API with structured output
          const result = await callGeminiVoiceAPI(
            base64Audio,
            'audio/m4a',
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
      Alert.alert(
        'Processing Error',
        `Failed to process your voice command: ${error.message}. Please try again.`,
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
    }
  };

  const handleActionPress = () => {
    if (!response?.action) return;

    const { action } = response;
    
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
      case 'add_todo':
        // For now, show what would be added
        Alert.alert(
          'Add Todo',
          `Would add "${action.data?.text || action.data?.itemName}" to ${action.data?.listName || 'the list'}`,
          [{ text: 'OK' }]
        );
        // TODO: Integrate with actual add_todo tool
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

  const getActionButtonText = () => {
    if (!response?.action) return '';
    
    switch (response.action.type) {
      case 'navigate':
        return 'Go There';
      case 'show_list':
      case 'show_items':
        return 'View List';
      case 'add_todo':
        return 'Add Todo';
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
              {isRecording ? 'Listening...' : 
               isProcessing ? 'Processing...' : 
               response ? 'Here\'s what I found' : 
               'Ask me anything'}
            </Text>
            
            {/* Help button */}
            {!response && !isProcessing && (
              <Pressable 
                style={styles.helpButton}
                onPress={() => setShowHelp(!showHelp)}
              >
                <Feather 
                  name={showHelp ? "x" : "help-circle"} 
                  size={20} 
                  color="#6B7280" 
                />
              </Pressable>
            )}
          </View>
          
          {/* Content */}
          <View style={[styles.content, { minHeight: getContentHeight() - 80 }]}>
            {/* Help content */}
            {showHelp && (
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Voice Assistant Tips</Text>
                <Text style={styles.helpText}>• "What's on my grocery list?"</Text>
                <Text style={styles.helpText}>• "Show me my home list"</Text>
                <Text style={styles.helpText}>• "Add milk to shopping"</Text>
                <Text style={styles.helpText}>• "What do I need to buy?"</Text>
                <Text style={styles.helpText}>• "Navigate to recipes"</Text>
              </View>
            )}
            
            {/* Processing indicator */}
            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
              </View>
            )}
            
            {/* Response content */}
            {response && !isProcessing && (
              <View style={styles.responseContainer}>
                <Text style={styles.responseText}>{response.message}</Text>
                
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
              </View>
            )}
            
            {/* Recording button - always visible at bottom */}
            {!showHelp && (
              <View style={styles.recordButtonContainer}>
                <VoiceRecordingButton
                  onRecordingStart={handleRecordingStart}
                  onRecordingStop={handleRecordingStop}
                  onRecordingComplete={handleRecordingComplete}
                  disabled={isProcessing}
                  size="medium"
                />
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
  },
  helpButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 24,
  },
  helpContent: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  processingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  responseContainer: {
    paddingTop: 8,
  },
  responseText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
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
  recordButtonContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import VoiceRecordingButton from './VoiceRecordingButton';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import Constants from 'expo-constants';

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

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
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

  // Prepare context information
  const listsInfo = Object.entries(contextData?.lists || {}).map(([id, list]: [string, any]) => ({
    id,
    name: list.name,
    itemCount: Object.values(contextData?.todos || {}).filter((todo: any) => todo.list === id).length
  }));

  const prompt = `You are a helpful shopping list assistant. Analyze this voice command and respond appropriately.

Available lists:
${listsInfo.map(list => `- ${list.name} (${list.itemCount} items)`).join('\n')}

Based on the voice command, provide:
1. A natural language response message
2. An optional action (navigate to a list, show items, etc.)

Respond in JSON format:
{
  "message": "Your helpful response here",
  "action": {
    "type": "navigate|show_list|show_items",
    "target": "list_id_if_applicable",
    "data": {}
  }
}`;

  console.log("[VoiceModal] Making request to Gemini API...");

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
    
    console.log("[VoiceModal] Gemini raw response:", text);
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedResponse = JSON.parse(jsonMatch[0]);
      return parsedResponse;
    } else {
      // Fallback if no JSON found
      return {
        message: text,
        action: null
      };
    }
  } catch (error) {
    console.error("[VoiceModal] Gemini API error:", error);
    throw error;
  }
};

export interface VoiceResponse {
  message: string;
  action?: {
    type: 'navigate' | 'show_list' | 'show_items';
    target?: string;
    data?: any;
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
  const [currentStep, setCurrentStep] = useState<'ready' | 'recording' | 'processing' | 'response'>('ready');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      setCurrentStep('ready');
      setResponse(null);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleRecordingStart = () => {
    setCurrentStep('recording');
    setResponse(null);
  };

  const handleRecordingStop = () => {
    setCurrentStep('processing');
    setIsProcessing(true);
  };

  const handleRecordingComplete = async (audioUri: string) => {
    console.log('[VoiceModal] Starting to process audio:', audioUri);
    
    try {
      setIsProcessing(true);
      console.log('[VoiceModal] Set processing to true');
      
      // Convert audio file to base64 for upload
      console.log('[VoiceModal] Fetching audio file...');
      const response = await fetch(audioUri);
      console.log('[VoiceModal] Audio file fetch response:', response.status);
      
      const blob = await response.blob();
      console.log('[VoiceModal] Audio blob size:', blob.size, 'bytes, type:', blob.type);
      
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          console.log('[VoiceModal] FileReader completed, converting to base64...');
          const base64Audio = (reader.result as string).split(',')[1];
          console.log('[VoiceModal] Base64 audio length:', base64Audio.length);
          
          console.log('[VoiceModal] Context data:', {
            listsCount: Object.keys(contextData?.lists || {}).length,
            todosCount: Object.keys(contextData?.todos || {}).length
          });
          
          // Call Gemini API directly instead of using API routes
          console.log('[VoiceModal] Calling Gemini API directly...');
          
          const result = await callGeminiVoiceAPI(
            base64Audio,
            'audio/m4a',
            contextData
          );
          
          console.log('[VoiceModal] API success result:', result);
          setResponse(result);
          setCurrentStep('response');
        } catch (innerError) {
          console.error('[VoiceModal] Error in FileReader onloadend:', innerError);
          throw innerError;
        } finally {
          setIsProcessing(false);
          console.log('[VoiceModal] Set processing to false');
        }
      };
      
      reader.onerror = (error) => {
        console.error('[VoiceModal] FileReader error:', error);
        setIsProcessing(false);
        throw new Error('Failed to read audio file');
      };
      
      console.log('[VoiceModal] Starting FileReader...');
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('[VoiceModal] Voice processing error:', error);
      Alert.alert(
        'Processing Error',
        `Failed to process your voice command: ${error.message}. Please try again.`,
        [{ text: 'OK' }]
      );
      setCurrentStep('ready');
      setIsProcessing(false);
    }
  };

  const handleActionPress = () => {
    if (!response?.action) return;

    const { action } = response;
    
    switch (action.type) {
      case 'navigate':
        if (action.target) {
          onClose();
          router.push(action.target as any);
        }
        break;
      case 'show_list':
        if (action.target) {
          onClose();
          router.push(`/(index)/list/${action.target}`);
        }
        break;
      case 'show_items':
        // Could show filtered items in a modal or navigate to a specific list
        if (action.target) {
          onClose();
          router.push(`/(index)/list/${action.target}`);
        }
        break;
    }
  };

  const handleClose = () => {
    setCurrentStep('ready');
    setResponse(null);
    setIsProcessing(false);
    onClose();
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'ready':
        return (
          <View style={styles.centerContent}>
            <View style={styles.iconContainer}>
              <Feather name="mic" size={48} color="#2196F3" />
            </View>
            <Text style={styles.title}>Voice Assistant</Text>
            <Text style={styles.subtitle}>
              Ask me about your shopping lists, add items, or navigate to specific lists
            </Text>
            <View style={styles.examplesContainer}>
              <Text style={styles.examplesTitle}>Try saying:</Text>
              <Text style={styles.example}>"What's on my grocery list?"</Text>
              <Text style={styles.example}>"Show me my home list"</Text>
              <Text style={styles.example}>"What do I need to buy?"</Text>
            </View>
            <VoiceRecordingButton
              onRecordingStart={handleRecordingStart}
              onRecordingStop={handleRecordingStop}
              onRecordingComplete={handleRecordingComplete}
            />
          </View>
        );

      case 'recording':
        return (
          <View style={styles.centerContent}>
            <View style={styles.iconContainer}>
              <Feather name="mic" size={48} color="#F44336" />
            </View>
            <Text style={styles.title}>Listening...</Text>
            <Text style={styles.subtitle}>
              Speak your question or command
            </Text>
            <VoiceRecordingButton
              onRecordingStart={handleRecordingStart}
              onRecordingStop={handleRecordingStop}
              onRecordingComplete={handleRecordingComplete}
            />
          </View>
        );

      case 'processing':
        return (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.title}>Processing...</Text>
            <Text style={styles.subtitle}>
              Analyzing your request
            </Text>
          </View>
        );

      case 'response':
        return (
          <View style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <View style={styles.iconContainer}>
                <Feather name="message-circle" size={32} color="#4CAF50" />
              </View>
              <Text style={styles.responseTitle}>Here's what I found:</Text>
            </View>
            
            <ScrollView style={styles.responseContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.responseText}>{response?.message}</Text>
            </ScrollView>

            <View style={styles.actionButtons}>
              {response?.action && (
                <Pressable style={styles.actionButton} onPress={handleActionPress}>
                  <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {response.action.type === 'navigate' ? 'Go There' : 
                     response.action.type === 'show_list' ? 'View List' : 'Show Items'}
                  </Text>
                </Pressable>
              )}
              
              <Pressable style={styles.askAgainButton} onPress={() => setCurrentStep('ready')}>
                <Feather name="mic" size={16} color="#2196F3" />
                <Text style={styles.askAgainButtonText}>Ask Again</Text>
              </Pressable>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Feather name="x" size={24} color="#6B7280" />
            </Pressable>
          </View>
          
          {renderContent()}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  examplesContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  example: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  responseContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  responseHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  responseTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  responseContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  responseText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  askAgainButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    gap: 8,
  },
  askAgainButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 16,
  },
});
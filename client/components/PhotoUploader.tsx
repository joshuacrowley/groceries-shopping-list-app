import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import PhosphorIcon from './PhosphorIcon';
import {
  useStore,
  useLocalRowIds,
  useAddRowCallback,
  useRow,
} from "tinybase/ui-react";
import { chakraColors, spacing, radii } from '@/constants/Colors';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";
import Constants from 'expo-constants';

// Initialize Gemini with API key from environment
const getGeminiAPI = () => {
  const apiKey = Constants.expoConfig?.extra?.GOOGLE_AI_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Google AI API key not found. Please set EXPO_PUBLIC_GOOGLE_AI_API_KEY in your environment.");
  }
  return new GoogleGenerativeAI(apiKey);
};

// Define the schema for structured output
const todoSchema = {
  type: SchemaType.OBJECT,
  properties: {
    todos: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "The main text of the todo item" },
          notes: { type: SchemaType.STRING, description: "Additional notes about the todo" },
          emoji: { type: SchemaType.STRING, description: "A relevant emoji for the todo" },
          category: { type: SchemaType.STRING, description: "The category of the todo" },
          type: { type: SchemaType.STRING, description: "The type of the todo (A-E)" },
          done: { type: SchemaType.BOOLEAN, description: "Whether the todo is completed" },
        },
        required: ["text", "emoji", "category", "type", "done"]
      }
    }
  },
  required: ["todos"]
};

// Timeout wrapper function
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Call Gemini API directly
const callGeminiAPI = async (
  image: string,
  mimeType: string,
  listInfo: any,
  currentTodos: any[]
) => {
  console.log("Initializing Gemini API...");
  const genAI = getGeminiAPI();

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 32,
      topP: 1,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: todoSchema,
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

  const prompt = `Analyze this image and create todo items based on it.
  Current List Information:
  - List Name: "${listInfo.name}"
  - List Purpose: "${listInfo.purpose}"
  - List Template: "${listInfo.template}"
  - Special Instructions: "${listInfo.systemPrompt}"
  
  To help you understand the schema of a todo for this list, here's the current todos: ${JSON.stringify(currentTodos)}
  Generate relevant, specific, and contextual todo items that match the style and purpose of the current list.
  Please only provide the new todos, not the existing todos provided for context.
  `;

  console.log("Making request to Gemini API...");

  // Wrap the generateContent call with timeout
  const result = await withTimeout(
    model.generateContent([
      {
        inlineData: {
          data: image,
          mimeType: mimeType,
        }
      },
      prompt
    ]),
    25000 // 25 seconds timeout
  );

  const response = result.response.text();
  console.log("Raw Gemini response:", response);
  
  const todos = JSON.parse(response);
  return todos;
};

interface PhotoUploaderProps {
  listId: string;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ listId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const store = useStore();

  const list = useRow("lists", listId);
  const todoIds = useLocalRowIds("todoList", listId);

  const addTodo = useAddRowCallback(
    "todos",
    (todoData: any) => ({
      text: todoData.text || "",
      notes: todoData.notes || "",
      emoji: todoData.emoji || "",
      category: todoData.category || "",
      type: todoData.type || "A",
      done: todoData.done || false,
      list: listId,
    }),
    [listId]
  );

  const handlePhotoPress = async () => {
    console.log("Photo button pressed");
    Alert.alert(
      "Add Photo",
      "How would you like to add a photo?",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            try {
              await openCamera();
            } catch (error) {
              console.error("Error opening camera:", error);
              Alert.alert("Error", "Failed to open camera: " + error.message);
            }
          },
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            try {
              await openImageLibrary();
            } catch (error) {
              console.error("Error opening image library:", error);
              Alert.alert("Error", "Failed to open photo library: " + error.message);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const openCamera = async () => {
    console.log("Opening camera...");
    
    try {
      // Request camera permissions
      console.log("Requesting camera permissions...");
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log("Camera permission result:", permissionResult);
      
      if (permissionResult.granted === false) {
        console.log("Camera permission denied");
        Alert.alert("Permission Required", "Permission to access camera is required!");
        return;
      }

      console.log("Launching camera...");
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      console.log("Camera result:", result);

      if (!result.canceled && result.assets[0]) {
        console.log("Processing camera result...");
        await processImageResult(result.assets[0]);
      } else {
        console.log("Camera was canceled or no assets");
      }
    } catch (error) {
      console.error("Error in openCamera:", error);
      Alert.alert("Camera Error", "Failed to open camera: " + error.message);
    }
  };

  const openImageLibrary = async () => {
    console.log("Opening image library...");
    
    try {
      // Request photo library permissions
      console.log("Requesting media library permissions...");
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Media library permission result:", permissionResult);
      
      if (permissionResult.granted === false) {
        console.log("Media library permission denied");
        Alert.alert("Permission Required", "Permission to access photo library is required!");
        return;
      }

      console.log("Launching image library...");
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      console.log("Image library result:", result);

      if (!result.canceled && result.assets[0]) {
        console.log("Processing image library result...");
        await processImageResult(result.assets[0]);
      } else {
        console.log("Image library was canceled or no assets");
      }
    } catch (error) {
      console.error("Error in openImageLibrary:", error);
      Alert.alert("Image Library Error", "Failed to open photo library: " + error.message);
    }
  };

  const processImageResult = async (asset: ImagePicker.ImagePickerAsset) => {
    console.log("Processing image result:", asset);
    setIsUploading(true);
    
    try {
      console.log("Calling handlePhotoSelected with URI:", asset.uri);
      await handlePhotoSelected(asset.uri, asset.mimeType || 'image/jpeg');
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert(
        "Error", 
        "Failed to process the image. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const convertUriToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handlePhotoSelected = useCallback(
    async (uri: string, mimeType: string) => {
      console.log("Platform:", Platform.OS);
      
      const currentTodos = todoIds
        .slice(0, 5)
        .map((id) => store.getRow("todos", id));

      try {
        const base64Image = await convertUriToBase64(uri);
        
        console.log("Calling Google Gemini API directly...");
        
        // Call Google Gemini API directly instead of going through Expo Router API route
        const result = await callGeminiAPI(base64Image, mimeType, {
          name: list.name,
          purpose: list.purpose,
          template: list.template,
          systemPrompt: list.systemPrompt,
        }, currentTodos);
        
        if (result && result.todos) {
          console.log(`Generated ${result.todos.length} todos from image`);
          
          store.transaction(() => {
            for (const todo of result.todos) {
              addTodo(todo);
            }
          });

          Alert.alert(
            "Success",
            `Added ${result.todos.length} new todos based on the image.`
          );
        } else {
          throw new Error("No todos generated from the image");
        }
      } catch (error) {
        console.error("Error generating todos:", error);
        
        let errorMessage = "Failed to generate todos from the image. Please try again.";
        if (error instanceof Error) {
          if (error.message === 'Request timeout') {
            errorMessage = "Request timed out - the image processing took too long. Please try again.";
          } else if (error.message.includes("quota") || error.message.includes("exhausted")) {
            errorMessage = "The AI service is currently at capacity. Please try again in a few minutes.";
          } else if (error.message.includes("API key")) {
            errorMessage = "API configuration error. Please check your settings.";
          }
        }

        Alert.alert("Error", errorMessage);
      }
    },
    [listId, list, todoIds, store, addTodo]
  );

  // Show photo button on all platforms

  return (
    <Pressable
      style={[styles.button, isUploading && styles.buttonDisabled]}
      onPress={handlePhotoPress}
      disabled={isUploading}
    >
      {isUploading ? (
        <ActivityIndicator size="small" color={chakraColors.gray[600]} />
      ) : (
        <PhosphorIcon 
          name="Camera" 
          size={18} 
          color={chakraColors.gray[600]} 
          weight="regular"
        />
      )}
      <Text style={[styles.buttonText, isUploading && styles.buttonTextDisabled]}>
        {isUploading ? "Processing..." : "Photo"}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    backgroundColor: 'transparent',
    gap: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    color: chakraColors.gray[600],
    fontWeight: '500',
  },
  buttonTextDisabled: {
    color: chakraColors.gray[400],
  },
});

export default PhotoUploader;
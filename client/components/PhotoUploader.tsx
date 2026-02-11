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
import { Type } from '@google/genai';
import { callGeminiProxy } from '@/lib/geminiProxy';
import { useAuth } from '@clerk/clerk-expo';

// Call Gemini API through server proxy
const callGeminiAPI = async (
  image: string,
  mimeType: string,
  listInfo: any,
  currentTodos: any[],
  getToken: () => Promise<string | null>
) => {
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
              description: "Additional notes about the todo"
            },
            emoji: {
              type: Type.STRING,
              description: "A relevant emoji for the todo"
            },
            category: {
              type: Type.STRING,
              description: "The category of the todo"
            },
            type: {
              type: Type.STRING,
              description: "The type of the todo (A-E)"
            },
            done: {
              type: Type.BOOLEAN,
              description: "Whether the todo is completed"
            }
          },
          required: ["text", "done"],
          propertyOrdering: ["text", "notes", "emoji", "category", "type", "done"]
        }
      }
    },
    required: ["todos"],
    propertyOrdering: ["todos"]
  };

  const prompt = `Analyze this image and create todo items based on it.
  Current List Information:
  - List Name: "${listInfo.name}"
  - List Purpose: "${listInfo.purpose}"
  - List Template: "${listInfo.template}"
  - Special Instructions: "${listInfo.systemPrompt}"
  
  To help you understand the schema of a todo for this list, here's the current todos: ${JSON.stringify(currentTodos)}
  Generate relevant, specific, and contextual todo items that match the style and purpose of the current list.
  Please only provide the new todos, not the existing todos provided for context.`;

  try {
    const text = await callGeminiProxy(
      {
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: image,
            }
          },
          { text: prompt }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema
        }
      },
      getToken
    );
    
    // Parse the JSON response directly
    const parsedResponse = JSON.parse(text);
    return parsedResponse;
  } catch (error) {
    throw error;
  }
};

interface PhotoUploaderProps {
  listId: string;
  iconOnly?: boolean;
  color?: string;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ listId, iconOnly, color }) => {
  const [isUploading, setIsUploading] = useState(false);
  const store = useStore();
  const { getToken } = useAuth();

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
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera is required!");
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await processImageResult(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Camera Error", "Failed to open camera: " + error.message);
    }
  };

  const openImageLibrary = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access photo library is required!");
        return;
      }
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3, // Reduce quality for faster processing
        base64: true, // Enable base64 encoding
      });

      if (!result.canceled && result.assets[0]) {
        await processImageResult(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Image Library Error", "Failed to open photo library: " + error.message);
    }
  };

  const processImageResult = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploading(true);
    
    try {
      
      // Pass the base64 data directly if available
      await handlePhotoSelected(asset.uri, asset.mimeType || 'image/jpeg', asset.base64);
    } catch (error) {
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
    async (uri: string, mimeType: string, base64Data?: string) => {
      const currentTodos = todoIds
        .slice(0, 5)
        .map((id) => store.getRow("todos", id));

      try {
        const base64Image = base64Data || await convertUriToBase64(uri);
        
        // Call Google Gemini API via server proxy
        const result = await callGeminiAPI(base64Image, mimeType, {
          name: list.name,
          purpose: list.purpose,
          template: list.template,
          systemPrompt: list.systemPrompt,
        }, currentTodos, getToken);
        
        if (result && result.todos) {
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

  const iconColor = color || chakraColors.gray[600];

  return (
    <Pressable
      style={[styles.button, isUploading && styles.buttonDisabled]}
      onPress={handlePhotoPress}
      disabled={isUploading}
    >
      {isUploading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <PhosphorIcon 
          name="Camera" 
          size={iconOnly ? 22 : 18} 
          color={iconColor} 
          weight="regular"
        />
      )}
      {!iconOnly && (
        <Text style={[styles.buttonText, isUploading && styles.buttonTextDisabled, color && { color }]}>
          {isUploading ? "Processing..." : "Photo"}
        </Text>
      )}
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
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
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
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Permission to access camera roll is required!");
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setIsUploading(true);
      
      try {
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
      const currentTodos = todoIds
        .slice(0, 5)
        .map((id) => store.getRow("todos", id));

      try {
        const base64Image = await convertUriToBase64(uri);
        
        const response = await fetch("/api/photo-gemini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Image,
            mimeType: mimeType,
            listInfo: {
              name: list.name,
              purpose: list.purpose,
              template: list.template,
              systemPrompt: list.systemPrompt,
            },
            currentTodos,
          }),
        });

        if (response.status === 429) {
          Alert.alert(
            "Rate Limit",
            "Please wait a moment before trying again. The AI service is currently busy."
          );
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to process image: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        store.transaction(() => {
          for (const todo of data.todos) {
            addTodo(todo);
          }
        });

        Alert.alert(
          "Success",
          `Added ${data.todos.length} new todos based on the image.`
        );
      } catch (error) {
        console.error("Error generating todos:", error);
        
        let errorMessage = "Failed to generate todos from the image. Please try again.";
        if (error instanceof Error) {
          if (error.message.includes("quota") || error.message.includes("exhausted")) {
            errorMessage = "The AI service is currently at capacity. Please try again in a few minutes.";
          }
        }

        Alert.alert("Error", errorMessage);
      }
    },
    [listId, list, todoIds, store, addTodo]
  );

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
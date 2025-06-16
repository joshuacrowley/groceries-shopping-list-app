import React, { useEffect, useState } from "react";
import { Link, Stack, useRouter } from "expo-router";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { appleBlue, backgroundColors, emojies } from "@/constants/Colors";
import { useListCreation } from "@/context/ListCreationContext";
import { useAddShoppingListCallback } from "@/stores/ShoppingListsStore";
import { LIST_TYPE, BACKGROUND_COLOUR } from "@/stores/schema";

// Available templates - key ones to show in UI
const AVAILABLE_TEMPLATES = [
  { id: "", name: "Default", description: "Basic todo list functionality" },
  { id: "ShoppingListv2", name: "Shopping List", description: "Categorized grocery list with prices and notes" },
  { id: "Basic", name: "Simple List", description: "Clean and minimal list interface" },
  { id: "Focus", name: "Focus List", description: "Narrow down to focus on one thing at a time" },
  { id: "HabitTracker", name: "Habit Tracker", description: "Track daily habits and routines" },
  { id: "MealPlanningAssistant", name: "Meal Planner", description: "Plan your weekly meals" },
  { id: "Christmas", name: "Christmas List", description: "Holiday planning and gift tracking" },
  { id: "DecisionLog", name: "Decision Log", description: "Track and categorize important decisions" },
];

// Helper function to map schema colors to actual color values
const getColorValue = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    blue: "#3b82f6",
    green: "#22c55e", 
    red: "#ef4444",
    yellow: "#eab308",
    purple: "#8b5cf6"
  };
  return colorMap[colorName] || "#3b82f6";
};

export default function CreateListScreen() {
  const [listName, setListName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedType, setSelectedType] = useState<string>("Info");
  const [backgroundColour, setBackgroundColour] = useState<string>("blue");
  const [icon, setIcon] = useState("");
  const [number, setNumber] = useState<string>("");
  const [template, setTemplate] = useState("");
  const [code, setCode] = useState("");
  const { selectedEmoji, setSelectedEmoji, selectedColor, setSelectedColor } =
    useListCreation();

  const router = useRouter();
  const useAddShoppingList = useAddShoppingListCallback();

  useEffect(() => {
    setSelectedEmoji(emojies[Math.floor(Math.random() * emojies.length)]);
    setSelectedColor(
      backgroundColors[Math.floor(Math.random() * backgroundColors.length)]
    );
    setIcon(emojies[Math.floor(Math.random() * emojies.length)]);

    // Cleanup function to reset context when unmounting
    return () => {
      setSelectedEmoji("");
      setSelectedColor("");
    };
  }, []);

  const handleCreateList = () => {
    if (!listName) {
      return;
    }

    const listId = useAddShoppingList(
      listName,
      purpose,
      selectedEmoji || icon,
      backgroundColour,
      selectedType,
      systemPrompt,
      number ? parseInt(number) : undefined,
      template,
      code
    );

    router.replace({
      pathname: "/list/[listId]",
      params: { listId },
    });
  };

  const handleCreateTestLists = () => {
    const testListNames = [
      "Grocery Shopping",
      "Weekend BBQ",
      "Party Supplies",
      "Office Supplies",
      "Camping Trip",
      "Holiday Gifts",
      "Home Improvement",
      "School Supplies",
      "Birthday Party",
      "Household Items",
    ];

    const testEmojis = [
      "🛒",
      "🍖",
      "🎉",
      "📎",
      "⛺️",
      "🎁",
      "🔨",
      "📚",
      "🎂",
      "🏠",
    ];
    const testColors = Object.values(backgroundColors).slice(0, 10);

    testListNames.forEach((name, index) => {
      useAddShoppingList(
        name,
        `This is a test list for ${name}`,
        testEmojis[index],
        testColors[index]
      );
    });

    // Navigate back to the main list view
    router.replace("/");
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLargeTitle: false,
          headerTitle: "New list",
        }}
      />
      <BodyScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="List Name"
              value={listName}
              onChangeText={setListName}
              returnKeyType="next"
              variant="ghost"
              size="lg"
              autoFocus
              inputStyle={styles.titleInput}
              containerStyle={styles.titleInputContainer}
            />
            <Link
              href={{ pathname: "/emoji-picker" }}
              style={[styles.emojiButton, { borderColor: getColorValue(backgroundColour) }]}
            >
              <View style={styles.emojiContainer}>
                <Text>{selectedEmoji || icon}</Text>
              </View>
            </Link>
          </View>

          <TextInput
            placeholder="Purpose (optional)"
            value={purpose}
            onChangeText={setPurpose}
            returnKeyType="next"
            variant="ghost"
            inputStyle={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>List Type</Text>
          <ScrollView horizontal style={styles.typeScrollView} showsHorizontalScrollIndicator={false}>
            {LIST_TYPE.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  selectedType === type && styles.selectedTypeButton
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === type && styles.selectedTypeButtonText
                ]}>{type}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background Color</Text>
          <ScrollView horizontal style={styles.colorScrollView} showsHorizontalScrollIndicator={false}>
            {BACKGROUND_COLOUR.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: getColorValue(color) },
                  backgroundColour === color && styles.selectedColorOption
                ]}
                onPress={() => setBackgroundColour(color)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Template</Text>
          <ScrollView style={styles.templateScrollView} showsVerticalScrollIndicator={false}>
            {AVAILABLE_TEMPLATES.map((templateOption) => (
              <Pressable
                key={templateOption.id}
                style={[
                  styles.templateOption,
                  template === templateOption.id && styles.selectedTemplateOption
                ]}
                onPress={() => setTemplate(templateOption.id)}
              >
                <View style={styles.templateContent}>
                  <Text style={[
                    styles.templateName,
                    template === templateOption.id && styles.selectedTemplateName
                  ]}>
                    {templateOption.name}
                  </Text>
                  <Text style={[
                    styles.templateDescription,
                    template === templateOption.id && styles.selectedTemplateDescription
                  ]}>
                    {templateOption.description}
                  </Text>
                </View>
                {template === templateOption.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Options</Text>
          
          <TextInput
            placeholder="System Prompt (optional)"
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            returnKeyType="next"
            variant="ghost"
            inputStyle={styles.input}
            multiline
          />
          
          <TextInput
            placeholder="Number (optional)"
            value={number}
            onChangeText={setNumber}
            returnKeyType="next"
            variant="ghost"
            inputStyle={styles.input}
            keyboardType="numeric"
          />
          
          <TextInput
            placeholder="Code (optional)"
            value={code}
            onChangeText={setCode}
            returnKeyType="done"
            variant="ghost"
            inputStyle={styles.input}
            multiline
          />
        </View>
        <Button
          onPress={handleCreateList}
          disabled={!listName}
          variant="ghost"
          textStyle={styles.createButtonText}
        >
          Create list
        </Button>
        <Button
          onPress={handleCreateTestLists}
          variant="ghost"
          textStyle={styles.createButtonText}
        >
          Create 10 test lists
        </Button>
      </BodyScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1f2937",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  titleInput: {
    fontWeight: "600",
    fontSize: 24,
    padding: 0,
  },
  titleInputContainer: {
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: "auto",
    marginBottom: 0,
  },
  input: {
    padding: 0,
    fontSize: 16,
  },
  emojiButton: {
    padding: 1,
    borderWidth: 3,
    borderRadius: 100,
  },
  emojiContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  typeScrollView: {
    flexGrow: 0,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectedTypeButton: {
    backgroundColor: appleBlue,
    borderColor: appleBlue,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  selectedTypeButtonText: {
    color: "#ffffff",
  },
  colorScrollView: {
    flexGrow: 0,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColorOption: {
    borderColor: "#1f2937",
    borderWidth: 3,
  },
  createButtonText: {
    color: appleBlue,
    fontWeight: "normal",
  },
  templateScrollView: {
    maxHeight: 300,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTemplateOption: {
    backgroundColor: '#eff6ff',
    borderColor: appleBlue,
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedTemplateName: {
    color: appleBlue,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  selectedTemplateDescription: {
    color: '#1e40af',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: appleBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

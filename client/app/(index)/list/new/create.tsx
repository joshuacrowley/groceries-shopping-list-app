import React, { useEffect, useState } from "react";
import { Link, Stack, useRouter, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, SafeAreaView } from "react-native";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { appleBlue, backgroundColors, emojies } from "@/constants/Colors";
import { useListCreation } from "@/context/ListCreationContext";
import { useAddShoppingListCallback } from "@/stores/ShoppingListsStore";
import { LIST_TYPE, BACKGROUND_COLOUR } from "@/stores/schema";
import catalogue from '../../../../catalogue.json';

// Get available templates from catalogue, filtered and formatted for UI
const AVAILABLE_TEMPLATES = [
  { id: "", name: "Default", description: "Basic todo list functionality", type: "Info" },
  ...catalogue
    .filter(template => template.published)
    .map(template => ({
      id: template.template,
      name: template.name,
      description: template.purpose,
      type: template.type,
      systemPrompt: template.systemPrompt || '',
      backgroundColour: template.backgroundColour || 'blue',
      icon: template.icon || '📝'
    }))
    .slice(0, 20) // Limit to top 20 for UI performance
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
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [createdListId, setCreatedListId] = useState<string>("");
  const { selectedEmoji, setSelectedEmoji, selectedColor, setSelectedColor } =
    useListCreation();

  const router = useRouter();
  const params = useLocalSearchParams();
  const addShoppingList = useAddShoppingListCallback();

  useEffect(() => {
    // Set random defaults only once
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
  }, []); // Remove params dependency to prevent infinite loop

  // Separate useEffect for handling URL parameters
  useEffect(() => {
    // Handle URL parameters for voice/photo creation
    if (params.selectedTemplate) {
      const selectedTemplateData = AVAILABLE_TEMPLATES.find(t => t.id === params.selectedTemplate);
      if (selectedTemplateData) {
        setTemplate(params.selectedTemplate as string);
        setSystemPrompt(selectedTemplateData.systemPrompt);
        setBackgroundColour(selectedTemplateData.backgroundColour);
        setSelectedType(selectedTemplateData.type);
        setIcon(selectedTemplateData.icon);
      }
    }
    
    if (params.description) {
      setPurpose(params.description as string);
    }

    if (params.fromVoice === 'true') {
      setListName(params.suggestedName as string || `Voice-created list`);
    }

    if (params.fromPhoto === 'true') {
      setListName(params.suggestedName as string || `Photo-based list`);
      
      if (params.suggestedIcon) {
        setIcon(params.suggestedIcon as string);
      }
    }
  }, [params.selectedTemplate, params.description, params.fromVoice, params.fromPhoto, params.suggestedName, params.suggestedIcon, params.photoUri, params.photoAnalysis]); // Only depend on specific param values

  const handleCreateList = () => {
    if (!listName) {
      return;
    }

    const listId = addShoppingList(
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

    setCreatedListId(listId);

    // Show follow-up modal for voice/photo creation with AI todo generation
    if ((params.fromVoice === 'true' || params.fromPhoto === 'true') && systemPrompt) {
      setShowFollowUpModal(true);
    } else {
      router.replace({
        pathname: "/list/[listId]",
        params: { listId },
      });
    }
  };

  const handleGenerateTodos = async () => {
    setShowFollowUpModal(false);
    // Navigate to list and show loading/generation state
    router.replace({
      pathname: "/list/[listId]",
      params: { 
        listId: createdListId,
        generateTodos: 'true',
        systemPrompt: systemPrompt,
        description: purpose || params.description as string || '',
        photoUri: params.photoUri as string || '',
        photoAnalysis: params.photoAnalysis as string || '',
        fromVoice: params.fromVoice as string || '',
        fromPhoto: params.fromPhoto as string || ''
      },
    });
  };

  const handleSkipTodos = () => {
    setShowFollowUpModal(false);
    router.replace({
      pathname: "/list/[listId]",
      params: { listId: createdListId },
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false, // Hide the default header to prevent overlap
        }}
      />
      
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          textStyle={styles.cancelButtonText}
        >
          Cancel
        </Button>
        <Text style={styles.headerTitle}>New list</Text>
        <View style={styles.headerSpacer} />
      </View>
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
                onPress={() => {
                  setTemplate(templateOption.id);
                  // Auto-populate system prompt and other fields when template is selected
                  if (templateOption.id && templateOption.systemPrompt) {
                    setSystemPrompt(templateOption.systemPrompt);
                  } else {
                    setSystemPrompt('');
                  }
                  if (templateOption.backgroundColour) {
                    setBackgroundColour(templateOption.backgroundColour);
                  }
                  if (templateOption.type) {
                    setSelectedType(templateOption.type);
                  }
                }}
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

      {/* Follow-up Modal for AI Todo Generation */}
      {showFollowUpModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.followUpModal}>
            <Text style={styles.followUpTitle}>List Created Successfully!</Text>
            <Text style={styles.followUpSubtitle}>
              Would you like me to create todos for this list using AI? 
              I'll use the template's system prompt to generate relevant tasks based on your description.
            </Text>
            
            <View style={styles.followUpButtons}>
              <Pressable 
                style={[styles.followUpButton, styles.generateButton]} 
                onPress={handleGenerateTodos}
              >
                <Text style={styles.generateButtonText}>Generate Todos</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.followUpButton, styles.skipButton]} 
                onPress={handleSkipTodos}
              >
                <Text style={styles.skipButtonText}>No Thanks</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E9EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerSpacer: {
    width: 60, // Same width as cancel button to center title
  },
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
  modalOverlay: {
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
  followUpModal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  followUpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  followUpSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  followUpButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  followUpButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButton: {
    backgroundColor: appleBlue,
  },
  skipButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
});

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import {
  useLocalRowIds,
  useRow,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
} from "tinybase/ui-react";
import {
  Plus,
  Trash,
  Cookie,
  CaretDown,
  CaretUp,
  ForkKnife,
  Timer,
  BookOpen,
  Fire,
  Scales,
  PencilSimple,
  Check,
  CookingPot,
} from "phosphor-react-native";

const FOOD_EMOJIS = ["🥩", "🍄", "🧀", "🧄", "🥕", "🥘", "🥛", "🍅", "🍖", "🍝", "👩‍🍳", "⏲️", "🌿", "🍞", "🥡", "📝", "❄️", "🧈", "🥜", "🍫", "⚖️", "🥚", "🍪", "🔥", "⚪", "🍽️", "🥛", "📸", "📄", "🔒"];

const CATEGORIES = [
  { name: "Main Dishes", icon: ForkKnife, color: "#3182CE" },
  { name: "Quick Meals", icon: Timer, color: "#38A169" },
  { name: "Family Recipes", icon: BookOpen, color: "#805AD5" },
  { name: "Special Diet", icon: Scales, color: "#D53F8C" },
  { name: "Baking", icon: Fire, color: "#DD6B20" },
];

interface RecipeItemProps {
  id: string;
}

const RecipeItem: React.FC<RecipeItemProps> = ({ id }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const recipeData = useRow("todos", id);

  const updateRecipe = useSetRowCallback(
    "todos",
    id,
    (updates) => ({ ...recipeData, ...updates }),
    [recipeData]
  );

  const deleteRecipe = useDelRowCallback("todos", id);

  const handleEdit = useCallback(
    (field: string, value: any) => {
      updateRecipe({ [field]: value });
    },
    [updateRecipe]
  );

  const startEdit = (field: string) => {
    setIsEditing(field);
    setEditValue(recipeData?.[field] || "");
  };

  const saveEdit = () => {
    if (isEditing) {
      handleEdit(isEditing, editValue);
      setIsEditing(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditValue("");
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteRecipe },
      ]
    );
  };

  const category = CATEGORIES.find(c => c.name === recipeData?.category);

  if (!recipeData) return null;

  return (
    <View style={styles.recipeItem}>
      <View style={styles.recipeHeader}>
        <Pressable
          style={styles.emojiButton}
          onPress={() => setShowEmojiPicker(true)}
        >
          <Text style={styles.emoji}>{recipeData.emoji || "🍳"}</Text>
        </Pressable>

        <View style={styles.recipeInfo}>
          {isEditing === "text" ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                autoFocus
              />
              <View style={styles.editActions}>
                <Pressable onPress={saveEdit} style={styles.editButton}>
                  <Check size={16} color="#38A169" />
                </Pressable>
                <Pressable onPress={cancelEdit} style={styles.editButton}>
                  <Text style={styles.cancelText}>✕</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => startEdit("text")} style={styles.titleContainer}>
              <Text style={styles.recipeTitle}>{recipeData.text}</Text>
              <PencilSimple size={16} color="#718096" />
            </Pressable>
          )}
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: category?.color + "20" }]}>
          <Text style={[styles.categoryText, { color: category?.color }]}>
            {recipeData.category}
          </Text>
        </View>

        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.iconButton}
        >
          {isExpanded ? (
            <CaretUp size={16} color="#718096" />
          ) : (
            <CaretDown size={16} color="#718096" />
          )}
        </Pressable>

        <Pressable onPress={handleDelete} style={styles.iconButton}>
          <Trash size={16} color="#E53E3E" />
        </Pressable>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions:</Text>
            {isEditing === "notes" ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={[styles.editInput, styles.textArea]}
                  value={editValue}
                  onChangeText={setEditValue}
                  multiline
                  autoFocus
                />
                <View style={styles.editActions}>
                  <Pressable onPress={saveEdit} style={styles.editButton}>
                    <Check size={16} color="#38A169" />
                  </Pressable>
                  <Pressable onPress={cancelEdit} style={styles.editButton}>
                    <Text style={styles.cancelText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => startEdit("notes")} style={styles.notesContainer}>
                <Text style={styles.notesText}>{recipeData.notes || "Tap to add instructions..."}</Text>
                <PencilSimple size={16} color="#718096" />
              </Pressable>
            )}
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.categorySection}>
              <Text style={styles.sectionTitle}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map(({ name, color }) => (
                  <Pressable
                    key={name}
                    onPress={() => handleEdit("category", name)}
                    style={[
                      styles.categoryOption,
                      recipeData.category === name && { backgroundColor: color + "20", borderColor: color }
                    ]}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      recipeData.category === name && { color }
                    ]}>
                      {name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.servesSection}>
              <Text style={styles.sectionTitle}>Serves:</Text>
              <View style={styles.numberInput}>
                <Pressable
                  onPress={() => handleEdit("number", Math.max(1, (recipeData.number || 1) - 1))}
                  style={styles.numberButton}
                >
                  <Text style={styles.numberButtonText}>-</Text>
                </Pressable>
                <Text style={styles.numberText}>{recipeData.number || 1}</Text>
                <Pressable
                  onPress={() => handleEdit("number", (recipeData.number || 1) + 1)}
                  style={styles.numberButton}
                >
                  <Text style={styles.numberButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>URL:</Text>
            {isEditing === "url" ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder="Add recipe URL"
                  autoFocus
                />
                <View style={styles.editActions}>
                  <Pressable onPress={saveEdit} style={styles.editButton}>
                    <Check size={16} color="#38A169" />
                  </Pressable>
                  <Pressable onPress={cancelEdit} style={styles.editButton}>
                    <Text style={styles.cancelText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => startEdit("url")} style={styles.urlContainer}>
                <Text style={styles.urlText}>{recipeData.url || "Tap to add URL..."}</Text>
                <PencilSimple size={16} color="#718096" />
              </Pressable>
            )}
          </View>
        </View>
      )}

      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowEmojiPicker(false)}
        >
          <View style={styles.emojiPickerContainer}>
            <Text style={styles.emojiPickerTitle}>Choose Emoji</Text>
            <ScrollView style={styles.emojiGrid}>
              <View style={styles.emojiRow}>
                {FOOD_EMOJIS.map((emoji, index) => (
                  <Pressable
                    key={emoji}
                    style={styles.emojiOption}
                    onPress={() => {
                      handleEdit("emoji", emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (recipe: any) => void;
}

const AddRecipeModal: React.FC<AddRecipeModalProps> = ({ visible, onClose, onAdd }) => {
  const [newRecipe, setNewRecipe] = useState({
    text: "",
    category: CATEGORIES[0].name,
    notes: "",
    emoji: "🍳",
    number: 1,
    url: "",
    done: false,
    type: "A",
  });
  const [nameError, setNameError] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = () => {
    if (!newRecipe.text.trim()) {
      setNameError(true);
      return;
    } else {
      setNameError(false);
    }

    onAdd(newRecipe);
    setNewRecipe({
      text: "",
      category: CATEGORIES[0].name,
      notes: "",
      emoji: "🍳",
      number: 1,
      url: "",
      done: false,
      type: "A",
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Recipe</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <View style={styles.nameRow}>
                <Pressable
                  style={styles.emojiSelectButton}
                  onPress={() => setShowEmojiPicker(true)}
                >
                  <Text style={styles.emoji}>{newRecipe.emoji}</Text>
                  <CaretDown size={16} color="#718096" />
                </Pressable>
                <TextInput
                  style={[styles.input, { flex: 1 }, nameError && styles.inputError]}
                  placeholder="Recipe name"
                  value={newRecipe.text}
                  onChangeText={(text) => setNewRecipe({ ...newRecipe, text })}
                />
              </View>
              {nameError && (
                <Text style={styles.errorText}>Recipe name is required.</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map(({ name, color }) => (
                  <Pressable
                    key={name}
                    onPress={() => setNewRecipe({ ...newRecipe, category: name })}
                    style={[
                      styles.categoryOption,
                      newRecipe.category === name && { backgroundColor: color + "20", borderColor: color }
                    ]}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newRecipe.category === name && { color }
                    ]}>
                      {name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Instructions:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newRecipe.notes}
                onChangeText={(text) => setNewRecipe({ ...newRecipe, notes: text })}
                placeholder="Enter recipe instructions..."
                multiline
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>URL:</Text>
              <TextInput
                style={styles.input}
                value={newRecipe.url}
                onChangeText={(text) => setNewRecipe({ ...newRecipe, url: text })}
                placeholder="Recipe URL (optional)"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Serves:</Text>
              <View style={styles.numberInput}>
                <Pressable
                  onPress={() => setNewRecipe({ ...newRecipe, number: Math.max(1, newRecipe.number - 1) })}
                  style={styles.numberButton}
                >
                  <Text style={styles.numberButtonText}>-</Text>
                </Pressable>
                <Text style={styles.numberText}>{newRecipe.number}</Text>
                <Pressable
                  onPress={() => setNewRecipe({ ...newRecipe, number: newRecipe.number + 1 })}
                  style={styles.numberButton}
                >
                  <Text style={styles.numberButtonText}>+</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Add Recipe</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>

          {showEmojiPicker && (
            <Modal
              visible={showEmojiPicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowEmojiPicker(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowEmojiPicker(false)}
              >
                <View style={styles.emojiPickerContainer}>
                  <Text style={styles.emojiPickerTitle}>Choose Emoji</Text>
                  <ScrollView style={styles.emojiGrid}>
                    <View style={styles.emojiRow}>
                      {FOOD_EMOJIS.map((emoji) => (
                        <Pressable
                          key={emoji}
                          style={styles.emojiOption}
                          onPress={() => {
                            setNewRecipe({ ...newRecipe, emoji });
                            setShowEmojiPicker(false);
                          }}
                        >
                          <Text style={styles.emojiOptionText}>{emoji}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </Pressable>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface RecipeListProps {
  listId: string;
}

const RecipeList: React.FC<RecipeListProps> = ({ listId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addRecipe = useAddRowCallback(
    "todos",
    (recipe) => ({
      text: recipe.text.trim(),
      category: recipe.category,
      notes: recipe.notes,
      emoji: recipe.emoji,
      number: recipe.number,
      url: recipe.url,
      done: false,
      type: "A",
      list: listId,
    }),
    [listId]
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CookingPot size={32} color="#3182CE" />
            <Text style={styles.title}>
              {listData?.name || "Recipe Collection"}
            </Text>
          </View>
          <Pressable
            style={styles.addButton}
            onPress={() => setIsModalOpen(true)}
          >
            <Plus size={20} color="white" />
            <Text style={styles.addButtonText}>Add Recipe</Text>
          </Pressable>
        </View>

        <View style={styles.recipesList}>
          {todoIds.map((id) => (
            <RecipeItem key={id} id={id} />
          ))}

          {todoIds.length === 0 && (
            <View style={styles.emptyState}>
              <Cookie size={48} color="#CBD5E0" />
              <Text style={styles.emptyText}>No recipes yet. Start by adding your favorite recipe!</Text>
            </View>
          )}
        </View>
      </View>

      <AddRecipeModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addRecipe}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EBF8FF",
  },
  content: {
    padding: 16,
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3748",
    marginLeft: 12,
  },
  addButton: {
    backgroundColor: "#3182CE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  recipesList: {
    gap: 16,
  },
  recipeItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emojiButton: {
    padding: 4,
  },
  emoji: {
    fontSize: 20,
  },
  recipeInfo: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  iconButton: {
    padding: 4,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
  },
  notesContainer: {
    backgroundColor: "#F7FAFC",
    padding: 12,
    borderRadius: 6,
    minHeight: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  notesText: {
    flex: 1,
    color: "#2D3748",
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
  },
  categorySection: {
    flex: 2,
    gap: 8,
  },
  categoryOption: {
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 12,
    color: "#4A5568",
  },
  servesSection: {
    flex: 1,
    gap: 8,
  },
  numberInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  numberButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#E2E8F0",
  },
  numberButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5568",
  },
  numberText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    color: "#2D3748",
  },
  urlContainer: {
    backgroundColor: "#F7FAFC",
    padding: 12,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  urlText: {
    flex: 1,
    color: "#2D3748",
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    color: "#2D3748",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    gap: 4,
  },
  editButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
    color: "#E53E3E",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: {
    color: "#718096",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#718096",
  },
  modalContent: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A5568",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emojiSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 8,
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: "#2D3748",
  },
  inputError: {
    borderColor: "#E53E3E",
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  submitButton: {
    backgroundColor: "#3182CE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: "#718096",
  },
  emojiPickerContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "80%",
    maxHeight: "60%",
  },
  emojiPickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 12,
    textAlign: "center",
  },
  emojiGrid: {
    flex: 1,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  emojiOption: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F7FAFC",
  },
  emojiOptionText: {
    fontSize: 24,
  },
});

export default RecipeList;
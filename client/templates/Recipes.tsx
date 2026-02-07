import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
} from "react-native";
import {
  useLocalRowIds,
  useRow,
  useDelRowCallback,
  useAddRowCallback,
  useStore,
} from "tinybase/ui-react";
import {
  Plus,
  Trash,
  CaretDown,
  CaretUp,
  ForkKnife,
  Timer,
  BookOpen,
  Fire,
  Scales,
  CookingPot,
} from "phosphor-react-native";

const FOOD_EMOJIS = [
  "🥩", "🍄", "🧀", "🧄", "🥕", "🥘", "🥛", "🍅", "🍖", "🍝",
  "👩‍🍳", "⏲️", "🌿", "🍞", "🥡", "📝", "❄️", "🧈", "🥜", "🍫",
  "⚖️", "🥚", "🍪", "🔥", "🍽️", "📸", "📄", "🍳",
];

const CATEGORIES = [
  { name: "Main Dishes", color: "#3182CE" },
  { name: "Quick Meals", color: "#38A169" },
  { name: "Family Recipes", color: "#805AD5" },
  { name: "Special Diet", color: "#ED64A6" },
  { name: "Baking", color: "#DD6B20" },
];

const RecipeItem = memo(({ id }: { id: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const recipeData = useRow("todos", id);
  const store = useStore();
  const deleteRecipe = useDelRowCallback("todos", id);

  const handleDelete = useCallback(() => {
    Alert.alert("Delete Recipe", "Remove this recipe?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteRecipe },
    ]);
  }, [deleteRecipe]);

  if (!recipeData) return null;

  const category = CATEGORIES.find((c) => c.name === String(recipeData.category));
  const catColor = category?.color || "#718096";

  return (
    <View style={styles.recipeItem}>
      <View style={styles.recipeHeader}>
        <Pressable
          onPress={() => {
            /* emoji picker would go here */
          }}
        >
          <Text style={styles.recipeEmoji}>
            {String(recipeData.emoji || "🍳")}
          </Text>
        </Pressable>

        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{String(recipeData.text || "")}</Text>
        </View>

        <View style={[styles.categoryBadge, { backgroundColor: catColor + "20" }]}>
          <Text style={[styles.categoryBadgeText, { color: catColor }]}>
            {String(recipeData.category || "Main Dishes")}
          </Text>
        </View>

        <Pressable onPress={() => setIsExpanded(!isExpanded)} style={styles.actionBtn}>
          {isExpanded ? (
            <CaretUp size={16} color="#718096" />
          ) : (
            <CaretDown size={16} color="#718096" />
          )}
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.actionBtn}>
          <Trash size={16} color="#E53E3E" />
        </Pressable>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Instructions:</Text>
            <TextInput
              style={[styles.textInput, styles.instructionsInput]}
              defaultValue={String(recipeData.notes || "")}
              onEndEditing={(e) =>
                store?.setCell("todos", id, "notes", e.nativeEvent.text)
              }
              placeholder="Enter recipe instructions..."
              multiline
            />
          </View>

          <View style={styles.expandedField}>
            <Text style={styles.fieldLabel}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionRow}>
                {CATEGORIES.map(({ name, color }) => (
                  <Pressable
                    key={name}
                    onPress={() => store?.setCell("todos", id, "category", name)}
                    style={[
                      styles.optionChip,
                      String(recipeData.category) === name && {
                        backgroundColor: color + "20",
                        borderColor: color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        String(recipeData.category) === name && { color },
                      ]}
                    >
                      {name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.expandedRow}>
            <View style={[styles.expandedField, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Serves:</Text>
              <TextInput
                style={styles.textInput}
                defaultValue={String(recipeData.number || 1)}
                onEndEditing={(e) =>
                  store?.setCell(
                    "todos",
                    id,
                    "number",
                    parseInt(e.nativeEvent.text, 10) || 1
                  )
                }
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.expandedField, { flex: 2 }]}>
              <Text style={styles.fieldLabel}>URL:</Text>
              <TextInput
                style={styles.textInput}
                defaultValue={String(recipeData.url || "")}
                onEndEditing={(e) =>
                  store?.setCell("todos", id, "url", e.nativeEvent.text)
                }
                placeholder="Recipe URL"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
});
RecipeItem.displayName = "RecipeItem";

export default function Recipes({ listId }: { listId: string }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    text: "",
    category: CATEGORIES[0].name,
    notes: "",
    emoji: "🍳",
    number: 1,
    url: "",
  });

  const todoIds = useLocalRowIds("todoList", listId) || [];
  const listData = useRow("lists", listId);

  const addRecipe = useAddRowCallback(
    "todos",
    (recipe: any) => ({
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

  const handleAdd = useCallback(() => {
    if (newRecipe.text.trim()) {
      addRecipe(newRecipe);
      setNewRecipe({
        text: "",
        category: CATEGORIES[0].name,
        notes: "",
        emoji: "🍳",
        number: 1,
        url: "",
      });
      setModalVisible(false);
    }
  }, [addRecipe, newRecipe]);

  const progressLabel = useMemo(() => {
    if (todoIds.length === 0) return "Start your recipe collection!";
    if (todoIds.length === 1) return "One recipe — everyone starts somewhere!";
    if (todoIds.length <= 5) return "Nice little collection";
    if (todoIds.length <= 15) return "Building a cookbook!";
    return "Recipe library status!";
  }, [todoIds.length]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <CookingPot size={32} color="#2B6CB0" weight="fill" />
              <View>
                <Text style={styles.title}>
                  {String(listData?.name || "Recipe Collection")}
                </Text>
                <Text style={styles.subtitle}>{progressLabel}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {todoIds.length} {todoIds.length === 1 ? "recipe" : "recipes"}
                </Text>
              </View>
              <Pressable onPress={() => setModalVisible(true)} style={styles.addButton}>
                <Plus size={18} color="#FFFFFF" weight="bold" />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.recipesList}>
            {todoIds.map((id) => (
              <RecipeItem key={id} id={id} />
            ))}
          </View>

          {todoIds.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>No recipes yet</Text>
              <Text style={styles.emptySubtitle}>
                Start by adding your favorite recipe to build your collection
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Recipe</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.emojiRow}>
                <Pressable style={styles.emojiButton}>
                  <Text style={styles.selectedEmoji}>{newRecipe.emoji}</Text>
                </Pressable>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="Recipe name"
                  value={newRecipe.text}
                  onChangeText={(text) => setNewRecipe({ ...newRecipe, text })}
                  placeholderTextColor="#A0AEC0"
                />
              </View>

              <Text style={styles.fieldLabel}>Emoji:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.emojiGrid}>
                  {FOOD_EMOJIS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => setNewRecipe({ ...newRecipe, emoji })}
                      style={[
                        styles.emojiOption,
                        newRecipe.emoji === emoji && styles.emojiSelected,
                      ]}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionRow}>
                  {CATEGORIES.map(({ name, color }) => (
                    <Pressable
                      key={name}
                      onPress={() => setNewRecipe({ ...newRecipe, category: name })}
                      style={[
                        styles.optionChip,
                        newRecipe.category === name && {
                          backgroundColor: color + "20",
                          borderColor: color,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          newRecipe.category === name && { color },
                        ]}
                      >
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Instructions:</Text>
              <TextInput
                style={[styles.modalInput, styles.instructionsInput]}
                placeholder="Enter recipe instructions..."
                value={newRecipe.notes}
                onChangeText={(notes) => setNewRecipe({ ...newRecipe, notes })}
                multiline
                placeholderTextColor="#A0AEC0"
              />

              <Text style={styles.fieldLabel}>URL:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Recipe URL (optional)"
                value={newRecipe.url}
                onChangeText={(url) => setNewRecipe({ ...newRecipe, url })}
                autoCapitalize="none"
                placeholderTextColor="#A0AEC0"
              />

              <Text style={styles.fieldLabel}>Serves:</Text>
              <TextInput
                style={styles.modalInput}
                value={String(newRecipe.number)}
                onChangeText={(text) =>
                  setNewRecipe({ ...newRecipe, number: parseInt(text, 10) || 1 })
                }
                keyboardType="number-pad"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable onPress={handleAdd} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Add Recipe</Text>
              </Pressable>
              <Pressable onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EBF8FF" },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2B6CB0" },
  subtitle: { fontSize: 12, color: "#4299E1", fontStyle: "italic" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  countBadge: { backgroundColor: "#BEE3F8", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  countText: { fontSize: 13, fontWeight: "600", color: "#2B6CB0" },
  addButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#3182CE", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  recipesList: { gap: 8 },
  recipeItem: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  recipeHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  recipeEmoji: { fontSize: 24 },
  recipeInfo: { flex: 1 },
  recipeName: { fontSize: 16, fontWeight: "bold", color: "#2D3748" },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  categoryBadgeText: { fontSize: 11, fontWeight: "600" },
  actionBtn: { padding: 4 },
  expandedContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#EDF2F7", gap: 14 },
  expandedField: { gap: 6 },
  expandedRow: { flexDirection: "row", gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#4A5568", marginTop: 8, marginBottom: 4 },
  textInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: "#2D3748" },
  instructionsInput: { minHeight: 100, textAlignVertical: "top" },
  optionRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#EDF2F7", borderWidth: 1, borderColor: "#E2E8F0" },
  optionText: { fontSize: 12, color: "#4A5568" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#2B6CB0" },
  emptySubtitle: { fontSize: 14, color: "#4299E1", textAlign: "center", maxWidth: 280 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, width: "90%", maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#2D3748" },
  closeText: { fontSize: 20, color: "#718096" },
  modalBody: { padding: 20 },
  emojiRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  emojiButton: { padding: 8, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8 },
  selectedEmoji: { fontSize: 24 },
  emojiGrid: { flexDirection: "row", gap: 4, marginBottom: 8 },
  emojiOption: { padding: 6, borderRadius: 6, backgroundColor: "#F7FAFC" },
  emojiSelected: { backgroundColor: "#BEE3F8" },
  emojiText: { fontSize: 20 },
  modalInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: "#2D3748", marginBottom: 8 },
  modalFooter: { flexDirection: "row", justifyContent: "flex-end", padding: 20, borderTopWidth: 1, borderTopColor: "#E2E8F0", gap: 12 },
  submitBtn: { backgroundColor: "#3182CE", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText: { color: "#718096", fontSize: 16 },
});

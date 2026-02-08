import React, { useEffect, useState } from "react";
import { Link, Stack, useRouter, useLocalSearchParams } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
  useColorScheme,
  LayoutAnimation,
  TextInput as RNTextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BodyScrollView } from "@/components/ui/BodyScrollView";
import PhosphorIcon from "@/components/PhosphorIcon";
import { appleBlue, backgroundColors, emojies } from "@/constants/Colors";
import { useListCreation } from "@/context/ListCreationContext";
import { LIST_TYPE, BACKGROUND_COLOUR } from "@/stores/schema";
import { useStore } from "tinybase/ui-react";
import { getUniqueId } from "tinybase";
import {
  House,
  Info,
  Heart,
  ForkKnife,
  Package,
  GameController,
  FirstAid,
  BookOpen,
  CurrencyDollar,
  Cube,
  Check,
  CaretDown,
  CaretUp,
  PencilSimple,
  ListChecks,
} from "phosphor-react-native";
import catalogue from "../../../../catalogue.json";

// ── Templates ──────────────────────────────────────────────────────────────────

// Only show templates that have a matching display component in client/templates/
const VALID_TEMPLATE_IDS = new Set([
  "ShoppingListv2",
  "Today",
  "WeeklyMealPlanner",
  "WeekendPlanner",
  "Recipes",
  "RecipeCard",
  "AfterSchoolRoutine",
  "Beach",
  "BirthdayTracker",
  "CarMaintenance",
  "ChildTemperatureTracker",
  "Clothes",
  "DateNightList",
  "Expiry",
  "GiveAwayList",
  "HomeMaintenanceList",
  "KidsPartyFoodList",
  "LaundryTracker",
  "Leftovers",
  "LunchPlanner",
  "MentalLoad",
  "MorningRoutine",
  "OffloadList",
  "ParkLife",
  "PartyBags",
  "PartyGuestList",
  "SchoolCalendarTodo",
  "SchoolHolidayPlanner",
  "SchoolPickupRoster",
  "SubscriptionTracker",
  "TidyUp",
]);

const CATALOGUE_TEMPLATES = catalogue
  .filter((t) => t.published)
  .filter((t) => VALID_TEMPLATE_IDS.has(t.template))
  .map((t) => ({
    id: t.template,
    name: t.name,
    description: t.purpose,
    type: t.type,
    systemPrompt: t.systemPrompt || "",
    backgroundColour: t.backgroundColour || "blue",
    icon: t.icon || "📝",
  }))
  .slice(0, 20);

// Special sentinel for "Custom list"
const CUSTOM_ID = "__custom__";

// ── Helpers ────────────────────────────────────────────────────────────────────

const COLOR_VALUES: Record<string, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#F59E0B",
  purple: "#8B5CF6",
};

const getColorValue = (name: string): string =>
  COLOR_VALUES[name] || COLOR_VALUES.blue;

const isEmojiString = (str: string): boolean => {
  if (!str) return false;
  if (/^[A-Z][a-zA-Z]+$/.test(str)) return false;
  return true;
};

const TYPE_ICONS: Record<string, React.FC<any>> = {
  Info: Info,
  Home: House,
  Life: Heart,
  Food: ForkKnife,
  Stuff: Package,
  Fun: GameController,
  Health: FirstAid,
  Learn: BookOpen,
  Money: CurrencyDollar,
};

const INITIAL_VISIBLE = 5;

// ── Component ──────────────────────────────────────────────────────────────────

export default function CreateListScreen() {
  // Form state
  const [listName, setListName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedType, setSelectedType] = useState<string>("Info");
  const [backgroundColour, setBackgroundColour] = useState<string>("blue");
  const [icon, setIcon] = useState("");
  const [number, setNumber] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [code, setCode] = useState("");

  // UI state
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [createdListId, setCreatedListId] = useState("");

  const { selectedEmoji, setSelectedEmoji, selectedColor, setSelectedColor } =
    useListCreation();

  const router = useRouter();
  const params = useLocalSearchParams();
  const store = useStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const isCustom = selectedTemplateId === CUSTOM_ID;

  // Theme
  const colors = {
    bg: isDark ? "#000000" : "#F2F2F7",
    cardBg: isDark ? "#1C1C1E" : "#FFFFFF",
    text: isDark ? "#F2F2F7" : "#000000",
    secondaryText: isDark ? "#8E8E93" : "#6B7280",
    tertiaryText: isDark ? "#636366" : "#AEAEB2",
    separator: isDark ? "#38383A" : "#E5E5EA",
    headerBg: isDark ? "#1C1C1E" : "#F9F9F9",
    headerBorder: isDark ? "#38383A" : "#E5E5EA",
    groupedBg: isDark ? "#1C1C1E" : "#FFFFFF",
    pillBg: isDark ? "#2C2C2E" : "#F2F2F7",
    pillSelectedBg: appleBlue,
    pillBorder: isDark ? "#3A3A3C" : "#E5E7EB",
  };

  // ── Effects ──

  useEffect(() => {
    setSelectedEmoji(emojies[Math.floor(Math.random() * emojies.length)]);
    setSelectedColor(
      backgroundColors[Math.floor(Math.random() * backgroundColors.length)]
    );
    setIcon(emojies[Math.floor(Math.random() * emojies.length)]);
    return () => {
      setSelectedEmoji("");
      setSelectedColor("");
    };
  }, []);

  useEffect(() => {
    if (params.selectedTemplate) {
      const data = CATALOGUE_TEMPLATES.find(
        (t) => t.id === params.selectedTemplate
      );
      if (data) {
        selectTemplate(data);
      }
    }
    if (params.description) setPurpose(params.description as string);
    if (params.fromVoice === "true")
      setListName((params.suggestedName as string) || "Voice-created list");
    if (params.fromPhoto === "true") {
      setListName((params.suggestedName as string) || "Photo-based list");
      if (params.suggestedIcon) setIcon(params.suggestedIcon as string);
    }
  }, [
    params.selectedTemplate,
    params.description,
    params.fromVoice,
    params.fromPhoto,
    params.suggestedName,
    params.suggestedIcon,
    params.photoUri,
    params.photoAnalysis,
  ]);

  // ── Template selection ──

  const selectTemplate = (t: (typeof CATALOGUE_TEMPLATES)[number]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedTemplateId(t.id);
    setSystemPrompt(t.systemPrompt || "");
    setBackgroundColour(t.backgroundColour || "blue");
    setSelectedType(t.type);
    setIcon(t.icon || "📝");
    // Pre-fill name with template name if user hasn't typed one
    if (!listName) setListName(t.name);
  };

  const selectCustom = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedTemplateId(CUSTOM_ID);
    setSystemPrompt("");
  };

  // ── Handlers ──

  const handleCreateList = () => {
    if (!listName) return;

    const listId = getUniqueId();
    store.setRow("lists", listId, {
      name: listName,
      purpose: purpose || "",
      icon: selectedEmoji || icon || "📝",
      backgroundColour: backgroundColour || "blue",
      type: selectedType || "Info",
      systemPrompt: systemPrompt || "",
      number: number ? parseInt(number) : 0,
      template: selectedTemplateId === CUSTOM_ID ? "" : selectedTemplateId,
      code: code || "",
    });

    setCreatedListId(listId);

    if (
      (params.fromVoice === "true" || params.fromPhoto === "true") &&
      systemPrompt
    ) {
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
    router.replace({
      pathname: "/list/[listId]",
      params: {
        listId: createdListId,
        generateTodos: "true",
        systemPrompt,
        description: purpose || (params.description as string) || "",
        photoUri: (params.photoUri as string) || "",
        photoAnalysis: (params.photoAnalysis as string) || "",
        fromVoice: (params.fromVoice as string) || "",
        fromPhoto: (params.fromPhoto as string) || "",
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

  const toggleShowAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllTemplates(!showAllTemplates);
  };

  const toggleAdvanced = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAdvanced(!showAdvanced);
  };

  // ── Derived ──

  const displayEmoji = selectedEmoji || icon || "📋";
  const accentColor = getColorValue(backgroundColour);
  const visibleTemplates = showAllTemplates
    ? CATALOGUE_TEMPLATES
    : CATALOGUE_TEMPLATES.slice(0, INITIAL_VISIBLE);

  // ── Render helpers ──

  const renderIcon = (iconStr: string, size: number, color: string) =>
    isEmojiString(iconStr) ? (
      <Text style={{ fontSize: size - 4 }}>{iconStr}</Text>
    ) : (
      <PhosphorIcon name={iconStr} size={size} color={color} />
    );

  // ── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <SafeAreaView style={{ backgroundColor: colors.headerBg }}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.headerBg,
              borderBottomColor: colors.headerBorder,
            },
          ]}
        >
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={[styles.headerAction, { color: appleBlue }]}>
              Cancel
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            New List
          </Text>
          <Pressable
            onPress={handleCreateList}
            disabled={!listName}
            hitSlop={8}
          >
            <Text
              style={[
                styles.headerAction,
                styles.headerActionBold,
                { color: appleBlue, opacity: listName ? 1 : 0.4 },
              ]}
            >
              Done
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <BodyScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        keyboardDismissMode="on-drag"
      >
        {/* ── Choose a Template ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>
            CHOOSE A TEMPLATE
          </Text>
          <View
            style={[
              styles.groupedCard,
              { backgroundColor: colors.groupedBg },
            ]}
          >
            {visibleTemplates.map((t, index) => {
              const isSelected =
                selectedTemplateId === t.id && !isCustom;
              const isLast =
                index === visibleTemplates.length - 1 && !isCustom;
              return (
                <React.Fragment key={t.id || "__catalogue_default"}>
                  <Pressable
                    style={[
                      styles.templateRow,
                      isSelected && {
                        backgroundColor: isDark ? "#1A3A5C" : "#EFF6FF",
                      },
                    ]}
                    onPress={() => selectTemplate(t)}
                  >
                    <View
                      style={[
                        styles.templateIconCircle,
                        {
                          backgroundColor: isSelected
                            ? getColorValue(t.backgroundColour || "blue")
                            : isDark
                              ? "#2C2C2E"
                              : "#F2F2F7",
                        },
                      ]}
                    >
                      {renderIcon(
                        t.icon || "📝",
                        20,
                        isSelected ? "#FFFFFF" : colors.secondaryText
                      )}
                    </View>
                    <View style={styles.templateContent}>
                      <Text
                        style={[
                          styles.templateName,
                          { color: isSelected ? appleBlue : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {t.name}
                      </Text>
                      <Text
                        style={[
                          styles.templateDesc,
                          { color: colors.secondaryText },
                        ]}
                        numberOfLines={1}
                      >
                        {t.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={20} color={appleBlue} weight="bold" />
                    )}
                  </Pressable>
                  {!isLast && (
                    <View
                      style={[
                        styles.templateSeparator,
                        { backgroundColor: colors.separator },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}

            {/* ── Separator before Custom ── */}
            <View
              style={[
                styles.templateSeparator,
                { backgroundColor: colors.separator, marginLeft: 0 },
              ]}
            />

            {/* ── Custom List option ── */}
            <Pressable
              style={[
                styles.templateRow,
                isCustom && {
                  backgroundColor: isDark ? "#1A3A5C" : "#EFF6FF",
                },
              ]}
              onPress={selectCustom}
            >
              <View
                style={[
                  styles.templateIconCircle,
                  {
                    backgroundColor: isCustom
                      ? accentColor
                      : isDark
                        ? "#2C2C2E"
                        : "#F2F2F7",
                  },
                ]}
              >
                <PencilSimple
                  size={18}
                  color={isCustom ? "#FFFFFF" : colors.secondaryText}
                  weight={isCustom ? "fill" : "regular"}
                />
              </View>
              <View style={styles.templateContent}>
                <Text
                  style={[
                    styles.templateName,
                    { color: isCustom ? appleBlue : colors.text },
                  ]}
                >
                  Custom List
                </Text>
                <Text
                  style={[
                    styles.templateDesc,
                    { color: colors.secondaryText },
                  ]}
                >
                  Pick your own icon, color, and type
                </Text>
              </View>
              {isCustom && (
                <Check size={20} color={appleBlue} weight="bold" />
              )}
            </Pressable>
          </View>

          {CATALOGUE_TEMPLATES.length > INITIAL_VISIBLE && (
            <Pressable style={styles.showAllButton} onPress={toggleShowAll}>
              <Text style={[styles.showAllText, { color: appleBlue }]}>
                {showAllTemplates
                  ? "Show Less"
                  : `Show All (${CATALOGUE_TEMPLATES.length})`}
              </Text>
              {showAllTemplates ? (
                <CaretUp size={14} color={appleBlue} weight="bold" />
              ) : (
                <CaretDown size={14} color={appleBlue} weight="bold" />
              )}
            </Pressable>
          )}
        </View>

        {/* ── Name & Purpose (always visible) ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>
            LIST DETAILS
          </Text>
          <View
            style={[
              styles.groupedCard,
              { backgroundColor: colors.groupedBg },
            ]}
          >
            <View style={styles.nameRow}>
              <Link href={{ pathname: "/emoji-picker" }} asChild>
                <Pressable
                  style={[
                    styles.emojiButton,
                    { backgroundColor: accentColor },
                  ]}
                >
                  {renderIcon(displayEmoji, 26, "#FFFFFF")}
                </Pressable>
              </Link>
              <RNTextInput
                style={[styles.nameInput, { color: colors.text }]}
                placeholder="List Name"
                placeholderTextColor={colors.tertiaryText}
                value={listName}
                onChangeText={setListName}
                returnKeyType="next"
                autoFocus
              />
            </View>
            <View
              style={[
                styles.rowSeparator,
                { backgroundColor: colors.separator },
              ]}
            />
            <RNTextInput
              style={[styles.purposeInput, { color: colors.text }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.tertiaryText}
              value={purpose}
              onChangeText={setPurpose}
              returnKeyType="done"
              multiline
            />
          </View>
        </View>

        {/* ── Customization (only when Custom is selected) ── */}
        {isCustom && (
          <>
            {/* Type */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.secondaryText },
                ]}
              >
                TYPE
              </Text>
              <View style={styles.typeGrid}>
                {LIST_TYPE.map((type) => {
                  const isSel = selectedType === type;
                  const IC = TYPE_ICONS[type] || Cube;
                  return (
                    <Pressable
                      key={type}
                      style={[
                        styles.typePill,
                        {
                          backgroundColor: isSel
                            ? colors.pillSelectedBg
                            : colors.pillBg,
                          borderColor: isSel
                            ? colors.pillSelectedBg
                            : colors.pillBorder,
                        },
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <IC
                        size={16}
                        color={isSel ? "#FFFFFF" : colors.secondaryText}
                        weight={isSel ? "fill" : "regular"}
                      />
                      <Text
                        style={[
                          styles.typePillText,
                          { color: isSel ? "#FFFFFF" : colors.text },
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Color */}
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.secondaryText },
                ]}
              >
                COLOR
              </Text>
              <View
                style={[
                  styles.groupedCard,
                  styles.colorCard,
                  { backgroundColor: colors.groupedBg },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.colorScrollContent}
                >
                  {BACKGROUND_COLOUR.map((c) => {
                    const isSel = backgroundColour === c;
                    return (
                      <Pressable
                        key={c}
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: getColorValue(c) },
                          isSel && styles.colorSwatchSelected,
                        ]}
                        onPress={() => setBackgroundColour(c)}
                      >
                        {isSel && (
                          <Check size={18} color="#FFFFFF" weight="bold" />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </>
        )}

        {/* ── Advanced (collapsible) ── */}
        <View style={styles.section}>
          <Pressable
            style={[
              styles.advancedToggle,
              showAdvanced && { marginBottom: 8 },
            ]}
            onPress={toggleAdvanced}
          >
            <Text
              style={[
                styles.sectionLabel,
                styles.advancedLabel,
                { color: colors.secondaryText },
              ]}
            >
              ADVANCED
            </Text>
            {showAdvanced ? (
              <CaretUp size={14} color={colors.secondaryText} weight="bold" />
            ) : (
              <CaretDown
                size={14}
                color={colors.secondaryText}
                weight="bold"
              />
            )}
          </Pressable>
          {showAdvanced && (
            <View
              style={[
                styles.groupedCard,
                { backgroundColor: colors.groupedBg },
              ]}
            >
              <RNTextInput
                style={[styles.advancedInput, { color: colors.text }]}
                placeholder="System Prompt"
                placeholderTextColor={colors.tertiaryText}
                value={systemPrompt}
                onChangeText={setSystemPrompt}
                multiline
              />
              <View
                style={[
                  styles.rowSeparator,
                  { backgroundColor: colors.separator },
                ]}
              />
              <RNTextInput
                style={[styles.advancedInput, { color: colors.text }]}
                placeholder="Number"
                placeholderTextColor={colors.tertiaryText}
                value={number}
                onChangeText={setNumber}
                keyboardType="numeric"
              />
              <View
                style={[
                  styles.rowSeparator,
                  { backgroundColor: colors.separator },
                ]}
              />
              <RNTextInput
                style={[styles.advancedInput, { color: colors.text }]}
                placeholder="Code"
                placeholderTextColor={colors.tertiaryText}
                value={code}
                onChangeText={setCode}
                multiline
              />
            </View>
          )}
        </View>
      </BodyScrollView>

      {/* ── Sticky Bottom CTA ── */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.bg,
            borderTopColor: colors.separator,
          },
        ]}
      >
        <Pressable
          style={[styles.createButton, { opacity: listName ? 1 : 0.5 }]}
          onPress={handleCreateList}
          disabled={!listName}
        >
          <Text style={styles.createButtonText}>Create List</Text>
        </Pressable>
      </View>

      {/* ── Follow-up Modal ── */}
      {showFollowUpModal && (
        <View style={styles.modalOverlay}>
          <View
            style={[styles.followUpModal, { backgroundColor: colors.cardBg }]}
          >
            <Text style={[styles.followUpTitle, { color: colors.text }]}>
              List Created!
            </Text>
            <Text
              style={[
                styles.followUpSubtitle,
                { color: colors.secondaryText },
              ]}
            >
              Would you like to generate tasks using AI based on your template
              and description?
            </Text>
            <View style={styles.followUpButtons}>
              <Pressable
                style={[styles.followUpBtn, styles.generateBtn]}
                onPress={handleGenerateTodos}
              >
                <Text style={styles.generateBtnText}>Generate Todos</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.followUpBtn,
                  {
                    backgroundColor: colors.pillBg,
                    borderWidth: 1,
                    borderColor: colors.separator,
                  },
                ]}
                onPress={handleSkipTodos}
              >
                <Text style={[styles.skipBtnText, { color: colors.text }]}>
                  No Thanks
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", letterSpacing: -0.4 },
  headerAction: { fontSize: 17 },
  headerActionBold: { fontWeight: "600" },

  // Scroll
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  // Sections
  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },

  // Grouped card
  groupedCard: { borderRadius: 12, overflow: "hidden" },

  // Template rows
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  templateIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  templateContent: { flex: 1 },
  templateName: { fontSize: 16, fontWeight: "600", letterSpacing: -0.2 },
  templateDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  templateSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  showAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 10,
  },
  showAllText: { fontSize: 14, fontWeight: "500" },

  // Name row
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    paddingVertical: 8,
    letterSpacing: -0.2,
  },
  rowSeparator: { height: StyleSheet.hairlineWidth, marginLeft: 74 },
  purposeInput: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },

  // Type grid
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  typePillText: { fontSize: 14, fontWeight: "500" },

  // Color
  colorCard: { paddingVertical: 14 },
  colorScrollContent: { paddingHorizontal: 14, gap: 12 },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.1 }],
  },

  // Advanced
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 16,
    marginBottom: 0,
  },
  advancedLabel: { marginBottom: 0 },
  advancedInput: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },

  // Bottom CTA
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  createButton: {
    backgroundColor: appleBlue,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  // Follow-up modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  followUpModal: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  followUpTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  followUpSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  followUpButtons: { flexDirection: "row", gap: 12, width: "100%" },
  followUpBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  generateBtn: { backgroundColor: appleBlue },
  generateBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  skipBtnText: { fontSize: 16, fontWeight: "500" },
});

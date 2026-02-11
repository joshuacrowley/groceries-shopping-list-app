import React, { useEffect, useState } from "react";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
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
import { appleBlue } from "@/constants/Colors";
import { useListCreation } from "@/context/ListCreationContext";
import { LIST_TYPE, BACKGROUND_COLOUR } from "@/stores/schema";
import { useRow, useStore } from "tinybase/ui-react";
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
} from "phosphor-react-native";
import catalogue from "../../../../catalogue.json";

// ── Templates ──────────────────────────────────────────────────────────────────

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
  .filter((t: any) => t.published)
  .filter((t: any) => VALID_TEMPLATE_IDS.has(t.template))
  .map((t: any) => ({
    id: t.template,
    name: t.name,
    description: t.purpose,
    type: t.type,
    systemPrompt: t.systemPrompt || "",
    backgroundColour: t.backgroundColour || "blue",
    icon: t.icon || "📝",
  }))
  .filter(
    (t: any, i: number, arr: any[]) =>
      arr.findIndex((x: any) => x.id === t.id) === i
  )
  .slice(0, 20);

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

export default function EditListScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams() as { listId: string };

  // ── Store (reactive read/write via useRow) ──
  const store = useStore();
  const listRow = useRow("lists", listId);

  // Derive all field values from the store row
  const name = (listRow.name as string) || "";
  const purpose = (listRow.purpose as string) || "";
  const icon = (listRow.icon as string) || "";
  const backgroundColour = (listRow.backgroundColour as string) || "blue";
  const type = (listRow.type as string) || "Info";
  const currentTemplate = (listRow.template as string) || "";
  const currentSystemPrompt = (listRow.systemPrompt as string) || "";
  const currentNumber = listRow.number ? String(listRow.number) : "";
  const currentCode = (listRow.code as string) || "";

  // ── UI state ──
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Template: if no template is set, treat as custom
  const selectedTemplateId = currentTemplate || CUSTOM_ID;
  const isCustom = !currentTemplate || selectedTemplateId === CUSTOM_ID;

  // ── Context for emoji picker ──
  const { selectedEmoji, setSelectedEmoji, selectedColor, setSelectedColor } =
    useListCreation();

  // ── Theme ──
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

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

  const accentColor = getColorValue(backgroundColour);
  const displayEmoji = icon || "📋";

  // ── Initialize context with current values ──
  useEffect(() => {
    setSelectedEmoji(icon || "");
    setSelectedColor("");
    return () => {
      setSelectedEmoji("");
      setSelectedColor("");
    };
  }, [listId]);

  // ── Sync emoji from context (after picker selection) ──
  useEffect(() => {
    if (selectedEmoji && selectedEmoji !== icon) {
      store?.setCell("lists", listId, "icon", selectedEmoji);
    }
  }, [selectedEmoji]);

  // ── Setters (all write to the main store) ──

  const handleNameChange = (v: string) => {
    store?.setCell("lists", listId, "name", v);
  };

  const handlePurposeChange = (v: string) => {
    store?.setCell("lists", listId, "purpose", v);
  };

  const handleBackgroundColourChange = (c: string) => {
    store?.setCell("lists", listId, "backgroundColour", c);
  };

  const handleTypeChange = (v: string) => {
    store?.setCell("lists", listId, "type", v);
  };

  const handleSystemPromptChange = (v: string) => {
    store?.setCell("lists", listId, "systemPrompt", v);
  };

  const handleNumberChange = (v: string) => {
    store?.setCell("lists", listId, "number", v ? parseInt(v) || 0 : 0);
  };

  const handleCodeChange = (v: string) => {
    store?.setCell("lists", listId, "code", v);
  };

  // ── Template selection ──

  const selectTemplate = (t: (typeof CATALOGUE_TEMPLATES)[number]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    store?.setCell("lists", listId, "template", t.id);
    store?.setCell("lists", listId, "systemPrompt", t.systemPrompt || "");
    store?.setCell(
      "lists",
      listId,
      "backgroundColour",
      t.backgroundColour || "blue"
    );
    store?.setCell("lists", listId, "type", t.type);
    store?.setCell("lists", listId, "icon", t.icon || "📝");

    // Update context for emoji display
    setSelectedEmoji(t.icon || "📝");
  };

  const selectCustom = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    store?.setCell("lists", listId, "template", "");
    store?.setCell("lists", listId, "systemPrompt", "");
  };

  // ── UI toggles ──

  const toggleShowAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllTemplates(!showAllTemplates);
  };

  const toggleAdvanced = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAdvanced(!showAdvanced);
  };

  // ── Derived ──

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
            Edit List
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text
              style={[
                styles.headerAction,
                styles.headerActionBold,
                { color: appleBlue },
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
          { paddingBottom: 40 + insets.bottom },
        ]}
        keyboardDismissMode="on-drag"
      >
        {/* ── List Details ── */}
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
                value={name}
                onChangeText={handleNameChange}
                returnKeyType="next"
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
              onChangeText={handlePurposeChange}
              returnKeyType="done"
              multiline
            />
          </View>
        </View>

        {/* ── Template ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>
            TEMPLATE
          </Text>
          <View
            style={[
              styles.groupedCard,
              { backgroundColor: colors.groupedBg },
            ]}
          >
            {visibleTemplates.map((t, index) => {
              const isSelected = selectedTemplateId === t.id && !isCustom;
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

            {/* Separator before Custom */}
            <View
              style={[
                styles.templateSeparator,
                { backgroundColor: colors.separator, marginLeft: 0 },
              ]}
            />

            {/* Custom List option */}
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

        {/* ── Type ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>
            TYPE
          </Text>
          <View style={styles.typeGrid}>
            {LIST_TYPE.map((listType) => {
              const isSel = type === listType;
              const IC = TYPE_ICONS[listType] || Cube;
              return (
                <Pressable
                  key={listType}
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
                  onPress={() => handleTypeChange(listType)}
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
                    {listType}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Color ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>
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
                    onPress={() => handleBackgroundColourChange(c)}
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
                value={currentSystemPrompt}
                onChangeText={handleSystemPromptChange}
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
                value={currentNumber}
                onChangeText={handleNumberChange}
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
                value={currentCode}
                onChangeText={handleCodeChange}
                multiline
              />
            </View>
          )}
        </View>
      </BodyScrollView>
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
});

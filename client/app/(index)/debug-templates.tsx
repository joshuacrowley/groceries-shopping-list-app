import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  LayoutAnimation,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useStore } from "tinybase/ui-react";
import PhosphorIcon from "@/components/PhosphorIcon";
import { appleBlue } from "@/constants/Colors";
import catalogue from "../../catalogue.json";
import sampleTodos from "../../sampleTodos.json";

// ── Template component imports ──
import TodoList from "@/Basic";
import ShoppingListv2 from "@/templates/ShoppingListv2";
import Today from "@/templates/Today";
import WeeklyMealPlanner from "@/templates/WeeklyMealPlanner";
import WeekendPlanner from "@/templates/WeekendPlanner";
import Recipes from "@/templates/Recipes";
import RecipeCard from "@/templates/RecipeCard";
import AfterSchoolRoutine from "@/templates/AfterSchoolRoutine";
import Beach from "@/templates/Beach";
import BirthdayTracker from "@/templates/BirthdayTracker";
import CarMaintenance from "@/templates/CarMaintenance";
import ChildTemperatureTracker from "@/templates/ChildTemperatureTracker";
import Clothes from "@/templates/Clothes";
import DateNightList from "@/templates/DateNightList";
import Expiry from "@/templates/Expiry";
import GiveAwayList from "@/templates/GiveAwayList";
import HomeMaintenanceList from "@/templates/HomeMaintenanceList";
import KidsPartyFoodList from "@/templates/KidsPartyFoodList";
import LaundryTracker from "@/templates/LaundryTracker";
import Leftovers from "@/templates/Leftovers";
import LunchPlanner from "@/templates/LunchPlanner";
import MentalLoad from "@/templates/MentalLoad";
import MorningRoutine from "@/templates/MorningRoutine";
import OffloadList from "@/templates/OffloadList";
import ParkLife from "@/templates/ParkLife";
import PartyBags from "@/templates/PartyBags";
import PartyGuestList from "@/templates/PartyGuestList";
import SchoolCalendarTodo from "@/templates/SchoolCalendarTodo";
import SchoolHolidayPlanner from "@/templates/SchoolHolidayPlanner";
import SchoolPickupRoster from "@/templates/SchoolPickupRoster";
import SubscriptionTracker from "@/templates/SubscriptionTracker";
import TidyUp from "@/templates/TidyUp";

// ── Template component map ──
const TEMPLATE_COMPONENTS: Record<string, React.FC<{ listId: string }>> = {
  ShoppingListv2,
  Today,
  WeeklyMealPlanner,
  WeekendPlanner,
  Recipes,
  RecipeCard,
  AfterSchoolRoutine,
  Beach,
  BirthdayTracker,
  CarMaintenance,
  ChildTemperatureTracker,
  Clothes,
  DateNightList,
  Expiry,
  GiveAwayList,
  HomeMaintenanceList,
  KidsPartyFoodList,
  LaundryTracker,
  Leftovers,
  LunchPlanner,
  MentalLoad,
  MorningRoutine,
  OffloadList,
  ParkLife,
  PartyBags,
  PartyGuestList,
  SchoolCalendarTodo,
  SchoolHolidayPlanner,
  SchoolPickupRoster,
  SubscriptionTracker,
  TidyUp,
  TodoList,
};

// ── Color map ──
const BRAND_COLORS: Record<string, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#F59E0B",
  purple: "#8B5CF6",
  teal: "#14B8A6",
  orange: "#F97316",
  pink: "#EC4899",
  cyan: "#06B6D4",
  gray: "#6B7280",
};

// Schema only allows these backgroundColour values
const ALLOWED_COLOURS = new Set(["blue", "green", "red", "yellow", "purple"]);
const COLOUR_FALLBACK: Record<string, string> = {
  cyan: "blue",
  teal: "blue",
  orange: "red",
  pink: "purple",
  gray: "blue",
};

const getSafeColour = (c: string) => {
  if (ALLOWED_COLOURS.has(c)) return c;
  return COLOUR_FALLBACK[c] || "blue";
};

const getColor = (name: string) => BRAND_COLORS[name] || BRAND_COLORS.blue;

const isEmojiString = (str: string): boolean => {
  if (!str) return false;
  if (/^[A-Z][a-zA-Z]+$/.test(str)) return false;
  return true;
};

// ── Build template data ──
type SampleTodo = (typeof sampleTodos)[number];
type CatalogueEntry = (typeof catalogue)[number];

interface TemplateWithTodos extends CatalogueEntry {
  sampleItems: SampleTodo[];
  debugListId: string;
}

const DEBUG_PREFIX = "__debug_preview__";

function buildTemplateData(): TemplateWithTodos[] {
  const todosByTemplate = new Map<number, SampleTodo[]>();
  for (const todo of sampleTodos) {
    const num = todo.templateNumber;
    if (!todosByTemplate.has(num)) {
      todosByTemplate.set(num, []);
    }
    todosByTemplate.get(num)!.push(todo);
  }

  const seen = new Set<number>();
  const results: TemplateWithTodos[] = [];

  for (const entry of catalogue) {
    const num = (entry as any).number;
    if (num == null || seen.has(num)) continue;
    seen.add(num);

    results.push({
      ...entry,
      sampleItems: todosByTemplate.get(num) || [],
      debugListId: `${DEBUG_PREFIX}${num}`,
    });
  }

  // Sort: templates with sample todos first, then alphabetical
  results.sort((a, b) => {
    const aHas = a.sampleItems.length > 0 ? 0 : 1;
    const bHas = b.sampleItems.length > 0 ? 0 : 1;
    if (aHas !== bHas) return aHas - bHas;
    return (a.name || "").localeCompare(b.name || "");
  });

  return results;
}

// ── Filter options ──
type FilterMode = "all" | "with-todos" | "published";

// ── Template Card ──
function TemplateCard({
  template,
  isDark,
}: {
  template: TemplateWithTodos;
  isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const accentColor = getColor(template.backgroundColour || "blue");
  const cardBg = isDark ? "#1C1C1E" : "#FFFFFF";
  const textColor = isDark ? "#F9FAFB" : "#111827";
  const subtextColor = isDark ? "#9CA3AF" : "#6B7280";
  const chipBg = isDark ? "#2C2C2E" : "#F3F4F6";
  const iconValue = String(template.icon || "ListChecks");
  const isEmoji = isEmojiString(iconValue);

  const todoCount = template.sampleItems.length;
  const templateName = template.template || "";
  const TemplateComponent = TEMPLATE_COMPONENTS[templateName] || TodoList;
  const hasComponent = !!TEMPLATE_COMPONENTS[templateName];

  const categories = [
    ...new Set(
      template.sampleItems.map((t) => t.category).filter(Boolean)
    ),
  ];

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      {/* ── Header ── */}
      <Pressable style={styles.cardHeader} onPress={toggleExpand}>
        <View style={[styles.iconContainer, { backgroundColor: accentColor }]}>
          {isEmoji ? (
            <Text style={styles.emojiIcon}>{iconValue}</Text>
          ) : (
            <PhosphorIcon name={iconValue} size={22} color="#FFFFFF" />
          )}
        </View>

        <View style={styles.cardContent}>
          <Text
            style={[styles.cardName, { color: textColor }]}
            numberOfLines={1}
          >
            {template.name || "Unnamed"}
          </Text>
          <Text
            style={[styles.cardMeta, { color: subtextColor }]}
            numberOfLines={1}
          >
            {template.type || "Info"} · #{(template as any).number}
            {templateName ? ` · ${templateName}` : ""}
            {todoCount > 0 ? ` · ${todoCount} todos` : ""}
          </Text>
        </View>

        <View style={styles.cardRight}>
          {(template as any).published && (
            <View
              style={[
                styles.publishedBadge,
                { backgroundColor: "#22C55E20" },
              ]}
            >
              <Text
                style={{ color: "#22C55E", fontSize: 11, fontWeight: "600" }}
              >
                Published
              </Text>
            </View>
          )}
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color={subtextColor}
          />
        </View>
      </Pressable>

      {/* ── Purpose ── */}
      {template.purpose && (
        <Text
          style={[styles.cardPurpose, { color: subtextColor }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {template.purpose}
        </Text>
      )}

      {/* ── Chips ── */}
      {expanded && (
        <View style={styles.chipRow}>
          <View style={[styles.chip, { backgroundColor: accentColor + "20" }]}>
            <Text style={[styles.chipText, { color: accentColor }]}>
              {template.backgroundColour || "blue"}
            </Text>
          </View>
          {hasComponent ? (
            <View style={[styles.chip, { backgroundColor: "#3B82F620" }]}>
              <Text style={[styles.chipText, { color: "#3B82F6" }]}>
                Has Component
              </Text>
            </View>
          ) : (
            <View style={[styles.chip, { backgroundColor: "#6B728020" }]}>
              <Text style={[styles.chipText, { color: "#6B7280" }]}>
                Fallback (TodoList)
              </Text>
            </View>
          )}
          {(template as any).upgradeOnly && (
            <View style={[styles.chip, { backgroundColor: "#F59E0B20" }]}>
              <Text style={[styles.chipText, { color: "#F59E0B" }]}>
                Upgrade Only
              </Text>
            </View>
          )}
          {categories.slice(0, 4).map((cat) => (
            <View
              key={cat}
              style={[styles.chip, { backgroundColor: chipBg }]}
            >
              <Text style={[styles.chipText, { color: subtextColor }]}>
                {cat}
              </Text>
            </View>
          ))}
          {categories.length > 4 && (
            <View style={[styles.chip, { backgroundColor: chipBg }]}>
              <Text style={[styles.chipText, { color: subtextColor }]}>
                +{categories.length - 4}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Live Template Preview ── */}
      {expanded && todoCount > 0 && (
        <View style={styles.templatePreviewContainer}>
          <Text style={[styles.templatePreviewLabel, { color: subtextColor }]}>
            LIVE TEMPLATE PREVIEW ({todoCount} todos)
          </Text>
          <View
            style={[
              styles.templatePreviewFrame,
              {
                borderColor: isDark ? "#38383A" : "#E5E5EA",
                backgroundColor: isDark ? "#000000" : "#F2F2F7",
              },
            ]}
          >
            <TemplateComponent listId={template.debugListId} />
          </View>
        </View>
      )}

      {expanded && todoCount === 0 && (
        <View style={styles.emptyPreview}>
          <Text
            style={[styles.emptyPreviewText, { color: subtextColor }]}
          >
            No sample todos for this template
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ──

export default function DebugTemplatesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const store = useStore();
  const [filter, setFilter] = useState<FilterMode>("with-todos");
  const [isSeeded, setIsSeeded] = useState(false);
  const seededIdsRef = useRef<{ listIds: string[]; todoIds: string[] }>({
    listIds: [],
    todoIds: [],
  });

  const allTemplates = useMemo(() => buildTemplateData(), []);

  // Seed the TinyBase store with debug data on mount
  useEffect(() => {
    if (!store) return;

    const listIds: string[] = [];
    const todoIds: string[] = [];

    store.transaction(() => {
      for (const template of allTemplates) {
        const listId = template.debugListId;

        // Create the list entry
        store.setRow("lists", listId, {
          name: template.name || "Unnamed",
          purpose: template.purpose || "",
          icon: template.icon || "ListChecks",
          backgroundColour: getSafeColour(
            template.backgroundColour || "blue"
          ),
          type: template.type || "Info",
          template: template.template || "",
          number: (template as any).number || 0,
          systemPrompt: (template as any).systemPrompt || "",
        });
        listIds.push(listId);

        // Create todo entries
        for (let i = 0; i < template.sampleItems.length; i++) {
          const todo = template.sampleItems[i];
          const todoId = `${DEBUG_PREFIX}todo_${(template as any).number}_${i}`;

          store.setRow("todos", todoId, {
            list: listId,
            text: todo.text || "",
            notes: todo.notes || "",
            date: todo.date || "",
            time: todo.time || "",
            url: todo.url || "",
            emoji: todo.emoji || "",
            email: todo.email || "",
            streetAddress: todo.streetAddress || "",
            number: todo.number ?? 0,
            amount: todo.amount ?? 0,
            fiveStarRating: todo.fiveStarRating ?? 1,
            done: todo.done || false,
            type: todo.type || "A",
            category: todo.category || "",
          });
          todoIds.push(todoId);
        }
      }
    });

    seededIdsRef.current = { listIds, todoIds };
    setIsSeeded(true);

    // Cleanup on unmount
    return () => {
      if (!store) return;
      store.transaction(() => {
        for (const id of seededIdsRef.current.todoIds) {
          store.delRow("todos", id);
        }
        for (const id of seededIdsRef.current.listIds) {
          store.delRow("lists", id);
        }
      });
    };
  }, [store, allTemplates]);

  const filteredTemplates = useMemo(() => {
    switch (filter) {
      case "with-todos":
        return allTemplates.filter((t) => t.sampleItems.length > 0);
      case "published":
        return allTemplates.filter((t) => (t as any).published);
      default:
        return allTemplates;
    }
  }, [allTemplates, filter]);

  const uniqueTemplateNumbers = new Set(
    sampleTodos.map((t) => t.templateNumber)
  );

  const colors = {
    bg: isDark ? "#000000" : "#F2F2F7",
    headerBg: isDark ? "#1C1C1E" : "#F9F9F9",
    headerBorder: isDark ? "#38383A" : "#E5E5EA",
    text: isDark ? "#F2F2F7" : "#000000",
    secondaryText: isDark ? "#8E8E93" : "#6B7280",
    pillBg: isDark ? "#2C2C2E" : "#F2F2F7",
    pillSelectedBg: appleBlue,
  };

  if (!isSeeded) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ color: colors.secondaryText, fontSize: 15 }}>
          Loading templates...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ backgroundColor: colors.headerBg }}>
        {/* ── Header ── */}
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
            <Feather name="arrow-left" size={22} color={appleBlue} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Template Preview
          </Text>
          <View style={{ width: 22 }} />
        </View>

        {/* ── Stats bar ── */}
        <View
          style={[
            styles.statsBar,
            { borderBottomColor: colors.headerBorder },
          ]}
        >
          <Text style={[styles.statsText, { color: colors.secondaryText }]}>
            {catalogue.length} templates · {sampleTodos.length} sample todos ·{" "}
            {uniqueTemplateNumbers.size} with data
          </Text>
        </View>

        {/* ── Filter pills ── */}
        <View style={styles.filterRow}>
          {(
            [
              { key: "all", label: `All (${allTemplates.length})` },
              {
                key: "with-todos",
                label: `With Todos (${allTemplates.filter((t) => t.sampleItems.length > 0).length})`,
              },
              {
                key: "published",
                label: `Published (${allTemplates.filter((t) => (t as any).published).length})`,
              },
            ] as { key: FilterMode; label: string }[]
          ).map(({ key, label }) => {
            const isSelected = filter === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected
                      ? colors.pillSelectedBg
                      : colors.pillBg,
                  },
                ]}
                onPress={() => setFilter(key)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? "#FFFFFF" : colors.text },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      {/* ── Template List ── */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTemplates.map((template, idx) => (
          <TemplateCard
            key={`${(template as any).number}-${template.template || ""}-${idx}`}
            template={template}
            isDark={isDark}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },

  // Stats
  statsBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statsText: {
    fontSize: 13,
    textAlign: "center",
  },

  // Filter
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },

  // Card
  card: {
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  cardName: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  cardMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  publishedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cardPurpose: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  // Chips
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Template preview
  templatePreviewContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  templatePreviewLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  templatePreviewFrame: {
    height: 500,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Empty preview
  emptyPreview: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  emptyPreviewText: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
    fontStyle: "italic",
  },
});

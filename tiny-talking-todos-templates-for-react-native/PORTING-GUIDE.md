# Porting Tiny Talking Todos Templates to React Native

## Overview

This archive contains all published templates from the Tiny Talking Todos web app. Each template is a self-contained React component that renders a themed, interactive todo list. Your goal is to port these to React Native equivalents.

---

## What's In This Archive

```
├── PORTING-GUIDE.md          ← You are here
├── catalogue.json            ← Template metadata (names, types, icons, system prompts)
├── best-practices.md         ← Performance patterns for TinyBase reactivity
├── hooks/
│   └── useTodos.ts           ← Shared hooks for todo CRUD operations
└── templates/                ← All 31 published template component files
    ├── AfterSchoolRoutine.tsx
    ├── Beach.tsx
    ├── BirthdayTracker.tsx
    ├── CarMaintenance.tsx
    ├── ChildTemperatureTracker.tsx
    ├── Clothes.tsx
    ├── DateNightList.tsx
    ├── Expiry.tsx
    ├── GiveAwayList.tsx
    ├── HomeMaintenanceList.tsx
    ├── KidsPartyFoodList.tsx
    ├── LaundryTracker.tsx
    ├── Leftovers.tsx
    ├── LunchPlanner.tsx
    ├── MentalLoad.tsx
    ├── MorningRoutine.tsx
    ├── OffloadList.tsx
    ├── ParkLife.tsx
    ├── PartyBags.tsx
    ├── PartyGuestList.tsx
    ├── RecipeCard.tsx
    ├── Recipes.tsx
    ├── SchoolCalendarTodo.tsx
    ├── SchoolHolidayPlanner.tsx
    ├── SchoolPickupRoster.tsx
    ├── ShoppingListv2.tsx
    ├── SubscriptionTracker.tsx
    ├── TidyUp.tsx
    ├── Today.tsx
    ├── WeekendPlanner.tsx
    └── WeeklyMealPlanner.tsx
```

---

## Architecture & Data Model

### Data Store: TinyBase

All templates use [TinyBase](https://tinybase.org/) for reactive client-side data. TinyBase works with React Native via `tinybase/ui-react`.

**Tables:**

| Table   | Purpose                           |
|---------|-----------------------------------|
| `lists` | List metadata (name, type, icon, template, etc.) |
| `todos` | All todo items across all lists   |

**Relationship:** Each todo row has a `list` cell pointing to a list ID. A TinyBase relationship called `"todoList"` links them, enabling `useLocalRowIds("todoList", listId)` to get all todos for a list.

### Todo Item Schema (`TodoItem`)

```typescript
interface TodoItem {
  // Identity
  id: string;
  list: string;           // FK to lists table

  // Core fields (always present)
  text: string;
  done: boolean;

  // Extended fields (used by specific templates)
  notes?: string;         // Additional details
  date?: string;          // Date value (YYYY-MM-DD)
  time?: string;          // Time value (HH:MM)
  url?: string;           // URL reference
  emoji?: string;         // Display emoji
  email?: string;         // Email address
  streetAddress?: string; // Physical address
  number?: number;        // Numeric value (servings, quantity, etc.)
  amount?: number;        // Money/quantity amount
  fiveStarRating?: number;// 1-5 rating
  type?: string;          // Category type (e.g., "Prep", "Cook", "Serve")
  category?: string;      // Grouping category
}
```

### List Metadata Schema

```typescript
interface ListMetadata {
  name: string;              // Display name
  purpose?: string;          // Description
  systemPrompt?: string;     // AI assistant prompt
  number: number;            // Template ID
  template: string;          // Component name
  type: string;              // Category: Life, Food, Info, Home, etc.
  backgroundColour: string;  // Theme color
  icon: string;              // Phosphor icon name
}
```

---

## Template Component Pattern

Every template follows this pattern:

```tsx
const MyTemplate = ({ listId = "my-list" }) => {
  // 1. Get list metadata
  const list = useRow("lists", listId);

  // 2. Get structural IDs (only re-renders on add/remove)
  const todoIds = useLocalRowIds("todoList", listId) || [];

  // 3. Action callbacks
  const addTodo = useAddRowCallback("todos", (data) => ({
    ...data, list: listId, done: false
  }), [listId]);

  // 4. Render IDs, delegate data to child components
  return (
    <Container>
      <Header list={list} count={todoIds.length} />
      {todoIds.map(id => <TodoItem key={id} id={id} />)}
      <AddButton onAdd={addTodo} />
    </Container>
  );
};

// Individual item component - subscribes to its own data
const TodoItem = memo(({ id }) => {
  const data = useRow("todos", id);
  const store = useStore();

  const toggle = () => store.setCell("todos", id, "done", !data.done);
  const remove = () => store.delRow("todos", id);

  return (
    <ItemRow done={data.done} onToggle={toggle} onRemove={remove}>
      {data.text}
    </ItemRow>
  );
});
```

---

## Key Hooks (from `hooks/useTodos.ts`)

### `useTodoActions(listId)` — Preferred
Returns `{ todoIds, addTodo, updateTodo, removeTodo }`. Only re-renders on structural changes (add/remove). Use this in parent components.

### `useTodos(listId)` — Legacy
Returns `{ todos, todoIds, addTodo, updateTodo, removeTodo }`. The `todos` array triggers re-renders on ANY cell change. Only use for simple templates.

### TinyBase Hooks Used Directly in Templates
- `useLocalRowIds("todoList", listId)` — reactive list of todo IDs
- `useRow("todos", id)` — full row data for one item
- `useCell("todos", id, "cellName")` — single reactive cell value
- `useStore()` — imperative access for mutations
- `useAddRowCallback` — stable callback for adding rows
- `useSetRowCallback` — stable callback for setting rows
- `useDelRowCallback` — stable callback for deleting rows

---

## Dependency Mapping (Web → React Native)

| Web Dependency               | React Native Equivalent                      |
|------------------------------|----------------------------------------------|
| `@chakra-ui/react` (Box, Flex, Text, VStack, HStack, Button, Input, etc.) | React Native core components (`View`, `Text`, `Pressable`, `TextInput`, `ScrollView`, `FlatList`) or a UI library like `react-native-paper`, `tamagui`, or `nativewind` |
| `@phosphor-icons/react`     | `phosphor-react-native` (same icon names!)    |
| `framer-motion`              | `react-native-reanimated` + `react-native-gesture-handler` |
| `date-fns`                   | `date-fns` (works as-is)                      |
| `use-sound`                  | `expo-av` or `react-native-sound`             |
| `react-confetti`             | `react-native-confetti-cannon`                |
| CSS transitions              | `Animated` API or `react-native-reanimated`   |
| `react-beautiful-dnd`        | `react-native-draggable-flatlist`             |

---

## Chakra UI → React Native Component Mapping

| Chakra Component | React Native Equivalent |
|-----------------|------------------------|
| `<Box>` | `<View>` |
| `<Flex>` | `<View style={{ flexDirection: 'row' }}>` |
| `<VStack>` | `<View style={{ flexDirection: 'column', gap: N }}>` |
| `<HStack>` | `<View style={{ flexDirection: 'row', gap: N }}>` |
| `<Text>` | `<Text>` (note: RN Text doesn't inherit styles) |
| `<Input>` | `<TextInput>` |
| `<Button>` | `<Pressable>` or `<TouchableOpacity>` |
| `<IconButton>` | `<Pressable>` wrapping an icon |
| `<Checkbox>` | Custom component or `expo-checkbox` |
| `<Badge>` | Custom `<View>` + `<Text>` |
| `<Tooltip>` | Not needed on mobile (remove or use long-press) |
| `<useToast>` | `react-native-toast-message` or `expo-notifications` |
| `<Divider>` | `<View style={{ height: 1, backgroundColor: '#ccc' }}>` |

### Chakra Style Props → React Native StyleSheet

```
// Chakra
<Box p={4} bg="gray.50" borderRadius="lg" shadow="md">

// React Native
<View style={{
  padding: 16,
  backgroundColor: '#F7FAFC',
  borderRadius: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}}>
```

**Chakra spacing scale:** `1 = 4px`, `2 = 8px`, `3 = 12px`, `4 = 16px`, `5 = 20px`, `6 = 24px`, `8 = 32px`

**Chakra color tokens (approximate):**
- `gray.50` = `#F7FAFC`, `gray.100` = `#EDF2F7`, `gray.200` = `#E2E8F0`, `gray.300` = `#CBD5E0`, `gray.400` = `#A0AEC0`, `gray.500` = `#718096`, `gray.600` = `#4A5568`, `gray.700` = `#2D3748`
- `blue.500` = `#3182CE`, `green.500` = `#38A169`, `red.500` = `#E53E3E`
- `yellow.400` = `#ECC94B`, `orange.400` = `#ED8936`, `cyan.400` = `#0BC5EA`
- `pink.400` = `#ED64A6`, `purple.500` = `#805AD5`

---

## Template Categories & What They Do

### Simple Todo Lists
- **Today** — Daily task list with time-of-day sections
- **Beach** — Beach packing checklist with fun surf theme
- **ParkLife** — Park outing checklist
- **Clothes** — Wardrobe tracking

### Routine/Offload Templates
- **OffloadList** — The most reused template! Used for: Party Wizard, Dinner Party, Away, Weekend Plans, Sweet Dreams, Hi DIY, Day Planner, Meal Jam, Movie Night, Lookback, Christmas HQ. Features guided steps/categories that walk users through a process.
- **AfterSchoolRoutine** — Step-by-step after-school routine
- **MorningRoutine** — Morning routine with time tracking
- **TidyUp** — Room-by-room cleaning tracker
- **MentalLoad** — Track mental load tasks by category and priority

### Food & Meal Planning
- **WeeklyMealPlanner** — Week grid with meal slots
- **LunchPlanner** — Lunchbox planning for school days
- **RecipeCard** — Recipe broken into timed cooking steps
- **Recipes** — Recipe collection/bookmarks
- **ShoppingListv2** — Categorized shopping list
- **Expiry** — Pantry/fridge/freezer expiry tracker
- **Leftovers** — Leftover meal tracker with storage info
- **KidsPartyFoodList** — Party food planning

### Life & Events
- **BirthdayTracker** — Birthday calendar with gift ideas
- **PartyGuestList** — Guest list with RSVP tracking
- **PartyBags** — Party bag contents planner
- **DateNightList** — Date night ideas and planning
- **SchoolCalendarTodo** — Weekly school timetable
- **SchoolHolidayPlanner** — Holiday activity planner
- **SchoolPickupRoster** — Pickup schedule roster
- **WeekendPlanner** — Weekend activity planner

### Home & Finance
- **HomeMaintenanceList** — Home maintenance schedule
- **CarMaintenance** — Car service/maintenance tracker
- **LaundryTracker** — Laundry load tracker
- **SubscriptionTracker** — Subscription/bill tracker with costs
- **ChildTemperatureTracker** — Temperature log for sick kids
- **GiveAwayList** — Items to donate/rehome

---

## Common Patterns to Port

### 1. Category Grouping
Many templates group todos by `type` or `category`. In the web app this uses `useMemo` with imperative reads:

```tsx
const grouped = useMemo(() => {
  const groups = {};
  todoIds.forEach(id => {
    const cat = store?.getCell("todos", id, "category") || "Default";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(id);
  });
  return groups;
}, [todoIds, store]);
```

For React Native, use `SectionList` with this grouped data.

### 2. Swipe to Delete
Web uses click-to-delete buttons. React Native should use swipe gestures via `react-native-gesture-handler` or `react-native-swipeable-item`.

### 3. Inline Editing
Web uses `<Input>` with blur-to-save. React Native should use `<TextInput>` with `onEndEditing`.

### 4. Drag to Reorder
Some web templates don't support this, but it's a natural fit for mobile. Consider `react-native-draggable-flatlist`.

### 5. Progress Indicators
Templates like TidyUp and MentalLoad show progress bars. Use `Animated` API or a library like `react-native-progress`.

### 6. Date/Time Pickers
Web uses HTML `<input type="date">`. React Native should use `@react-native-community/datetimepicker` or `expo-date-time-picker`.

---

## Performance Best Practices (Critical!)

1. **Never use `useTable("todos")` in parent components** — it re-renders on every cell change
2. **Use `useLocalRowIds("todoList", listId)` in parents** — only fires on add/remove
3. **Wrap individual items in `memo()`** — each subscribes to its own `useRow`
4. **Use `FlatList` instead of `.map()`** — React Native needs virtualization for lists
5. **Isolate aggregation** (progress bars, counts) into separate component trees
6. **Use CSS-style transitions sparingly** — prefer `Animated` API for simple opacity/transform, `react-native-reanimated` for complex animations

---

## Catalogue Reference

The `catalogue.json` file contains metadata for all templates. Key fields for each published template:

- `template` — Component name (maps to filename in `templates/`)
- `name` — User-facing display name
- `purpose` — Description shown to users
- `type` — Category (Life, Food, Info, Home, Offload, Fun, Money, Stuff, Health)
- `backgroundColour` — Theme color (use for list header/accent)
- `icon` — Phosphor icon name (same names work in `phosphor-react-native`)
- `number` — Unique template ID
- `systemPrompt` — AI assistant system prompt (for voice/chat features)
- `published` — Only port templates where this is `true`
- `upgradeOnly` — Premium templates (some published templates are upgrade-only)

**Note:** The `OffloadList` template appears multiple times in the catalogue with different names and purposes. It's a single component that adapts based on the list metadata (name, purpose, system prompt). You only need to port it once.

---

## Getting Started

1. Read this guide fully
2. Review `catalogue.json` to understand which templates to port
3. Start with a simpler template like `Today.tsx` or `Beach.tsx` to establish patterns
4. Then tackle the reusable `OffloadList.tsx` (it powers ~10 published lists)
5. Work through the remaining templates
6. Refer to `best-practices.md` for TinyBase performance patterns

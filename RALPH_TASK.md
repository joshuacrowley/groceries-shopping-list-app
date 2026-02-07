---
task: Port/refresh all 31 Tiny Talking Todos templates to React Native
test_command: "cd client && npx expo lint"
---

# Task: Port All Templates to React Native

Port each web template from `tiny-talking-todos-templates-for-react-native/templates/` to `client/templates/` as a React Native component, then wire it into the switch statement in `client/app/(index)/list/[listId]/index.tsx`.

## CRITICAL: Context Management

DO NOT read these files (they are too large and will waste your context):
- `tiny-talking-todos-templates-for-react-native/catalogue.json` (88KB) — use `grep` instead
- `tiny-talking-todos-templates-for-react-native/PORTING-GUIDE.md` — already summarized below
- `tiny-talking-todos-templates-for-react-native/best-practices.md` — already summarized below
- `client/templates/RecipeCard.tsx` (68KB) — pattern is shown below

For each template, ONLY read the specific web source file you're porting. Use `grep -A 10 '"template": "TemplateName"' tiny-talking-todos-templates-for-react-native/catalogue.json` to get metadata.

## Porting Pattern (use this — do NOT read other files for reference)

```typescript
import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal } from "react-native";
import { useStore, useLocalRowIds, useRow, useSetRowCallback, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
// Import specific icons from phosphor-react-native (same names as web)

// Memoized individual item component — subscribes to its own data only
const TaskItem = memo(({ id }: { id: string }) => {
  const taskData = useRow("todos", id);
  const store = useStore();
  const deleteTask = useDelRowCallback("todos", id);

  if (!taskData) return null;

  const handleToggle = () => store?.setCell("todos", id, "done", !taskData.done);
  const handleDelete = () => {
    Alert.alert("Delete", "Delete this item?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteTask },
    ]);
  };

  return (
    <View style={styles.item}>
      <Pressable onPress={handleToggle}>
        <View style={[styles.checkbox, taskData.done && styles.checkboxDone]} />
      </Pressable>
      <Text style={[styles.itemText, taskData.done && styles.itemTextDone]}>{taskData.text}</Text>
      <Pressable onPress={handleDelete}>
        <Text style={styles.deleteBtn}>×</Text>
      </Pressable>
    </View>
  );
});

// Parent component — uses useLocalRowIds (NOT useTable)
export default function TemplateName({ listId }: { listId: string }) {
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const store = useStore();
  const [newText, setNewText] = useState("");

  const addTodo = useAddRowCallback(
    "todos",
    (data: any) => ({ ...data, list: listId, done: false }),
    [listId]
  );

  // Category grouping (if needed)
  const grouped = useMemo(() => {
    const groups: Record<string, string[]> = {};
    todoIds.forEach(id => {
      const cat = store?.getCell("todos", id, "category") as string || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(id);
    });
    return groups;
  }, [todoIds, store]);

  return (
    <ScrollView style={styles.container}>
      {todoIds.map(id => <TaskItem key={id} id={id} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAFC" },
  item: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  // ... more styles
});
```

## Key Conversion Rules

- `<Box>` → `<View>`, `<Flex>` → `<View style={{flexDirection:'row'}}>`, `<VStack>` → `<View>`, `<HStack>` → `<View style={{flexDirection:'row'}}>`
- `<Input>` → `<TextInput>`, `<Button>` → `<Pressable>`, `<IconButton>` → `<Pressable>` wrapping icon
- Chakra spacing: `p={4}` = `padding: 16`, `1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px`
- Chakra colors: `gray.50=#F7FAFC, gray.100=#EDF2F7, gray.200=#E2E8F0, gray.500=#718096, gray.700=#2D3748`
- `blue.500=#3182CE, green.500=#38A169, red.500=#E53E3E, purple.500=#805AD5, orange.400=#ED8936, pink.400=#ED64A6`
- Skip `framer-motion` animations — use simple style changes
- Skip `use-sound` — remove sound effects
- Skip `react-confetti` — remove confetti
- Use `StyleSheet.create()` for all styles
- `export default function TemplateName({ listId }: { listId: string })`

## How to Port Each Template

1. Read ONLY `tiny-talking-todos-templates-for-react-native/templates/{Template}.tsx`
2. Use `grep` to get catalogue metadata (do NOT read the full file)
3. Convert to React Native using the pattern above
4. Write to `client/templates/{Template}.tsx`
5. Add import + case to switch in `client/app/(index)/list/[listId]/index.tsx`
6. Mark checkbox `[x]` in this file
7. Commit: `git add -A && git commit -m 'ralph: port {Template} to React Native'`

Work through templates one at a time. After each commit, move to the next unchecked item.

## Success Criteria

### Refresh existing (overwrite with fresh port from web source)

1. [x] `ShoppingListv2`
2. [x] `Today`
3. [x] `WeeklyMealPlanner`
4. [x] `WeekendPlanner`
5. [x] `Recipes`
6. [x] `RecipeCard`

### Port new templates

7. [x] `AfterSchoolRoutine`
8. [x] `Beach`
9. [ ] `BirthdayTracker`
10. [ ] `CarMaintenance`
11. [ ] `ChildTemperatureTracker`
12. [ ] `Clothes`
13. [ ] `DateNightList`
14. [ ] `Expiry`
15. [ ] `GiveAwayList`
16. [ ] `HomeMaintenanceList`
17. [ ] `KidsPartyFoodList`
18. [ ] `LaundryTracker`
19. [ ] `Leftovers`
20. [ ] `LunchPlanner`
21. [ ] `MentalLoad`
22. [ ] `MorningRoutine`
23. [ ] `OffloadList`
24. [ ] `ParkLife`
25. [ ] `PartyBags`
26. [ ] `PartyGuestList`
27. [ ] `SchoolCalendarTodo`
28. [ ] `SchoolHolidayPlanner`
29. [ ] `SchoolPickupRoster`
30. [ ] `SubscriptionTracker`
31. [ ] `TidyUp`

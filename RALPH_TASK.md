---
task: Port/refresh all 31 Tiny Talking Todos templates to React Native
test_command: "cd client && npx expo lint"
---

# Task: Port All Templates to React Native

Port every template from `tiny-talking-todos-templates-for-react-native/templates/` to `client/templates/` as a React Native component. For the 6 that already exist, refresh them from the latest web source. For the 25 new ones, create them from scratch.

## Before You Start

Read these files for context (in this order):

1. `tiny-talking-todos-templates-for-react-native/PORTING-GUIDE.md` — full porting instructions, dependency mapping, component mapping
2. `tiny-talking-todos-templates-for-react-native/best-practices.md` — TinyBase performance patterns
3. `tiny-talking-todos-templates-for-react-native/hooks/useTodos.ts` — shared hooks reference (TodoItem interface, useTodoActions, useTodos)
4. `client/templates/RecipeCard.tsx` — example of a well-ported template (use as your reference for style/patterns)
5. `client/app/(index)/list/[listId]/index.tsx` — the switch statement where templates are wired up

## How to Port Each Template

For each template:

1. **Read the web source**: `tiny-talking-todos-templates-for-react-native/templates/{Template}.tsx`
2. **Read the catalogue entry** in `tiny-talking-todos-templates-for-react-native/catalogue.json` for metadata (icon, color, type, systemPrompt)
3. **Convert to React Native** following these rules:
   - Use `react-native` core components: `View`, `Text`, `Pressable`, `TextInput`, `ScrollView`, `FlatList`, `Alert`, `Modal`, `StyleSheet`
   - Use `phosphor-react-native` for icons (same icon names as web)
   - Use TinyBase hooks from `tinybase/ui-react`: `useStore`, `useLocalRowIds`, `useRow`, `useCell`, `useSetRowCallback`, `useDelRowCallback`, `useAddRowCallback`, `useTable`, `useAddRowCallback`
   - Wrap individual item components in `React.memo()`
   - Use `useLocalRowIds("todoList", listId)` in parent components (NOT `useTable`)
   - Use `useMemo` with imperative `store.getCell()` for category grouping
   - Replace Chakra UI components with React Native equivalents (see PORTING-GUIDE.md)
   - Replace framer-motion with simple React Native `Animated` or just static rendering (skip complex animations)
   - Replace `use-sound` with nothing (skip sound effects for now)
   - Replace CSS transitions with React Native opacity/style changes
   - Use `StyleSheet.create()` for all styles at the bottom of the file
   - Export the component as `export default function TemplateName({ listId }: { listId: string })`
4. **Write the file** to `client/templates/{Template}.tsx`
5. **Wire it up**: Add an `import` and a `case` to the switch statement in `client/app/(index)/list/[listId]/index.tsx`
6. **Commit**: `git add -A && git commit -m 'ralph: port {Template} to React Native'` (or `ralph: refresh {Template}` for existing ones)

## Key Pattern Reference

```typescript
import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal } from "react-native";
import { useStore, useLocalRowIds, useRow, useSetRowCallback, useDelRowCallback, useAddRowCallback } from "tinybase/ui-react";
import { SomeIcon } from "phosphor-react-native";

// Memoized individual item component
const TaskItem = memo(({ id }: { id: string }) => {
  const taskData = useRow("todos", id);
  const store = useStore();
  const updateTask = useSetRowCallback(
    "todos", id,
    (updates: any) => ({ ...taskData, ...updates }),
    [taskData]
  );
  const deleteTask = useDelRowCallback("todos", id);

  if (!taskData) return null;

  return (
    <View style={styles.item}>
      <Pressable onPress={() => store?.setCell("todos", id, "done", !taskData.done)}>
        {/* checkbox */}
      </Pressable>
      <Text>{taskData.text}</Text>
      <Pressable onPress={() => Alert.alert("Delete", "Delete this item?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteTask },
      ])}>
        {/* delete button */}
      </Pressable>
    </View>
  );
});

// Parent component
export default function TemplateName({ listId }: { listId: string }) {
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const store = useStore();
  const addTodo = useAddRowCallback(
    "todos",
    (data: any) => ({ ...data, list: listId, done: false }),
    [listId]
  );

  // Category grouping example
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
      {/* Render items */}
      {todoIds.map(id => <TaskItem key={id} id={id} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  item: { /* ... */ },
});
```

## Success Criteria

### Refresh existing templates (re-port from latest web source)

1. [ ] Refresh `ShoppingListv2` — read web source, re-port to React Native, commit
2. [ ] Refresh `Today` — read web source, re-port to React Native, commit
3. [ ] Refresh `WeeklyMealPlanner` — read web source, re-port to React Native, commit
4. [ ] Refresh `WeekendPlanner` — read web source, re-port to React Native, commit
5. [ ] Refresh `Recipes` — read web source, re-port to React Native, commit
6. [ ] Refresh `RecipeCard` — read web source, re-port to React Native, commit

### Port new templates

7. [ ] Port `AfterSchoolRoutine` — read web source, port to React Native, wire up switch, commit
8. [ ] Port `Beach` — read web source, port to React Native, wire up switch, commit
9. [ ] Port `BirthdayTracker` — read web source, port to React Native, wire up switch, commit
10. [ ] Port `CarMaintenance` — read web source, port to React Native, wire up switch, commit
11. [ ] Port `ChildTemperatureTracker` — read web source, port to React Native, wire up switch, commit
12. [ ] Port `Clothes` — read web source, port to React Native, wire up switch, commit
13. [ ] Port `DateNightList` — read web source, port to React Native, wire up switch, commit
14. [ ] Port `Expiry` — read web source, port to React Native, wire up switch, commit
15. [ ] Port `GiveAwayList` — read web source, port to React Native, wire up switch, commit
16. [ ] Port `HomeMaintenanceList` — read web source, port to React Native, wire up switch, commit
17. [ ] Port `KidsPartyFoodList` — read web source, port to React Native, wire up switch, commit
18. [ ] Port `LaundryTracker` — read web source, port to React Native, wire up switch, commit
19. [ ] Port `Leftovers` — read web source, port to React Native, wire up switch, commit
20. [ ] Port `LunchPlanner` — read web source, port to React Native, wire up switch, commit
21. [ ] Port `MentalLoad` — read web source, port to React Native, wire up switch, commit
22. [ ] Port `MorningRoutine` — read web source, port to React Native, wire up switch, commit
23. [ ] Port `OffloadList` — read web source, port to React Native, wire up switch, commit
24. [ ] Port `ParkLife` — read web source, port to React Native, wire up switch, commit
25. [ ] Port `PartyBags` — read web source, port to React Native, wire up switch, commit
26. [ ] Port `PartyGuestList` — read web source, port to React Native, wire up switch, commit
27. [ ] Port `SchoolCalendarTodo` — read web source, port to React Native, wire up switch, commit
28. [ ] Port `SchoolHolidayPlanner` — read web source, port to React Native, wire up switch, commit
29. [ ] Port `SchoolPickupRoster` — read web source, port to React Native, wire up switch, commit
30. [ ] Port `SubscriptionTracker` — read web source, port to React Native, wire up switch, commit
31. [ ] Port `TidyUp` — read web source, port to React Native, wire up switch, commit

## Important Notes

- The `OffloadList` template is the most complex — it powers ~10 different published lists. Port it as a single component that adapts based on list metadata.
- Skip sound effects (`use-sound`) — just remove them.
- Skip complex framer-motion animations — use simple opacity/style changes or static rendering.
- For date/time pickers, use a simple `TextInput` for now (the app can add native pickers later).
- If a Phosphor icon doesn't exist in `phosphor-react-native`, use the closest available alternative.
- Always use `StyleSheet.create()` for styles — never inline style objects.
- Each template should be fully self-contained in a single file.
- Remember to update `.ralph/progress.md` after completing templates.

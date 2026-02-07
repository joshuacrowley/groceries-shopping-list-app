---
description: Best practices for building todo list templates with TinyBase reactivity
globs: src/templates/**/*.tsx
alwaysApply: false
---

# Template Best Practices

## Data Access: Fine-grained TinyBase subscriptions

Never use `useTable("todos")` in parent components. It subscribes to EVERY cell change across ALL todos, causing cascade re-renders.

```tsx
// BAD - parent re-renders on every toggle, edit, or any change
const todosTable = useTable("todos");
const items = todoIds.map(id => ({ id, ...todosTable[id] }));

// GOOD - parent only re-renders on add/remove
const todoIds = useLocalRowIds("todoList", listId) || [];
```

For category grouping or other derived data that depends on cell values, use imperative reads inside `useMemo` keyed on `todoIds`:

```tsx
// Only recomputes when items are added/removed, not on toggle
const categorized = useMemo(() => {
  const groups = {};
  todoIds.forEach(id => {
    const cat = store?.getCell("todos", id, "category") || "Default";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(id);
  });
  return groups;
}, [todoIds, store]);
```

## Component Architecture: Extract memoized item components

Every template should extract individual items into `memo()`-wrapped components that subscribe to their own row via `useRow`. The parent renders IDs, the child renders data.

```tsx
const TodoItem = memo(({ id }: { id: string }) => {
  const data = useRow("todos", id);           // Only THIS item's changes trigger re-render
  const update = useSetRowCallback("todos", id, (u) => ({ ...data, ...u }), [data]);
  const remove = useDelRowCallback("todos", id);
  // ... render item
});

const MyList = ({ listId }) => {
  const todoIds = useLocalRowIds("todoList", listId) || [];
  return todoIds.map(id => <TodoItem key={id} id={id} />);
};
```

## Aggregation: Isolate counts into separate components

Progress bars, done counts, or other aggregates should be in their own component tree so updates don't cascade to item rendering.

```tsx
const DoneStatus = memo(({ id, onDone }) => {
  const done = useCell("todos", id, "done");
  React.useEffect(() => { onDone(id, Boolean(done)); }, [id, done, onDone]);
  return null; // Render-less observer
});

const ProgressBar = ({ todoIds }) => {
  const [doneCounts, setDoneCounts] = useState({});
  const handleDone = useCallback((id, done) => {
    setDoneCounts(prev => prev[id] === done ? prev : { ...prev, [id]: done });
  }, []);
  // Render DoneStatus per item + progress UI
};
```

## Animation: CSS transitions over framer-motion for items

Don't use framer-motion `initial`/`animate`/`layout` on todo items. Structural re-renders (add/remove) will replay entry animations on all sibling items, causing visual noise. Use CSS transitions instead.

```tsx
// BAD - replays on every parent re-render
<Box as={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>

// GOOD - smooth, GPU-composited, no React re-render needed
<Box opacity={isDone ? 0.55 : 1} css={{ transition: "opacity 0.2s, border-color 0.2s" }}>
```

Keep framer-motion for decorative elements only (wave animations, progress bars, empty states).

## Template Signature

Templates should only destructure `listId` and get everything else from hooks:

```tsx
// GOOD - self-managing, no dependency on passed data
const MyTemplate = ({ listId = "my-list" }) => {
  const list = useRow("lists", listId);
  const todoIds = useLocalRowIds("todoList", listId) || [];
  const addTodo = useAddRowCallback("todos", (d) => ({ ...d, list: listId, done: false }), [listId]);
  // ...
};
```

## Available hooks from TinyBase (via scope)

- `useLocalRowIds("todoList", listId)` - reactive ID list (structural only)
- `useRow("todos", id)` - reactive full row for one item
- `useCell("todos", id, "cellName")` - reactive single cell
- `useStore()` - imperative store access (non-reactive reads)
- `useAddRowCallback` / `useSetRowCallback` / `useDelRowCallback` - stable mutation callbacks

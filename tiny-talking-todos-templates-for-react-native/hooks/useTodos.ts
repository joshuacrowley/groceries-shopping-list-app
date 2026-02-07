import { useMemo, useCallback } from "react";
import {
  useStore,
  useLocalRowIds,
  useTable,
  useAddRowCallback,
} from "tinybase/ui-react";

/**
 * Represents a single todo item with all fields from the schema.
 *
 * Core fields are always present; extended fields are optional and
 * used by specific templates (e.g., RecipeCard uses `type` and `category`,
 * ShoppingList uses `amount` and `category`, etc.).
 */
export interface TodoItem {
  // Identity
  id: string;
  list: string;

  // Core fields (always present)
  text: string;
  done: boolean;

  // Extended fields (used by various templates)
  notes?: string;
  date?: string;
  time?: string;
  url?: string;
  emoji?: string;
  email?: string;
  streetAddress?: string;
  number?: number;
  amount?: number;
  fiveStarRating?: number;
  type?: string;
  category?: string;

  // Allow any additional fields for forward compatibility
  [key: string]: any;
}

/** Data accepted when creating a new todo (id and list are set automatically). */
export type NewTodoData = Partial<Omit<TodoItem, "id" | "list">>;

/** Data accepted when updating an existing todo. */
export type TodoUpdate = Partial<Omit<TodoItem, "id">>;

/**
 * A lightweight hook that provides only structural subscriptions and action
 * callbacks. It uses `useLocalRowIds` which only fires when items are **added
 * or removed** from the list — not when a cell value (e.g. `done`) changes.
 *
 * Use this in rendering pipelines (PreviewScreen, LiveList) and in parent
 * components that don't need the full todo data. Individual item components
 * should subscribe to their own data via `useRow("todos", id)`.
 *
 * @param {string} listId - The ID of the list whose todos are to be managed.
 * @returns {object} An object containing:
 *  - `todoIds`: A reactive array of todo row IDs (only changes on add/remove).
 *  - `addTodo`: A memoized function to add a new todo item.
 *  - `updateTodo`: A memoized function to partially update an existing todo item.
 *  - `removeTodo`: A memoized function to delete a todo item.
 */
export const useTodoActions = (listId: string) => {
  const store = useStore();

  const todoIds = useLocalRowIds("todoList", listId) || [];

  const addTodo = useAddRowCallback(
    "todos",
    (newTodoData: NewTodoData) => ({
      ...newTodoData,
      list: listId,
      done: newTodoData.done ?? false,
    }),
    [listId]
  );

  const updateTodo = useCallback(
    (todoId: string, updates: TodoUpdate) => {
      store?.setPartialRow("todos", todoId, updates);
    },
    [store]
  );

  const removeTodo = useCallback(
    (todoId: string) => {
      store?.delRow("todos", todoId);
    },
    [store]
  );

  return { todoIds, addTodo, updateTodo, removeTodo };
};

/**
 * A full-data hook that provides a reactive `todos` array built from the
 * entire table. **This causes a re-render on every cell change in the todos
 * table** — prefer `useTodoActions` in rendering pipelines and parent
 * components, and `useRow` in individual item components.
 *
 * Kept for backward compatibility with simple templates that receive `todos`
 * as a prop.
 *
 * @param {string} listId - The ID of the list whose todos are to be managed.
 */
export const useTodos = (listId: string) => {
  const store = useStore();

  const todoIds = useLocalRowIds("todoList", listId) || [];

  const todosTable = useTable("todos");

  const todos = useMemo(
    () =>
      todoIds.map((id) => ({
        id,
        ...(todosTable[id] || {}),
      })) as TodoItem[],
    [todoIds, todosTable]
  );

  const addTodo = useAddRowCallback(
    "todos",
    (newTodoData: NewTodoData) => ({
      ...newTodoData,
      list: listId,
      done: newTodoData.done ?? false,
    }),
    [listId]
  );

  const updateTodo = useCallback(
    (todoId: string, updates: TodoUpdate) => {
      store?.setPartialRow("todos", todoId, updates);
    },
    [store]
  );

  const removeTodo = useCallback(
    (todoId: string) => {
      store?.delRow("todos", todoId);
    },
    [store]
  );

  return {
    todos,
    todoIds,
    addTodo,
    updateTodo,
    removeTodo,
  };
};
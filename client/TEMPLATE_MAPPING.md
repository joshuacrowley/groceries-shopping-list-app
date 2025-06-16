# Template Mapping Guide

This document explains how template mapping works in the groceries shopping list app and provides step-by-step instructions for adding new templates.

## Overview

The app uses a template-based architecture where different list types can have completely different UI components and data schemas. This allows for specialized interfaces like shopping lists, todo lists, recipe cards, etc.

## How Template Mapping Works

### 1. Template Definition (`catalogue.json`)

Each template is defined in `catalogue.json` with the following structure:

```json
{
  "template": "TemplateName",           // Must match the component filename
  "name": "Display Name",              // Human-readable name
  "purpose": "What this template does",
  "type": "Category",                  // Food, Life, Info, etc.
  "published": true,                   // Whether it's available to users
  "backgroundColour": "blue",          // Theme color
  "icon": "IconName",                  // Phosphor icon name
  "systemPrompt": "AI behavior...",    // How the AI assistant behaves
  "number": 1                          // Sort order
}
```

### 2. Template Component (`templates/TemplateName.tsx`)

Each template has its own React Native component in the `templates/` directory:

```typescript
// templates/TemplateName.tsx
interface TemplateNameProps {
  listId: string;
}

const TemplateName: React.FC<TemplateNameProps> = ({ listId }) => {
  // Component implementation
  return <View>...</View>;
};

export default TemplateName;
```

### 3. Template Routing (`app/(index)/list/[listId]/index.tsx`)

The router determines which template component to render based on the list's `template` property:

```typescript
const renderListTemplate = () => {
  const template = list.template;
  
  switch (template) {
    case 'ShoppingListv2':
      return <ShoppingListv2 listId={listId as string} />;
    case 'Today':
      return <Today listId={listId as string} />;
    case 'YourNewTemplate':
      return <YourNewTemplate listId={listId as string} />;
    default:
      return <TodoList listId={listId as string} />;
  }
};
```

## Step-by-Step: Adding a New Template

### Step 1: Define Template in Catalogue

Add your template definition to `catalogue.json`:

```json
{
  "template": "MyNewTemplate",
  "name": "My New Template",
  "purpose": "Brief description of what this template does",
  "type": "Category",
  "published": true,
  "backgroundColour": "green",
  "icon": "IconName",
  "systemPrompt": "You are an assistant that helps with...",
  "number": 999
}
```

**Important**: The `"template"` field must exactly match your component filename.

### Step 2: Create Template Component

Create `templates/MyNewTemplate.tsx`:

```typescript
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  useStore,
  useRow,
  useLocalRowIds,
  useTable,
  useSetRowCallback,
  useDelRowCallback,
  useAddRowCallback,
} from 'tinybase/ui-react';

interface MyNewTemplateProps {
  listId: string;
}

const MyNewTemplate: React.FC<MyNewTemplateProps> = ({ listId }) => {
  const store = useStore();
  const todosTable = useTable('todos');
  const todoIds = useLocalRowIds('todoList', listId) || [];
  const listData = useRow('lists', listId);

  // Your template implementation here
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Your UI here */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 16,
  },
});

export default MyNewTemplate;
```

### Step 3: Add Template to Router

Update `app/(index)/list/[listId]/index.tsx`:

1. **Add import**:
```typescript
import MyNewTemplate from '@/templates/MyNewTemplate';
```

2. **Add case to switch statement**:
```typescript
case 'MyNewTemplate':
  return <MyNewTemplate listId={listId as string} />;
```

### Step 4: Test Your Template

1. Create a new list using your template
2. Verify it renders correctly
3. Test all functionality
4. Ensure data persistence works

## Data Schema Considerations

### TinyBase Integration

Templates work with TinyBase stores and follow this data structure:

- **Lists Table**: `{ id, name, template, icon, color, ... }`
- **Todos Table**: `{ id, text, list, type, done, notes, ... }`
- **Relationships**: `todoList` links todos to their lists

### Common Data Fields

Most templates use these standard fields:

```typescript
interface TodoItem {
  text: string;           // Main item description
  list: string;           // List ID this belongs to
  type: string;           // Category (A, B, C, D, E)
  done: boolean;          // Completion status
  notes?: string;         // Additional details
  date?: string;          // ISO date (YYYY-MM-DD)
  time?: string;          // Time (HH:MM)
  category?: string;      // Custom categorization
  amount?: number;        // Price/quantity
  emoji?: string;         // Display emoji
}
```

### Template-Specific Fields

Templates can define their own additional fields based on their needs:

- **Shopping Lists**: `category`, `amount` for prices
- **Today Lists**: `date`, `time` for scheduling
- **Recipe Cards**: `instructions`, `ingredients`

## Best Practices

### 1. Follow Naming Conventions

- **Template Name**: PascalCase, descriptive (e.g., `ShoppingListv2`)
- **Component File**: Match template name exactly
- **Display Name**: Human-readable (e.g., "Shopping List")

### 2. Design Considerations

- Use consistent color schemes
- Follow React Native best practices
- Ensure accessibility
- Test on different screen sizes
- Match the overall app design language

### 3. Data Structure

- Keep data schemas simple and intuitive
- Document any custom fields in your system prompt
- Ensure data can be easily exported/imported
- Consider backwards compatibility

### 4. System Prompts

Write clear system prompts that explain:
- What fields are required vs optional
- How data should be structured
- What the AI assistant should help with
- Examples of proper data format

### 5. Error Handling

- Handle missing or malformed data gracefully
- Provide fallbacks for optional fields
- Test with empty lists and edge cases

## Examples

### Simple Template Example

See `templates/Today.tsx` for a good example of:
- Date-based organization
- Multiple sections (Todo/Todidn't)
- Time-based sorting
- Action buttons and interactions

### Complex Template Example

See `templates/ShoppingListv2.tsx` for:
- Category-based organization
- Price calculations
- Advanced UI components
- Modal forms

## Troubleshooting

### Template Not Appearing
1. Check the template name matches exactly in catalogue.json and filename
2. Verify the switch case was added to the router
3. Ensure the import statement is correct
4. Check for TypeScript errors

### Data Not Persisting
1. Verify TinyBase hooks are used correctly
2. Check that the `list` field is set properly on todos
3. Ensure relationships are established correctly

### UI Issues
1. Test on both iOS and Android
2. Check for console errors
3. Verify StyleSheet is properly defined
4. Test with different data states (empty, full, etc.)

## Getting Help

If you run into issues:
1. Check existing templates for reference
2. Review TinyBase documentation for data operations
3. Test incrementally as you build
4. Use console.log to debug data flow

Remember: Templates are powerful because they allow completely different user experiences within the same app architecture!
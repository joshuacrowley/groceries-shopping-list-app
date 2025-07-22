# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Client (React Native/Expo)
```bash
cd client
bun install                    # Install dependencies
npx expo start                 # Start development server
expo run:ios                   # Run on iOS simulator
expo run:android              # Run on Android emulator
expo start --web             # Run on web browser
npx expo lint                 # Lint code
jest --watchAll               # Run tests in watch mode
eas build --platform ios     # Build for iOS
```

### Server (Cloudflare Workers)
```bash
cd server
bun install                   # Install dependencies
bun dev                      # Start local development server (wrangler dev)
bun run deploy              # Deploy to Cloudflare Workers
```

### Widget Development
```bash
cd client
npx expo prebuild --template node_modules/@bacons/apple-targets/prebuild-blank.tgz --clean
```

## Architecture Overview

### Project Structure
- **client/**: Expo React Native app with iOS widget support
- **server/**: Cloudflare Worker with Durable Objects for real-time sync

### State Management with TinyBase
The app uses TinyBase as its primary state management solution with a dual-store architecture:

1. **ShoppingListsStore**: Manages list metadata and IDs (singleton)
2. **ShoppingListStore**: Individual list instances with products and collaborators

Key patterns:
- Schema-driven data structure defined in `stores/schema.ts`
- Mergeable stores for collaborative editing without conflicts
- Local SQLite persistence via `expo-sqlite`
- Real-time WebSocket synchronization with Cloudflare Workers

### Navigation
- File-based routing with Expo Router
- Custom tab navigation (tab bar hidden, using `ListsNavigator` component)
- Modal presentations for forms and detail views

### Authentication & Multi-tenancy
- Clerk handles authentication and organization management
- Organization ID used for data partitioning
- WebSocket connections use Clerk authentication tokens

## Key Technologies

- **Expo SDK 53** with React Native 0.79.2 and React 19
- **TinyBase 5.4.2** for state management and synchronization
- **Clerk** for authentication
- **Cloudflare Workers + Durable Objects** for serverless backend
- **Phosphor React Native** for icons
- **TypeScript** throughout

## Data Flow

1. **Local-first**: All data stored locally in SQLite
2. **Real-time sync**: WebSocket connection to Cloudflare Worker
3. **Conflict resolution**: TinyBase's mergeable architecture handles conflicts automatically
4. **Offline tolerance**: App works fully offline, syncs when reconnected

## Common Patterns

### Creating New Lists
Lists are created through `ListCreationForm` component with:
- Custom icons and colors via `IconSelector`
- Schema validation via TinyBase
- Automatic store instantiation for new lists

### Store Management
Each shopping list gets its own TinyBase store instance:
```typescript
// Pattern: stores/ShoppingListStore.tsx
const store = createMergeableStore().setSchema(shoppingListSchema)
```

### Authentication Flow
- Clerk session determines data access
- Organization membership required for list access
- Token refresh handled automatically for WebSocket connections

## iOS Widget Integration
- Uses `@bacons/apple-targets` for native widget support
- Shared data between app and widget via App Groups
- Widget code in `targets/widget/` directory
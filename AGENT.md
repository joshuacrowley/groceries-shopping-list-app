# Agent Guidelines for Groceries Shopping List App

## Build and Test Commands

### Client (Expo/React Native)
- `cd client && bun install` - Install dependencies
- `cd client && npx expo start` - Start development server
- `cd client && bun test` - Run all tests with Jest
- `cd client && bun test -- -t "<test-name>"` - Run single test
- `cd client && bun lint` - Run linter

### Server (Cloudflare Workers)
- `cd server && bun install` - Install dependencies
- `cd server && bun dev` - Start local development server
- `cd server && bun run deploy` - Deploy to Cloudflare Workers

## Code Style Guidelines

- **TypeScript**: Use TypeScript for type safety with React component props
- **Component Structure**: Functional components with hooks (useState, useEffect, custom hooks)
- **Imports**: Group related imports, sort from external to internal (@/paths)
- **File Organization**: Components in client/components/, screens in client/app/
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Error Handling**: Early returns for validation (e.g., `if (!listName) return;`)
- **Styling**: Use StyleSheet.create() with descriptive style names
- **Testing**: Jest with react-test-renderer for snapshot tests
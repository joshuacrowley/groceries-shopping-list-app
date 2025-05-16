import React, { useEffect, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useUser, useOrganization, useAuth } from "@clerk/clerk-expo";
import {
  createMergeableStore,
  createRelationships,
  createStore,
  MergeableStore,
} from "tinybase";
import {
  Provider,
  useCreateMergeableStore,
  useCreatePersister,
  useCreateSynchronizer,
  useCreateStore,
  useCreateRelationships,
} from "tinybase/ui-react";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import { SCHEMA } from "./schema";

// Enable detailed logging
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[TTTStore]', ...args);
  }
}

// Constants for server connection
// Get the server URL from environment or use defaults
let SERVER = process.env.EXPO_PUBLIC_SYNC_SERVER_URL || 
  (process.env.NODE_ENV === "development" 
    ? "ws://localhost:8787" 
    : "wss://worker.tinytalkingtodos.com");

// Ensure URL starts with ws:// or wss://
if (SERVER.startsWith('http://')) {
  SERVER = SERVER.replace('http://', 'ws://');
} else if (SERVER.startsWith('https://')) {
  SERVER = SERVER.replace('https://', 'wss://');
} else if (!SERVER.startsWith('ws://') && !SERVER.startsWith('wss://')) {
  SERVER = `ws://${SERVER}`;
}

debugLog("Server URL:", SERVER);

const TTTStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoaded } = useUser();
  const { organization } = useOrganization();
  const { getToken } = useAuth();
  const [serverPath, setServerPath] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize main store
  const store = useCreateMergeableStore(() => {
    const newStore = createMergeableStore();
    newStore.setTablesSchema(SCHEMA);
    // Add initial data for a demo list if needed
    if (!newStore.getRowIds('lists').length) {
      const listId = 'demo-list-' + Date.now();
      newStore.setRow('lists', listId, {
        name: 'Getting Started',
        purpose: 'Welcome to your todo list app!',
        backgroundColour: 'blue',
        icon: '🚀',
        type: 'Info'
      });
      
      // Add a sample todo
      newStore.setRow('todos', 'demo-todo-1', {
        list: listId,
        text: 'Try adding a new todo',
        done: false,
        type: 'A'
      });
    }
    return newStore;
  });

  // Initialize settings store
  const settingsStore = useCreateStore(() => {
    const store = createStore()
      .setValue("backgroundColour", "blue")
      .setValue("persister", "websocket")
      .setValue("showSettings", false);
    return store;
  });

  // Initialize desk store
  const deskStore = useCreateStore(() =>
    createStore()
      .setValue("primaryList", "")
      .setValue("listType", "All")
  );

  // Set up relationships
  const relationships = useCreateRelationships(store, (store) =>
    createRelationships(store).setRelationshipDefinition(
      "todoList", 
      "todos", 
      "lists", 
      "list"
    )
  );

  // No local persistence for now, using memory-only store
  // We'll rely on server synchronization for data persistence

  // Set up organization path for synchronization
  useEffect(() => {
    debugLog("Auth state:", { isLoaded, organizationId: organization?.id, userId: user?.id });
    
    if (isLoaded) {
      if (organization?.id) {
        const path = `/sync/${organization.id}`;
        debugLog("Setting server path:", path);
        setServerPath(path);
        setIsInitialized(true);
      } else {
        debugLog("Warning: No organization ID available");
      }
    }
  }, [isLoaded, organization?.id, user?.id]);

  // Set up server synchronization
  useCreateSynchronizer(
    store,
    async (store: MergeableStore) => {
      if (!isInitialized || !serverPath) {
        debugLog("Waiting for initialization...", {
          isInitialized,
          serverPath,
        });
        return null;
      }

      try {
        // Get the token from Clerk session using useAuth
        let token;
        try {
          token = await getToken();
          if (!token) {
            console.error("No token available from session");
            return null;
          }
        } catch (error) {
          console.error("Error getting token:", error);
          return null;
        }

        debugLog("Creating WebSocket connection:", {
          organizationId: organization?.id,
          path: serverPath,
          tokenAvailable: !!token,
        });

        const wsUrl = new URL(SERVER + serverPath);
        wsUrl.searchParams.set("token", token);

        debugLog("WebSocket URL:", wsUrl.toString());

        const ws = new ReconnectingWebSocket(wsUrl.toString());

        ws.addEventListener("open", () => {
          debugLog("WebSocket connected successfully", {
            readyState: ws.readyState,
            url: ws.url,
          });
        });

        ws.addEventListener("close", (event) => {
          debugLog("WebSocket closed:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            readyState: ws.readyState,
          });
        });

        ws.addEventListener("error", (event) => {
          console.error("WebSocket error:", {
            readyState: ws.readyState,
            type: event.type,
            error: event,
          });
        });

        const synchronizer = await createWsSynchronizer(store, ws, 1);
        await synchronizer.startSync();

        // If the websocket reconnects, get a fresh token and reconnect
        synchronizer.getWebSocket().addEventListener("open", async () => {
          try {
            const freshToken = await getToken();
            if (freshToken) {
              wsUrl.searchParams.set("token", freshToken);
              synchronizer.load().then(() => synchronizer.save());
            }
          } catch (error) {
            console.error("Error refreshing token:", error);
          }
        });

        return synchronizer;
      } catch (error) {
        console.error("Error in createWsSynchronizer:", error);
        return null;
      }
    },
    [isInitialized, serverPath, getToken, organization?.id]
  );

  return (
    <Provider
      store={store}
      relationships={relationships}
      storesById={{ deskStore, settingsStore }}
    >
      {children}
    </Provider>
  );
};

export default TTTStoreProvider;
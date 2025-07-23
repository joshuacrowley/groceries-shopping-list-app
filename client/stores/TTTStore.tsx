import React, { useEffect, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useUser, useOrganization, useAuth } from "@clerk/clerk-expo";
import {
  createMergeableStore,
  createRelationships,
  createStore,
  MergeableStore,
  TablesSchema,
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
import { createExpoSqlitePersister } from "tinybase/persisters/persister-expo-sqlite";
import * as SQLite from "expo-sqlite";
import { SCHEMA } from "./schema";

// Enable detailed logging
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log("[TTTStore]", ...args);
  }
}

// Constants for server connection
// Get the server URL from environment or use defaults
let SERVER =
  process.env.EXPO_PUBLIC_SYNC_SERVER_URL ||
  (process.env.NODE_ENV === "development"
    ? "ws://localhost:8787"
    : "wss://worker.tinytalkingtodos.com");

// Ensure URL starts with ws:// or wss://
if (SERVER.startsWith("http://")) {
  SERVER = SERVER.replace("http://", "ws://");
} else if (SERVER.startsWith("https://")) {
  SERVER = SERVER.replace("https://", "wss://");
} else if (!SERVER.startsWith("ws://") && !SERVER.startsWith("wss://")) {
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
  const [isPersisterReady, setIsPersisterReady] = useState(false);

  // Generate a stable store ID based on organization
  const storeId = organization?.id ? `ttt-store-${organization.id}` : null;

  // Initialize main store
  const store = useCreateMergeableStore(() => {
    const newStore = createMergeableStore();
    newStore.setTablesSchema(SCHEMA as TablesSchema);
    // Add initial data for a demo list if needed
    // if (!newStore.getRowIds('lists').length) {
    //   const listId = 'demo-list-' + Date.now();
    //   newStore.setRow('lists', listId, {
    //     name: 'Getting Started',
    //     purpose: 'Welcome to your todo list app!',
    //     backgroundColour: 'blue',
    //     icon: '🚀',
    //     type: 'Info'
    //   });

    //   // Add a sample todo
    //   newStore.setRow('todos', 'demo-todo-1', {
    //     list: listId,
    //     text: 'Try adding a new todo',
    //     done: false,
    //     type: 'A'
    //   });
    // }
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
    createStore().setValue("primaryList", "").setValue("listType", "All")
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

  // Set up local persistence with SQLite
  useCreatePersister(
    store,
    (store) => {
      const db = SQLite.openDatabaseSync(storeId || "default-store" + ".db");
      return createExpoSqlitePersister(store, db);
    },
    [storeId],
    async (persister) => {
      await persister.load();
      // Temporarily disable auto-save to prevent potential sync loops
      // The WebSocket synchronizer already handles persistence to the server
      // await persister.startAutoSave();
      
      // TO RE-ENABLE: Uncomment the line above after confirming the sync loop is fixed
      // Auto-save provides offline persistence between app restarts
      
      debugLog("Local persister loaded and ready");
      setIsPersisterReady(true);
    },
    [storeId]
  );

  // Set up organization path for synchronization
  useEffect(() => {
    debugLog("Auth state:", {
      isLoaded,
      organizationId: organization?.id,
      userId: user?.id,
    });

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
      if (!isInitialized || !serverPath || !isPersisterReady) {
        debugLog("Waiting for initialization...", {
          isInitialized,
          serverPath,
          isPersisterReady,
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

        const ws = new ReconnectingWebSocket(wsUrl.toString(), [], {
          maxReconnectionDelay: 10000,  // Increase max delay to 10 seconds
          connectionTimeout: 5000,       // Increase connection timeout to 5 seconds
          reconnectionDelayGrowFactor: 1.5,  // Slower reconnection backoff
          maxRetries: 10,  // Limit reconnection attempts
        });

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
        
        // Add message debugging
        ws.addEventListener("message", (event) => {
          debugLog("WebSocket message received:", {
            data: event.data,
            type: typeof event.data,
            length: event.data?.length
          });
        });

        const synchronizer = await createWsSynchronizer(store, ws, 1);
        
        // Add a small delay to ensure server is ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // IMPORTANT: Load data from server BEFORE starting sync
        // This prevents the empty client state from overwriting server data
        // Note: We've already loaded from local SQLite persistence above,
        // so now we load the latest from server to merge any remote changes
        debugLog("Loading initial data from server...");
        await synchronizer.load();
        
        // Now start the sync after we have the server's data
        debugLog("Starting synchronization...");
        await synchronizer.startSync();

        // If the websocket reconnects, get a fresh token and reconnect
        synchronizer.getWebSocket().addEventListener("open", () => {
          debugLog("WebSocket reconnected, refreshing connection...");
          // Note: We don't need to manually load/save here - TinyBase handles
          // the sync protocol automatically. The synchronizer is already running
          // and will sync any changes as needed.
        });

        return synchronizer;
      } catch (error) {
        console.error("Error in createWsSynchronizer:", error);
        return null;
      }
    },
    [isInitialized, serverPath, organization?.id, isPersisterReady]
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

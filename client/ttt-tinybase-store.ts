import { createClient } from "@libsql/client";
import { debounce } from "lodash";
import { useValue, useSetValueCallback } from "tinybase/ui-react";
import {
  createLocalPersister,
  createSessionPersister,
} from "tinybase/persisters/persister-browser";
import { createLibSqlPersister } from "./libsql-persister-wrapper";

import useStoreInitialization from "./useStoreInitialization";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createCheckpoints,
  createStore,
  createRelationships,
  createMergeableStore,
} from "tinybase";
import {
  Provider,
  useCreateCheckpoints,
  useCreateMergeableStore,
  useCreatePersister,
  useCreateStore,
} from "tinybase/ui-react";
import { Onboarding, TodoList } from "./generatedTemplates";
import sampleTodosData from "./sampleTodos.json";
import catalogue from "./catalogue.json";

import { INITIAL_TODOS } from "./initialTodos";
import { SCHEMA, setupDatabaseSchema } from "./schema";

// Import the correct type for TablesSchema
import { TablesSchema } from "tinybase";

// Add these imports at the top
import ReconnectingWebSocket from "reconnecting-websocket";
import { MergeableStore } from "tinybase";
import { useCreateSynchronizer } from "tinybase/ui-react";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import { useAuth } from "@clerk/nextjs";

const SERVER_SCHEME = "wss://";

const serverPathId = "/sync";

// Add this constant
const SERVER =
  process.env.NODE_ENV === "development"
    ? "ws://localhost:8787"
    : "wss://worker.tinytalkingtodos.com";

// Add this at the top of the file for easier debugging
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

const SyncedWebSocketStore: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { orgId, getToken, isLoaded } = useAuth();
  const [serverPath, setServerPath] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize stores
  const store = useCreateMergeableStore(() => {
    const newStore = createMergeableStore();
    newStore.setTablesSchema(SCHEMA as TablesSchema);
    return newStore;
  });

  useCreatePersister(
    store,
    (store) => createLocalPersister(store, "synctodos/store"),
    [],
    async (persister) => {
      await persister.startAutoLoad([INITIAL_TODOS, {}]);
      await persister.startAutoSave();
    },
    []
  );

  // Create stores for settings, desk state, etc.
  const BYOtokenStore = useCreateStore(() =>
    createStore()
      .setValue("GROQ_API_KEY", "")
      .setValue("OPENAI_API_KEY", "")
      .setValue("CARTESIA_API_KEY", "")
      .setValue("ANTHROPIC_API_KEY", "")
      .setValue("JINA_API_KEY", "")
      .setValue("GEMINI_API_KEY", "")
      .setValue("DB_PATH", "")
      .setValue("TURSO_TOKEN", "")
  );

  const SettingsStore = useCreateStore(() =>
    createStore()
      .setValue("startRecording", false)
      .setValue("showAbout", false)
      .setValue("showSettings", false)
      .setValue("voiceID", "Charon")
      .setValue("operatorMode", "Never")
      .setValue("persister", "websocket")
  );

  const deskStore = useCreateStore(() =>
    createStore()
      .setValue("primaryList", "")
      .setValue("secondaryList", "")
      .setValue("showSecondary", false)
      .setValue("showCanvas", true)
      .setValue("editingListCode", TodoList)
      .setValue("editingListCodeError", false)
      .setValue("askAnything", false)
      .setValue("askAnythingAnswer", false)
      .setValue("backgroundColour", "blue")
      .setValue("messages", false)
      .setValue("batchTranscription", false)
      .setValue("isGenerating", false)
      .setValue("isSendingCode", false)
  );

  const tempStore = useCreateStore(() =>
    createStore()
      .setValue("operatorAudioLevel", 0)
      .setValue("operatorSpeaking", false)
      .setValue("interrupt", false)
      .setValue("showOffload", true)
      .setValue("userAudioLevel", 0)
      .setValue("textPreview", false)
      .setValue("vadStatus", "Ready")
      .setValue("tokensUsed", 0)
      .setValue("listType", "All")
  );

  // Set up relationships
  const relationships = createRelationships(store);
  relationships.setRelationshipDefinition("todoList", "todos", "lists", "list");

  // Set up the server path when the org ID is loaded
  useEffect(() => {
    if (isLoaded && orgId) {
      const path = `/sync/${orgId}`;
      console.log("Setting server path:", path);
      setServerPath(path);
      setIsInitialized(true);
    }
  }, [isLoaded, orgId]);

  useCreateSynchronizer(
    store,
    async (store: MergeableStore) => {
      if (!isInitialized || !serverPath) {
        console.log("Waiting for initialization...", {
          isInitialized,
          serverPath,
        });
        return null;
      }

      try {
        const token = await getToken();
        if (!token) {
          console.error("No token available");
          return null;
        }

        console.log("Creating WebSocket connection:", {
          orgId,
          path: serverPath,
          tokenAvailable: !!token,
        });

        const wsUrl = new URL(SERVER + serverPath);
        wsUrl.searchParams.set("token", token);

        console.log("WebSocket URL:", wsUrl.toString());

        const ws = new ReconnectingWebSocket(wsUrl.toString());

        ws.addEventListener("open", () => {
          console.log("WebSocket connected successfully", {
            readyState: ws.readyState,
            url: ws.url,
          });
        });

        ws.addEventListener("close", (event) => {
          console.log("WebSocket closed:", {
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

        return synchronizer;
      } catch (error) {
        console.error("Error in createWsSynchronizer:", error);
        return null;
      }
    },
    [isInitialized, serverPath, getToken, orgId]
  );

  useCreatePersister(
    BYOtokenStore,
    (store) => createLocalPersister(BYOtokenStore, "tokens/store"),
    [],
    async (persister) => {
      await persister.startAutoLoad();
      await persister.startAutoSave();
    },
    []
  );

  useCreatePersister(
    SettingsStore,
    (store) => createLocalPersister(SettingsStore, "settings/store"),
    [],
    async (persister) => {
      await persister.startAutoLoad();
      await persister.startAutoSave();
    },
    []
  );

  useCreatePersister(
    deskStore,
    (store) => createSessionPersister(deskStore, "desk/store"),
    [],
    async (persister) => {
      await persister.startAutoLoad();
      await persister.startAutoSave();
    },
    []
  );

  // // Show loading state while initializing
  // if (!isInitialized) {
  //   return <div>Initializing WebSocket connection...</div>;
  // }

  return (
    <Provider
      store={store}
      relationships={relationships}
      storesById={{ deskStore, BYOtokenStore, SettingsStore, tempStore }}
    >
      {children}
    </Provider>
  );
};

export { SyncedWebSocketStore };

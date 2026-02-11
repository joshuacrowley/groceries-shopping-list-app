/**
 * OpenClaw React Context
 *
 * Wraps the Gateway client and discovery service in a React context.
 * Manages connection state, persists settings in expo-secure-store,
 * and exposes chat/session methods to the UI.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import * as SecureStore from "expo-secure-store";
import {
  OpenClawGatewayClient,
  type ConnectionStatus,
  type ChatEvent,
  type HelloOk,
} from "@/lib/openclawGateway";
import {
  OpenClawDiscoveryService,
  type DiscoveredGateway,
} from "@/lib/openclawDiscovery";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** Whether this message is still being streamed */
  streaming?: boolean;
  /** The runId from the gateway, used for abort */
  runId?: string;
}

interface OpenClawContextValue {
  // Connection
  connectionStatus: ConnectionStatus;
  activeGateway: DiscoveredGateway | null;
  serverInfo: HelloOk | null;
  connect: (gateway: DiscoveredGateway) => void;
  disconnect: () => void;

  // Discovery
  discoveredGateways: DiscoveredGateway[];
  startDiscovery: (tailnetDomain?: string) => void;
  stopDiscovery: () => void;
  addManualGateway: (host: string, port: number) => void;

  // Chat
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  abortResponse: () => Promise<void>;
  clearMessages: () => void;
  isStreaming: boolean;

  // Session
  sessionKey: string | null;
}

// ---------------------------------------------------------------------------
// SecureStore keys
// ---------------------------------------------------------------------------

const STORE_GATEWAY_HOST = "openclaw_gateway_host";
const STORE_GATEWAY_PORT = "openclaw_gateway_port";
const STORE_GATEWAY_NAME = "openclaw_gateway_name";
const STORE_GATEWAY_TLS = "openclaw_gateway_tls";
const STORE_GATEWAY_PASSWORD = "openclaw_gateway_password";
const STORE_DEVICE_TOKEN = "openclaw_device_token";
const STORE_SESSION_KEY = "openclaw_session_key";
const STORE_TAILNET_DOMAIN = "openclaw_tailnet_domain";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const OpenClawContext = createContext<OpenClawContextValue | null>(null);

export function useOpenClaw(): OpenClawContextValue {
  const ctx = useContext(OpenClawContext);
  if (!ctx) {
    throw new Error("useOpenClaw must be used within <OpenClawProvider>");
  }
  return ctx;
}

/** Safe hook that returns null when outside the provider. */
export function useOpenClawOptional(): OpenClawContextValue | null {
  return useContext(OpenClawContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function OpenClawProvider({ children }: { children: React.ReactNode }) {
  // Refs for long-lived instances
  const clientRef = useRef<OpenClawGatewayClient>(new OpenClawGatewayClient());
  const discoveryRef = useRef<OpenClawDiscoveryService>(
    new OpenClawDiscoveryService()
  );

  // State
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [activeGateway, setActiveGateway] =
    useState<DiscoveredGateway | null>(null);
  const [serverInfo, setServerInfo] = useState<HelloOk | null>(null);
  const [discoveredGateways, setDiscoveredGateways] = useState<
    DiscoveredGateway[]
  >([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionKey, setSessionKey] = useState<string | null>(null);

  // Track the current streaming message's runId
  const streamingRunIdRef = useRef<string | null>(null);

  // -- Setup event listeners ------------------------------------------------

  useEffect(() => {
    const client = clientRef.current;
    const discovery = discoveryRef.current;

    // Connection status changes
    const offConnection = client.on("connectionChange", (status) => {
      setConnectionStatus(status as ConnectionStatus);
    });

    // Hello-ok received
    const offHello = client.on("hello", (payload) => {
      const hello = payload as HelloOk;
      setServerInfo(hello);

      // If the server issued a device token, persist it
      if (hello.auth?.deviceToken) {
        SecureStore.setItemAsync(STORE_DEVICE_TOKEN, hello.auth.deviceToken);
      }

      // Resolve or create a session
      resolveSession(client);
    });

    // Chat events (streaming)
    const offChat = client.on("chat", (payload) => {
      handleChatEvent(payload as ChatEvent);
    });

    // Discovery updates
    const offDiscovery = discovery.subscribe((gateways) => {
      setDiscoveredGateways(gateways);
    });

    // Auto-connect to saved gateway
    autoConnect();

    return () => {
      offConnection();
      offHello();
      offChat();
      offDiscovery();
      discovery.destroy();
      client.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Auto-connect ---------------------------------------------------------

  const autoConnect = useCallback(async () => {
    try {
      const host = await SecureStore.getItemAsync(STORE_GATEWAY_HOST);
      const portStr = await SecureStore.getItemAsync(STORE_GATEWAY_PORT);
      const name = await SecureStore.getItemAsync(STORE_GATEWAY_NAME);
      const tlsStr = await SecureStore.getItemAsync(STORE_GATEWAY_TLS);
      const password =
        (await SecureStore.getItemAsync(STORE_GATEWAY_PASSWORD)) ?? undefined;

      if (host && portStr) {
        const port = parseInt(portStr, 10);
        const tls = tlsStr === "1";
        const gateway: DiscoveredGateway = {
          id: `saved-${host}:${port}`,
          displayName: name ?? `${host}:${port}`,
          host,
          port,
          source: tls ? "tailnet" : "manual",
          tls,
          password,
        };
        connectToGateway(gateway);
      }
    } catch {
      // No saved gateway — that's fine
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Session resolution ---------------------------------------------------

  const resolveSession = useCallback(
    async (client: OpenClawGatewayClient) => {
      try {
        // Try to use a saved session key
        const savedKey = await SecureStore.getItemAsync(STORE_SESSION_KEY);

        if (__DEV__) {
          console.log("[OpenClaw] Resolving session, saved key:", savedKey);
        }

        const result = (await client.sessionsResolve({
          key: savedKey ?? undefined,
        })) as { key?: string } | undefined;

        if (__DEV__) {
          console.log("[OpenClaw] Session resolve result:", JSON.stringify(result));
        }

        // Use the resolved key, or the saved key, or default to agent:main:main
        const key = result?.key ?? savedKey ?? "agent:main:main";
        setSessionKey(key);
        await SecureStore.setItemAsync(STORE_SESSION_KEY, key);

        if (__DEV__) {
          console.log("[OpenClaw] Using session key:", key);
        }
      } catch (err) {
        if (__DEV__) console.warn("[OpenClaw] Session resolve failed:", err);
        // Fallback: use the default agent session key
        const key = "agent:main:main";
        setSessionKey(key);
        await SecureStore.setItemAsync(STORE_SESSION_KEY, key);
      }
    },
    []
  );

  // -- Chat event handling --------------------------------------------------

  const handleChatEvent = useCallback((event: ChatEvent) => {
    switch (event.state) {
      case "delta": {
        const deltaText =
          typeof event.message === "string"
            ? event.message
            : (event.message as { text?: string })?.text ?? "";

        streamingRunIdRef.current = event.runId;

        setMessages((prev) => {
          // Find existing streaming message for this runId
          const existingIdx = prev.findIndex(
            (m) => m.runId === event.runId && m.streaming
          );

          if (existingIdx >= 0) {
            // Append delta to existing message
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              content: updated[existingIdx].content + deltaText,
            };
            return updated;
          } else {
            // Start a new streaming message
            return [
              ...prev,
              {
                id: `msg-${event.runId}`,
                role: "assistant" as const,
                content: deltaText,
                timestamp: Date.now(),
                streaming: true,
                runId: event.runId,
              },
            ];
          }
        });

        setIsStreaming(true);
        break;
      }

      case "final": {
        setMessages((prev) =>
          prev.map((m) =>
            m.runId === event.runId
              ? { ...m, streaming: false }
              : m
          )
        );
        setIsStreaming(false);
        streamingRunIdRef.current = null;
        break;
      }

      case "aborted": {
        setMessages((prev) =>
          prev.map((m) =>
            m.runId === event.runId
              ? { ...m, streaming: false, content: m.content + " [aborted]" }
              : m
          )
        );
        setIsStreaming(false);
        streamingRunIdRef.current = null;
        break;
      }

      case "error": {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant" as const,
            content: event.errorMessage ?? "An error occurred.",
            timestamp: Date.now(),
            streaming: false,
          },
        ]);
        setIsStreaming(false);
        streamingRunIdRef.current = null;
        break;
      }
    }
  }, []);

  // -- Public methods -------------------------------------------------------

  const connectToGateway = useCallback(
    async (gateway: DiscoveredGateway) => {
      setActiveGateway(gateway);

      // Persist for auto-connect
      await SecureStore.setItemAsync(STORE_GATEWAY_HOST, gateway.host);
      await SecureStore.setItemAsync(
        STORE_GATEWAY_PORT,
        String(gateway.port)
      );
      await SecureStore.setItemAsync(STORE_GATEWAY_NAME, gateway.displayName);
      await SecureStore.setItemAsync(
        STORE_GATEWAY_TLS,
        gateway.tls ? "1" : "0"
      );
      if (gateway.password) {
        await SecureStore.setItemAsync(STORE_GATEWAY_PASSWORD, gateway.password);
      } else {
        await SecureStore.deleteItemAsync(STORE_GATEWAY_PASSWORD);
      }

      // Retrieve device token if we have one
      const deviceToken =
        (await SecureStore.getItemAsync(STORE_DEVICE_TOKEN)) ?? undefined;

      clientRef.current.connect({
        host: gateway.host,
        port: gateway.port,
        tls: gateway.tls,
        deviceToken,
        password: gateway.password,
      });
    },
    []
  );

  const disconnectFromGateway = useCallback(async () => {
    clientRef.current.disconnect();
    setActiveGateway(null);
    setServerInfo(null);
    setSessionKey(null);

    // Clear persisted connection
    await SecureStore.deleteItemAsync(STORE_GATEWAY_HOST);
    await SecureStore.deleteItemAsync(STORE_GATEWAY_PORT);
    await SecureStore.deleteItemAsync(STORE_GATEWAY_NAME);
    await SecureStore.deleteItemAsync(STORE_GATEWAY_TLS);
    await SecureStore.deleteItemAsync(STORE_GATEWAY_PASSWORD);
    await SecureStore.deleteItemAsync(STORE_SESSION_KEY);
  }, []);

  const startDiscovery = useCallback((tailnetDomain?: string) => {
    discoveryRef.current.startScan(tailnetDomain);
  }, []);

  const stopDiscovery = useCallback(() => {
    discoveryRef.current.stopScan();
  }, []);

  const addManualGateway = useCallback((host: string, port: number) => {
    discoveryRef.current.addManualGateway(host, port);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionKey) {
        throw new Error("No active session");
      }

      // Add user message to state immediately
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Send via gateway — response comes back as chat events
      await clientRef.current.chatSend(sessionKey, text);
    },
    [sessionKey]
  );

  const abortResponse = useCallback(async () => {
    if (!sessionKey) return;
    const runId = streamingRunIdRef.current ?? undefined;
    await clientRef.current.chatAbort(sessionKey, runId);
  }, [sessionKey]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // -- Context value --------------------------------------------------------

  const value = useMemo<OpenClawContextValue>(
    () => ({
      connectionStatus,
      activeGateway,
      serverInfo,
      connect: connectToGateway,
      disconnect: disconnectFromGateway,
      discoveredGateways,
      startDiscovery,
      stopDiscovery,
      addManualGateway,
      messages,
      sendMessage,
      abortResponse,
      clearMessages,
      isStreaming,
      sessionKey,
    }),
    [
      connectionStatus,
      activeGateway,
      serverInfo,
      connectToGateway,
      disconnectFromGateway,
      discoveredGateways,
      startDiscovery,
      stopDiscovery,
      addManualGateway,
      messages,
      sendMessage,
      abortResponse,
      clearMessages,
      isStreaming,
      sessionKey,
    ]
  );

  return (
    <OpenClawContext.Provider value={value}>
      {children}
    </OpenClawContext.Provider>
  );
}

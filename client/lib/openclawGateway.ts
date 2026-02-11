/**
 * OpenClaw Gateway WebSocket Client
 *
 * Implements the OpenClaw Gateway protocol:
 *   - Three frame types: req, res, event
 *   - Connection handshake (connect → hello-ok)
 *   - Request/response correlation via message IDs
 *   - Chat methods (chat.send, chat.history, chat.abort)
 *   - Session methods (sessions.list, sessions.resolve)
 *   - Event dispatching (chat, tick, shutdown)
 *
 * See: https://github.com/openclaw/openclaw/tree/main/src/gateway/protocol/schema
 */

import ReconnectingWebSocket from "reconnecting-websocket";
import * as Crypto from "expo-crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErrorShape {
  code: string;
  message: string;
  details?: unknown;
  retryable?: boolean;
  retryAfterMs?: number;
}

export interface RequestFrame {
  type: "req";
  id: string;
  method: string;
  params?: unknown;
}

export interface ResponseFrame {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: ErrorShape;
}

export interface EventFrame {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
  stateVersion?: Record<string, number>;
}

export type GatewayFrame = RequestFrame | ResponseFrame | EventFrame;

export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    displayName?: string;
    version: string;
    platform: string;
    mode: string;
    instanceId?: string;
  };
  device?: {
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce?: string;
  };
  auth?: {
    token?: string;
    password?: string;
  };
}

export interface HelloOk {
  type: "hello-ok";
  protocol: number;
  server: {
    version: string;
    commit?: string;
    host?: string;
    connId: string;
  };
  features: {
    methods: string[];
    events: string[];
  };
  snapshot: unknown;
  canvasHostUrl?: string;
  auth?: {
    deviceToken: string;
    role: string;
    scopes: string[];
    issuedAtMs?: number;
  };
  policy: {
    maxPayload: number;
    maxBufferedBytes: number;
    tickIntervalMs: number;
  };
}

export interface ChatEvent {
  runId: string;
  sessionKey: string;
  seq: number;
  state: "delta" | "final" | "aborted" | "error";
  message?: unknown;
  errorMessage?: string;
  usage?: unknown;
  stopReason?: string;
}

export interface ChatSendParams {
  sessionKey: string;
  message: string;
  thinking?: string;
  deliver?: boolean;
  attachments?: unknown[];
  timeoutMs?: number;
  idempotencyKey: string;
}

export interface ChatHistoryParams {
  sessionKey: string;
  limit?: number;
}

export interface ChatAbortParams {
  sessionKey: string;
  runId?: string;
}

export interface SessionInfo {
  key: string;
  label?: string;
  agentId?: string;
  model?: string;
  derivedTitle?: string;
  lastMessage?: string;
  [k: string]: unknown;
}

export interface SessionsListParams {
  limit?: number;
  activeMinutes?: number;
  includeDerivedTitles?: boolean;
  includeLastMessage?: boolean;
  label?: string;
}

export interface SessionsResolveParams {
  key?: string;
  sessionId?: string;
  label?: string;
  agentId?: string;
}

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type GatewayEventType =
  | "connectionChange"
  | "chat"
  | "tick"
  | "shutdown"
  | "hello"
  | "error";

type EventCallback = (payload: unknown) => void;

// ---------------------------------------------------------------------------
// Gateway Client
// ---------------------------------------------------------------------------

const PROTOCOL_VERSION = 3;
const CLIENT_ID = "groceries-app";
const CLIENT_VERSION = "1.0.0";
const REQUEST_TIMEOUT_MS = 30_000;

export class OpenClawGatewayClient {
  private ws: ReconnectingWebSocket | null = null;
  private _status: ConnectionStatus = "disconnected";
  private pendingRequests = new Map<
    string,
    {
      resolve: (payload: unknown) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  private eventListeners = new Map<GatewayEventType, Set<EventCallback>>();
  private requestCounter = 0;
  private helloOk: HelloOk | null = null;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private _url: string = "";
  private _pendingDeviceToken: string | undefined;
  private _pendingPassword: string | undefined;
  private _challengeTimeout: ReturnType<typeof setTimeout> | null = null;

  // -- Public getters -------------------------------------------------------

  get status(): ConnectionStatus {
    return this._status;
  }

  get serverInfo(): HelloOk | null {
    return this.helloOk;
  }

  get url(): string {
    return this._url;
  }

  // -- Connection -----------------------------------------------------------

  /**
   * Connect to a gateway.
   *
   * @param opts.host    Hostname or IP address of the gateway.
   * @param opts.port    Port number (defaults to 443 when tls is true, 18789 otherwise).
   * @param opts.tls     Use wss:// instead of ws:// (required for Tailscale Serve/Funnel).
   * @param opts.deviceToken  Persisted device token for re-authentication.
   * @param opts.password     Shared password (Tailscale Funnel / password auth mode).
   */
  connect(
    hostOrOpts: string | {
      host: string;
      port?: number;
      tls?: boolean;
      deviceToken?: string;
      password?: string;
    },
    port?: number,
    deviceToken?: string,
  ): void {
    // Normalise overloaded signature
    const opts = typeof hostOrOpts === "string"
      ? { host: hostOrOpts, port, tls: false, deviceToken, password: undefined }
      : hostOrOpts;

    const scheme = opts.tls ? "wss" : "ws";
    const effectivePort = opts.port ?? (opts.tls ? 443 : 18789);
    // Omit port from the URL when it's the default for the scheme
    const portSuffix =
      (scheme === "wss" && effectivePort === 443) ||
      (scheme === "ws" && effectivePort === 80)
        ? ""
        : `:${effectivePort}`;

    this.disconnect();
    this._url = `${scheme}://${opts.host}${portSuffix}`;
    this.setStatus("connecting");

    this.ws = new ReconnectingWebSocket(this._url, [], {
      maxReconnectionDelay: 10_000,
      connectionTimeout: 5_000,
      maxRetries: 10,
    });

    // Store credentials — we'll use them when we send the handshake
    // after receiving the connect.challenge event.
    this._pendingDeviceToken = opts.deviceToken;
    this._pendingPassword = opts.password;

    this.ws.onopen = () => {
      if (__DEV__) console.log("[OpenClaw] WebSocket open, waiting for challenge from", this._url);
      // Don't send handshake yet — wait for connect.challenge event.
      // Set a fallback timeout in case the server doesn't send a challenge.
      this._challengeTimeout = setTimeout(() => {
        if (__DEV__) console.log("[OpenClaw] No challenge received, sending handshake without nonce");
        this.sendConnectHandshake(this._pendingDeviceToken);
      }, 3000);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      if (__DEV__) console.log("[OpenClaw] ← message:", String(event.data).slice(0, 200));
      this.handleMessage(event.data);
    };

    this.ws.onerror = (err: unknown) => {
      if (__DEV__) console.warn("[OpenClaw] WebSocket error:", err);
      this.setStatus("error");
      this.emit("error", { message: "WebSocket error" });
    };

    this.ws.onclose = (event: unknown) => {
      if (__DEV__) console.log("[OpenClaw] WebSocket closed:", event);
      this.stopHealthCheck();
      if (this._status !== "error") {
        this.setStatus("disconnected");
      }
    };
  }

  disconnect(): void {
    this.stopHealthCheck();
    if (this._challengeTimeout) {
      clearTimeout(this._challengeTimeout);
      this._challengeTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.helloOk = null;
    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Disconnected"));
    }
    this.pendingRequests.clear();
    this.setStatus("disconnected");
  }

  // -- Events ---------------------------------------------------------------

  on(event: GatewayEventType, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit(event: GatewayEventType, payload: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const cb of listeners) {
        try {
          cb(payload);
        } catch (err) {
          if (__DEV__) console.warn("[OpenClaw] Event handler error:", err);
        }
      }
    }
  }

  // -- Chat methods ---------------------------------------------------------

  async chatSend(
    sessionKey: string,
    message: string
  ): Promise<ResponseFrame["payload"]> {
    const idempotencyKey = Crypto.randomUUID();
    return this.request<ResponseFrame["payload"]>("chat.send", {
      sessionKey,
      message,
      idempotencyKey,
    } satisfies ChatSendParams);
  }

  async chatHistory(
    sessionKey: string,
    limit?: number
  ): Promise<unknown> {
    return this.request("chat.history", {
      sessionKey,
      limit,
    } satisfies ChatHistoryParams);
  }

  async chatAbort(
    sessionKey: string,
    runId?: string
  ): Promise<unknown> {
    return this.request("chat.abort", {
      sessionKey,
      runId,
    } satisfies ChatAbortParams);
  }

  // -- Session methods ------------------------------------------------------

  async sessionsList(
    params?: SessionsListParams
  ): Promise<unknown> {
    return this.request("sessions.list", params ?? {});
  }

  async sessionsResolve(
    params: SessionsResolveParams
  ): Promise<unknown> {
    return this.request("sessions.resolve", params);
  }

  // -- Health ---------------------------------------------------------------

  async health(): Promise<unknown> {
    return this.request("health", undefined);
  }

  // -- Internal: handshake --------------------------------------------------

  private sendConnectHandshake(deviceToken?: string, nonce?: string): void {
    if (__DEV__) {
      console.log("[OpenClaw] Sending connect handshake, nonce:", nonce, "hasToken:", !!deviceToken);
    }

    const params: ConnectParams = {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: CLIENT_ID,
        displayName: "Groceries App",
        version: CLIENT_VERSION,
        platform: `ios`,
        mode: "ui",
        instanceId: Crypto.randomUUID().slice(0, 8),
      },
    };

    if (deviceToken) {
      params.auth = { token: deviceToken };
    } else if (this._pendingPassword) {
      params.auth = { password: this._pendingPassword };
    }

    const connectId = this.nextId();

    this.sendFrame({
      type: "req",
      id: connectId,
      method: "connect",
      params,
    });
  }

  // -- Internal: request/response -------------------------------------------

  private request<T = unknown>(
    method: string,
    params: unknown
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.ws || this._status !== "connected") {
        reject(new Error("Not connected to gateway"));
        return;
      }

      const id = this.nextId();
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(id, {
        resolve: resolve as (p: unknown) => void,
        reject,
        timer,
      });

      this.sendFrame({
        type: "req",
        id,
        method,
        params,
      });
    });
  }

  private sendFrame(frame: RequestFrame): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    }
  }

  private nextId(): string {
    this.requestCounter += 1;
    return `r${this.requestCounter}`;
  }

  // -- Internal: message handling -------------------------------------------

  private handleMessage(data: string | ArrayBuffer | Blob): void {
    let raw: string;
    if (typeof data === "string") {
      raw = data;
    } else {
      if (__DEV__) console.warn("[OpenClaw] Non-string message received");
      return;
    }

    let frame: GatewayFrame;
    try {
      frame = JSON.parse(raw) as GatewayFrame;
    } catch {
      if (__DEV__) console.warn("[OpenClaw] Invalid JSON frame");
      return;
    }

    switch (frame.type) {
      case "res":
        this.handleResponse(frame as ResponseFrame);
        break;
      case "event":
        this.handleEvent(frame as EventFrame);
        break;
      case "req":
        // Server-initiated requests (e.g. node.invoke) — not used here
        if (__DEV__) console.log("[OpenClaw] Server request:", frame);
        break;
    }
  }

  private handleResponse(frame: ResponseFrame): void {
    if (__DEV__) {
      console.log("[OpenClaw] Response ok:", frame.ok, "id:", frame.id,
        frame.ok ? "" : "error: " + JSON.stringify(frame.error));
    }

    // Check if this is the connect handshake response
    const payload = frame.payload as Record<string, unknown> | undefined;
    if (payload && payload.type === "hello-ok") {
      if (__DEV__) console.log("[OpenClaw] Connected! Server:", JSON.stringify((payload as any).server));
      this.helloOk = payload as unknown as HelloOk;
      this.setStatus("connected");
      this.emit("hello", this.helloOk);
      this.startHealthCheck();
      return;
    }

    // Regular request/response correlation
    const pending = this.pendingRequests.get(frame.id);
    if (pending) {
      clearTimeout(pending.timer);
      this.pendingRequests.delete(frame.id);
      if (frame.ok) {
        pending.resolve(frame.payload);
      } else {
        const errMsg =
          frame.error?.message ?? "Request failed";
        if (__DEV__) console.warn("[OpenClaw] Request failed:", errMsg);
        pending.reject(new Error(errMsg));
      }
    }
  }

  private handleEvent(frame: EventFrame): void {
    switch (frame.event) {
      case "connect.challenge": {
        // Gateway sends a nonce challenge before accepting the connect request.
        const challengePayload = frame.payload as {
          nonce?: string;
          ts?: number;
        } | undefined;
        const nonce = challengePayload?.nonce;
        if (__DEV__) {
          console.log("[OpenClaw] Received connect.challenge, nonce:", nonce);
        }
        // Clear the fallback timeout
        if (this._challengeTimeout) {
          clearTimeout(this._challengeTimeout);
          this._challengeTimeout = null;
        }
        // Now send the connect handshake with the nonce
        this.sendConnectHandshake(this._pendingDeviceToken, nonce);
        break;
      }
      case "chat":
        this.emit("chat", frame.payload as ChatEvent);
        break;
      case "tick":
        this.emit("tick", frame.payload);
        break;
      case "shutdown":
        this.emit("shutdown", frame.payload);
        break;
      default:
        if (__DEV__) {
          console.log("[OpenClaw] Unhandled event:", frame.event);
        }
    }
  }

  // -- Internal: health check -----------------------------------------------

  private startHealthCheck(): void {
    this.stopHealthCheck();
    const interval = this.helloOk?.policy.tickIntervalMs ?? 30_000;
    this.healthTimer = setInterval(() => {
      this.health().catch(() => {
        // Health check failed — the reconnecting-websocket handles reconnection
      });
    }, interval);
  }

  private stopHealthCheck(): void {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
  }

  // -- Internal: status management ------------------------------------------

  private setStatus(status: ConnectionStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.emit("connectionChange", status);
    }
  }
}

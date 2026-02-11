/**
 * OpenClaw Gateway Discovery Service
 *
 * Discovery paths:
 *   1. Manual — user enters host + port directly (always available)
 *   2. Bonjour (LAN) — placeholder for future native module integration
 *   3. Tailnet (wide-area DNS-SD) — placeholder for future integration
 *
 * Bonjour/Tailnet discovery requires react-native-zeroconf with a native
 * rebuild. For now this service supports manual gateway entry only.
 * To add Bonjour later:
 *   1. Install react-native-zeroconf
 *   2. Run `npx expo run:ios`
 *   3. Uncomment the Bonjour scanning code in startScan()
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveredGateway {
  /** Stable identifier derived from service name + source */
  id: string;
  /** Human-readable name from the TXT displayName or service name */
  displayName: string;
  /** Resolved host address */
  host: string;
  /** Gateway WebSocket port */
  port: number;
  /** How this gateway was discovered */
  source: "bonjour" | "tailnet" | "manual";
  /** Use wss:// (TLS) — true for Tailscale Serve / Funnel connections */
  tls?: boolean;
  /** Shared password for password-auth mode (Tailscale Funnel) */
  password?: string;
  /** Raw TXT record key-value pairs */
  txt?: Record<string, string>;
}

type DiscoveryListener = (gateways: DiscoveredGateway[]) => void;

// ---------------------------------------------------------------------------
// Discovery Service
// ---------------------------------------------------------------------------

export class OpenClawDiscoveryService {
  private gateways = new Map<string, DiscoveredGateway>();
  private listeners = new Set<DiscoveryListener>();
  private isScanning = false;

  /** Whether native Bonjour discovery is available. */
  get bonjourAvailable(): boolean {
    return false; // Will be true once react-native-zeroconf is linked
  }

  // -- Public API -----------------------------------------------------------

  /** Start scanning for gateways. Currently manual-only. */
  startScan(_tailnetDomain?: string): void {
    if (this.isScanning) {
      this.stopScan();
    }
    this.isScanning = true;

    // Bonjour scanning will go here once react-native-zeroconf is linked.
    // For now, manual entries are the only discovery path.

    if (__DEV__) {
      console.log(
        "[Discovery] Bonjour not available — use manual host/port to connect."
      );
    }
  }

  /** Stop all active scans. */
  stopScan(): void {
    this.isScanning = false;
  }

  /** Add a manual gateway entry. */
  addManualGateway(
    host: string,
    port: number,
    displayName?: string
  ): DiscoveredGateway {
    const id = `manual-${host}:${port}`;
    const gw: DiscoveredGateway = {
      id,
      displayName: displayName ?? `${host}:${port}`,
      host,
      port,
      source: "manual",
    };
    this.gateways.set(id, gw);
    this.notifyListeners();
    return gw;
  }

  /** Remove a manual gateway entry. */
  removeManualGateway(id: string): void {
    if (this.gateways.get(id)?.source === "manual") {
      this.gateways.delete(id);
      this.notifyListeners();
    }
  }

  /** Get current list of discovered gateways. */
  getGateways(): DiscoveredGateway[] {
    return Array.from(this.gateways.values());
  }

  /** Subscribe to gateway list changes. Returns unsubscribe function. */
  subscribe(listener: DiscoveryListener): () => void {
    this.listeners.add(listener);
    // Immediately emit current state
    listener(this.getGateways());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Clean up all resources. */
  destroy(): void {
    this.stopScan();
    this.listeners.clear();
    this.gateways.clear();
  }

  // -- Internal: notify subscribers -----------------------------------------

  private notifyListeners(): void {
    const gateways = this.getGateways();
    for (const listener of this.listeners) {
      try {
        listener(gateways);
      } catch (err) {
        if (__DEV__) console.warn("[Discovery] Listener error:", err);
      }
    }
  }
}

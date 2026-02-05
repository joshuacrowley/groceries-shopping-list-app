import ReconnectingWebSocket from "reconnecting-websocket";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client/with-schemas";
import * as UiReact from "tinybase/ui-react/with-schemas";
import { MergeableStore, OptionalSchemas } from "tinybase/with-schemas";
import { useAuth, useOrganization } from "@clerk/clerk-expo";

const SYNC_SERVER_URL = process.env.EXPO_PUBLIC_SYNC_SERVER_URL;

if (!SYNC_SERVER_URL) {
  throw new Error(
    "Please set EXPO_PUBLIC_SYNC_SERVER_URL in .env to the URL of the sync server"
  );
}

export const useCreateServerSynchronizerAndStart = <
  Schemas extends OptionalSchemas
>(
  storeId: string,
  store: MergeableStore<Schemas>
) => {
  const { getToken } = useAuth();
  const { organization } = useOrganization();

  return (UiReact as UiReact.WithSchemas<Schemas>).useCreateSynchronizer(
    store,
    async (store: MergeableStore<Schemas>) => {
      if (!organization?.id) {
        throw new Error("Organization required for synchronization");
      }

      // Get auth token for WebSocket connection
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token required for synchronization");
      }

      // Construct WebSocket URL with organization context
      const wsUrl = `${SYNC_SERVER_URL}/sync/${organization.id}?token=${token}`;

      // Create the synchronizer.
      const synchronizer = await createWsSynchronizer(
        store,
        new ReconnectingWebSocket(wsUrl, [], {
          maxReconnectionDelay: 10000,  // Increase max delay to 10 seconds
          connectionTimeout: 5000,       // Increase connection timeout to 5 seconds
          reconnectionDelayGrowFactor: 1.5,  // Slower reconnection backoff
          maxRetries: 10,  // Limit reconnection attempts
        })
      );

      // IMPORTANT: Load data from server BEFORE starting sync
      // This prevents the empty client state from overwriting server data
      await synchronizer.load();

      // Start the synchronizer.
      await synchronizer.startSync();

      // Note: We don't need to handle reconnection explicitly - TinyBase's
      // synchronizer manages the sync protocol automatically. When the WebSocket
      // reconnects, it will resume syncing from where it left off.

      return synchronizer;
    },
    [storeId, organization?.id]
  );
};

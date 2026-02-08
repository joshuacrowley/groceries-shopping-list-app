/**
 * Gemini API Proxy Client
 *
 * Routes all Gemini AI requests through the server-side proxy
 * instead of calling Google's API directly from the client.
 * This keeps the API key secure on the server.
 */

// The proxy runs on the same server as the WebSocket sync,
// but uses HTTPS instead of WSS.
function getProxyBaseUrl(): string {
  const wsUrl = process.env.EXPO_PUBLIC_SYNC_SERVER_URL;
  if (!wsUrl) {
    throw new Error(
      "EXPO_PUBLIC_SYNC_SERVER_URL is not configured. Cannot reach Gemini proxy."
    );
  }

  // Convert ws:// to http:// and wss:// to https://
  return wsUrl.replace(/^ws(s?):\/\//, "http$1://");
}

interface GeminiProxyRequest {
  model?: string;
  contents: unknown;
  config?: Record<string, unknown>;
}

interface GeminiProxyResponse {
  text: string;
}

/**
 * Call the Gemini API through the server-side proxy.
 *
 * @param request - The request payload (model, contents, config)
 * @param getToken - A function that returns a Clerk auth token
 * @returns The generated text from Gemini
 */
export async function callGeminiProxy(
  request: GeminiProxyRequest,
  getToken: () => Promise<string | null>
): Promise<string> {
  const baseUrl = getProxyBaseUrl();
  const token = await getToken();

  if (!token) {
    throw new Error("Authentication required to use AI features.");
  }

  const response = await fetch(`${baseUrl}/api/gemini`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: request.model || "gemini-2.5-flash",
      contents: request.contents,
      config: request.config,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      (errorData as { error?: string }).error || `API request failed (${response.status})`;

    if (response.status === 401) {
      throw new Error("Authentication expired. Please try again.");
    } else if (response.status === 502) {
      throw new Error(
        "The AI service is temporarily unavailable. Please try again in a moment."
      );
    } else if (response.status === 429) {
      throw new Error(
        "Too many requests. Please wait a moment and try again."
      );
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as GeminiProxyResponse;
  return data.text;
}

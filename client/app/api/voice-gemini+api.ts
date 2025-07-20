import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";
import { createChatContextGenerator } from "./chatContext";

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_API_KEY || "",
);

// Define the schema for structured voice response output
const voiceResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    message: { 
      type: SchemaType.STRING, 
      description: "The main response message to display to the user" 
    },
    action: {
      type: SchemaType.OBJECT,
      properties: {
        type: { 
          type: SchemaType.STRING, 
          description: "The type of action to take: navigate, show_list, or show_items" 
        },
        target: { 
          type: SchemaType.STRING, 
          description: "The target list ID or route for the action" 
        },
        data: { 
          type: SchemaType.STRING, 
          description: "Additional data for the action" 
        }
      },
      required: ["type"]
    }
  },
  required: ["message"]
};

// Add timeout wrapper function
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

export async function POST(request: Request) {
  console.log('[voice-gemini API] Received POST request');
  console.log('[voice-gemini API] Environment check - API key exists:', !!process.env.GOOGLE_AI_API_KEY);
  console.log('[voice-gemini API] Environment check - API key length:', process.env.GOOGLE_AI_API_KEY?.length || 0);
  
  try {
    const body = await request.json();
    console.log('[voice-gemini API] Request body keys:', Object.keys(body));
    
    const { audio, mimeType, contextData } = body;
    console.log('[voice-gemini API] Audio length:', audio?.length);
    console.log('[voice-gemini API] MIME type:', mimeType);
    console.log('[voice-gemini API] Context data:', {
      listsCount: Object.keys(contextData?.lists || {}).length,
      todosCount: Object.keys(contextData?.todos || {}).length
    });

    if (!audio) {
      console.error('[voice-gemini API] No audio data provided');
      return Response.json(
        { error: "No audio data provided" },
        { status: 400 }
      );
    }

    console.log('[voice-gemini API] Creating Gemini model...');
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseSchema: voiceResponseSchema,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    console.log('[voice-gemini API] Model created successfully');

    // Generate context from current lists and todos
    const contextGenerator = createChatContextGenerator(contextData || { lists: {}, todos: {} });
    const contextXml = contextGenerator.getSystemMessage();

    const systemPrompt = `You are a helpful voice assistant for a shopping list app. The user will ask you questions about their shopping lists or request actions.

Available user data (shopping lists and todos):
${contextXml}

Your responses should be:
1. Conversational and helpful
2. Based on the actual data provided
3. Include appropriate actions when relevant

Available actions:
- "navigate": Navigate to a specific route (target should be a route like "/(index)/lists")
- "show_list": Show a specific list (target should be the list ID)
- "show_items": Show specific items (target should be the list ID containing relevant items)

Common user requests:
- "What's on my shopping list?" - Summarize items from shopping/grocery lists
- "Show me my [list name]" - Navigate to that specific list
- "What do I need to buy?" - Show incomplete items from relevant lists
- "What lists do I have?" - List all available lists

Always provide a helpful message even if no relevant data is found. If the user asks for a specific list that doesn't exist, suggest similar lists or offer to help create one.`;

    const userPrompt = `The user said something to me via voice. Please respond helpfully based on their request and the shopping list data provided.`;

    console.log('[voice-gemini API] Calling Gemini API...');
    console.log('[voice-gemini API] System prompt length:', systemPrompt.length);
    
    // Wrap the generateContent call with timeout
    const result = await withTimeout(
      model.generateContent([
        {
          inlineData: {
            data: audio,
            mimeType: mimeType,
          }
        },
        systemPrompt,
        userPrompt
      ]),
      30000 // 30 seconds timeout for audio processing
    );

    console.log('[voice-gemini API] Gemini API call completed');
    const response = result.response.text();
    console.log('[voice-gemini API] Gemini response:', response);
    
    const parsedResponse = JSON.parse(response);
    console.log('[voice-gemini API] Parsed response:', parsedResponse);

    return Response.json(parsedResponse);
  } catch (error) {
    console.error("Error processing voice with Gemini:", error);
    
    if (error instanceof Error && error.message === 'Request timeout') {
      return Response.json(
        { error: "Request timed out - the voice processing took too long" },
        { status: 504 }
      );
    }
    
    return Response.json(
      { error: "Failed to process voice command" },
      { status: 500 }
    );
  }
}
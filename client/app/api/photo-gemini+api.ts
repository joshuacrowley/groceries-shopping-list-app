import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_API_KEY || "",
);

// Define the schema for structured output
const todoSchema = {
  type: SchemaType.OBJECT,
  properties: {
    todos: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "The main text of the todo item" },
          notes: { type: SchemaType.STRING, description: "Additional notes about the todo" },
          emoji: { type: SchemaType.STRING, description: "A relevant emoji for the todo" },
          category: { type: SchemaType.STRING, description: "The category of the todo" },
          type: { type: SchemaType.STRING, description: "The type of the todo (A-E)" },
          done: { type: SchemaType.BOOLEAN, description: "Whether the todo is completed" },
        },
        required: ["text", "emoji", "category", "type", "done"]
      }
    }
  },
  required: ["todos"]
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
  try {
    const { image, mimeType, listInfo, currentTodos } = await request.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: todoSchema,
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

    const prompt = `Analyze this image and create todo items based on it.
    Current List Information:
    - List Name: "${listInfo.name}"
    - List Purpose: "${listInfo.purpose}"
    - List Template: "${listInfo.template}"
    - Special Instructions: "${listInfo.systemPrompt}"
    
    To help you understand the schema of a todo for this list, here's the current todos: ${JSON.stringify(currentTodos)}
    Generate relevant, specific, and contextual todo items that match the style and purpose of the current list.
    Please only provide the new todos, not the existing todos provided for context.
    `;

    // Wrap the generateContent call with timeout
    const result = await withTimeout(
      model.generateContent([
        {
          inlineData: {
            data: image,
            mimeType: mimeType,
          }
        },
        prompt
      ]),
      25000 // 25 seconds timeout
    );

    const response = result.response.text();
    const todos = JSON.parse(response);

    return Response.json(todos);
  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    
    if (error instanceof Error && error.message === 'Request timeout') {
      return Response.json(
        { error: "Request timed out - the image processing took too long" },
        { status: 504 }
      );
    }
    
    return Response.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_API_KEY || "",
);

// Define the schema for structured todo output
const todoGenerationSchema = {
  type: SchemaType.OBJECT,
  properties: {
    todos: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "The main text/title of the todo item" },
          notes: { type: SchemaType.STRING, description: "Additional notes or details about the todo" },
          emoji: { type: SchemaType.STRING, description: "A relevant emoji for the todo" },
          category: { type: SchemaType.STRING, description: "The category or grouping for the todo" },
          type: { type: SchemaType.STRING, description: "Priority type: A (critical), B (important), C (normal), D (low), E (someday)" },
          done: { type: SchemaType.BOOLEAN, description: "Whether the todo is completed (default false)" },
          date: { type: SchemaType.STRING, description: "Due date in YYYY-MM-DD format if applicable" },
          time: { type: SchemaType.STRING, description: "Due time in HH:MM format if applicable" },
          amount: { type: SchemaType.NUMBER, description: "Numerical amount if applicable (e.g., quantity, price)" },
          url: { type: SchemaType.STRING, description: "Related URL if applicable" },
          email: { type: SchemaType.STRING, description: "Related email if applicable" },
          streetAddress: { type: SchemaType.STRING, description: "Related address if applicable" },
          number: { type: SchemaType.NUMBER, description: "Related phone number if applicable" },
          fiveStarRating: { type: SchemaType.NUMBER, description: "Rating from 1-5 if applicable" },
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
  console.log('[generate-todos API] Received POST request');
  
  try {
    const { 
      systemPrompt, 
      description, 
      listName, 
      listType, 
      template,
      photoData, 
      fromVoice, 
      fromPhoto 
    } = await request.json();

    console.log('[generate-todos API] Request data:', {
      systemPrompt: systemPrompt ? 'present' : 'missing',
      description,
      listName,
      listType,
      template,
      photoData: photoData ? 'present' : 'missing',
      fromVoice,
      fromPhoto
    });

    if (!systemPrompt && !description) {
      return Response.json({ 
        error: "Either systemPrompt or description is required" 
      }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: todoGenerationSchema,
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

    // Build the prompt based on available data
    let prompt = systemPrompt || `You are a helpful assistant that creates structured todos for a ${listType} list.`;
    
    // Add context about the list
    prompt += `\n\nList Details:
- Name: ${listName}
- Type: ${listType}
- Template: ${template || 'Default'}
- Description: ${description}`;

    // Add specific instructions based on source
    if (fromPhoto === 'true' && photoData) {
      prompt += `\n\nThis list was created from a photo. The photo analysis provided the following data:
${photoData}

Please create todos based on the items, ingredients, or information visible in the photo. Consider the context and purpose of the list template when structuring the todos.`;
    }

    if (fromVoice === 'true') {
      prompt += `\n\nThis list was created via voice input. The user described what they wanted, so please create relevant todos that match their intent and the selected template structure.`;
    }

    // Add general instruction for todo generation
    prompt += `\n\nPlease generate 5-10 relevant todos that fit this list's purpose and template. Each todo should:
1. Be specific and actionable
2. Include appropriate emoji that represents the task
3. Have a relevant category for grouping
4. Include proper priority type (A-E scale)
5. Include additional fields (notes, dates, amounts, etc.) when applicable
6. Follow the template's intended structure and workflow

Generate todos that are realistic, useful, and well-organized.`;

    console.log('[generate-todos API] Sending prompt to Gemini...');

    // Call Gemini with timeout
    const result = await withTimeout(
      model.generateContent(prompt),
      25000 // 25 second timeout
    );

    const response = await result.response;
    const text = response.text();

    console.log('[generate-todos API] Raw Gemini response:', text);

    // Parse the structured JSON response
    try {
      const parsedResponse = JSON.parse(text);
      
      console.log('[generate-todos API] Parsed response:', {
        todoCount: parsedResponse.todos?.length || 0,
        firstTodo: parsedResponse.todos?.[0]?.text || 'N/A'
      });

      return Response.json(parsedResponse);
      
    } catch (parseError) {
      console.error('[generate-todos API] Failed to parse JSON response:', parseError);
      return Response.json({ 
        error: "Failed to parse AI response",
        details: parseError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[generate-todos API] Error:', error);
    
    if (error.message === 'Request timeout') {
      return Response.json({ 
        error: "Request timed out. Please try again." 
      }, { status: 408 });
    }
    
    return Response.json({ 
      error: "Failed to generate todos",
      details: error.message 
    }, { status: 500 });
  }
}
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini with API key
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || ""
});

export async function POST(request: Request) {
  console.log('[generate-todos API] Received POST request');
  
  try {
    const { prompt: userPrompt, listInfo, currentTodos, image, mimeType } = await request.json();

    console.log('[generate-todos API] Request details:', {
      hasPrompt: !!userPrompt,
      hasImage: !!image,
      listName: listInfo?.name,
      currentTodoCount: currentTodos?.length || 0
    });

    // Build the system prompt based on list information
    const systemPrompt = `You are a helpful assistant generating todos for a list.
    
List Information:
- List Name: "${listInfo.name}"
- List Purpose: "${listInfo.purpose}"
- List Template: "${listInfo.template}"
- Special Instructions: "${listInfo.systemPrompt}"

To help you understand the schema of a todo for this list, here's the current todos: ${JSON.stringify(currentTodos)}

Generate relevant, specific, and contextual todo items that match the style and purpose of the current list.
Please only provide the new todos, not the existing todos provided for context.

Respond with JSON in this exact format:
{
  "todos": [
    {
      "text": "The main text/title of the todo item",
      "notes": "Additional notes or details about the todo",
      "emoji": "A relevant emoji for the todo",
      "category": "The category or grouping for the todo",
      "type": "Priority type: A (critical), B (important), C (normal), D (low), E (someday)",
      "done": false,
      "date": "Due date in YYYY-MM-DD format if applicable",
      "time": "Due time in HH:MM format if applicable",
      "amount": 0,
      "url": "Related URL if applicable",
      "email": "Related email if applicable",
      "streetAddress": "Related address if applicable",
      "number": 0,
      "fiveStarRating": 0
    }
  ]
}`;

    // Combine prompts
    const fullPrompt = `${systemPrompt}\n\nUser Request: ${userPrompt}`;

    console.log('[generate-todos API] Calling Gemini API...');

    let contents;
    if (image && mimeType) {
      // If image is provided, include it
      contents = [
        {
          inlineData: {
            mimeType: mimeType,
            data: image,
          }
        },
        { text: fullPrompt }
      ];
    } else {
      // Text-only request
      contents = [{ text: fullPrompt }];
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    // Get the response text directly
    const text = response.text;
    
    console.log('[generate-todos API] Gemini response received');

    try {
      const parsedResponse = JSON.parse(text);
      
      // Validate the response has todos array
      if (!parsedResponse.todos || !Array.isArray(parsedResponse.todos)) {
        throw new Error('Invalid response format - missing todos array');
      }

      console.log('[generate-todos API] Generated todos count:', parsedResponse.todos.length);
      return Response.json(parsedResponse);

    } catch (parseError) {
      console.error('[generate-todos API] Failed to parse response:', parseError);
      console.log('[generate-todos API] Raw response:', text);
      
      return Response.json({
        error: "Failed to parse AI response",
        details: parseError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[generate-todos API] Error:', error);
    
    let errorMessage = 'Failed to generate todos';
    let statusCode = 500;
    
    if (error.message?.includes('API key')) {
      errorMessage = 'API configuration error';
      statusCode = 401;
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out';
      statusCode = 504;
    }
    
    return Response.json({ 
      error: errorMessage,
      details: error.message 
    }, { status: statusCode });
  }
}
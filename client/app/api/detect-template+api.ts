import { GoogleGenAI } from '@google/genai';
import catalogue from '../../catalogue.json';

// Initialize Gemini with API key
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || ""
});

// Get available templates with their key information
const getAvailableTemplates = () => {
  return catalogue
    .filter(template => template.published)
    .map(template => ({
      id: template.template,
      name: template.name,
      purpose: template.purpose,
      type: template.type,
      icon: template.icon || '📝',
      backgroundColour: template.backgroundColour || 'blue',
    }));
};

export async function POST(request: Request) {
  console.log('[detect-template API] Received POST request');
  
  try {
    const { image, mimeType } = await request.json();

    console.log('[detect-template API] Processing photo for template detection');

    if (!image || !mimeType) {
      return Response.json({ 
        error: "Image and mimeType are required" 
      }, { status: 400 });
    }

    const availableTemplates = getAvailableTemplates();
    
    const prompt = `You are an AI assistant that analyzes photos to suggest the best template for creating a structured list.

Analyze this photo and determine what type of content or collection it shows, then suggest the most appropriate templates from the available options.

AVAILABLE TEMPLATES:
${availableTemplates.map(t => `${t.id}: ${t.name} - ${t.purpose} (Type: ${t.type})`).join('\n')}

ANALYSIS INSTRUCTIONS:
1. Identify what is shown in the photo (recipe, document, collection, menu, etc.)
2. Consider the context and purpose of the content
3. Match the content to the most suitable templates based on:
   - Content type and structure
   - Intended use case
   - Organization needs

RESPONSE FORMAT:
Please respond with JSON in this exact format:
{
  "analysis": "Brief description of what you see",
  "suggestedTemplates": [
    {
      "templateId": "exact template ID from list",
      "confidence": 85,
      "reasoning": "Why this template matches",
      "suggestedName": "My Suggested List Name",
      "suggestedIcon": "🎯"
    }
  ]
}

Focus on practical utility - choose templates that would actually help the user organize the content they photographed.`;

    console.log('[detect-template API] Calling Gemini API...');

    const contents = [
      {
        inlineData: {
          mimeType: mimeType,
          data: image,
        }
      },
      { text: prompt }
    ];

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    // Get the response text directly
    const text = response.text;
    
    console.log('[detect-template API] Gemini response received');

    try {
      const parsedResponse = JSON.parse(text);
      
      // Validate and enrich the suggestions with full template data
      const enrichedSuggestions = parsedResponse.suggestedTemplates
        .map((suggestion: any) => {
          const template = availableTemplates.find(t => t.id === suggestion.templateId);
          if (!template) return null;
          
          return {
            ...suggestion,
            templateData: template
          };
        })
        .filter(Boolean)
        .slice(0, 3);

      const result = {
        analysis: parsedResponse.analysis,
        suggestedTemplates: enrichedSuggestions
      };

      console.log('[detect-template API] Returning suggestions:', enrichedSuggestions.length);
      return Response.json(result);

    } catch (parseError) {
      console.error('[detect-template API] Failed to parse response:', parseError);
      console.log('[detect-template API] Raw response:', text);
      
      // Return a generic error response
      return Response.json({
        analysis: "I analyzed your photo but had trouble processing the results.",
        suggestedTemplates: []
      });
    }

  } catch (error: any) {
    console.error('[detect-template API] Error:', error);
    
    let errorMessage = 'Failed to analyze photo';
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
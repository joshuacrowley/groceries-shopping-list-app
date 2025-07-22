import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";
import catalogue from '../../catalogue.json';

// Initialize Gemini with API key
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_AI_API_KEY || "",
);

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

// Define the schema for template detection response
const templateDetectionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    analysis: {
      type: SchemaType.STRING,
      description: "Brief analysis of what was seen in the photo"
    },
    suggestedTemplates: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          templateId: { 
            type: SchemaType.STRING, 
            description: "The template ID from the available templates" 
          },
          confidence: { 
            type: SchemaType.NUMBER, 
            description: "Confidence score from 0-100" 
          },
          reasoning: { 
            type: SchemaType.STRING, 
            description: "Why this template matches the photo content" 
          },
          suggestedName: { 
            type: SchemaType.STRING, 
            description: "Suggested name for the list based on photo content" 
          },
          suggestedIcon: { 
            type: SchemaType.STRING, 
            description: "Suggested emoji icon based on photo content" 
          }
        },
        required: ["templateId", "confidence", "reasoning", "suggestedName"]
      },
      description: "Top 3 template suggestions ranked by relevance"
    }
  },
  required: ["analysis", "suggestedTemplates"]
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
  console.log('[detect-template API] Received POST request');
  
  try {
    const { image, mimeType } = await request.json();

    console.log('[detect-template API] Processing photo for template detection');

    if (!image || !mimeType) {
      return Response.json({ 
        error: "Image and mimeType are required" 
      }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite-preview-06-17",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent analysis
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: templateDetectionSchema,
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

    // Get available templates for context
    const availableTemplates = getAvailableTemplates();

    // Build the prompt for template detection
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
- Provide a brief analysis of what you see
- Suggest TOP 3 most relevant templates with confidence scores (0-100)
- Include reasoning for each suggestion
- Suggest an appropriate list name based on the photo content
- Optionally suggest an emoji icon if relevant

Focus on practical utility - choose templates that would actually help the user organize the content they photographed.`;

    console.log('[detect-template API] Sending request to Gemini...');

    // Call Gemini with timeout
    const result = await withTimeout(
      model.generateContent([
        { text: prompt },
        { 
          inlineData: { 
            mimeType: mimeType, 
            data: image 
          } 
        }
      ]),
      30000 // 30 second timeout
    );

    const response = await result.response;
    const text = response.text();

    console.log('[detect-template API] Raw Gemini response:', text.substring(0, 500) + '...');

    // Parse the structured JSON response
    try {
      const parsedResponse = JSON.parse(text);
      
      // Validate and enrich the suggestions with full template data
      const enrichedSuggestions = parsedResponse.suggestedTemplates
        .map(suggestion => {
          const template = availableTemplates.find(t => t.id === suggestion.templateId);
          if (!template) return null;
          
          return {
            ...suggestion,
            templateData: template
          };
        })
        .filter(Boolean)
        .slice(0, 3); // Ensure max 3 suggestions

      const finalResponse = {
        analysis: parsedResponse.analysis,
        suggestedTemplates: enrichedSuggestions
      };

      console.log('[detect-template API] Processed response:', {
        analysis: finalResponse.analysis.substring(0, 100) + '...',
        templateCount: finalResponse.suggestedTemplates.length,
        topSuggestion: finalResponse.suggestedTemplates[0]?.templateData?.name || 'N/A'
      });

      return Response.json(finalResponse);
      
    } catch (parseError) {
      console.error('[detect-template API] Failed to parse JSON response:', parseError);
      return Response.json({ 
        error: "Failed to parse AI response",
        details: parseError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[detect-template API] Error:', error);
    
    if (error.message === 'Request timeout') {
      return Response.json({ 
        error: "Request timed out. Please try again." 
      }, { status: 408 });
    }
    
    return Response.json({ 
      error: "Failed to analyze photo for template detection",
      details: error.message 
    }, { status: 500 });
  }
}
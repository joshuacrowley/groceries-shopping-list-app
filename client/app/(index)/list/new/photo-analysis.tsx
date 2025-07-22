import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, ScrollView, SafeAreaView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import PhosphorIcon from '@/components/PhosphorIcon';
import Constants from 'expo-constants';
import catalogue from '../../../../catalogue.json';
import { useStore } from 'tinybase/ui-react';
import { getUniqueId } from 'tinybase';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";

// Initialize Gemini with API key from environment
const getGeminiAPI = () => {
  const apiKey = Constants.expoConfig?.extra?.GOOGLE_AI_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Google AI API key not found. Please set EXPO_PUBLIC_GOOGLE_AI_API_KEY in your environment.");
  }
  return new GoogleGenerativeAI(apiKey);
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

// Timeout wrapper function
const withTimeout = (promise: Promise<any>, timeoutMs: number): Promise<any> => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

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

interface TemplateSuggestion {
  templateId: string;
  confidence: number;
  reasoning: string;
  suggestedName: string;
  suggestedIcon?: string;
  templateData: {
    id: string;
    name: string;
    purpose: string;
    type: string;
    icon: string;
    backgroundColour: string;
  };
}

export default function PhotoAnalysisScreen() {
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;
  const base64Image = params.base64Image as string;
  const mimeType = params.mimeType as string || 'image/jpeg';
  
  const store = useStore();

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<string>('');
  const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([]);
  const [error, setError] = useState<string>('');
  const [loadingText, setLoadingText] = useState('Analyzing your photo...');

  useEffect(() => {
    if (base64Image) {
      analyzePhotoForTemplates();
    }
  }, [base64Image]);

  // Animate loading text
  useEffect(() => {
    if (!isAnalyzing) return;
    
    const messages = [
      'Analyzing your photo...',
      'Understanding the content...',
      'Finding the best templates...',
      'Almost ready...'
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const analyzePhotoForTemplates = async () => {
    try {
      console.log('Starting photo analysis with direct Gemini call...');
      
      const genAI = getGeminiAPI();
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite-preview-06-17",
        generationConfig: {
          temperature: 0.3,
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
- Provide a brief analysis of what you see
- Suggest TOP 3 most relevant templates with confidence scores (0-100)
- Include reasoning for each suggestion
- Suggest an appropriate list name based on the photo content
- Optionally suggest an emoji icon if relevant

Focus on practical utility - choose templates that would actually help the user organize the content they photographed.`;

      console.log('Calling Gemini API...');
      
      const result = await withTimeout(
        model.generateContent([
          { text: prompt },
          { 
            inlineData: { 
              mimeType: mimeType, 
              data: base64Image 
            } 
          }
        ]),
        15000 // 15 second timeout
      );

      const response = await result.response;
      const text = response.text();
      console.log('Gemini response received');
      
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

      setAnalysis(parsedResponse.analysis);
      setSuggestions(enrichedSuggestions);
      setIsAnalyzing(false);

    } catch (error) {
      console.error('Error analyzing photo:', error);
      setError('Failed to analyze photo. Please try again.');
      setIsAnalyzing(false);
      
      // Provide fallback suggestions
      const availableTemplates = getAvailableTemplates();
      const fallbackTemplates = availableTemplates.slice(0, 3);
      
      setSuggestions(fallbackTemplates.map((template, index) => ({
        templateId: template.id,
        confidence: 70 - (index * 10),
        reasoning: `${template.name} is a versatile template for ${template.purpose}`,
        suggestedName: "My Photo List",
        suggestedIcon: template.icon,
        templateData: template
      })));
    }
  };

  const handleTemplateSelect = (suggestion: TemplateSuggestion) => {
    console.log('Template selected:', suggestion.templateId);
    
    // Get the full template data from catalogue
    const templateData = catalogue.find(t => t.template === suggestion.templateId);
    if (!templateData) {
      Alert.alert('Error', 'Template not found');
      return;
    }
    
    // Create the list immediately
    const listId = getUniqueId();
    
    store.transaction(() => {
      store.setRow("lists", listId, {
        name: suggestion.suggestedName,
        purpose: suggestion.templateData.purpose,
        systemPrompt: templateData.systemPrompt || '',
        number: templateData.number || 117,
        template: suggestion.templateId,
        type: suggestion.templateData.type,
        backgroundColour: suggestion.templateData.backgroundColour,
        icon: suggestion.suggestedIcon || suggestion.templateData.icon || '📝',
        code: ''
      });
    });
    
    console.log('List created with ID:', listId);
    
    // Navigate to the list detail screen with parameters for todo generation
    router.replace({
      pathname: '/(index)/list/[listId]',
      params: { 
        listId: listId,
        generateTodos: 'true',
        fromPhoto: 'true',
        photoAnalysis: analysis,
        templateId: suggestion.templateId,
        systemPrompt: templateData.systemPrompt || ''
      }
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#22C55E';
    if (confidence >= 60) return '#F59E0B';
    return '#6B7280';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 80) return 'High match';
    if (confidence >= 60) return 'Good match';
    return 'Possible match';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <PhosphorIcon name="ArrowLeft" size={24} color="#1F2937" weight="bold" />
        </Pressable>
        <Text style={styles.title}>Smart Template Suggestions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo Preview */}
        {photoUri && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          </View>
        )}

        {isAnalyzing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        ) : (
          <>
            {/* Analysis */}
            {analysis && (
              <View style={styles.analysisContainer}>
                <Text style={styles.analysisTitle}>What we found:</Text>
                <Text style={styles.analysisText}>{analysis}</Text>
              </View>
            )}

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Template Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Recommended templates:</Text>
              
              {suggestions.map((suggestion, index) => (
                <Pressable
                  key={suggestion.templateId}
                  style={[
                    styles.suggestionCard,
                    index === 0 && styles.topSuggestion
                  ]}
                  onPress={() => handleTemplateSelect(suggestion)}
                >
                  <View style={styles.suggestionHeader}>
                    <View style={styles.templateInfo}>
                      <View style={styles.templateIconContainer}>
                        {/* Check if it's an emoji or icon name */}
                        {(suggestion.suggestedIcon && suggestion.suggestedIcon.length <= 2) || 
                         (suggestion.templateData.icon && suggestion.templateData.icon.length <= 2) ? (
                          <Text style={styles.templateEmoji}>
                            {suggestion.suggestedIcon || suggestion.templateData.icon}
                          </Text>
                        ) : (
                          <PhosphorIcon 
                            name={suggestion.templateData.icon || 'ListChecks'} 
                            size={28} 
                            color="#374151" 
                            weight="duotone"
                          />
                        )}
                      </View>
                      <View style={styles.templateDetails}>
                        <Text style={styles.templateName}>
                          {suggestion.suggestedName}
                        </Text>
                        <Text style={styles.templateType}>
                          {suggestion.templateData.name} • {suggestion.templateData.type}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.confidenceContainer}>
                      <View style={[
                        styles.confidenceBadge,
                        { backgroundColor: getConfidenceColor(suggestion.confidence) + '20' }
                      ]}>
                        <Text style={[
                          styles.confidenceText,
                          { color: getConfidenceColor(suggestion.confidence) }
                        ]}>
                          {getConfidenceText(suggestion.confidence)}
                        </Text>
                      </View>
                      {index === 0 && (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.reasoning}>{suggestion.reasoning}</Text>
                  
                  <View style={styles.templatePurpose}>
                    <Text style={styles.purposeText}>{suggestion.templateData.purpose}</Text>
                  </View>
                  
                  <View style={styles.selectButton}>
                    <Text style={styles.selectButtonText}>Use this template</Text>
                    <PhosphorIcon name="ArrowRight" size={16} color="#2196F3" weight="bold" />
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Alternative Option */}
            <Pressable
              style={styles.alternativeOption}
              onPress={() => {
                router.push('/(index)/list/new/create');
              }}
            >
              <PhosphorIcon name="Plus" size={20} color="#6B7280" weight="bold" />
              <Text style={styles.alternativeText}>Create custom list instead</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E9EA',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  photoContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  analysisContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  errorContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    lineHeight: 22,
  },
  suggestionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  topSuggestion: {
    borderColor: '#2196F3',
    backgroundColor: '#F0F9FF',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  templateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  templateEmoji: {
    fontSize: 28,
  },
  templateDetails: {
    flex: 1,
  },
  templateName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  templateType: {
    fontSize: 14,
    color: '#6B7280',
  },
  confidenceContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendedBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reasoning: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  templatePurpose: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
    marginBottom: 12,
  },
  purposeText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginRight: 6,
  },
  alternativeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  alternativeText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
}); 
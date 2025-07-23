import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, ScrollView, SafeAreaView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import PhosphorIcon from '@/components/PhosphorIcon';
import Constants from 'expo-constants';
import catalogue from '../../../../catalogue.json';
import { useStore } from 'tinybase/ui-react';
import { getUniqueId } from 'tinybase';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini with API key from environment
const getGeminiAPI = () => {
  const apiKey = Constants.expoConfig?.extra?.GOOGLE_AI_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Google AI API key not found. Please set EXPO_PUBLIC_GOOGLE_AI_API_KEY in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper function to get available templates
const getAvailableTemplates = () => {
  const templates = Object.keys(catalogue)
    .filter(key => 
      catalogue[key].code && 
      catalogue[key].code.trim() !== '' && 
      catalogue[key].code !== 'Basic'
    )
    .map(key => ({
      name: catalogue[key].code,
      label: catalogue[key].display || catalogue[key].name,
      description: catalogue[key].type || 'No description available'
    }));
  
  console.log('Available templates:', templates);
  return templates;
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
  const needsBase64 = params.needsBase64 === 'true';
  const mimeType = params.mimeType as string || 'image/jpeg';
  
  const store = useStore();

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<string>('');
  const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([]);
  const [error, setError] = useState<string>('');
  const [loadingText, setLoadingText] = useState('Processing your photo...');
  const [base64Image, setBase64Image] = useState<string>(params.base64Image as string || '');

  useEffect(() => {
    if (needsBase64 && photoUri) {
      // Process base64 after navigation
      processBase64FromUri();
    } else if (base64Image) {
      analyzePhotoForTemplates();
    }
  }, [needsBase64, photoUri, base64Image]);

  // Animate loading text
  useEffect(() => {
    if (!isAnalyzing) return;
    
    const messages = [
      'Processing your photo...',
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

  const processBase64FromUri = async () => {
    try {
      console.log('Converting photo to base64...');
      
      // Fetch the image and convert to base64
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        console.log('Base64 conversion complete');
        setBase64Image(base64);
        analyzePhotoForTemplates(base64);
      };
      reader.onerror = () => {
        console.error('Failed to convert image to base64');
        setError('Failed to process image. Please try again.');
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const analyzePhotoForTemplates = async (imageData?: string) => {
    const dataToAnalyze = imageData || base64Image;
    if (!dataToAnalyze) {
      setError('No image data available');
      setIsAnalyzing(false);
      return;
    }

    try {
      console.log('Starting photo analysis with direct Gemini call...');
      console.log('Using model: gemini-2.5-flash');
      
      const genAI = getGeminiAPI();

      const availableTemplates = getAvailableTemplates();
      
      const prompt = `You are an AI assistant that analyzes photos to suggest the best template for creating a structured list. 

Analyze this photo and determine what type of content or collection it shows, then suggest the most appropriate templates from the available options.

AVAILABLE TEMPLATES:
${availableTemplates.map(t => `${t.name} - ${t.description}`).join('\n')}

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
      "templateId": "exact template name from list",
      "confidence": 85,
      "reasoning": "Why this template matches",
      "suggestedName": "My Suggested List Name",
      "suggestedIcon": "🎯"
    }
  ]
}

Focus on practical utility - choose templates that would actually help the user organize the content they photographed.`;

      console.log('Calling Gemini API...');
      console.log('Image data length:', dataToAnalyze.length);
      
      const contents = [
        { 
          inlineData: { 
            mimeType: mimeType, 
            data: dataToAnalyze 
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
      
      console.log('Gemini response received');
      
      try {
        const parsedResponse = JSON.parse(text);
        
        // Validate and enrich the suggestions with full template data
        const enrichedSuggestions = parsedResponse.suggestedTemplates
          .map((suggestion: any) => {
            const template = availableTemplates.find(t => t.name === suggestion.templateId);
            if (!template) return null;
            
            // Find the full catalogue entry
            const catalogueKey = Object.keys(catalogue).find(key => catalogue[key].code === template.name);
            const fullTemplate = catalogueKey ? catalogue[catalogueKey] : null;
            
            return {
              ...suggestion,
              templateData: fullTemplate ? {
                id: fullTemplate.template || template.name,
                name: fullTemplate.name || template.label,
                purpose: fullTemplate.purpose || template.description,
                type: fullTemplate.type || 'General',
                icon: fullTemplate.icon || '📝',
                backgroundColour: fullTemplate.backgroundColour || 'blue'
              } : {
                id: template.name,
                name: template.label,
                purpose: template.description,
                type: 'General',
                icon: '📝',
                backgroundColour: 'blue'
              }
            };
          })
          .filter(Boolean)
          .slice(0, 3);

        setAnalysis(parsedResponse.analysis);
        setSuggestions(enrichedSuggestions);
        setIsAnalyzing(false);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        console.log('Raw response:', text);
        
        // Fallback to generic suggestions
        const fallbackTemplates = availableTemplates.slice(0, 3);
        setSuggestions(fallbackTemplates.map((template, index) => {
          const catalogueKey = Object.keys(catalogue).find(key => catalogue[key].code === template.name);
          const fullTemplate = catalogueKey ? catalogue[catalogueKey] : null;
          
          return {
            templateId: template.name,
            confidence: 70 - (index * 10),
            reasoning: `${template.name} is a versatile template for ${template.description}`,
            suggestedName: "My Photo List",
            suggestedIcon: '📝',
            templateData: fullTemplate ? {
              id: fullTemplate.template || template.name,
              name: fullTemplate.name || template.label,
              purpose: fullTemplate.purpose || template.description,
              type: fullTemplate.type || 'General',
              icon: fullTemplate.icon || '📝',
              backgroundColour: fullTemplate.backgroundColour || 'blue'
            } : {
              id: template.name,
              name: template.label,
              purpose: template.description,
              type: 'General',
              icon: '📝',
              backgroundColour: 'blue'
            }
          };
        }));
        
        setAnalysis("I analyzed your photo and found some suitable templates for you.");
        setIsAnalyzing(false);
      }

    } catch (error: any) {
      console.error('Error analyzing photo:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to analyze photo. Please try again.';
      
      if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message?.includes('API key')) {
        errorMessage = 'API configuration error. Please check your settings.';
      }
      
      setError(errorMessage);
      setIsAnalyzing(false);
      
      // Provide fallback suggestions
      const availableTemplates = getAvailableTemplates();
      const fallbackTemplates = availableTemplates.slice(0, 3);
      
      setSuggestions(fallbackTemplates.map((template, index) => {
        const catalogueKey = Object.keys(catalogue).find(key => catalogue[key].code === template.name);
        const fullTemplate = catalogueKey ? catalogue[catalogueKey] : null;
        
        return {
          templateId: template.name,
          confidence: 70 - (index * 10),
          reasoning: `${template.name} is a versatile template for ${template.description}`,
          suggestedName: "My Photo List",
          suggestedIcon: '📝', // Default icon for fallback
          templateData: fullTemplate ? {
            id: fullTemplate.template || template.name,
            name: fullTemplate.name || template.label,
            purpose: fullTemplate.purpose || template.description,
            type: fullTemplate.type || 'General',
            icon: fullTemplate.icon || '📝',
            backgroundColour: fullTemplate.backgroundColour || 'blue'
          } : {
            id: template.name,
            name: template.label,
            purpose: template.description,
            type: 'General',
            icon: '📝',
            backgroundColour: 'blue'
          }
        };
      }));
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
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, ScrollView, SafeAreaView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import PhosphorIcon from '@/components/PhosphorIcon';
import Constants from 'expo-constants';
import catalogue from '../../../../catalogue.json';
import { useStore } from 'tinybase/ui-react';
import { getUniqueId } from 'tinybase';

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

  useEffect(() => {
    if (base64Image) {
      analyzePhotoForTemplates();
    }
  }, [base64Image]);

  const analyzePhotoForTemplates = async () => {
    try {
      console.log('Starting photo analysis...');
      
      // Determine the correct API base URL
      let apiBaseUrl = '';
      if (__DEV__) {
        const bundleUrl = Constants.experienceUrl;
        const urlsToTry = [];
        
        if (bundleUrl) {
          try {
            const url = new URL(bundleUrl);
            urlsToTry.push(`http://${url.hostname}:8081`);
          } catch (urlError) {
            console.log('Failed to parse bundle URL:', urlError.message);
          }
        }
        
        urlsToTry.push('http://localhost:8081');
        apiBaseUrl = urlsToTry[0] || 'http://localhost:8081';
      }
      
      const response = await fetch(`${apiBaseUrl}/api/detect-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType: mimeType
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('Analysis complete:', result);
      
      setAnalysis(result.analysis);
      setSuggestions(result.suggestedTemplates || []);
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
          <PhosphorIcon name="ArrowLeft" size={20} color="#1F2937" weight="bold" />
        </Pressable>
        <Text style={styles.title}>Smart Template Suggestions</Text>
        <View style={{ width: 32 }} />
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
            <Text style={styles.loadingText}>Analyzing your photo...</Text>
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
                      <Text style={styles.templateEmoji}>
                        {suggestion.suggestedIcon || suggestion.templateData.icon}
                      </Text>
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
              <PhosphorIcon name="Wrench" size={20} color="#666" weight="regular" />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E9EA',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
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
  },
  templateEmoji: {
    fontSize: 24,
    marginRight: 12,
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
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
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
  },
  purposeText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
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
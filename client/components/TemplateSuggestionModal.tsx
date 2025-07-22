import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import PhosphorIcon from './PhosphorIcon';
import { router } from 'expo-router';

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

interface TemplateSuggestionModalProps {
  visible: boolean;
  onClose: () => void;
  photoUri?: string;
  analysis?: string;
  suggestions: TemplateSuggestion[];
  isLoading?: boolean;
}

const TemplateSuggestionModal: React.FC<TemplateSuggestionModalProps> = ({
  visible,
  onClose,
  photoUri,
  analysis,
  suggestions,
  isLoading = false,
}) => {
  
  // Debug logging
  console.log('TemplateSuggestionModal render:', {
    visible,
    photoUri: !!photoUri,
    analysis: !!analysis,
    suggestionsCount: suggestions?.length || 0,
    isLoading
  });

  // Additional debugging
  useEffect(() => {
    console.log('TemplateSuggestionModal state change:', {
      visible,
      hasAnalysis: !!analysis,
      hasSuggestions: suggestions?.length > 0,
      isLoading,
      firstSuggestion: suggestions?.[0]?.templateData?.name || 'none'
    });
  }, [visible, analysis, suggestions, isLoading]);

  // Log when modal should be visible
  if (visible) {
    console.log('TemplateSuggestionModal is VISIBLE with:', {
      hasContent: !isLoading && suggestions?.length > 0,
      isLoading
    });
  }

  const handleTemplateSelect = (suggestion: TemplateSuggestion) => {
    console.log('Template selected:', suggestion.templateId, suggestion.suggestedName);
    
    // Navigate to create screen with pre-selected template and photo data
    router.push({
      pathname: '/(index)/list/new/create',
      params: {
        selectedTemplate: suggestion.templateId,
        suggestedName: suggestion.suggestedName,
        suggestedIcon: suggestion.suggestedIcon || suggestion.templateData.icon,
        description: `Created from photo: ${analysis}`,
        fromPhoto: 'true',
        photoUri: photoUri,
        photoAnalysis: analysis,
      }
    });
    
    // Close the modal after navigation
    onClose();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#22C55E'; // Green
    if (confidence >= 60) return '#F59E0B'; // Orange
    return '#6B7280'; // Gray
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 80) return 'High match';
    if (confidence >= 60) return 'Good match';
    return 'Possible match';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Smart Template Suggestions</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <PhosphorIcon name="X" size={20} color="#666" weight="bold" />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Analyzing your photo...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Photo Preview */}
              {photoUri && (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                </View>
              )}

              {/* Analysis */}
              {analysis && (
                <View style={styles.analysisContainer}>
                  <Text style={styles.analysisTitle}>What we found:</Text>
                  <Text style={styles.analysisText}>{analysis}</Text>
                </View>
              )}

              {/* Template Suggestions */}
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Recommended templates:</Text>
                
                {suggestions && suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
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
                  ))
                ) : (
                  <View style={styles.noSuggestionsContainer}>
                    <Text style={styles.noSuggestionsText}>
                      No template suggestions available yet.
                    </Text>
                  </View>
                )}
              </View>

              {/* Alternative Option */}
              <Pressable
                style={styles.alternativeOption}
                onPress={() => {
                  console.log('Creating custom list instead');
                  router.push('/(index)/list/new/create');
                  onClose();
                }}
              >
                <PhosphorIcon name="Wrench" size={20} color="#666" weight="regular" />
                <Text style={styles.alternativeText}>Create custom list instead</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E9EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
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
  noSuggestionsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noSuggestionsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default TemplateSuggestionModal;
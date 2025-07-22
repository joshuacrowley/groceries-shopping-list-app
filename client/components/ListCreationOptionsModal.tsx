import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Alert } from 'react-native';
import PhosphorIcon from './PhosphorIcon';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import TemplateSuggestionModal from './TemplateSuggestionModal';
import Constants from 'expo-constants';
import catalogue from '../catalogue.json';

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


interface ListCreationOptionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const ListCreationOptionsModal: React.FC<ListCreationOptionsModalProps> = ({
  visible,
  onClose,
}) => {
  const [showTemplateSuggestions, setShowTemplateSuggestions] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<any>(null);
  const [photoUri, setPhotoUri] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Debug state changes
  useEffect(() => {
    console.log('[ListCreationOptionsModal] State update:', {
      showTemplateSuggestions,
      hasPhotoAnalysis: !!photoAnalysis,
      isAnalyzing,
      visible
    });
  }, [showTemplateSuggestions, photoAnalysis, isAnalyzing, visible]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible && !showTemplateSuggestions) {
      // Only reset if both modals are closed
      setShowTemplateSuggestions(false);
      setPhotoAnalysis(null);
      setPhotoUri('');
      setIsAnalyzing(false);
    }
  }, [visible, showTemplateSuggestions]);

  const handleCreateManually = () => {
    onClose();
    router.push('/(index)/list/new/create');
  };

  const handleCreateWithVoice = () => {
    onClose();
    // For now, show a simple alert and direct to create with voice suggestion
    Alert.alert(
      'Create with Voice',
      'Voice list creation will analyze your description and suggest the best template.',
      [
        {
          text: 'Try it',
          onPress: () => {
            // Navigate directly to create page with voice flag
            router.push({
              pathname: '/(index)/list/new/create',
              params: {
                fromVoice: 'true',
                description: 'Describe what kind of list you want to create'
              }
            });
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleCreateWithPhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return;
      }

      // Show photo picker options
      Alert.alert(
        'Take Photo',
        'Choose how you\'d like to capture your photo:',
        [
          {
            text: 'Camera',
            onPress: () => capturePhoto('camera')
          },
          {
            text: 'Photo Library',
            onPress: () => capturePhoto('library')
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to access camera. Please try again.');
    }
  };

  const capturePhoto = async (source: 'camera' | 'library') => {
    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Determine proper MIME type - expo-image-picker sometimes returns just "image"
        let mimeType = asset.type || 'image/jpeg';
        if (mimeType === 'image') {
          // Default to JPEG for generic "image" type
          mimeType = 'image/jpeg';
        }
        
        console.log('Asset type from picker:', asset.type);
        console.log('Using MIME type:', mimeType);
        
        // Set up the template suggestion modal state
        setPhotoUri(asset.uri);
        setPhotoAnalysis(null); // Clear previous results
        
        // IMPORTANT: Show the template suggestions modal immediately
        console.log('[ListCreationOptionsModal] Before setting showTemplateSuggestions to true');
        setShowTemplateSuggestions(true);
        console.log('[ListCreationOptionsModal] After setting showTemplateSuggestions to true');
        setIsAnalyzing(true);
        
        // Close the parent modal to avoid nested modals
        onClose();
        
        // Force a re-render to ensure state updates
        setTimeout(() => {
          console.log('[ListCreationOptionsModal] Checking state after timeout:', {
            showTemplateSuggestions,
            isAnalyzing
          });
        }, 0);
        
        // Start analysis immediately without delay
        analyzePhotoForTemplates(asset.base64!, mimeType);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsAnalyzing(false);
      setShowTemplateSuggestions(false);
    }
  };

  const analyzePhotoForTemplates = async (base64Image: string, mimeType: string) => {
    let payloadSize = 0;
    try {
      console.log('=== PHOTO ANALYSIS DEBUG ===');
      console.log('Starting analysis...');
      console.log('Image data length:', base64Image.length);
      console.log('MIME type:', mimeType);
      console.log('Request URL: /api/detect-template');
      
      // Log request payload size
      const requestPayload = {
        image: base64Image,
        mimeType: mimeType
      };
      payloadSize = JSON.stringify(requestPayload).length;
      console.log('Request payload size:', payloadSize, 'bytes');
      
      console.log('Making fetch request...');
      
      // Check payload size - if too large, compress the image
      if (payloadSize > 5 * 1024 * 1024) { // 5MB limit
        console.log('Payload too large, will need to compress image');
        throw new Error('Image too large. Please try a smaller image or lower quality.');
      }
      
      // First test simple connectivity
      console.log('Testing basic API connectivity...');
      
      // Determine the correct API base URL
      let apiBaseUrl = '';
      if (__DEV__) {
        // In development, we need to use the full URL
        // Get the bundle URL to determine the dev server host
        const bundleUrl = Constants.experienceUrl;
        console.log('Bundle URL from Constants:', bundleUrl);
        console.log('Constants debug info:', {
          experienceUrl: Constants.experienceUrl,
          debuggerHost: Constants.debuggerHost,
          linkingUrl: Constants.linkingUrl
        });
        
        // Try multiple approaches to get the dev server URL
        const urlsToTry = [];
        
        if (bundleUrl) {
          try {
            const url = new URL(bundleUrl);
            urlsToTry.push(`http://${url.hostname}:8081`);
          } catch (urlError) {
            console.log('Failed to parse bundle URL:', urlError.message);
          }
        }
        
        // Add common development URLs
        urlsToTry.push('http://localhost:8081');
        urlsToTry.push('http://192.168.20.11:8081'); // Your network IP from lsof output
        
        // Remove duplicates
        const uniqueUrls = [...new Set(urlsToTry)];
        console.log('URLs to try:', uniqueUrls);
        
        // Use the first URL for now
        apiBaseUrl = uniqueUrls[0] || 'http://localhost:8081';
      }
      
      console.log('Selected API base URL:', apiBaseUrl);
      
      try {
        const testResponse = await fetch(`${apiBaseUrl}/api/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'connectivity check' })
        });
        console.log('Test API response status:', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('Test API response:', testData.message);
        }
      } catch (testError) {
        console.error('Basic connectivity test failed:', testError.message);
        throw new Error(`Network connectivity issue: ${testError.message}`);
      }
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Request timeout - aborting...');
        controller.abort();
      }, 30000); // 30 second timeout
      
      console.log('Basic connectivity OK, proceeding with template detection...');
      
      const response = await fetch(`${apiBaseUrl}/api/detect-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response received!');
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.log('Response not OK, trying to parse error...');
        let errorData;
        try {
          errorData = await response.json();
          console.log('Error response data:', errorData);
        } catch (parseError) {
          console.log('Failed to parse error response as JSON:', parseError.message);
          const errorText = await response.text();
          console.log('Raw error response:', errorText.substring(0, 500));
          throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      console.log('Parsing successful response...');
      const finalResponse = await response.json();
      console.log('Parsed response keys:', Object.keys(finalResponse));

      console.log('Template analysis result:', {
        analysis: finalResponse.analysis?.substring(0, 100) + '...',
        templateCount: finalResponse.suggestedTemplates?.length || 0,
        topSuggestion: finalResponse.suggestedTemplates?.[0]?.templateData?.name || 'N/A'
      });
      
      setPhotoAnalysis(finalResponse);
      setIsAnalyzing(false);
      console.log('=== ANALYSIS COMPLETED ===');
      console.log('Template suggestion modal should now show results');
      console.log('photoAnalysis set:', !!finalResponse);
      console.log('Final response:', {
        hasAnalysis: !!finalResponse.analysis,
        suggestionsCount: finalResponse.suggestedTemplates?.length || 0
      });

    } catch (error) {
      console.log('=== ERROR ANALYZING PHOTO ===');
      console.error('Error analyzing photo:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check if it's an AbortError
      if (error.name === 'AbortError') {
        console.log('Request was aborted due to timeout');
      }
      
      // Check if it's a network error
      if (error.message === 'Network request failed') {
        console.log('This is a network connectivity issue');
        console.log('Possible causes:');
        console.log('- Expo development server not running API routes');
        console.log('- Request payload too large (current size:', payloadSize, 'bytes)');
        console.log('- Network connectivity issues');
        console.log('- CORS or other security restrictions');
        console.log('- Wrong API URL or development server not accessible');
      }
      
      // Provide fallback suggestions if API fails
      console.log('API failed, using fallback template suggestions...');
      const availableTemplates = getAvailableTemplates();
      const fallbackTemplates = availableTemplates.slice(0, 3);
      
      const fallbackResponse = {
        analysis: "Unable to analyze the photo automatically. Here are some popular template options to choose from.",
        suggestedTemplates: fallbackTemplates.map((template, index) => ({
          templateId: template.id,
          confidence: 70 - (index * 10), // Decreasing confidence
          reasoning: `${template.name} is a versatile template for ${template.purpose}`,
          suggestedName: "My Photo List",
          suggestedIcon: template.icon,
          templateData: template
        }))
      };
      
      setPhotoAnalysis(fallbackResponse);
      setIsAnalyzing(false);
      
      // Show error info for debugging
      console.log('Fallback suggestions provided. Original error:', error.message);
      console.log('=== FALLBACK COMPLETED ===');
    }
  };


  return (
    <>
      <Modal
        visible={visible && !showTemplateSuggestions}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Create New List</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <PhosphorIcon name="X" size={20} color="#666" weight="bold" />
              </Pressable>
            </View>
            
            <View style={styles.separator} />

            <View style={styles.options}>
              <Pressable style={styles.option} onPress={handleCreateManually}>
                <View style={styles.optionIcon}>
                  <PhosphorIcon name="Plus" size={32} color="#2196F3" weight="bold" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Create Manually</Text>
                  <Text style={styles.optionDescription}>
                    Choose from templates and customize your list
                  </Text>
                </View>
              </Pressable>

              <Pressable style={styles.option} onPress={handleCreateWithPhoto}>
                <View style={styles.optionIcon}>
                  <PhosphorIcon name="Camera" size={32} color="#FF9800" weight="bold" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Scan with Camera</Text>
                  <Text style={styles.optionDescription}>
                    Take a photo of a document, recipe, or collection to get smart template suggestions
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Template Suggestion Modal - Render separately to avoid nested modals */}
      <TemplateSuggestionModal
        visible={showTemplateSuggestions}
        onClose={() => {
          console.log('Closing template suggestions modal');
          setShowTemplateSuggestions(false);
          setPhotoAnalysis(null);
          setPhotoUri('');
          setIsAnalyzing(false);
        }}
        photoUri={photoUri}
        analysis={photoAnalysis?.analysis}
        suggestions={photoAnalysis?.suggestedTemplates || []}
        isLoading={isAnalyzing}
      />
    </>
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
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#E8E9EA',
    marginHorizontal: 24,
  },
  options: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E9EA',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E8E9EA',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default ListCreationOptionsModal;
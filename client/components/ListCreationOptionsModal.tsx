import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Alert, ActivityIndicator } from 'react-native';
import PhosphorIcon from './PhosphorIcon';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

interface ListCreationOptionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const ListCreationOptionsModal: React.FC<ListCreationOptionsModalProps> = ({
  visible,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

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
      setIsProcessing(true);
      
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.3, // 0-1 scale, reduce for faster processing
          base64: true, // Enable base64 encoding
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.3, // 0-1 scale, reduce for faster processing
          base64: true, // Enable base64 encoding
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Determine proper MIME type
        let mimeType = asset.type || 'image/jpeg';
        if (mimeType === 'image') {
          mimeType = 'image/jpeg';
        }
        
        console.log('Asset type from picker:', asset.type);
        console.log('Using MIME type:', mimeType);
        console.log('Base64 data available:', !!asset.base64);
        
        // Close the modal
        onClose();
        
        // Navigate immediately to the photo analysis screen
        router.push({
          pathname: '/(index)/list/new/photo-analysis',
          params: {
            photoUri: asset.uri,
            mimeType: mimeType,
            base64Image: asset.base64 || '', // Pass base64 directly
            needsBase64: 'false' // No need to process later
          }
        });
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modal}>
          {isProcessing ? (
            // Show loading state while processing
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Processing photo...</Text>
            </View>
          ) : (
            <>
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
            </>
          )}
        </View>
      </Pressable>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default ListCreationOptionsModal;
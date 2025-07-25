import React, { useState, useEffect } from 'react';
import { 
  View, 
  Pressable, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { 
  useAudioRecorder, 
  useAudioRecorderState, 
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync 
} from 'expo-audio';

interface VoiceRecordingButtonProps {
  onRecordingComplete: (audioUri: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function VoiceRecordingButton({ 
  onRecordingComplete, 
  onRecordingStart, 
  onRecordingStop,
  disabled = false,
  size = 'large'
}: VoiceRecordingButtonProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Size configurations
  const sizeConfig = {
    small: { button: 40, icon: 20, pulse: 56 },
    medium: { button: 50, icon: 22, pulse: 70 },
    large: { button: 60, icon: 24, pulse: 80 }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    // Request permissions on mount
    requestPermissions();
  }, []);

  useEffect(() => {
    // Update recording state based on recorder state
    console.log('[VoiceRecordingButton] Recorder state changed:', {
      isRecording: recorderState.isRecording,
      currentIsRecording: isRecording,
      uri: audioRecorder.uri
    });
    
    if (recorderState.isRecording !== isRecording) {
      setIsRecording(recorderState.isRecording);
      
      if (recorderState.isRecording) {
        console.log('[VoiceRecordingButton] Recording started');
        onRecordingStart?.();
        startPulseAnimation();
      } else {
        console.log('[VoiceRecordingButton] Recording stopped');
        onRecordingStop?.();
        stopPulseAnimation();
        
        // If we have a recording URI, notify parent
        if (audioRecorder.uri) {
          console.log('[VoiceRecordingButton] Calling onRecordingComplete with URI:', audioRecorder.uri);
          onRecordingComplete(audioRecorder.uri);
        } else {
          console.log('[VoiceRecordingButton] No recording URI available');
        }
      }
    }
  }, [recorderState.isRecording, audioRecorder.uri]);

  const requestPermissions = async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      setHasPermission(granted);
      
      if (granted) {
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      }
    } catch (error) {
      console.error('Permission error:', error);
      setHasPermission(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = async () => {
    console.log('[VoiceRecordingButton] Press in - hasPermission:', hasPermission, 'disabled:', disabled);
    if (!hasPermission || disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    try {
      console.log('[VoiceRecordingButton] Preparing to record...');
      await audioRecorder.prepareToRecordAsync();
      console.log('[VoiceRecordingButton] Starting recording...');
      audioRecorder.record();
    } catch (error) {
      console.error('[VoiceRecordingButton] Recording start error:', error);
    }
  };

  const handlePressOut = async () => {
    console.log('[VoiceRecordingButton] Press out - hasPermission:', hasPermission, 'disabled:', disabled);
    if (!hasPermission || disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    try {
      console.log('[VoiceRecordingButton] Stopping recording...');
      await audioRecorder.stop();
      console.log('[VoiceRecordingButton] Recording stopped, URI:', audioRecorder.uri);
    } catch (error) {
      console.error('[VoiceRecordingButton] Recording stop error:', error);
    }
  };

  if (!hasPermission) {
    return (
      <Pressable style={styles.disabledButton} onPress={requestPermissions}>
        <Feather name="mic-off" size={24} color="#9CA3AF" />
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {isRecording && (
        <Animated.View 
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              width: config.pulse,
              height: config.pulse,
              borderRadius: config.pulse / 2,
            }
          ]} 
        />
      )}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <Pressable
          style={[
            styles.button,
            isRecording && styles.recordingButton,
            disabled && styles.disabledButton,
            {
              width: config.button,
              height: config.button,
              borderRadius: config.button / 2,
            }
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          <Feather 
            name={isRecording ? "square" : "mic"} 
            size={config.icon} 
            color={disabled ? "#9CA3AF" : "#FFFFFF"} 
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    position: 'relative',
    zIndex: 2,
  },
  button: {
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordingButton: {
    backgroundColor: '#F44336',
    shadowColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0.1,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#F44336',
    opacity: 0.6,
    zIndex: 1,
  },
});
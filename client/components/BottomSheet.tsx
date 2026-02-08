import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Style applied to the content container (the white card). */
  contentStyle?: StyleProp<ViewStyle>;
  /** How far (in px) the sheet travels upward. Defaults to SCREEN_HEIGHT * 0.6. */
  slideDistance?: number;
  /** Backdrop color. Defaults to 'rgba(0, 0, 0, 0.5)'. */
  backdropColor?: string;
  /** Whether the backdrop press dismisses the sheet. Defaults to true. */
  backdropDismiss?: boolean;
}

/**
 * Reusable bottom-sheet wrapper that fades in the backdrop independently
 * while sliding the content card up from the bottom, avoiding the jarring
 * "sliding black overlay" effect of `<Modal animationType="slide">`.
 */
const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  contentStyle,
  slideDistance = SCREEN_HEIGHT * 0.6,
  backdropColor = 'rgba(0, 0, 0, 0.5)',
  backdropDismiss = true,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade backdrop and slide content in parallel
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [slideDistance, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop - fades independently */}
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: backdropColor, opacity: backdropAnim },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={backdropDismiss ? onClose : undefined}
          />
        </Animated.View>

        {/* Content - slides up independently */}
        <Animated.View
          style={[
            styles.content,
            contentStyle,
            { transform: [{ translateY }] },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
});

export default BottomSheet;

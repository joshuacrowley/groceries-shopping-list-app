import React, { useState, useEffect } from 'react';
import { Animated, View } from 'react-native';
import PhosphorIcon from './PhosphorIcon';

interface DynamicIconProps {
  iconName: string;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

const DynamicIcon: React.FC<DynamicIconProps> = ({
  iconName,
  size = 24,
  color = '#000000',
  weight = 'regular',
  ...props
}) => {
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Reset opacity when icon changes
    opacityAnim.setValue(0);
    
    // Animate opacity in
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [iconName, opacityAnim]);

  return (
    <Animated.View style={{ opacity: opacityAnim }}>
      <PhosphorIcon 
        name={iconName}
        size={size} 
        color={color} 
        weight={weight} 
      />
    </Animated.View>
  );
};

export default DynamicIcon;
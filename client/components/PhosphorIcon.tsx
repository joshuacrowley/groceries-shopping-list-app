import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as PhosphorIcons from 'phosphor-react-native';

interface PhosphorIconProps {
  name: string;
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

const PhosphorIcon: React.FC<PhosphorIconProps> = ({
  name,
  size = 24,
  color = '#000',
  weight = 'regular',
}) => {
  try {
    // First character to uppercase for proper naming convention
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
    
    // Get the icon from phosphor-react-native
    const IconComponent = (PhosphorIcons as any)[formattedName];
    
    if (!IconComponent) {
      console.warn(`Icon '${formattedName}' not found in Phosphor Icons, using fallback`);
      const FallbackIcon = PhosphorIcons.List;
      return (
        <View style={styles.container}>
          <FallbackIcon size={size} color={color} weight={weight} />
        </View>
      );
    }
    
    return (
      <View style={styles.container}>
        <IconComponent size={size} color={color} weight={weight} />
      </View>
    );
  } catch (error) {
    console.error(`Error rendering icon ${name}:`, error);
    
    // Fallback to List icon
    const FallbackIcon = PhosphorIcons.List;
    return (
      <View style={styles.container}>
        <FallbackIcon size={size} color={color} weight={weight} />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PhosphorIcon;
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import PhosphorIcon from './PhosphorIcon';
import DynamicIcon from './DynamicIcon';

// Common icons to test
const testIcons = [
  'List', 
  'CheckCircle', 
  'ClipboardText', 
  'ShoppingCart', 
  'Apple', 
  'Carrot', 
  'Fish',
  'CookingPot',
  'Coffee',
  'Hamburger',
  'Pizza',
  'Bread'
];

const IconTest = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Phosphor Icons Test</Text>
      
      <Text style={styles.subtitle}>Direct PhosphorIcon Usage</Text>
      <View style={styles.iconGrid}>
        {testIcons.map(icon => (
          <View key={icon} style={styles.iconContainer}>
            <PhosphorIcon name={icon} size={32} color="#2196F3" />
            <Text style={styles.iconLabel}>{icon}</Text>
          </View>
        ))}
      </View>
      
      <Text style={styles.subtitle}>DynamicIcon Usage</Text>
      <View style={styles.iconGrid}>
        {testIcons.map(icon => (
          <View key={icon} style={styles.iconContainer}>
            <DynamicIcon iconName={icon} size={32} color="#4CAF50" />
            <Text style={styles.iconLabel}>{icon}</Text>
          </View>
        ))}
      </View>
      
      <Text style={styles.subtitle}>Different Weights</Text>
      <View style={styles.weightContainer}>
        {['thin', 'light', 'regular', 'bold', 'fill'].map(weight => (
          <View key={weight} style={styles.weightItem}>
            <PhosphorIcon 
              name="ShoppingCart" 
              size={32} 
              color="#9C27B0" 
              weight={weight as any} 
            />
            <Text style={styles.weightLabel}>{weight}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#212121',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    color: '#424242',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  iconLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  weightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginVertical: 16,
  },
  weightItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    width: '18%',
  },
  weightLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
});

export default IconTest;
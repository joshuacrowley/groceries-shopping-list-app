import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import ListCreationForm from '@/components/ListCreationForm';

export default function NewListScreen() {
  const handleComplete = (listId) => {
    if (listId) {
      router.push(`/(index)/list/${listId}`);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Feather name="x" size={24} color="#757575" />
        </Pressable>
      </View>
      
      <ListCreationForm onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    padding: 8,
  },
});
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import IconTest from '../components/IconTest';

export default function IconTestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <IconTest />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
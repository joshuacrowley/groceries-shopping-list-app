import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { useAddRowCallback } from 'tinybase/ui-react';
import ListsNavigator from '@/components/ListsNavigator';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ListsScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const addList = useAddRowCallback(
    'lists',
    () => ({
      name: "New List",
      purpose: "A simple, flexible todo list for all your tasks and ideas",
      icon: '',
      iconName: 'ListChecks',
      backgroundColour: 'blue',
      type: 'Home',
      systemPrompt: '',
      template: 'Basic',
      code: '',
      number: 117,
    }),
    []
  );

  const handleCreateList = () => {
    const listId = addList();
    router.push(`/(index)/list/${listId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={backgroundColor} />
      <ListsNavigator onCreateList={handleCreateList} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
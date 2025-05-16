import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { useAddRowCallback } from 'tinybase/ui-react';
import { BACKGROUND_COLOUR, LIST_TYPE } from '@/stores/schema';

const ListCreationForm = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [icon, setIcon] = useState('📝');
  const [backgroundColour, setBackgroundColour] = useState('blue');
  const [listType, setListType] = useState('Info');

  const addList = useAddRowCallback(
    'lists',
    (listName) => ({
      name: listName,
      purpose: purpose,
      icon: icon,
      backgroundColour: backgroundColour,
      type: listType,
      systemPrompt: '',
      template: '',
      code: '',
    }),
    [purpose, icon, backgroundColour, listType]
  );

  const handleCreate = () => {
    if (name.trim() === '') return;
    
    const listId = addList(name);
    onComplete?.(listId);
  };

  const renderColorOption = (color) => {
    const colorMap = {
      blue: '#2196F3',
      green: '#4CAF50',
      red: '#F44336',
      yellow: '#FFC107',
      purple: '#9C27B0'
    };
    
    return (
      <Pressable 
        key={color}
        style={[styles.colorOption, { 
          backgroundColor: colorMap[color],
          borderWidth: backgroundColour === color ? 3 : 0,
          borderColor: '#000'
        }]}
        onPress={() => setBackgroundColour(color)}
      />
    );
  };

  const renderListTypeOption = (type) => {
    return (
      <Pressable 
        key={type}
        style={[styles.listTypeOption, { 
          backgroundColor: listType === type ? '#E3F2FD' : '#FFFFFF',
          borderColor: listType === type ? '#2196F3' : '#E0E0E0'
        }]}
        onPress={() => setListType(type)}
      >
        <Text style={{
          color: listType === type ? '#2196F3' : '#757575',
          fontWeight: listType === type ? 'bold' : 'normal'
        }}>{type}</Text>
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create a New List</Text>
      
      <Text style={styles.label}>List Name</Text>
      <TextInput 
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter list name"
        placeholderTextColor="#9E9E9E"
      />
      
      <Text style={styles.label}>Description</Text>
      <TextInput 
        style={[styles.input, styles.textArea]}
        value={purpose}
        onChangeText={setPurpose}
        placeholder="What is this list for?"
        placeholderTextColor="#9E9E9E"
        multiline
        numberOfLines={3}
      />
      
      <Text style={styles.label}>Icon</Text>
      <TextInput 
        style={styles.iconInput}
        value={icon}
        onChangeText={setIcon}
        maxLength={2}
      />
      
      <Text style={styles.label}>Background Color</Text>
      <View style={styles.colorOptions}>
        {BACKGROUND_COLOUR.map(renderColorOption)}
      </View>
      
      <Text style={styles.label}>List Type</Text>
      <View style={styles.listTypeOptions}>
        {LIST_TYPE.map(renderListTypeOption)}
      </View>
      
      <Pressable style={styles.createButton} onPress={handleCreate}>
        <Text style={styles.createButtonText}>Create List</Text>
      </Pressable>
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
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#424242',
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconInput: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    fontSize: 24,
    textAlign: 'center',
    width: 60,
  },
  colorOptions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  listTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  listTypeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ListCreationForm;
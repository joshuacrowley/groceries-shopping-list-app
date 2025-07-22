import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DynamicIcon from './DynamicIcon';
import IconSelector from './IconSelector';
import PhosphorIcon from './PhosphorIcon';
import { randomUUID } from 'expo-crypto';
import { useAddRowCallback } from 'tinybase/ui-react';
import { BACKGROUND_COLOUR, LIST_TYPE } from '@/stores/schema';

const ListCreationForm = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [iconName, setIconName] = useState('ClipboardText');
  const [useEmoji, setUseEmoji] = useState(true);
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [backgroundColour, setBackgroundColour] = useState('blue');
  const [listType, setListType] = useState('Info');

  const addList = useAddRowCallback(
    'lists',
    (listName) => ({
      name: listName,
      purpose: purpose,
      icon: useEmoji ? emoji : '',
      iconName: useEmoji ? '' : iconName,
      backgroundColour: backgroundColour,
      type: listType,
      systemPrompt: '',
      template: '',
      code: '',
    }),
    [purpose, emoji, iconName, useEmoji, backgroundColour, listType]
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

  // Map list types to icons for type selection
  const typeToIconMap = {
    'Shopping': 'ShoppingCart',
    'Today': 'CalendarCheck',
    'Recipes': 'CookingPot',
    'Meals': 'ForkKnife',
    'Weekend': 'Sunglasses',
    'Info': 'Info',
    'General': 'ClipboardText',
    'Home': 'House',
    'Health': 'HeartPulse',
    'Work': 'Briefcase'
  };

  const renderListTypeOption = (type) => {
    return (
      <Pressable 
        key={type}
        style={[styles.listTypeOption, { 
          backgroundColor: listType === type ? '#E3F2FD' : '#FFFFFF',
          borderColor: listType === type ? '#2196F3' : '#E0E0E0'
        }]}
        onPress={() => {
          setListType(type);
          // Auto-set the icon based on type if using icons (not emoji)
          if (!useEmoji) {
            setIconName(typeToIconMap[type] || 'ClipboardText');
          }
        }}
      >
        <View style={styles.listTypeIconContainer}>
          <DynamicIcon 
            iconName={typeToIconMap[type] || 'ClipboardText'}
            size={18}
            color={listType === type ? '#2196F3' : '#757575'}
          />
        </View>
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
      <View style={styles.iconSelector}>
        <Pressable 
          style={[styles.iconTypeToggle, useEmoji ? styles.iconTypeSelected : {}]}
          onPress={() => setUseEmoji(true)}
        >
          <Text style={styles.iconTypeText}>Emoji</Text>
        </Pressable>
        <Pressable 
          style={[styles.iconTypeToggle, !useEmoji ? styles.iconTypeSelected : {}]}
          onPress={() => setUseEmoji(false)}
        >
          <Text style={styles.iconTypeText}>Icon</Text>
        </Pressable>
      </View>
      
      {useEmoji ? (
        <TextInput 
          style={styles.iconInput}
          value={emoji}
          onChangeText={setEmoji}
          maxLength={2}
        />
      ) : (
        <Pressable 
          style={styles.iconPickerButton}
          onPress={() => setIsIconSelectorOpen(true)}
        >
          <View style={styles.selectedIcon}>
            <DynamicIcon iconName={iconName} size={28} color="#424242" />
          </View>
          <Text style={styles.iconPickerText}>{iconName}</Text>
          <Feather name="chevron-right" size={18} color="#757575" />
        </Pressable>
      )}
      
      <IconSelector 
        isOpen={isIconSelectorOpen}
        onClose={() => setIsIconSelectorOpen(false)}
        onSelectIcon={setIconName}
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
  iconSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconTypeToggle: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconTypeSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  iconTypeText: {
    fontWeight: '500',
    color: '#424242',
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
  iconPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  selectedIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconPickerText: {
    flex: 1,
    fontSize: 16,
    color: '#424242',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  listTypeIconContainer: {
    marginRight: 6,
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
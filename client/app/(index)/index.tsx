import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, SafeAreaView, ScrollView, StatusBar, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore, useRowIds, useAddRowCallback, useRow } from 'tinybase/ui-react';
import { useOrganization, useAuth, useUser, useClerk } from '@clerk/clerk-expo';
import TodoList from '@/Basic';
import ListItem from '@/components/ListItem';
import VoiceModal from '@/components/VoiceModal';
import ListCreationOptionsModal from '@/components/ListCreationOptionsModal';
import { LIST_TYPE } from '@/stores/schema';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState(null);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'todos'>('name');
  const { organization } = useOrganization();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  // Animation for voice button
  const voiceButtonScale = useRef(new Animated.Value(1)).current;
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  
  // Theme colors
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  
  // Custom theme-aware colors
  const containerBg = isDark ? '#1a1a1a' : '#F8F9FA';
  const cardBg = isDark ? '#2d2d2d' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB';
  const primaryText = isDark ? '#ffffff' : '#1F2937';
  const secondaryText = isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280';
  const tertiaryText = isDark ? 'rgba(255, 255, 255, 0.5)' : '#666666';
  const chipBg = isDark ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6';
  const primaryBlue = isDark ? '#64B5F6' : '#2196F3';
  const primaryGreen = isDark ? '#81C784' : '#4CAF50';
  const lightBlue = isDark ? 'rgba(100, 181, 246, 0.15)' : '#E3F2FD';
  const lightGreen = isDark ? 'rgba(129, 199, 132, 0.15)' : '#ECFDF5';
  const lightRed = isDark ? 'rgba(239, 154, 154, 0.15)' : '#FEF2F2';
  const greenText = isDark ? '#81C784' : '#059669';
  const redText = isDark ? '#EF9A9A' : '#DC2626';
  const blueText = isDark ? '#64B5F6' : '#2563EB';
  const emptyStateIconBg = isDark ? 'rgba(100, 181, 246, 0.2)' : '#E3F2FD';
  const shadowColor = isDark ? 'transparent' : '#000';
  
  // Get lists from the store
  const store = useStore();
  const listIds = useRowIds('lists') || [];
  
  // Get all todos and lists for voice context
  const allLists = {};
  const allTodos = {};
  
  // Build lists data
  listIds.forEach(listId => {
    const listData = store?.getRow('lists', listId);
    if (listData) {
      allLists[listId] = listData;
    }
  });
  
  // Build todos data - get all todos from all stores
  const todoIds = store?.getRowIds('todos') || [];
  todoIds.forEach(todoId => {
    const todoData = store?.getRow('todos', todoId);
    if (todoData) {
      allTodos[todoId] = todoData;
    }
  });
  
  const contextData = {
    lists: allLists,
    todos: allTodos,
  };

  // Filter and sort lists
  const filteredAndSortedLists = useMemo(() => {
    let filtered = listIds.filter(listId => {
      const listData = store?.getRow('lists', listId);
      if (!listData || listData.type === 'Offload') return false;
      
      if (selectedTopic === 'All') return true;
      return listData.type === selectedTopic;
    });

    // Sort lists
    filtered.sort((a, b) => {
      const listA = store?.getRow('lists', a);
      const listB = store?.getRow('lists', b);
      
      if (!listA || !listB) return 0;
      
      if (sortBy === 'name') {
        return String(listA.name).localeCompare(String(listB.name));
      } else {
        // Sort by todo count - get todos for each list
        const todosA = store?.getRowIds('todos')?.filter(todoId => 
          store?.getRow('todos', todoId)?.list === a
        )?.length || 0;
        const todosB = store?.getRowIds('todos')?.filter(todoId => 
          store?.getRow('todos', todoId)?.list === b
        )?.length || 0;
        return todosB - todosA; // Descending order
      }
    });

    return filtered;
  }, [listIds, selectedTopic, sortBy, store]);
  
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
  
  // Set loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Fade in the instruction text after loading
      Animated.timing(instructionOpacity, {
        toValue: 1,
        duration: 500,
        delay: 500,
        useNativeDriver: true,
      }).start();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const renderListItem = ({ item: listId }) => {
    return <ListItem listId={listId} onPress={handleListPress} />;
  };

  const handleCreateList = () => {
    console.log('[index.tsx] Opening create list modal');
    setCreateModalVisible(true);
  };
  
  const handleListPress = (listId) => {
    router.push(`/(index)/list/${listId}`);
  };
  

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)');
  };

  const handleProfile = () => {
    router.push('/(index)/profile');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: containerBg }]}>
        <ActivityIndicator size="large" color={primaryBlue} />
        <Text style={[styles.loadingText, { color: secondaryText }]}>Loading your lists...</Text>
      </SafeAreaView>
    );
  }

  // We now use routing instead of selectedListId state

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={containerBg}
      />
      {/* Header */}
      <View style={[styles.orgHeader, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.orgName, { color: primaryText }]}>{organization?.name || 'My Lists'}</Text>
        <View style={styles.headerButtons}>
          {isSignedIn ? (
            <Pressable onPress={handleProfile} style={[styles.profileButton, { backgroundColor: lightGreen, borderColor: isDark ? 'transparent' : '#D1FAE5' }]}>
              <Feather name="user" size={16} color={greenText} />
              <Text style={[styles.profileButtonText, { color: greenText }]}>Profile</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleSignIn} style={[styles.signInButton, { backgroundColor: lightBlue, borderColor: isDark ? 'transparent' : '#DBEAFE' }]}>
              <Feather name="log-in" size={16} color={blueText} />
              <Text style={[styles.signInButtonText, { color: blueText }]}>Sign In</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Primary Voice Interface */}
      <View style={[styles.voiceSection, { backgroundColor: cardBg }]}>
        <Animated.View
          style={{
            transform: [{ scale: voiceButtonScale }]
          }}
        >
          <Pressable
            style={[styles.primaryVoiceButton, { backgroundColor: primaryGreen, shadowColor: isDark ? 'transparent' : primaryGreen }]}
            onPressIn={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              // Animate button scale down
              Animated.spring(voiceButtonScale, {
                toValue: 0.95,
                useNativeDriver: true,
                speed: 50,
                bounciness: 0,
              }).start();
              
              setVoiceModalVisible(true);
            }}
            onPressOut={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              
              // Animate button scale back to normal
              Animated.spring(voiceButtonScale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 50,
                bounciness: 10,
              }).start();
              
              setVoiceModalVisible(false);
            }}
          >
            <Feather name="mic" size={32} color="#FFFFFF" />
            <Text style={styles.voiceButtonText}>Ask me anything</Text>
          </Pressable>
        </Animated.View>
        <Animated.Text 
          style={[
            styles.voiceInstructions, 
            { 
              color: secondaryText,
              opacity: instructionOpacity,
            }
          ]}
        >
          Press and hold to talk
        </Animated.Text>
      </View>

      {/* Topic Filters */}
      <View style={[styles.filtersSection, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.filtersTitle, { color: primaryText }]}>Topics</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicFilters}
        >
          <Pressable 
            style={[styles.topicChip, { backgroundColor: selectedTopic === 'All' ? primaryBlue : chipBg }]}
            onPress={() => setSelectedTopic('All')}
          >
            <Text style={[styles.topicText, { color: selectedTopic === 'All' ? '#FFFFFF' : secondaryText }]}>All</Text>
          </Pressable>
          {LIST_TYPE.map(topic => (
            <Pressable 
              key={topic}
              style={[styles.topicChip, { backgroundColor: selectedTopic === topic ? primaryBlue : chipBg }]}
              onPress={() => setSelectedTopic(topic)}
            >
              <Text style={[styles.topicText, { color: selectedTopic === topic ? '#FFFFFF' : secondaryText }]}>{topic}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Sort Controls */}
      <View style={[styles.sortSection, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Pressable 
          style={[styles.sortButton, { backgroundColor: sortBy === 'name' ? lightBlue : chipBg }]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.sortText, { color: sortBy === 'name' ? blueText : secondaryText }]}>A-Z</Text>
        </Pressable>
        <Pressable 
          style={[styles.sortButton, { backgroundColor: sortBy === 'todos' ? lightBlue : chipBg }]}
          onPress={() => setSortBy('todos')}
        >
          <Text style={[styles.sortText, { color: sortBy === 'todos' ? blueText : secondaryText }]}>To-dos</Text>
        </Pressable>
      </View>
      
      {/* Lists */}
      {listIds.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateCard, { backgroundColor: cardBg, shadowColor }]}>
            <View style={[styles.emptyStateIcon, { backgroundColor: emptyStateIconBg }]}>
              <Feather name="list" size={36} color={primaryBlue} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: primaryText }]}>Welcome to Lists!</Text>
            <Text style={[styles.emptyStateDesc, { color: tertiaryText }]}>
              Organize your shopping with smart lists that sync across all your devices
            </Text>
            <Pressable style={[styles.createButton, { backgroundColor: primaryBlue, shadowColor: isDark ? 'transparent' : primaryBlue }]} onPress={handleCreateList}>
              <Text style={styles.createButtonText}>Create Your First List</Text>
            </Pressable>
          </View>
        </View>
      ) : filteredAndSortedLists.length === 0 ? (
        <View style={styles.emptyFilterState}>
          <Text style={[styles.emptyFilterText, { color: secondaryText }]}>No {selectedTopic} lists found</Text>
          <Pressable style={[styles.createButton, { backgroundColor: primaryBlue, shadowColor: isDark ? 'transparent' : primaryBlue }]} onPress={handleCreateList}>
            <Text style={styles.createButtonText}>Create New List</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedLists}
          renderItem={renderListItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Floating Create List Button */}
      <Pressable
        style={[styles.floatingCreateButton, { backgroundColor: primaryBlue, shadowColor: isDark ? 'transparent' : primaryBlue }]}
        onPress={handleCreateList}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
      
      {/* Voice Modal */}
      <VoiceModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        contextData={contextData}
      />

      {/* List Creation Options Modal */}
      <ListCreationOptionsModal
        visible={createModalVisible}
        onClose={() => {
          console.log('[index.tsx] Closing create list modal');
          setCreateModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  orgHeader: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  orgName: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  navButtonText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  profileButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signOutButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  signInButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signInButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 320,
    width: '100%',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  // Voice Interface
  voiceSection: {
    padding: 20,
    alignItems: 'center',
  },
  primaryVoiceButton: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 200,
    justifyContent: 'center',
  },
  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  voiceInstructions: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },

  // Topic Filters
  filtersSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  topicFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  topicChipActive: {
    // Dynamic styles applied inline
  },
  topicText: {
    fontSize: 14,
    fontWeight: '500',
  },
  topicTextActive: {
    // Dynamic styles applied inline
  },

  // Sort Controls
  sortSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortButtonActive: {
    // Dynamic styles applied inline
  },
  sortText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortTextActive: {
    // Dynamic styles applied inline
  },

  // Empty Filter State
  emptyFilterState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyFilterText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },

  // Floating Create Button
  floatingCreateButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
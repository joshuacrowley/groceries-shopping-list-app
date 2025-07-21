import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore, useRowIds, useAddRowCallback, useRow } from 'tinybase/ui-react';
import { useOrganization, useAuth, useUser, useClerk } from '@clerk/clerk-expo';
import TodoList from '@/Basic';
import ListItem from '@/components/ListItem';
import VoiceModal from '@/components/VoiceModal';
import { LIST_TYPE } from '@/stores/schema';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState(null);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'todos'>('name');
  const { organization } = useOrganization();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  
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
        return listA.name.localeCompare(listB.name);
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
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const renderListItem = ({ item: listId }) => {
    return <ListItem listId={listId} onPress={handleListPress} />;
  };

  const handleCreateList = () => {
    const listId = addList();
    router.push(`/(index)/list/${listId}`);
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your lists...</Text>
      </SafeAreaView>
    );
  }

  // We now use routing instead of selectedListId state

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.orgHeader}>
        <Text style={styles.orgName}>{organization?.name || 'My Lists'}</Text>
        <View style={styles.headerButtons}>
          {isSignedIn ? (
            <Pressable onPress={handleProfile} style={styles.profileButton}>
              <Feather name="user" size={16} color="#059669" />
              <Text style={styles.profileButtonText}>Profile</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleSignIn} style={styles.signInButton}>
              <Feather name="log-in" size={16} color="#2563EB" />
              <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Primary Voice Interface */}
      <View style={styles.voiceSection}>
        <Pressable
          style={styles.primaryVoiceButton}
          onPress={() => setVoiceModalVisible(true)}
        >
          <Feather name="mic" size={32} color="#FFFFFF" />
          <Text style={styles.voiceButtonText}>Ask me anything</Text>
        </Pressable>
      </View>

      {/* Topic Filters */}
      <View style={styles.filtersSection}>
        <Text style={styles.filtersTitle}>Topics</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicFilters}
        >
          <Pressable 
            style={[styles.topicChip, selectedTopic === 'All' && styles.topicChipActive]}
            onPress={() => setSelectedTopic('All')}
          >
            <Text style={[styles.topicText, selectedTopic === 'All' && styles.topicTextActive]}>All</Text>
          </Pressable>
          {LIST_TYPE.map(topic => (
            <Pressable 
              key={topic}
              style={[styles.topicChip, selectedTopic === topic && styles.topicChipActive]}
              onPress={() => setSelectedTopic(topic)}
            >
              <Text style={[styles.topicText, selectedTopic === topic && styles.topicTextActive]}>{topic}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Sort Controls */}
      <View style={styles.sortSection}>
        <Pressable 
          style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.sortText, sortBy === 'name' && styles.sortTextActive]}>A-Z</Text>
        </Pressable>
        <Pressable 
          style={[styles.sortButton, sortBy === 'todos' && styles.sortButtonActive]}
          onPress={() => setSortBy('todos')}
        >
          <Text style={[styles.sortText, sortBy === 'todos' && styles.sortTextActive]}>To-dos</Text>
        </Pressable>
      </View>
      
      {/* Lists */}
      {listIds.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyStateIcon}>
              <Feather name="list" size={36} color="#2196F3" />
            </View>
            <Text style={styles.emptyStateTitle}>Welcome to Lists!</Text>
            <Text style={styles.emptyStateDesc}>
              Organize your shopping with smart lists that sync across all your devices
            </Text>
            <Pressable style={styles.createButton} onPress={handleCreateList}>
              <Text style={styles.createButtonText}>Create Your First List</Text>
            </Pressable>
          </View>
        </View>
      ) : filteredAndSortedLists.length === 0 ? (
        <View style={styles.emptyFilterState}>
          <Text style={styles.emptyFilterText}>No {selectedTopic} lists found</Text>
          <Pressable style={styles.createButton} onPress={handleCreateList}>
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
        style={styles.floatingCreateButton}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orgName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
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
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileButtonText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 14,
  },
  signOutButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signOutButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  signInButtonText: {
    color: '#2563EB',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
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
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#2196F3',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  primaryVoiceButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#4CAF50',
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

  // Topic Filters
  filtersSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  topicFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  topicChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  topicChipActive: {
    backgroundColor: '#2196F3',
  },
  topicText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  topicTextActive: {
    color: '#FFFFFF',
  },

  // Sort Controls
  sortSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  sortButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  sortTextActive: {
    color: '#2563EB',
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
    color: '#6B7280',
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
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
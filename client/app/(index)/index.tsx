import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore, useRowIds } from 'tinybase/ui-react';
import { useOrganization } from '@clerk/clerk-expo';
import TodoList from '@/Basic';
import ListItem from '@/components/ListItem';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState(null);
  const { organization } = useOrganization();
  
  // Get lists from the store
  const store = useStore();
  const listIds = useRowIds('lists') || [];
  
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
    router.push('/(index)/list/new');
  };
  
  const handleListPress = (listId) => {
    router.push(`/(index)/list/${listId}`);
  };
  
  const goToTestScreen = () => {
    router.push('/(index)/test');
  };
  
  const goToListsScreen = () => {
    router.push('/(index)/lists');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your lists...</Text>
      </View>
    );
  }

  // We now use routing instead of selectedListId state

  return (
    <View style={styles.container}>
      <View style={styles.orgHeader}>
        <Text style={styles.orgName}>{organization?.name || 'My Lists'}</Text>
        <View style={styles.headerButtons}>
          <Pressable onPress={goToListsScreen} style={styles.navButton}>
            <Text style={styles.navButtonText}>All Lists</Text>
          </Pressable>
          <Pressable onPress={goToTestScreen} style={styles.testButton}>
            <Text style={styles.testButtonText}>Test</Text>
          </Pressable>
        </View>
      </View>
      
      {listIds.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="list" size={48} color="#BDBDBD" />
          <Text style={styles.emptyStateTitle}>No lists yet</Text>
          <Text style={styles.emptyStateDesc}>Create your first list to get started</Text>
          <Pressable style={styles.createButton} onPress={handleCreateList}>
            <Text style={styles.createButtonText}>Create List</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listIds}
          renderItem={renderListItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Your Lists</Text>
              <Pressable style={styles.addButton} onPress={handleCreateList}>
                <Feather name="plus" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
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
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orgName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212121',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  navButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  testButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  listContainer: {
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
  },
  addButton: {
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 16,
  },
  emptyStateDesc: {
    fontSize: 16,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
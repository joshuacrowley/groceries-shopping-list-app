import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore, useRowIds, useAddRowCallback } from 'tinybase/ui-react';
import { useOrganization, useAuth, useUser, useClerk } from '@clerk/clerk-expo';
import TodoList from '@/Basic';
import ListItem from '@/components/ListItem';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListId, setSelectedListId] = useState(null);
  const { organization } = useOrganization();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  // Get lists from the store
  const store = useStore();
  const listIds = useRowIds('lists') || [];
  
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
      <View style={styles.orgHeader}>
        <Text style={styles.orgName}>{organization?.name || 'My Lists'}</Text>
        <View style={styles.headerButtons}>
          {isSignedIn ? (
            <>
              <Pressable onPress={handleProfile} style={styles.profileButton}>
                <Feather name="user" size={16} color="#059669" />
                <Text style={styles.profileButtonText}>Profile</Text>
              </Pressable>
              <Pressable onPress={handleSignOut} style={styles.signOutButton}>
                <Feather name="log-out" size={16} color="#DC2626" />
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={handleSignIn} style={styles.signInButton}>
              <Feather name="log-in" size={16} color="#2563EB" />
              <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>
          )}
        </View>
      </View>
      
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
});
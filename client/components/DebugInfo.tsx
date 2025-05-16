import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useUser, useOrganization, useAuth } from '@clerk/clerk-expo';
import { useStore, useRowIds } from 'tinybase/ui-react';
import Constants from 'expo-constants';

const DebugInfo = () => {
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { isLoaded: orgLoaded, organization } = useOrganization();
  const { getToken } = useAuth();
  const store = useStore();
  const listIds = useRowIds('lists') || [];
  
  // Get server URL from environment
  const serverUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SYNC_SERVER_URL || 'Not set';
  
  const [expanded, setExpanded] = React.useState(false);
  
  if (!expanded) {
    return (
      <Pressable 
        style={styles.debugButton} 
        onPress={() => setExpanded(true)}
      >
        <Text style={styles.debugButtonText}>Show Debug Info</Text>
      </Pressable>
    );
  }
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.heading}>Clerk Auth Status</Text>
        <Text style={styles.text}>User Loaded: {userLoaded ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Signed In: {isSignedIn ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>User ID: {user?.id || 'None'}</Text>
        <Text style={styles.text}>User Email: {user?.primaryEmailAddress?.emailAddress || 'None'}</Text>
        
        <Text style={styles.heading}>Organization Status</Text>
        <Text style={styles.text}>Org Loaded: {orgLoaded ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Organization ID: {organization?.id || 'None'}</Text>
        <Text style={styles.text}>Organization Name: {organization?.name || 'None'}</Text>
        
        <Text style={styles.heading}>TinyBase Store Status</Text>
        <Text style={styles.text}>List Count: {listIds.length}</Text>
        <Text style={styles.text}>List IDs: {listIds.join(', ') || 'None'}</Text>
        
        <Text style={styles.heading}>Environment</Text>
        <Text style={styles.text}>Server URL: {serverUrl}</Text>
        <Text style={styles.text}>Environment: {process.env.NODE_ENV || 'Not set'}</Text>
        
        <Pressable 
          style={styles.testButton}
          onPress={async () => {
            try {
              const token = await getToken();
              console.log('Token:', token ? 'Available' : 'Not available');
              alert('Token: ' + (token ? 'Available' : 'Not available'));
            } catch (e) {
              console.error('Error getting token:', e);
              alert('Error getting token: ' + e.message);
            }
          }}
        >
          <Text style={styles.testButtonText}>Test Get Token</Text>
        </Pressable>
      </ScrollView>
      
      <Pressable 
        style={styles.closeButton} 
        onPress={() => setExpanded(false)}
      >
        <Text style={styles.closeButtonText}>Hide Debug Info</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingBottom: 20,
    zIndex: 100,
    maxHeight: '80%'
  },
  scrollView: {
    padding: 12,
    maxHeight: 400,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 12,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  closeButton: {
    backgroundColor: '#F44336',
    padding: 10,
    alignItems: 'center',
    margin: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  debugButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 100,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

export default DebugInfo;
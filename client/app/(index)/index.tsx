import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, SafeAreaView, StatusBar, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useStore, useRowIds, useAddRowCallback } from 'tinybase/ui-react';
import { useOrganization, useAuth, useUser, useClerk } from '@clerk/clerk-expo';
import ListCard, { CARD_WIDTH, CARD_MARGIN } from '@/components/ListCard';
import VoiceModal from '@/components/VoiceModal';
import ListCreationOptionsModal from '@/components/ListCreationOptionsModal';
import BottomSheet from '@/components/BottomSheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { LIST_TYPE } from '@/stores/schema';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'todos'>('name');
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const { organization } = useOrganization();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  // Animation for voice button
  const voiceButtonScale = useRef(new Animated.Value(1)).current;
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0.6)).current;
  const filterDrawerAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [scrubberActive, setScrubberActive] = useState(false);
  const scrubberY = useRef(new Animated.Value(0)).current;
  const [scrubberLabel, setScrubberLabel] = useState('');
  const [listAreaHeight, setListAreaHeight] = useState(SCREEN_HEIGHT * 0.6);
  
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
      icon: 'ListChecks',
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
      
      // Gentle pulse for the "hold to speak" hint
      Animated.loop(
        Animated.sequence([
          Animated.timing(hintPulse, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(hintPulse, {
            toValue: 0.6,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Filter drawer open/close animation
  useEffect(() => {
    Animated.timing(filterDrawerAnim, {
      toValue: filterDrawerVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [filterDrawerVisible]);

  // Scrubber handler
  const handleScrubberGesture = useCallback((evt: any) => {
    const { locationY } = evt.nativeEvent;
    const clampedY = Math.max(0, Math.min(locationY, listAreaHeight));
    const ratio = clampedY / listAreaHeight;
    const index = Math.round(ratio * (filteredAndSortedLists.length - 1));
    
    if (index >= 0 && index < filteredAndSortedLists.length) {
      const listId = filteredAndSortedLists[index];
      const listData = store?.getRow('lists', listId);
      setScrubberLabel(String(listData?.name || ''));
      
      flatListRef.current?.scrollToIndex({
        index,
        animated: false,
        viewPosition: 0,
      });
    }
    
    scrubberY.setValue(clampedY);
  }, [filteredAndSortedLists, listAreaHeight, store]);

  const renderListCard = ({ item: listId }) => {
    return <ListCard listId={listId} onPress={handleListPress} />;
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
      <View style={[styles.orgHeader, { backgroundColor: containerBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.orgName, { color: primaryText }]}>{organization?.name || 'My Lists'}</Text>
        <View style={styles.headerButtons}>
          {/* Filter button with active badge */}
          <Pressable 
            onPress={() => setFilterDrawerVisible(true)} 
            style={[styles.filterButton, { backgroundColor: selectedTopic !== 'All' ? lightBlue : chipBg }]}
          >
            <Feather name="sliders" size={16} color={selectedTopic !== 'All' ? blueText : secondaryText} />
            {selectedTopic !== 'All' && (
              <Text style={[styles.filterBadgeText, { color: blueText }]}>{selectedTopic}</Text>
            )}
          </Pressable>
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
        <View 
          style={styles.listAreaWrapper} 
          onLayout={(e) => setListAreaHeight(e.nativeEvent.layout.height)}
        >
          <FlatList
            ref={flatListRef}
            data={filteredAndSortedLists}
            renderItem={renderListCard}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listCardsContainer}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
            }}
          />
          {/* Fast-scroll scrubber - only show when 5+ lists */}
          {filteredAndSortedLists.length >= 5 && (
            <View 
              style={styles.scrubberTrack}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(evt) => {
                setScrubberActive(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleScrubberGesture(evt);
              }}
              onResponderMove={(evt) => {
                handleScrubberGesture(evt);
              }}
              onResponderRelease={() => {
                setScrubberActive(false);
                setScrubberLabel('');
              }}
            >
              <View style={[styles.scrubberLine, { backgroundColor: scrubberActive ? primaryBlue : (isDark ? 'rgba(255,255,255,0.15)' : '#E5E7EB') }]} />
              {/* Scrubber thumb */}
              {scrubberActive && (
                <Animated.View 
                  style={[
                    styles.scrubberThumb,
                    { 
                      backgroundColor: primaryBlue,
                      transform: [{ translateY: Animated.subtract(scrubberY, new Animated.Value(10)) }],
                    }
                  ]}
                />
              )}
              {/* Floating label */}
              {scrubberActive && scrubberLabel !== '' && (
                <Animated.View 
                  style={[
                    styles.scrubberLabelContainer,
                    { 
                      backgroundColor: primaryBlue,
                      transform: [{ translateY: Animated.subtract(scrubberY, new Animated.Value(16)) }],
                    }
                  ]}
                >
                  <Text style={styles.scrubberLabelText} numberOfLines={1}>{scrubberLabel}</Text>
                  <View style={[styles.scrubberLabelArrow, { borderLeftColor: primaryBlue }]} />
                </Animated.View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Bottom Bar: Voice Pill + Create Button */}
      <View style={styles.bottomBar}>
        <Animated.View
          style={[
            styles.floatingVoicePill,
            { transform: [{ scale: voiceButtonScale }] }
          ]}
        >
          <Pressable
            style={[
              styles.voicePillButton,
              { 
                backgroundColor: isRecording ? primaryGreen : (isDark ? '#1F2937' : '#FFFFFF'),
                shadowColor: isDark ? 'transparent' : '#000',
                borderWidth: isRecording ? 0 : 1,
                borderColor: isRecording ? 'transparent' : (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'),
              }
            ]}
            onPressIn={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Animated.spring(voiceButtonScale, {
                toValue: 0.95,
                useNativeDriver: true,
                speed: 50,
                bounciness: 0,
              }).start();
              setVoiceModalVisible(true);
              setIsRecording(true);
            }}
            onPressOut={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Animated.spring(voiceButtonScale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 50,
                bounciness: 10,
              }).start();
              setIsRecording(false);
            }}
          >
            <View style={[styles.voicePillIcon, { backgroundColor: primaryGreen }]}>
              <Feather name="mic" size={14} color="#FFFFFF" />
            </View>
            <Text style={[
              styles.voicePillText,
              { color: isRecording ? '#FFFFFF' : secondaryText }
            ]}>
              Ask anything...
            </Text>
            <Animated.View style={[styles.holdBadge, { opacity: isRecording ? 0 : hintPulse, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }]}>
              <Feather name="radio" size={10} color={secondaryText} />
              <Text style={[styles.holdBadgeText, { color: secondaryText }]}>Hold</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Pressable
          style={[styles.floatingCreateButton, { backgroundColor: primaryBlue, shadowColor: isDark ? 'transparent' : primaryBlue }]}
          onPress={handleCreateList}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Filter Drawer */}
      <BottomSheet
        visible={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        contentStyle={[styles.drawerSheet, { backgroundColor: cardBg }]}
      >
        <View style={styles.drawerHandle} />
        <View style={styles.drawerHeader}>
          <Text style={[styles.drawerTitle, { color: primaryText }]}>Filter & Sort</Text>
          <Pressable onPress={() => setFilterDrawerVisible(false)} hitSlop={10}>
            <Feather name="x" size={20} color={secondaryText} />
          </Pressable>
        </View>

        <Text style={[styles.drawerSectionLabel, { color: secondaryText }]}>Category</Text>
        <View style={styles.drawerChipGrid}>
          <Pressable 
            style={[styles.drawerChip, { backgroundColor: selectedTopic === 'All' ? primaryBlue : chipBg }]}
            onPress={() => { setSelectedTopic('All'); setFilterDrawerVisible(false); }}
          >
            <Feather name="grid" size={14} color={selectedTopic === 'All' ? '#FFFFFF' : secondaryText} />
            <Text style={[styles.drawerChipText, { color: selectedTopic === 'All' ? '#FFFFFF' : primaryText }]}>All</Text>
          </Pressable>
          {LIST_TYPE.map(topic => (
            <Pressable 
              key={topic}
              style={[styles.drawerChip, { backgroundColor: selectedTopic === topic ? primaryBlue : chipBg }]}
              onPress={() => { setSelectedTopic(topic); setFilterDrawerVisible(false); }}
            >
              <Text style={[styles.drawerChipText, { color: selectedTopic === topic ? '#FFFFFF' : primaryText }]}>{topic}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.drawerSectionLabel, { color: secondaryText, marginTop: 20 }]}>Sort by</Text>
        <View style={styles.drawerSortRow}>
          <Pressable 
            style={[styles.drawerSortOption, { backgroundColor: sortBy === 'name' ? lightBlue : chipBg, borderColor: sortBy === 'name' ? primaryBlue : 'transparent' }]}
            onPress={() => setSortBy('name')}
          >
            <Feather name="type" size={16} color={sortBy === 'name' ? blueText : secondaryText} />
            <Text style={[styles.drawerSortText, { color: sortBy === 'name' ? blueText : primaryText }]}>Alphabetical</Text>
          </Pressable>
          <Pressable 
            style={[styles.drawerSortOption, { backgroundColor: sortBy === 'todos' ? lightBlue : chipBg, borderColor: sortBy === 'todos' ? primaryBlue : 'transparent' }]}
            onPress={() => setSortBy('todos')}
          >
            <Feather name="check-square" size={16} color={sortBy === 'todos' ? blueText : secondaryText} />
            <Text style={[styles.drawerSortText, { color: sortBy === 'todos' ? blueText : primaryText }]}>By items</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Voice Modal */}
      <VoiceModal
        visible={voiceModalVisible}
        isRecording={isRecording}
        onClose={() => {
          setVoiceModalVisible(false);
          setIsRecording(false);
        }}
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
  orgHeader: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  orgName: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterBadgeText: {
    fontSize: 13,
    fontWeight: '600',
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
  listAreaWrapper: {
    flex: 1,
    position: 'relative',
  },
  listCardsContainer: {
    paddingTop: 12,
    paddingBottom: 100,
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

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
    gap: 12,
  },
  floatingVoicePill: {
    flex: 1,
  },
  voicePillButton: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 6,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  voicePillIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voicePillText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  holdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  holdBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  floatingCreateButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  // Filter Drawer
  drawerSheet: {
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  drawerSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  drawerChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  drawerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  drawerChipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  drawerSortRow: {
    flexDirection: 'row',
    gap: 10,
  },
  drawerSortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  drawerSortText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Scrubber
  scrubberTrack: {
    position: 'absolute',
    right: 0,
    top: 12,
    bottom: 100,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrubberLine: {
    width: 3,
    height: '100%',
    borderRadius: 1.5,
  },
  scrubberThumb: {
    position: 'absolute',
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  scrubberLabelContainer: {
    position: 'absolute',
    right: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrubberLabelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  scrubberLabelArrow: {
    position: 'absolute',
    right: -6,
    top: '50%',
    marginTop: -4,
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});
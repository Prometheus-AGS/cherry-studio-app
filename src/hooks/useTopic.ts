import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { loggerService } from '@/services/LoggerService'
import { topicService } from '@/services/TopicService'
import type { Assistant, Topic } from '@/types/assistant'

const logger = loggerService.withContext('useTopic')

/**
 * Get current topic ID synchronously
 * This is used in non-React contexts where hooks cannot be used.
 */
export function getCurrentTopicId(): string {
  return topicService.getCurrentTopic()?.id || ''
}

/**
 * Get current topic object synchronously
 * This is used in non-React contexts where hooks cannot be used.
 */
export function getCurrentTopic(): Topic | null {
  return topicService.getCurrentTopic()
}

/**
 * React Hook for managing the currently active topic (Refactored with useSyncExternalStore)
 *
 * Uses TopicService with optimistic updates for zero-latency UX.
 * Integrates with React 18's useSyncExternalStore for efficient re-renders.
 *
 * @example
 * ```typescript
 * function ChatScreen() {
 *   const {
 *     currentTopic,
 *     isLoading,
 *     switchTopic,
 *     createNewTopic,
 *     renameTopic,
 *     deleteTopic
 *   } = useCurrentTopic()
 *
 *   return (
 *     <div>
 *       Current Topic: {currentTopic?.name}
 *       <button onClick={() => createNewTopic(assistant)}>New Topic</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCurrentTopic() {
  // ==================== Subscription (useSyncExternalStore) ====================

  /**
   * Subscribe to current topic changes
   */
  const subscribe = useCallback((callback: () => void) => {
    logger.verbose('Subscribing to current topic changes')
    return topicService.subscribeCurrentTopic(callback)
  }, [])

  /**
   * Get current topic snapshot (synchronous)
   */
  const getSnapshot = useCallback(() => {
    return topicService.getCurrentTopic()
  }, [])

  /**
   * Server snapshot (for SSR compatibility - not used in React Native)
   */
  const getServerSnapshot = useCallback(() => {
    return null
  }, [])

  // Use useSyncExternalStore for reactive updates
  const currentTopic = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // ==================== Loading State ====================

  /**
   * Track if we're loading the topic from database
   */
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Load current topic on mount if not cached
   */
  useEffect(() => {
    if (!currentTopic) {
      setIsLoading(true)
      topicService
        .getCurrentTopicAsync()
        .then(() => {
          setIsLoading(false)
        })
        .catch(error => {
          logger.error('Failed to load current topic:', error as Error)
          setIsLoading(false)
        })
    }
  }, [currentTopic])

  // ==================== Action Methods ====================

  /**
   * Switch to a different topic (optimistic)
   */
  const switchTopic = useCallback(async (topicId: string) => {
    try {
      await topicService.switchToTopic(topicId)
    } catch (error) {
      logger.error('Failed to switch topic:', error as Error)
      throw error
    }
  }, [])

  /**
   * Create a new topic (optimistic)
   */
  const createNewTopic = useCallback(async (assistant: Assistant) => {
    try {
      const newTopic = await topicService.createTopic(assistant)
      // Automatically switch to the new topic
      await topicService.switchToTopic(newTopic.id)
      return newTopic
    } catch (error) {
      logger.error('Failed to create new topic:', error as Error)
      throw error
    }
  }, [])

  /**
   * Rename current topic (optimistic)
   */
  const renameTopic = useCallback(
    async (newName: string) => {
      if (!currentTopic) {
        throw new Error('No current topic to rename')
      }
      try {
        await topicService.renameTopic(currentTopic.id, newName)
      } catch (error) {
        logger.error('Failed to rename current topic:', error as Error)
        throw error
      }
    },
    [currentTopic]
  )

  /**
   * Delete current topic (optimistic)
   */
  const deleteTopic = useCallback(async () => {
    if (!currentTopic) {
      throw new Error('No current topic to delete')
    }
    try {
      await topicService.deleteTopic(currentTopic.id)
    } catch (error) {
      logger.error('Failed to delete current topic:', error as Error)
      throw error
    }
  }, [currentTopic])

  // ==================== Return API ====================

  return {
    currentTopic,
    currentTopicId: currentTopic?.id || '',
    isLoading,
    switchTopic,
    createNewTopic,
    renameTopic,
    deleteTopic
  }
}

/**
 * React Hook for a specific topic with optimistic updates (Refactored with useSyncExternalStore)
 *
 * Uses TopicService's LRU cache and subscription system for efficient reactive updates.
 * Supports optimistic updates with automatic rollback on failure.
 *
 * @param topicId - The topic ID to watch
 * @returns topic data, loading state, and update/rename/delete methods
 *
 * @example
 * ```typescript
 * function TopicDetail({ topicId }) {
 *   const { topic, isLoading, renameTopic, deleteTopic } = useTopic(topicId)
 *
 *   if (isLoading) return <Loading />
 *
 *   return (
 *     <div>
 *       <h1>{topic.name}</h1>
 *       <button onClick={() => renameTopic('New Name')}>Rename</button>
 *       <button onClick={deleteTopic}>Delete</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTopic(topicId: string) {
  // ==================== Subscription (useSyncExternalStore) ====================

  /**
   * Subscribe to specific topic changes
   */
  const subscribe = useCallback(
    (callback: () => void) => {
      logger.verbose(`Subscribing to topic ${topicId} changes`)
      return topicService.subscribeTopic(topicId, callback)
    },
    [topicId]
  )

  /**
   * Get topic snapshot (synchronous from cache)
   */
  const getSnapshot = useCallback(() => {
    return topicService.getTopicCached(topicId)
  }, [topicId])

  /**
   * Server snapshot (for SSR compatibility - not used in React Native)
   */
  const getServerSnapshot = useCallback(() => {
    return null
  }, [])

  // Use useSyncExternalStore for reactive updates
  const topic = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // ==================== Loading State ====================

  /**
   * Track if we're loading the topic from database
   */
  const [, setIsLoading] = useState(false)

  /**
   * Load topic from database if not cached
   */
  useEffect(() => {
    if (!topic) {
      setIsLoading(true)
      topicService
        .getTopic(topicId)
        .then(() => {
          setIsLoading(false)
        })
        .catch(error => {
          logger.error(`Failed to load topic ${topicId}:`, error as Error)
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [topic, topicId])

  // ==================== Action Methods ====================

  /**
   * Update topic with optimistic updates
   */
  const updateTopic = useCallback(
    async (topic: Topic) => {
      await topicService.updateTopic(topicId, {
        name: topic.name,
        assistantId: topic.assistantId,
        isLoading: topic.isLoading,
        updatedAt: topic.updatedAt
      })
    },
    [topicId]
  )

  /**
   * Rename topic (optimistic)
   */
  const renameTopic = useCallback(
    async (newName: string) => {
      await topicService.renameTopic(topicId, newName)
    },
    [topicId]
  )

  /**
   * Delete topic (optimistic)
   */
  const deleteTopic = useCallback(async () => {
    await topicService.deleteTopic(topicId)
  }, [topicId])

  // ==================== Return API ====================

  // 当删除最后一个topic时会返回 null, 需要返回加载状态
  if (!topic) {
    return {
      topic: null,
      isLoading: true,
      updateTopic,
      renameTopic,
      deleteTopic
    }
  }

  return {
    topic,
    isLoading: false,
    updateTopic,
    renameTopic,
    deleteTopic
  }
}

/**
 * React Hook for getting all topics
 *
 * Uses TopicService with caching for optimal performance.
 *
 * @example
 * ```typescript
 * function TopicList() {
 *   const { topics, isLoading, updateTopics } = useTopics()
 *
 *   if (isLoading) return <Loading />
 *
 *   return (
 *     <ul>
 *       {topics.map(t => <li key={t.id}>{t.name}</li>)}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Subscribe to changes
   */
  const subscribe = useCallback((callback: () => void) => {
    logger.verbose('Subscribing to all topics changes')
    return topicService.subscribeAllTopics(callback)
  }, [])

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      // Reload when any topic changes
      loadAllTopics()
    })

    loadAllTopics()

    return unsubscribe
  }, [subscribe])

  const loadAllTopics = async () => {
    try {
      setIsLoading(true)
      const allTopics = await topicService.getAllTopics()
      setTopics(allTopics)
    } catch (error) {
      logger.error('Failed to load all topics:', error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTopics = useCallback(async (updates: Topic[]) => {
    for (const topic of updates) {
      await topicService.updateTopic(topic.id, {
        name: topic.name,
        assistantId: topic.assistantId,
        isLoading: topic.isLoading,
        updatedAt: topic.updatedAt
      })
    }
  }, [])

  return {
    topics,
    isLoading,
    updateTopics
  }
}

// ==================== Topic Renaming Functions ====================

/**
 * Lock set to prevent duplicate rename operations
 */
const topicRenamingLocks = new Set<string>()

/**
 * Start renaming a topic (update UI state)
 *
 * @param topicId - The topic ID to start renaming
 */
export function startTopicRenaming(topicId: string): void {
  const { dispatch, getState } = require('@/store').default
  const { setRenamingTopics } = require('@/store/runtime')
  
  const currentIds = getState().runtime.renamingTopics
  if (!currentIds.includes(topicId)) {
    dispatch(setRenamingTopics([...currentIds, topicId]))
  }
}

/**
 * Finish renaming a topic (update UI state with animation feedback)
 *
 * @param topicId - The topic ID that finished renaming
 */
export function finishTopicRenaming(topicId: string): void {
  const { dispatch, getState } = require('@/store').default
  const { setRenamingTopics, setNewlyRenamedTopics } = require('@/store/runtime')
  
  const state = getState()
  
  // Remove from renamingTopics
  const currentRenaming = state.runtime.renamingTopics
  dispatch(setRenamingTopics(currentRenaming.filter((id: string) => id !== topicId)))
  
  // Add to newlyRenamedTopics
  const currentNewlyRenamed = state.runtime.newlyRenamedTopics
  dispatch(setNewlyRenamedTopics([...currentNewlyRenamed, topicId]))
  
  // Remove from newlyRenamedTopics after delay for animation
  setTimeout(() => {
    const current = getState().runtime.newlyRenamedTopics
    dispatch(setNewlyRenamedTopics(current.filter((id: string) => id !== topicId)))
  }, 700)
}

/**
 * Automatically rename a topic based on its messages
 *
 * @param assistant - The assistant for this topic
 * @param topicId - The topic ID to rename
 */
export async function autoRenameTopic(assistant: Assistant, topicId: string): Promise<void> {
  // Prevent duplicate operations
  if (topicRenamingLocks.has(topicId)) {
    return
  }

  try {
    topicRenamingLocks.add(topicId)

    const topic = await topicService.getTopic(topicId)
    
    if (!topic) {
      logger.warn('Topic not found for auto-rename:', topicId)
      return
    }

    // Check if topic naming is enabled
    const { preferenceService } = require('@/services/PreferenceService')
    const enableTopicNaming = preferenceService.getCached('topic.enable_naming')

    // Load messages for this topic
    const { messageDatabase } = require('@database')
    const messages = await messageDatabase.getMessagesByTopicId(topicId)

    if (!messages || messages.length === 0) {
      logger.verbose('No messages to generate topic name from')
      return
    }

    // Don't rename if user manually edited the name (optional field for future enhancement)
    if ((topic as any).isNameManuallyEdited) {
      logger.verbose('Topic name was manually edited, skipping auto-rename')
      return
    }

    // Simple mode: Use first user message text
    if (!enableTopicNaming) {
      const firstUserMessage = messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        try {
          startTopicRenaming(topicId)
          
          // Extract content from first user message
          const { messageBlockDatabase } = require('@database')
          const blocks = await Promise.all(
            firstUserMessage.blocks.map((blockId: string) => messageBlockDatabase.getBlockById(blockId))
          )
          
          const textContent = blocks
            .filter((block: any) => block && block.type === 'main_text')
            .map((block: any) => block.content || '')
            .join('\n\n')
            .substring(0, 50)
          
          if (textContent.trim()) {
            await topicService.renameTopic(topicId, textContent.trim())
          }
        } finally {
          finishTopicRenaming(topicId)
        }
      }
      return
    }

    // AI mode: Generate topic name using AI
    const { t } = require('i18next')
    const defaultTopicName = t('topics.new_topic')
    
    if (topic.name === defaultTopicName && messages.length >= 2) {
      try {
        startTopicRenaming(topicId)
        
        const { fetchMessagesSummary } = require('@/services/ApiService')
        const summaryText = await fetchMessagesSummary({ messages, assistant })
        
        if (summaryText) {
          await topicService.renameTopic(topicId, summaryText)
        }
      } finally {
        finishTopicRenaming(topicId)
      }
    }
  } catch (error) {
    logger.error('Failed to auto-rename topic:', error as Error, { topicId })
  } finally {
    topicRenamingLocks.delete(topicId)
  }
}

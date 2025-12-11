/**
 * Context Strategy Service
 *
 * Provides utilities for resolving context strategy configuration
 * from the hierarchy: Topic > Assistant > Global
 */

import type { Assistant, Topic } from '@/types/assistant'
import type { ContextStrategyConfig, ContextStrategyType } from '@/types/contextStrategy'
import { DEFAULT_CONTEXT_STRATEGY_CONFIG } from '@/types/contextStrategy'

/**
 * Get the effective context strategy configuration for a conversation
 *
 * Priority order:
 * 1. Topic-level settings (highest priority)
 * 2. Assistant-level settings
 * 3. Global settings (lowest priority)
 *
 * @param topic - The current topic/conversation
 * @param assistant - The assistant being used
 * @param globalStrategyType - The global strategy type from preferences
 * @returns The effective context strategy configuration to use
 */
export function getEffectiveContextStrategy(
  topic: Topic | undefined,
  assistant: Assistant | undefined,
  globalStrategyType: ContextStrategyType
): ContextStrategyConfig {
  // Priority 1: Topic-level override
  if (topic?.contextStrategy) {
    return topic.contextStrategy
  }

  // Priority 2: Assistant-level override
  if (assistant?.settings?.contextStrategy) {
    return assistant.settings.contextStrategy
  }

  // Priority 3: Global settings
  return {
    ...DEFAULT_CONTEXT_STRATEGY_CONFIG,
    type: globalStrategyType
  }
}

/**
 * Get the source of the current context strategy
 *
 * @param topic - The current topic/conversation
 * @param assistant - The assistant being used
 * @param globalStrategyType - The global strategy type from preferences
 * @returns 'topic' | 'assistant' | 'global'
 */
export function getContextStrategySource(
  topic: Topic | undefined,
  assistant: Assistant | undefined,
  _globalStrategyType: ContextStrategyType
): 'topic' | 'assistant' | 'global' {
  if (topic?.contextStrategy) {
    return 'topic'
  }

  if (assistant?.settings?.contextStrategy) {
    return 'assistant'
  }

  return 'global'
}

/**
 * Check if a topic has a custom context strategy override
 *
 * @param topic - The topic to check
 * @returns true if the topic has a custom strategy
 */
export function hasTopicContextOverride(topic: Topic | undefined): boolean {
  return !!topic?.contextStrategy
}

/**
 * Check if an assistant has a custom context strategy override
 *
 * @param assistant - The assistant to check
 * @returns true if the assistant has a custom strategy
 */
export function hasAssistantContextOverride(assistant: Assistant | undefined): boolean {
  return !!assistant?.settings?.contextStrategy
}

/**
 * Get a human-readable description of the strategy source
 *
 * @param source - The strategy source
 * @returns A human-readable string
 */
export function getStrategySourceLabel(source: 'topic' | 'assistant' | 'global'): string {
  switch (source) {
    case 'topic':
      return 'Conversation Settings'
    case 'assistant':
      return 'Assistant Settings'
    case 'global':
      return 'Global Settings'
  }
}

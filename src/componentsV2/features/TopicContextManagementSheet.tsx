/**
 * Topic Context Management Sheet
 *
 * Bottom sheet for configuring context management at the conversation/topic level.
 * Shows the hierarchy of settings (Topic > Assistant > Global) and allows overriding.
 */

import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Switch } from 'heroui-native'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge, Group, GroupTitle, Row, Text, YStack } from '@/componentsV2'
import { ContextStrategyPicker } from '@/componentsV2/features/ContextStrategyPicker'
import {
  getContextStrategySource,
  getEffectiveContextStrategy,
  getStrategySourceLabel
} from '@/services/ContextStrategyService'
import type { Assistant, Topic } from '@/types/assistant'
import type { ContextStrategyConfig, ContextStrategyType } from '@/types/contextStrategy'
import { CONTEXT_STRATEGY_LABELS,DEFAULT_CONTEXT_STRATEGY_CONFIG } from '@/types/contextStrategy'

interface TopicContextManagementSheetProps {
  topic: Topic
  assistant: Assistant
  globalStrategyType: ContextStrategyType
  onUpdate: (topic: Topic) => Promise<void>
}

export const TopicContextManagementSheet = React.forwardRef<
  BottomSheetModal,
  TopicContextManagementSheetProps
>(({ topic, assistant, globalStrategyType, onUpdate }, ref) => {
  const { t } = useTranslation()
  const snapPoints = useMemo(() => ['75%', '90%'], [])

  // Get effective strategy and source
  const effectiveStrategy = getEffectiveContextStrategy(topic, assistant, globalStrategyType)
  const strategySource = getContextStrategySource(topic, assistant, globalStrategyType)

  // State for topic override
  const [hasTopicOverride, setHasTopicOverride] = useState(!!topic.contextStrategy)
  const [topicStrategy, setTopicStrategy] = useState<ContextStrategyConfig>(
    topic.contextStrategy || {
      ...DEFAULT_CONTEXT_STRATEGY_CONFIG,
      type: 'sliding_window'
    }
  )

  const handleOverrideToggle = async (value: boolean) => {
    setHasTopicOverride(value)

    if (value) {
      // Enable topic override
      await onUpdate({
        ...topic,
        contextStrategy: topicStrategy
      })
    } else {
      // Disable topic override
      await onUpdate({
        ...topic,
        contextStrategy: undefined
      })
    }
  }

  const handleStrategyChange = async (config: ContextStrategyConfig) => {
    setTopicStrategy(config)

    if (hasTopicOverride) {
      await onUpdate({
        ...topic,
        contextStrategy: config
      })
    }
  }

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index)
  }, [])

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: 'var(--color-background)' }}
      handleIndicatorStyle={{ backgroundColor: 'var(--color-foreground-muted)' }}>
      <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <YStack className="gap-6">
          {/* Header */}
          <YStack className="gap-2">
            <Text className="text-lg font-semibold">{t('settings.context.title', 'Context Management')}</Text>

            {/* Current Strategy Display */}
            <Row className="items-center gap-2">
              <Text className="text-sm text-foreground-secondary">
                {t('settings.context.current', 'Current')}:
              </Text>
              <Badge variant="secondary">{CONTEXT_STRATEGY_LABELS[effectiveStrategy.type]}</Badge>
              <Text className="text-xs text-foreground-muted">
                ({getStrategySourceLabel(strategySource)})
              </Text>
            </Row>
          </YStack>

          {/* Override Toggle */}
          <YStack className="gap-2">
            <GroupTitle>{t('settings.context.conversation_settings', 'Conversation Settings')}</GroupTitle>
            <Group>
              <Row>
                <YStack className="flex-1">
                  <Text>{t('settings.context.custom_for_conversation', 'Custom Settings for This Conversation')}</Text>
                  <Text className="text-xs text-foreground-secondary">
                    {t(
                      'settings.context.override_hint',
                      strategySource === 'assistant'
                        ? 'Override assistant settings'
                        : 'Override global settings'
                    )}
                  </Text>
                </YStack>
                <Switch isSelected={hasTopicOverride} onSelectedChange={handleOverrideToggle} />
              </Row>
            </Group>
          </YStack>

          {/* Strategy Configuration (if override enabled) */}
          {hasTopicOverride && (
            <ContextStrategyPicker value={topicStrategy} onChange={handleStrategyChange} />
          )}

          {/* Hierarchy Info */}
          <YStack className="gap-2">
            <GroupTitle>{t('settings.context.priority_order', 'Priority Order')}</GroupTitle>
            <Group>
              <YStack className="p-4 gap-2">
                <Row className="items-center gap-2">
                  <Text className="text-xs font-medium text-foreground">
                    1. {t('settings.context.priority_conversation', 'Conversation settings')}
                  </Text>
                  {strategySource === 'topic' && (
                    <Badge variant="primary" size="sm">
                      {t('common.active', 'Active')}
                    </Badge>
                  )}
                </Row>
                <Row className="items-center gap-2">
                  <Text className="text-xs font-medium text-foreground">
                    2. {t('settings.context.priority_assistant', 'Assistant settings')}
                  </Text>
                  {strategySource === 'assistant' && (
                    <Badge variant="primary" size="sm">
                      {t('common.active', 'Active')}
                    </Badge>
                  )}
                </Row>
                <Row className="items-center gap-2">
                  <Text className="text-xs font-medium text-foreground">
                    3. {t('settings.context.priority_global', 'Global settings')}
                  </Text>
                  {strategySource === 'global' && (
                    <Badge variant="primary" size="sm">
                      {t('common.active', 'Active')}
                    </Badge>
                  )}
                </Row>
              </YStack>
            </Group>
          </YStack>
        </YStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
})

TopicContextManagementSheet.displayName = 'TopicContextManagementSheet'

/**
 * Hook to present the Topic Context Management Sheet
 */
export function usePresentTopicContextSheet() {
  const sheetRef = useRef<BottomSheetModal>(null)

  const present = useCallback(() => {
    sheetRef.current?.present()
  }, [])

  const dismiss = useCallback(() => {
    sheetRef.current?.dismiss()
  }, [])

  return {
    sheetRef,
    present,
    dismiss
  }
}

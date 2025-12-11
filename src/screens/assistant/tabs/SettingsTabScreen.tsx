/**
 * Settings Tab Screen for Assistant Detail
 *
 * Displays assistant-level settings including context management configuration
 */

import { Switch } from 'heroui-native'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView } from 'react-native'

import { Group, GroupTitle, Row, Text, YStack } from '@/componentsV2'
import { ContextStrategyPicker } from '@/componentsV2/features/ContextStrategyPicker'
import { useAssistant } from '@/hooks/useAssistant'
import type { Assistant } from '@/types/assistant'
import type { ContextStrategyConfig } from '@/types/contextStrategy'
import { DEFAULT_CONTEXT_STRATEGY_CONFIG } from '@/types/contextStrategy'

interface SettingsTabScreenProps {
  route: {
    params: {
      assistant: Assistant
    }
  }
}

export default function SettingsTabScreen({ route }: SettingsTabScreenProps) {
  const { t } = useTranslation()
  const _assistant = route.params.assistant
  
  // Use the hook to get live assistant data and update function
  const { assistant, updateAssistant, isLoading } = useAssistant(_assistant.id)

  // State for context management override
  const [hasContextOverride, setHasContextOverride] = useState(!!assistant?.settings?.contextStrategy)
  const [contextStrategy, setContextStrategy] = useState<ContextStrategyConfig>(
    assistant?.settings?.contextStrategy || {
      ...DEFAULT_CONTEXT_STRATEGY_CONFIG,
      type: 'sliding_window'
    }
  )

  const handleOverrideToggle = async (value: boolean) => {
    setHasContextOverride(value)
    
    if (value) {
      await updateAssistant({
        settings: {
          ...assistant?.settings,
          contextStrategy
        }
      })
    } else {
      await updateAssistant({
        settings: {
          ...assistant?.settings,
          contextStrategy: undefined
        }
      })
    }
  }

  const handleStrategyChange = async (config: ContextStrategyConfig) => {
    setContextStrategy(config)
    
    if (hasContextOverride) {
      await updateAssistant({
        settings: {
          ...assistant?.settings,
          contextStrategy: config
        }
      })
    }
  }

  if (isLoading || !assistant) {
    return (
      <YStack className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </YStack>
    )
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <YStack className="gap-6 p-4">
        {/* Context Management Section */}
        <YStack className="gap-2">
          <GroupTitle>{t('settings.context.title', 'Context Management')}</GroupTitle>
          
          {/* Description */}
          <Text className="text-xs text-foreground-secondary mb-2">
            {t(
              'settings.assistant.context_override_description',
              'Override global context management settings for this assistant. When disabled, the global settings will be used.'
            )}
          </Text>

          <Group>
            {/* Override Toggle */}
            <Row>
              <YStack className="flex-1">
                <Text>{t('settings.assistant.override_global_context', 'Override Global Settings')}</Text>
                <Text className="text-xs text-foreground-secondary">
                  {t('settings.assistant.use_custom_context', 'Use custom context strategy for this assistant')}
                </Text>
              </YStack>
              <Switch isSelected={hasContextOverride} onSelectedChange={handleOverrideToggle} />
            </Row>
          </Group>
        </YStack>

        {/* Strategy Configuration (if override enabled) */}
        {hasContextOverride && (
          <ContextStrategyPicker value={contextStrategy} onChange={handleStrategyChange} />
        )}

        {/* Info about hierarchy */}
        {!hasContextOverride && (
          <YStack className="gap-2">
            <Group>
              <YStack className="p-4">
                <Text className="text-xs font-medium text-foreground mb-2">
                  {t('settings.context.priority_order', 'Priority Order:')}
                </Text>
                <Text className="text-xs text-foreground-secondary">
                  {t('settings.context.priority_1', '1. Conversation settings (if set)')}
                </Text>
                <Text className="text-xs text-foreground-secondary">
                  {t('settings.context.priority_2', '2. Assistant settings (if set)')}
                </Text>
                <Text className="text-xs text-foreground-secondary">
                  {t('settings.context.priority_3', '3. Global settings')}
                </Text>
              </YStack>
            </Group>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}

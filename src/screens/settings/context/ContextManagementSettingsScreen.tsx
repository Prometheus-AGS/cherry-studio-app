/**
 * Context Management Settings Screen
 *
 * Allows users to configure the global context management strategy
 * that applies to all conversations unless overridden at assistant/topic level.
 */

import { Switch } from 'heroui-native'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'

import {
  Container,
  ContextStrategyPicker,
  Group,
  GroupTitle,
  HeaderBar,
  Row,
  SafeAreaContainer,
  Text,
  YStack
} from '@/componentsV2'
import { loggerService } from '@/services/LoggerService'
import { preferenceService } from '@/services/PreferenceService'
import type { ContextStrategyConfig, ContextStrategyType } from '@/types/contextStrategy'
import { DEFAULT_CONTEXT_STRATEGY_CONFIG } from '@/types/contextStrategy'

const logger = loggerService.withContext('ContextManagementSettings')

export function ContextManagementSettingsScreen() {
  const { t } = useTranslation()

  // State
  const [enabled, setEnabled] = useState(false)
  const [strategyConfig, setStrategyConfig] = useState<ContextStrategyConfig>({
    ...DEFAULT_CONTEXT_STRATEGY_CONFIG,
    type: 'sliding_window'
  })

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const currentStrategy = await preferenceService.get('context.strategy_type')
      const modelId = await preferenceService.get('context.summarization_model_id')

      setEnabled(currentStrategy !== 'none')
      
      // If strategy is 'none', default to 'sliding_window' for UI display
      // This ensures the first strategy is visually selected when the user enables it
      setStrategyConfig({
        ...DEFAULT_CONTEXT_STRATEGY_CONFIG,
        type: currentStrategy === 'none' ? 'sliding_window' : (currentStrategy as ContextStrategyType),
        summarizationModelId: modelId || undefined
      })
    } catch (error) {
      logger.error('Failed to load context management settings:', error as Error)
    }
  }

  const handleToggle = (value: boolean) => {
    setEnabled(value)
    
    if (value) {
      // When enabling for the first time, ensure a strategy is selected
      // If current strategy is 'none', auto-select 'sliding_window'
      const selectedStrategy = strategyConfig.type === 'none' ? 'sliding_window' : strategyConfig.type
      const updatedConfig = { ...strategyConfig, type: selectedStrategy }
      setStrategyConfig(updatedConfig)
      preferenceService.set('context.strategy_type', selectedStrategy)
      if (updatedConfig.summarizationModelId) {
        preferenceService.set('context.summarization_model_id', updatedConfig.summarizationModelId)
      }
    } else {
      // When disabling, set to 'none'
      preferenceService.set('context.strategy_type', 'none')
    }
  }

  const handleStrategyConfigChange = (config: ContextStrategyConfig) => {
    setStrategyConfig(config)
    if (enabled) {
      preferenceService.set('context.strategy_type', config.type)
      if (config.summarizationModelId) {
        preferenceService.set('context.summarization_model_id', config.summarizationModelId)
      }
    }
  }

  return (
    <SafeAreaContainer className="flex-1">
      <HeaderBar title={t('settings.context.title', 'Context Management')} />

      <Container className="pb-0">
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <YStack className="flex-1 gap-6">
            {/* Description */}
            <Text className="text-sm text-foreground-secondary">
              {t(
                'settings.context.description',
                'Automatically manages conversation context to prevent exceeding model limits. This setting applies globally and can be overridden per assistant or conversation.'
              )}
            </Text>

            {/* Enable/Disable Toggle */}
            <YStack className="gap-2">
              <GroupTitle>{t('common.manage', 'Manage')}</GroupTitle>
              <Group>
                <Row>
                  <Text>{t('settings.context.enabled', 'Enable Context Management')}</Text>
                  <Switch isSelected={enabled} onSelectedChange={handleToggle} />
                </Row>
              </Group>
            </YStack>

            {/* Strategy Configuration */}
            {enabled && <ContextStrategyPicker value={strategyConfig} onChange={handleStrategyConfigChange} />}

            {/* How It Works Section */}
            <YStack className="gap-2">
              <GroupTitle>{t('settings.context.how_it_works', 'How It Works')}</GroupTitle>
              <Group>
                <YStack className="p-4">
                  <Text className="text-xs text-foreground-secondary">
                    {t(
                      'settings.context.how_it_works_description',
                      'Context management strategies help prevent "Prompt is too long" errors by intelligently managing conversation history. The selected strategy will be applied automatically when needed.'
                    )}
                  </Text>
                </YStack>
              </Group>
            </YStack>
          </YStack>
        </ScrollView>
      </Container>
    </SafeAreaContainer>
  )
}
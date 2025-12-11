/**
 * Context Management Settings Screen
 *
 * Allows users to configure the global context management strategy
 * that applies to all conversations unless overridden at assistant/topic level.
 */

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Switch, Text, TextInput, View } from 'react-native'

import { loggerService } from '@/services/LoggerService'
import { preferenceService } from '@/services/PreferenceService'
import type { ContextStrategyType } from '@/types/contextStrategy'
import { CONTEXT_STRATEGY_DESCRIPTIONS,CONTEXT_STRATEGY_LABELS } from '@/types/contextStrategy'

const logger = loggerService.withContext('ContextManagementSettings')

export function ContextManagementSettingsScreen() {
  const { t } = useTranslation()

  // State
  const [enabled, setEnabled] = useState(false)
  const [strategyType, setStrategyType] = useState<ContextStrategyType>('sliding_window')
  const [shortTermTurns, setShortTermTurns] = useState(5)
  const [midTermBudget, setMidTermBudget] = useState(2000)
  const [longTermBudget, setLongTermBudget] = useState(500)
  const [summarizationModelId, setSummarizationModelId] = useState('')

  // Load settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const currentStrategy = await preferenceService.get('context.strategy_type')
      const modelId = await preferenceService.get('context.summarization_model_id')

      setEnabled(currentStrategy !== 'none')
      setStrategyType(currentStrategy as ContextStrategyType)
      setSummarizationModelId(modelId || '')
    } catch (error) {
      logger.error('Failed to load context management settings:', error as Error)
    }
  }

  const saveSettings = async () => {
    try {
      await preferenceService.set('context.strategy_type', enabled ? strategyType : 'none')
      await preferenceService.set('context.summarization_model_id', summarizationModelId)

      logger.info('Context management settings saved', {
        enabled,
        strategy: enabled ? strategyType : 'none'
      })
    } catch (error) {
      logger.error('Failed to save context management settings:', error as Error)
    }
  }

  const handleToggle = (value: boolean) => {
    setEnabled(value)
    preferenceService.set('context.strategy_type', value ? strategyType : 'none')
  }

  const handleStrategyChange = (strategy: ContextStrategyType) => {
    setStrategyType(strategy)
    if (enabled) {
      preferenceService.set('context.strategy_type', strategy)
    }
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            {t('settings.context.title', 'Context Management')}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {t('settings.context.description', 'Automatically manages conversation context to prevent exceeding model limits. This setting applies globally and can be overridden per assistant or conversation.')}
          </Text>
        </View>

        {/* Enable/Disable Toggle */}
        <View className="flex-row items-center justify-between bg-card p-4 rounded-lg mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-base font-medium text-foreground">
              {t('settings.context.enabled', 'Enable Context Management')}
            </Text>
            <Text className="text-xs text-muted-foreground mt-1">
              {enabled ? t('settings.context.enabled_hint', 'Active') : t('settings.context.disabled_hint', 'Disabled')}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={enabled ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        {enabled && (
          <>
            {/* Strategy Selection */}
            <View className="bg-card p-4 rounded-lg mb-4">
              <Text className="text-base font-medium text-foreground mb-3">
                {t('settings.context.strategy', 'Strategy')}
              </Text>

              {/* Strategy Options */}
              {(['sliding_window', 'summarize', 'hierarchical', 'truncate_middle'] as const).map((strategy) => (
                <View
                  key={strategy}
                  className={`p-3 mb-2 rounded ${strategyType === strategy ? 'bg-primary/20 border-2 border-primary' : 'bg-secondary border border-border'}`}
                  onTouchEnd={() => handleStrategyChange(strategy)}
                >
                  <Text className="font-medium text-foreground mb-1">{CONTEXT_STRATEGY_LABELS[strategy]}</Text>
                  <Text className="text-xs text-muted-foreground">{CONTEXT_STRATEGY_DESCRIPTIONS[strategy]}</Text>
                </View>
              ))}
            </View>

            {/* Hierarchical Memory Configuration */}
            {strategyType === 'hierarchical' && (
              <View className="bg-card p-4 rounded-lg mb-4">
                <Text className="text-base font-medium text-foreground mb-4">
                  {t('settings.context.hierarchical_config', 'Hierarchical Memory Configuration')}
                </Text>

                {/* Short-term Turns */}
                <View className="mb-4">
                  <Text className="text-sm text-foreground mb-2">{t('settings.context.short_term_turns', 'Short-term Turns')}</Text>
                  <TextInput
                    value={shortTermTurns.toString()}
                    onChangeText={(text) => setShortTermTurns(parseInt(text) || 5)}
                    keyboardType="number-pad"
                    className="bg-background border border-border rounded px-3 py-2 text-foreground"
                  />
                  <Text className="text-xs text-muted-foreground mt-1">
                    {t('settings.context.short_term_hint', 'Number of recent conversation turns to keep verbatim (1-10)')}
                  </Text>
                </View>

                {/* Mid-term Budget */}
                <View className="mb-4">
                  <Text className="text-sm text-foreground mb-2">{t('settings.context.mid_term_budget', 'Mid-term Budget')}</Text>
                  <TextInput
                    value={midTermBudget.toString()}
                    onChangeText={(text) => setMidTermBudget(parseInt(text) || 2000)}
                    keyboardType="number-pad"
                    className="bg-background border border-border rounded px-3 py-2 text-foreground"
                  />
                  <Text className="text-xs text-muted-foreground mt-1">
                    {t('settings.context.mid_term_hint', 'Token budget for summarized older messages (500-5000)')}
                  </Text>
                </View>

                {/* Long-term Budget */}
                <View className="mb-4">
                  <Text className="text-sm text-foreground mb-2">{t('settings.context.long_term_budget', 'Long-term Budget')}</Text>
                  <TextInput
                    value={longTermBudget.toString()}
                    onChangeText={(text) => setLongTermBudget(parseInt(text) || 500)}
                    keyboardType="number-pad"
                    className="bg-background border border-border rounded px-3 py-2 text-foreground"
                  />
                  <Text className="text-xs text-muted-foreground mt-1">
                    {t('settings.context.long_term_hint', 'Token budget for extracted facts and preferences (100-1000)')}
                  </Text>
                </View>
              </View>
            )}

            {/* Summarization Model */}
            {(strategyType === 'summarize' || strategyType === 'hierarchical') && (
              <View className="bg-card p-4 rounded-lg mb-4">
                <Text className="text-base font-medium text-foreground mb-2">
                  {t('settings.context.summarization_model', 'Summarization Model')}
                </Text>
                <Text className="text-xs text-muted-foreground mb-3">
                  {t('settings.context.summarization_model_hint', 'This model will be used to generate conversation summaries. Choose a fast model to minimize latency. If not set, the current conversation model will be used.')}
                </Text>
                {/* TODO: Add model picker component */}
                <Text className="text-sm text-muted-foreground italic">
                  {summarizationModelId || t('settings.context.use_current_model', 'Use current model')}
                </Text>
              </View>
            )}

            {/* How It Works Section */}
            <View className="bg-card p-4 rounded-lg">
              <Text className="text-base font-medium text-foreground mb-3">
                {t('settings.context.how_it_works', 'How It Works')}
              </Text>

              <View className="space-y-3">
                {/* Sliding Window */}
                <View className="mb-3">
                  <Text className="text-sm font-medium text-foreground mb-1">
                    {CONTEXT_STRATEGY_LABELS.sliding_window}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {CONTEXT_STRATEGY_DESCRIPTIONS.sliding_window}
                  </Text>
                </View>

                {/* Progressive Summarization */}
                <View className="mb-3">
                  <Text className="text-sm font-medium text-foreground mb-1">
                    {CONTEXT_STRATEGY_LABELS.summarize}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {CONTEXT_STRATEGY_DESCRIPTIONS.summarize}
                  </Text>
                </View>

                {/* Hierarchical Memory */}
                <View className="mb-3">
                  <Text className="text-sm font-medium text-foreground mb-1">
                    {CONTEXT_STRATEGY_LABELS.hierarchical}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {CONTEXT_STRATEGY_DESCRIPTIONS.hierarchical}
                  </Text>
                </View>

                {/* Keep First & Last */}
                <View>
                  <Text className="text-sm font-medium text-foreground mb-1">
                    {CONTEXT_STRATEGY_LABELS.truncate_middle}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {CONTEXT_STRATEGY_DESCRIPTIONS.truncate_middle}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  )
}
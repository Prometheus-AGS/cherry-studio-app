import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'

import { Group, GroupTitle, Text, YStack } from '@/componentsV2'
import type { ContextStrategyConfig, ContextStrategyType } from '@/types/contextStrategy'
import { CONTEXT_STRATEGY_DESCRIPTIONS, CONTEXT_STRATEGY_LABELS } from '@/types/contextStrategy'

export interface ContextStrategyPickerProps {
  value: ContextStrategyConfig
  onChange: (config: ContextStrategyConfig) => void
  className?: string
}

const strategies: ContextStrategyType[] = ['sliding_window', 'summarize', 'hierarchical', 'truncate_middle']

export function ContextStrategyPicker({ value, onChange, className = '' }: ContextStrategyPickerProps): React.ReactElement {
  const { t } = useTranslation()

  const handleStrategySelect = (strategyType: ContextStrategyType) => {
    onChange({
      ...value,
      type: strategyType
    })
  }

  return (
    <YStack className={`gap-2 ${className}`}>
      <GroupTitle>{t('settings.context.strategy', 'Strategy')}</GroupTitle>
      <Group>
        <YStack className="p-2 gap-2">
          {strategies.map((strategy) => (
            <Pressable
              key={strategy}
              onPress={() => handleStrategySelect(strategy)}
              className={`p-3 rounded-lg ${
                value.type === strategy
                  ? 'bg-primary/20 border-2 border-primary'
                  : 'bg-secondary/10 border border-border'
              }`}
            >
              <Text className="font-medium text-foreground mb-1">
                {CONTEXT_STRATEGY_LABELS[strategy]}
              </Text>
              <Text className="text-xs text-foreground-secondary">
                {CONTEXT_STRATEGY_DESCRIPTIONS[strategy]}
              </Text>
            </Pressable>
          ))}
        </YStack>
      </Group>
    </YStack>
  )
}

export default ContextStrategyPicker

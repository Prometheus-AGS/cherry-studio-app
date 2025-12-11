import React, { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import type { ContextActionMessageBlock } from '@/types/message'

interface Props {
  block: ContextActionMessageBlock
  onExpand?: () => void
}

/**
 * ContextActionBlock Component
 * 
 * Displays transparent notifications when context management actions are applied.
 * Shows what was done (strategy, tokens saved, messages removed) in an expandable format.
 */
export function ContextActionBlock({ block, onExpand }: Props) {
  const [expanded, setExpanded] = useState(false)

  const handlePress = () => {
    setExpanded(!expanded)
    onExpand?.()
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-secondary/50 p-4 rounded-lg border border-border my-2"
    >
      <View className="flex-row items-start gap-3">
        <Text className="text-muted-foreground text-base">ℹ️</Text>
        
        <View className="flex-1">
          <Text className="font-medium text-sm mb-1 text-foreground">
            Context Management
          </Text>
          
          <Text className="text-xs text-muted-foreground leading-5">
            {block.summary}
          </Text>
          
          {expanded && block.metadata && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-xs text-muted-foreground mb-2 font-medium">
                Details:
              </Text>
              
              {block.metadata.strategyType && (
                <Text className="text-xs text-foreground mb-1">
                  • Strategy: {block.metadata.strategyType}
                </Text>
              )}
              
              {block.removedCount !== undefined && block.removedCount > 0 && (
                <Text className="text-xs text-foreground mb-1">
                  • Messages removed: {block.removedCount}
                </Text>
              )}
              
              {block.tokensSaved !== undefined && (
                <Text className="text-xs text-foreground mb-1">
                  • Tokens saved: ~{block.tokensSaved.toLocaleString()}
                </Text>
              )}
              
              {block.metadata.originalMessageCount && block.metadata.finalMessageCount && (
                <Text className="text-xs text-foreground mb-1">
                  • Messages: {block.metadata.originalMessageCount} → {block.metadata.finalMessageCount}
                </Text>
              )}
              
              {block.metadata.toolName && (
                <Text className="text-xs text-foreground mb-1">
                  • Tool: {block.metadata.toolName}
                </Text>
              )}
              
              {block.metadata.originalTokens && block.metadata.condensedTokens && (
                <Text className="text-xs text-foreground mb-1">
                  • Tokens: {block.metadata.originalTokens.toLocaleString()} → {block.metadata.condensedTokens.toLocaleString()}
                </Text>
              )}
              
              {block.metadata.contextSummary && (
                <View className="mt-2 p-2 bg-secondary/30 rounded">
                  <Text className="text-xs italic text-muted-foreground">
                    &ldquo;{block.metadata.contextSummary}&rdquo;
                  </Text>
                </View>
              )}
            </View>
          )}
          
          <Text className="text-xs text-primary mt-2">
            {expanded ? '▲' : '▼'} Tap for {expanded ? 'less' : 'more'} details
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
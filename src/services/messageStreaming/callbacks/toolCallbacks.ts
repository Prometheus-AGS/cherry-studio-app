import { loggerService } from '@/services/LoggerService'
import {
  condenseToolResult,
  getToolThreshold,
  shouldCondenseToolResult,
  shouldNotifyUser
} from '@/services/ToolResultCondenser'
import type { MCPToolResponse } from '@/types/mcp'
import type { ContextActionMessageBlock, ToolMessageBlock } from '@/types/message'
import { MessageBlockStatus, MessageBlockType } from '@/types/message'
import { WebSearchSource } from '@/types/websearch'
import { createCitationBlock, createToolBlock } from '@/utils/messageUtils/create'

import type { BlockManager } from '../BlockManager'

const logger = loggerService.withContext('ToolCallbacks')

interface ToolCallbacksDependencies {
  blockManager: BlockManager
  assistantMsgId: string
}

export const createToolCallbacks = (deps: ToolCallbacksDependencies) => {
  const { blockManager, assistantMsgId } = deps

  // 内部维护的状态
  const toolCallIdToBlockIdMap = new Map<string, string>()
  let toolBlockId: string | null = null
  let citationBlockId: string | null = null

  return {
    onToolCallPending: (toolResponse: MCPToolResponse) => {
      if (blockManager.hasInitialPlaceholder) {
        const changes = {
          type: MessageBlockType.TOOL,
          status: MessageBlockStatus.PENDING,
          toolName: toolResponse.tool.name,
          metadata: { rawMcpToolResponse: toolResponse }
        }
        toolBlockId = blockManager.initialPlaceholderBlockId!
        blockManager.smartBlockUpdate(toolBlockId, changes, MessageBlockType.TOOL)
        toolCallIdToBlockIdMap.set(toolResponse.id, toolBlockId)
      } else if (toolResponse.status === 'pending') {
        const toolBlock = createToolBlock(assistantMsgId, toolResponse.id, {
          toolName: toolResponse.tool.name,
          status: MessageBlockStatus.PENDING,
          metadata: { rawMcpToolResponse: toolResponse }
        })
        toolBlockId = toolBlock.id
        blockManager.handleBlockTransition(toolBlock, MessageBlockType.TOOL)
        toolCallIdToBlockIdMap.set(toolResponse.id, toolBlock.id)
      } else {
        logger.warn(
          `[onToolCallPending] Received unhandled tool status: ${toolResponse.status} for ID: ${toolResponse.id}`
        )
      }
    },

    onToolCallComplete: (toolResponse: MCPToolResponse) => {
      const existingBlockId = toolCallIdToBlockIdMap.get(toolResponse.id)
      toolCallIdToBlockIdMap.delete(toolResponse.id)

      if (toolResponse.status === 'done' || toolResponse.status === 'error' || toolResponse.status === 'cancelled') {
        if (!existingBlockId) {
          logger.error(
            `[onToolCallComplete] No existing block found for completed/error tool call ID: ${toolResponse.id}. Cannot update.`
          )
          return
        }

        const finalStatus =
          toolResponse.status === 'done' || toolResponse.status === 'cancelled'
            ? MessageBlockStatus.SUCCESS
            : MessageBlockStatus.ERROR

        // Check if tool result needs condensation (proactive token management)
        let processedContent = toolResponse.response
        
        if (finalStatus === MessageBlockStatus.SUCCESS && toolResponse.response) {
          const maxTokens = getToolThreshold(toolResponse.tool.name)
          const { shouldCondense, threshold } = shouldCondenseToolResult(
            toolResponse.response,
            maxTokens
          )
          
          if (shouldCondense) {
            const condensationResult = condenseToolResult(
              toolResponse.response,
              maxTokens,
              toolResponse.tool.name
            )
            
            // Use condensed version for AI
            processedContent = condensationResult.condensedContent
            
            // Create context action block if user should be notified
            if (shouldNotifyUser(condensationResult.originalTokens - condensationResult.condensedTokens, threshold)) {
              const contextActionBlock: ContextActionMessageBlock = {
                id: `context_action_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                messageId: assistantMsgId,
                type: MessageBlockType.CONTEXT_ACTION,
                action: 'summarize', // Tool result condensation
                summary: condensationResult.summary,
                removedCount: 0,
                tokensSaved: condensationResult.originalTokens - condensationResult.condensedTokens,
                status: MessageBlockStatus.SUCCESS,
                createdAt: Date.now(),
                metadata: {
                  strategyType: 'tool_result_condensation',
                  originalTokens: condensationResult.originalTokens,
                  condensedTokens: condensationResult.condensedTokens,
                  toolName: toolResponse.tool.name,
                  condensationStrategy: condensationResult.strategy
                }
              }
              
              blockManager.handleBlockTransition(contextActionBlock, MessageBlockType.CONTEXT_ACTION)
              
              logger.info('Tool result condensed - notification created', {
                toolName: toolResponse.tool.name,
                originalTokens: condensationResult.originalTokens,
                condensedTokens: condensationResult.condensedTokens
              })
            }
          }
        }

        const changes: Partial<ToolMessageBlock> = {
          content: processedContent,
          status: finalStatus,
          metadata: {
            rawMcpToolResponse: toolResponse,
            // Store full content if condensed
            ...(processedContent !== toolResponse.response && {
              fullContent: toolResponse.response,
              wasCondensed: true
            })
          }
        }

        if (finalStatus === MessageBlockStatus.ERROR) {
          changes.error = {
            message: `Tool execution failed/error`,
            details: toolResponse.response,
            name: null,
            stack: null
          }
        }

        blockManager.smartBlockUpdate(existingBlockId, changes, MessageBlockType.TOOL, true)

        // Handle citation block creation for web search results
        if (toolResponse.tool.name === 'builtin_web_search' && toolResponse.response) {
          const citationBlock = createCitationBlock(
            assistantMsgId,
            {
              response: { results: toolResponse.response, source: WebSearchSource.WEBSEARCH }
            },
            {
              status: MessageBlockStatus.SUCCESS
            }
          )
          citationBlockId = citationBlock.id
          blockManager.handleBlockTransition(citationBlock, MessageBlockType.CITATION)
        }
      } else {
        logger.warn(
          `[onToolCallComplete] Received unhandled tool status: ${toolResponse.status} for ID: ${toolResponse.id}`
        )
      }

      toolBlockId = null
    },

    // 暴露给 textCallbacks 使用的方法
    getCitationBlockId: () => citationBlockId
  }
}

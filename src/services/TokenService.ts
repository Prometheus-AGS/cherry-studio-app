import { flatten, takeRight } from 'lodash'
import { approximateTokenSize } from 'tokenx'

import type { Assistant, Usage } from '@/types/assistant'
import type { FileMetadata } from '@/types/file'
import { FileTypes } from '@/types/file'
import type { Message } from '@/types/message'
import { filterAfterContextClearMessages, filterMessages } from '@/utils/messageUtils/filters'
import { findFileBlocks, getMainTextContent, getThinkingContent } from '@/utils/messageUtils/find'

import { getAssistantSettings } from './AssistantService'
import { readFile } from './FileService'
import { loggerService } from './LoggerService'

const logger = loggerService.withContext('TokenService')

interface MessageItem {
  name?: string
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function getFileContent(file?: FileMetadata | null): Promise<string> {
  if (!file) {
    return ''
  }

  if (![FileTypes.TEXT, FileTypes.DOCUMENT].includes(file.type)) {
    return ''
  }

  try {
    return readFile(file)
  } catch (error) {
    logger.warn('Failed to read file content for token estimation', { fileId: file.id, error })
    return ''
  }
}

async function getMessageParam(message: Message): Promise<MessageItem[]> {
  const param: MessageItem[] = []
  const content = await getMainTextContent(message)

  param.push({
    role: message.role,
    content
  })

  const files = await findFileBlocks(message)

  if (files.length > 0) {
    for (const fileBlock of files) {
      const fileContent = await getFileContent(fileBlock.file)

      if (fileContent) {
        param.push({
          role: 'assistant',
          content: fileContent
        })
      }
    }
  }

  return param
}

/**
 * 估算文本内容的 token 数量
 *
 * @param text - 需要估算的文本内容
 * @returns 返回估算的 token 数量
 */
export function estimateTextTokens(text: string) {
  return approximateTokenSize(text)
}

/**
 * 估算图片文件的 token 数量
 *
 * 根据图片文件大小计算预估的 token 数量。
 * 当前使用简单的文件大小除以 100 的方式进行估算。
 *
 * @param file - 图片文件对象
 * @returns 返回估算的 token 数量
 */
export function estimateImageTokens(file: FileMetadata) {
  return Math.floor(file.size / 100)
}

/**
 * 估算用户输入内容（文本和文件）的 token 用量。
 *
 * 该函数只根据传入的 content（文本内容）和 files（文件列表）估算，
 * 不依赖完整的 Message 结构，也不会处理消息块、上下文等信息。
 *
 * @param {Object} params - 输入参数对象
 * @param {string} [params.content] - 用户输入的文本内容
 * @param {FileMetadata[]} [params.files] - 用户上传的文件列表（支持图片和文本）
 * @returns {Promise<Usage>} 返回一个 Usage 对象，包含 prompt_tokens、completion_tokens、total_tokens
 */
export async function estimateUserPromptUsage({
  content,
  files
}: {
  content?: string
  files?: FileMetadata[]
}): Promise<Usage> {
  let imageTokens = 0

  if (files && files.length > 0) {
    const images = files.filter(f => f.type === FileTypes.IMAGE)

    if (images.length > 0) {
      for (const image of images) {
        imageTokens = estimateImageTokens(image) + imageTokens
      }
    }
  }

  const tokens = estimateTextTokens(content || '')

  return {
    prompt_tokens: tokens,
    completion_tokens: tokens,
    total_tokens: tokens + (imageTokens ? imageTokens - 7 : 0)
  }
}

/**
 * 估算完整消息（Message）的 token 用量。
 *
 * 该函数会自动从 message 中提取主文本内容、推理内容（reasoningContent）和所有文件块，
 * 统计文本和图片的 token 数量，适用于对完整消息对象进行 usage 估算。
 *
 * @param {Partial<Message>} message - 消息对象，可以是完整或部分 Message
 * @returns {Promise<Usage>} 返回一个 Usage 对象，包含 prompt_tokens、completion_tokens、total_tokens
 */
export async function estimateMessageUsage(message: Partial<Message>): Promise<Usage> {
  const fileBlocks = await findFileBlocks(message as Message)
  const files = fileBlocks.map(f => f.file)

  let imageTokens = 0

  if (files.length > 0) {
    const images = files.filter(f => f.type === FileTypes.IMAGE)

    if (images.length > 0) {
      for (const image of images) {
        imageTokens = estimateImageTokens(image) + imageTokens
      }
    }
  }

  const content = await getMainTextContent(message as Message)
  const reasoningContent = await getThinkingContent(message as Message)
  const combinedContent = [content, reasoningContent].filter(s => s !== undefined).join(' ')
  const tokens = estimateTextTokens(combinedContent)

  return {
    prompt_tokens: tokens,
    completion_tokens: tokens,
    total_tokens: tokens + (imageTokens ? imageTokens - 7 : 0)
  }
}

export async function estimateMessagesUsage({
  assistant,
  messages
}: {
  assistant: Assistant
  messages: Message[]
}): Promise<Usage> {
  const outputMessage = messages.pop()!

  const prompt_tokens = await estimateHistoryTokens(assistant, messages)
  const { completion_tokens } = await estimateMessageUsage(outputMessage)

  return {
    prompt_tokens,
    completion_tokens,
    total_tokens: prompt_tokens + completion_tokens
  } as Usage
}

export async function estimateHistoryTokens(assistant: Assistant, msgs: Message[]) {
  logger.info('assistant', assistant.id, msgs.length)
  const { contextCount } = getAssistantSettings(assistant)
  const limitedByContext = takeRight(msgs, contextCount)
  const afterContextClear = filterAfterContextClearMessages(limitedByContext)
  const messages = await filterMessages(afterContextClear)

  if (messages.length === 0) {
    return estimateTextTokens(assistant.prompt || '')
  }

  const uasageTokens = messages
    .filter(m => m.usage)
    .reduce((acc, message) => {
      const inputTokens = message.usage?.total_tokens ?? 0
      const outputTokens = message.usage?.completion_tokens ?? 0
      return acc + (message.role === 'user' ? inputTokens : outputTokens)
    }, 0)

  const allMessages: MessageItem[][] = []

  for (const message of messages.filter(m => !m.usage)) {
    const items = await getMessageParam(message)
    allMessages.push(items)
  }

  const prompt = assistant.prompt || ''
  const input = flatten(allMessages)
    .map(m => m.content)
    .join('\n')

  return estimateTextTokens(prompt + input) + uasageTokens
}

// ==================== Context Management Token Estimation ====================

/**
 * Estimate tokens for a single message (for context strategies)
 *
 * Handles all message block types including images, files, tools, citations
 *
 * @param message - The message to estimate
 * @returns Estimated token count
 */
export async function estimateSingleMessageTokens(message: Message): Promise<number> {
  try {
    // Use existing message usage estimation
    const usage = await estimateMessageUsage(message)
    return usage.total_tokens
  } catch (error) {
    logger.error('Failed to estimate single message tokens:', error as Error, { messageId: message.id })
    // Fallback to simple estimation
    const content = await getMainTextContent(message)
    return estimateTextTokens(content)
  }
}

/**
 * Estimate total tokens for an array of messages
 *
 * @param messages - Array of messages to estimate
 * @returns Total estimated token count
 */
export async function estimateMessagesTokens(messages: Message[]): Promise<number> {
  let total = 0
  
  for (const message of messages) {
    total += await estimateSingleMessageTokens(message)
  }
  
  return total
}

/**
 * Estimate the total token usage for a conversation including system prompt
 *
 * @param messages - Array of messages in the conversation
 * @param systemPrompt - Optional system prompt text
 * @returns Total estimated token count
 */
export async function estimateConversationTokens(
  messages: Message[],
  systemPrompt?: string
): Promise<number> {
  let total = await estimateMessagesTokens(messages)

  if (systemPrompt) {
    total += estimateTextTokens(systemPrompt)
  }

  return total
}

/**
 * Find messages that fit within a token budget (from most recent)
 *
 * @param messages - Array of messages (oldest to newest)
 * @param tokenBudget - Maximum tokens allowed
 * @param systemPromptTokens - Tokens used by system prompt (already accounted for)
 * @returns Object with fitting messages and stats
 */
export async function findMessagesThatFit(
  messages: Message[],
  tokenBudget: number,
  systemPromptTokens: number = 0
): Promise<{
  fittingMessages: Message[]
  removedCount: number
  tokensSaved: number
}> {
  let availableBudget = tokenBudget - systemPromptTokens
  const fittingMessages: Message[] = []
  let removedCount = 0
  let tokensSaved = 0

  // Start from the end (most recent) and work backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    const messageTokens = await estimateSingleMessageTokens(message)

    if (messageTokens <= availableBudget) {
      fittingMessages.unshift(message) // Add to front to preserve order
      availableBudget -= messageTokens
    } else {
      removedCount++
      tokensSaved += messageTokens
    }
  }

  return {
    fittingMessages,
    removedCount,
    tokensSaved
  }
}

// ==================== Proactive Token Monitoring ====================

/**
 * Calculate comprehensive token budget breakdown for context management
 * Use this BEFORE sending messages to AI to check if context management is needed
 *
 * @param model - The model being used
 * @param messages - Messages to send
 * @param systemPrompt - Optional system prompt
 * @param maxOutputTokens - Expected max output tokens
 * @returns Detailed budget breakdown with warnings
 */
export async function getContextBudgetBreakdown(
  model: Assistant['model'],
  messages: Message[],
  systemPrompt?: string,
  maxOutputTokens?: number
): Promise<{
  modelLimit: number
  effectiveBudget: number
  systemPromptTokens: number
  maxOutputTokens: number
  currentMessageTokens: number
  availableForMessages: number
  isOverBudget: boolean
  overBudgetBy: number
  isNearLimit: boolean // > 85% usage
  warningThreshold: number // 85% of available
  criticalThreshold: number // 95% of available
  usagePercentage: number
}> {
  // Import here to avoid circular dependencies
  const {
    getModelContextLimit,
    getEffectiveContextBudget,
    MIN_RESPONSE_TOKEN_BUDGET
  } = await import('@/config/models/contextLimits')

  if (!model) {
    throw new Error('Model is required for token budget calculation')
  }

  const modelLimit = getModelContextLimit(model)
  const effectiveBudget = getEffectiveContextBudget(model)
  const systemPromptTokens = systemPrompt ? estimateTextTokens(systemPrompt) : 0
  const outputBudget = maxOutputTokens || MIN_RESPONSE_TOKEN_BUDGET
  const availableForMessages = effectiveBudget - systemPromptTokens - outputBudget
  const currentMessageTokens = await estimateMessagesTokens(messages)
  
  const isOverBudget = currentMessageTokens > availableForMessages
  const overBudgetBy = isOverBudget ? currentMessageTokens - availableForMessages : 0
  
  const usagePercentage = (currentMessageTokens / availableForMessages) * 100
  const warningThreshold = availableForMessages * 0.85
  const criticalThreshold = availableForMessages * 0.95
  const isNearLimit = currentMessageTokens > warningThreshold

  return {
    modelLimit,
    effectiveBudget,
    systemPromptTokens,
    maxOutputTokens: outputBudget,
    currentMessageTokens,
    availableForMessages,
    isOverBudget,
    overBudgetBy,
    isNearLimit,
    warningThreshold,
    criticalThreshold,
    usagePercentage
  }
}

/**
 * Check if context management should be triggered
 * Call this BEFORE sending to AI to prevent "input too large" errors
 *
 * @param model - The model being used
 * @param messages - Messages to check
 * @param systemPrompt - Optional system prompt
 * @param maxOutputTokens - Expected max output tokens
 * @returns Object with recommendation on whether to apply context management
 */
export async function shouldApplyContextManagement(
  model: Assistant['model'],
  messages: Message[],
  systemPrompt?: string,
  maxOutputTokens?: number
): Promise<{
  shouldApply: boolean
  reason: 'over_budget' | 'near_limit' | 'safe'
  breakdown: Awaited<ReturnType<typeof getContextBudgetBreakdown>>
  recommendation: string
}> {
  const breakdown = await getContextBudgetBreakdown(model, messages, systemPrompt, maxOutputTokens)

  if (breakdown.isOverBudget) {
    return {
      shouldApply: true,
      reason: 'over_budget',
      breakdown,
      recommendation: `Context exceeds budget by ${breakdown.overBudgetBy} tokens. Context management required.`
    }
  }

  if (breakdown.isNearLimit) {
    return {
      shouldApply: true,
      reason: 'near_limit',
      breakdown,
      recommendation: `Context at ${breakdown.usagePercentage.toFixed(1)}% of budget. Proactive management recommended.`
    }
  }

  return {
    shouldApply: false,
    reason: 'safe',
    breakdown,
    recommendation: `Context usage is safe (${breakdown.usagePercentage.toFixed(1)}%).`
  }
}

/**
 * Estimate tokens for tool result content
 * Used to check if tool results need condensation
 *
 * @param toolResult - Tool result content (any type)
 * @returns Estimated token count
 */
export function estimateToolResultTokens(toolResult: any): number {
  if (!toolResult) return 0
  
  try {
    // Convert to string if not already
    const content = typeof toolResult === 'string'
      ? toolResult
      : JSON.stringify(toolResult)
    
    return estimateTextTokens(content)
  } catch (error) {
    logger.error('Failed to estimate tool result tokens:', error as Error)
    // Conservative fallback
    return 1000
  }
}

/**
 * Estimate tokens for each message in an array
 *
 * @param messages - Array of messages
 * @returns Array of objects with message and its estimated tokens
 */
export async function estimateTokensPerMessage(
  messages: Message[]
): Promise<Array<{ message: Message; tokens: number }>> {
  const results: Array<{ message: Message; tokens: number }> = []
  
  for (const message of messages) {
    const tokens = await estimateSingleMessageTokens(message)
    results.push({ message, tokens })
  }
  
  return results
}

import type { ProviderId, ProviderSettingsMap } from '@cherrystudio/ai-core/provider'
import {
  formatPrivateKey,
  hasProviderConfig,
  ProviderConfigFactory
} from '@cherrystudio/ai-core/provider'
import { fetch } from 'expo/fetch'
import { cloneDeep, isEmpty } from 'lodash'
import type OpenAI from 'openai'

import { isOpenAIChatCompletionOnlyModel } from '@/config/models/default'
import { isNewApiProvider } from '@/config/providers'
import {
  getAwsBedrockAccessKeyId,
  getAwsBedrockApiKey,
  getAwsBedrockAuthType,
  getAwsBedrockRegion,
  getAwsBedrockSecretAccessKey
} from '@/hooks/useAwsBedrock'
import { createVertexProvider, isVertexAIConfigured } from '@/hooks/useVertexAI'
import { generateSignature } from '@/integration/cherryai'
import { loggerService } from '@/services/LoggerService'
import { getProviderByModel } from '@/services/ProviderService'
import store from '@/store'
import {
  isAnthropicProvider,
  isAzureFoundryProvider,
  isAzureOpenAIProvider,
  isCherryAIProvider,
  isGeminiProvider,
  isOllamaProvider,
  isPerplexityProvider,
  isSupportStreamOptionsProvider,
  isSystemProvider,
  isVertexProvider,
  type Model,
  type Provider,
  SystemProviderIds
} from '@/types/assistant'
import { storage } from '@/utils'
import {
  formatApiHost,
  formatAzureFoundryApiHost,
  formatAzureOpenAIApiHost,
  formatOllamaApiHost,
  formatVertexApiHost,
  isWithTrailingSharp,
  routeToEndpoint
} from '@/utils/api'

import {
  aihubmixProviderCreator,
  newApiResolverCreator,
  vertexAnthropicProviderCreator
} from './config'
import { azureAnthropicProviderCreator } from './config/azure-anthropic'
import { azureFoundryProviderCreator } from './config/azure-foundry'
import { COPILOT_DEFAULT_HEADERS } from './constant'
import { getAiSdkProviderId } from './factory'

const logger = loggerService.withContext('ProviderConfigProcessor')

/**
 * 获取轮询的API key
 * 复用legacy架构的多key轮询逻辑
 */
function getRotatedApiKey(provider: Provider): string {
  const keys = provider.apiKey.split(',').map((key) => key.trim())
  const keyName = `provider:${provider.id}:last_used_key`

  if (keys.length === 1) {
    return keys[0]
  }

  const lastUsedKey = storage.getString(keyName)

  if (!lastUsedKey) {
    storage.set(keyName, keys[0])
    return keys[0]
  }

  const currentIndex = keys.indexOf(lastUsedKey)
  const nextIndex = (currentIndex + 1) % keys.length
  const nextKey = keys[nextIndex]
  storage.set(keyName, nextKey)

  return nextKey
}

/**
 * 处理特殊provider的转换逻辑
 */
function handleSpecialProviders(model: Model, provider: Provider): Provider {
  if (isNewApiProvider(provider)) {
    return newApiResolverCreator(model, provider)
  }

  if (isSystemProvider(provider)) {
    if (provider.id === 'aihubmix') {
      return aihubmixProviderCreator(model, provider)
    }
    if (provider.id === 'vertexai') {
      return vertexAnthropicProviderCreator(model, provider)
    }
  }

  // Handle Azure Foundry multi-model routing
  if (isAzureFoundryProvider(provider)) {
    return azureFoundryProviderCreator(model, provider)
  }

  // Legacy Azure OpenAI Anthropic routing
  if (isAzureOpenAIProvider(provider)) {
    return azureAnthropicProviderCreator(model, provider)
  }

  return provider
}

/**
 * Format and normalize the API host URL for a provider.
 * Handles provider-specific URL formatting rules (e.g., appending version paths, Azure formatting).
 *
 * @param provider - The provider whose API host is to be formatted.
 * @returns A new provider instance with the formatted API host.
 */
export function formatProviderApiHost(provider: Provider): Provider {
  const formatted = { ...provider }
  const appendApiVersion = !isWithTrailingSharp(provider.apiHost)
  if (formatted.anthropicApiHost) {
    formatted.anthropicApiHost = formatApiHost(formatted.anthropicApiHost, appendApiVersion)
  }

  if (isAnthropicProvider(provider)) {
    const baseHost = formatted.anthropicApiHost || formatted.apiHost
    // AI SDK needs /v1 in baseURL, Anthropic SDK will strip it in getSdkClient
    formatted.apiHost = formatApiHost(baseHost, appendApiVersion)
    if (!formatted.anthropicApiHost) {
      formatted.anthropicApiHost = formatted.apiHost
    }
  } else if (
    formatted.id === SystemProviderIds.copilot ||
    formatted.id === SystemProviderIds.github
  ) {
    formatted.apiHost = formatApiHost(formatted.apiHost, false)
  } else if (isOllamaProvider(formatted)) {
    formatted.apiHost = formatOllamaApiHost(formatted.apiHost)
  } else if (isGeminiProvider(formatted)) {
    formatted.apiHost = formatApiHost(formatted.apiHost, appendApiVersion, 'v1beta')
  } else if (isAzureOpenAIProvider(formatted)) {
    formatted.apiHost = formatAzureOpenAIApiHost(formatted.apiHost)
  } else if (isAzureFoundryProvider(formatted)) {
    formatted.apiHost = formatAzureFoundryApiHost(formatted.apiHost)
    if (formatted.openaiApiHost) {
      formatted.openaiApiHost = formatAzureOpenAIApiHost(formatted.openaiApiHost)
    }
  } else if (isVertexProvider(formatted)) {
    formatted.apiHost = formatVertexApiHost(formatted)
  } else if (isCherryAIProvider(formatted)) {
    formatted.apiHost = formatApiHost(formatted.apiHost, false)
  } else if (isPerplexityProvider(formatted)) {
    formatted.apiHost = formatApiHost(formatted.apiHost, false)
  } else {
    formatted.apiHost = formatApiHost(formatted.apiHost, appendApiVersion)
  }
  return formatted
}

/**
 * Retrieve the effective Provider configuration for the given model.
 * Applies all necessary transformations (special-provider handling, URL formatting, etc.).
 *
 * @param model - The model whose provider is to be resolved.
 * @returns A new Provider instance with all adaptations applied.
 */
export function getActualProvider(model: Model): Provider {
  const baseProvider = getProviderByModel(model)

  return adaptProvider({ provider: baseProvider, model })
}

/**
 * Transforms a provider configuration by applying model-specific adaptations and normalizing its API host.
 * The transformations are applied in the following order:
 * 1. Model-specific provider handling (e.g., New-API, system providers, Azure OpenAI)
 * 2. API host formatting (provider-specific URL normalization)
 *
 * @param provider - The base provider configuration to transform.
 * @param model - The model associated with the provider; optional but required for special-provider handling.
 * @returns A new Provider instance with all transformations applied.
 */
export function adaptProvider({
  provider,
  model
}: {
  provider: Provider
  model?: Model
}): Provider {
  let adaptedProvider = cloneDeep(provider)

  // Apply transformations in order
  if (model) {
    adaptedProvider = handleSpecialProviders(model, adaptedProvider)
  }
  adaptedProvider = formatProviderApiHost(adaptedProvider)

  return adaptedProvider
}

/**
 * 将 Provider 配置转换为新 AI SDK 格式
 * 简化版：利用新的别名映射系统
 */
export function providerToAiSdkConfig(
  actualProvider: Provider,
  model: Model
): {
  providerId: ProviderId | 'openai-compatible'
  options: ProviderSettingsMap[keyof ProviderSettingsMap]
} {
  const aiSdkProviderId = getAiSdkProviderId(actualProvider)
  logger.debug('providerToAiSdkConfig', { aiSdkProviderId })

  // 构建基础配置
  const { baseURL, endpoint } = routeToEndpoint(actualProvider.apiHost)
  const baseConfig = {
    baseURL: baseURL,
    apiKey: getRotatedApiKey(actualProvider)
  }
  let includeUsage: OpenAI.ChatCompletionStreamOptions['include_usage'] = undefined
  if (isSupportStreamOptionsProvider(actualProvider)) {
    includeUsage = store.getState().llm.settings.openAI?.streamOptions?.includeUsage
  }

  const isCopilotProvider = actualProvider.id === SystemProviderIds.copilot
  if (isCopilotProvider) {
    const storedHeaders = store.getState().copilot?.defaultHeaders ?? {}
    const options = ProviderConfigFactory.fromProvider(
      'github-copilot-openai-compatible',
      baseConfig,
      {
        headers: {
          ...COPILOT_DEFAULT_HEADERS,
          ...storedHeaders,
          ...actualProvider.extra_headers
        },
        name: actualProvider.id,
        includeUsage
      }
    )

    return {
      providerId: 'github-copilot-openai-compatible',
      options
    }
  }

  if (isOllamaProvider(actualProvider)) {
    return {
      providerId: 'ollama',
      options: {
        ...baseConfig,
        headers: {
          ...actualProvider.extra_headers,
          Authorization: !isEmpty(baseConfig.apiKey) ? `Bearer ${baseConfig.apiKey}` : undefined
        }
      }
    }
  }

  // 处理OpenAI模式
  const extraOptions: any = {}
  extraOptions.endpoint = endpoint // endpoint could be useful even for chat if custom
  if (actualProvider.type === 'openai-response' && !isOpenAIChatCompletionOnlyModel(model)) {
    extraOptions.mode = 'responses'
    // Ensure standard OpenAI API uses /v1 for responses if baseConfig doesn't have it
    if (aiSdkProviderId === 'openai' && !baseConfig.baseURL.endsWith('/v1')) {
      baseConfig.baseURL = formatApiHost(baseConfig.baseURL, true)
    }
  } else if (aiSdkProviderId === 'openai' || (aiSdkProviderId === 'cherryin' && actualProvider.type === 'openai')) {
    extraOptions.mode = 'chat'
  }

  // 添加额外headers
  if (actualProvider.extra_headers) {
    extraOptions.headers = actualProvider.extra_headers

    // copy from openaiBaseClient/openaiResponseApiClient
    if (aiSdkProviderId === 'openai') {
      extraOptions.headers = {
        ...extraOptions.headers,
        'HTTP-Referer': 'https://cherry-ai.com',
        'X-Title': 'The Boss',
        'X-Api-Key': baseConfig.apiKey
      }
    }
  }

  // copilot
  if (actualProvider.id === 'copilot') {
    extraOptions.headers = {
      ...extraOptions.headers,
      'editor-version': 'vscode/1.97.2',
      'copilot-vision-request': 'true'
    }
  }

   // azure foundry - unified inference API for all non-OpenAI/Anthropic models
   if (actualProvider.id === 'azure-foundry-inference') {
    const inferenceBaseURL = actualProvider.apiHost + '/models'
    return {
      providerId: 'openai-compatible',
      options: {
        baseURL: inferenceBaseURL,
        apiKey: baseConfig.apiKey,
        name: 'azure-foundry',
        headers: {
          'api-version': actualProvider.apiVersion || '2024-10-21',
          ...actualProvider.extra_headers
        },
        includeUsage
      }
    }
  }

  // azure
  if (aiSdkProviderId === 'azure-responses') {
    extraOptions.mode = 'responses'
  } else if (aiSdkProviderId === 'azure') {
    extraOptions.mode = 'chat'
  }

  // bedrock
  if (aiSdkProviderId === 'bedrock') {
    const authType = getAwsBedrockAuthType()
    extraOptions.region = getAwsBedrockRegion()

    if (authType === 'apiKey') {
      extraOptions.apiKey = getAwsBedrockApiKey()
    } else {
      extraOptions.accessKeyId = getAwsBedrockAccessKeyId()
      extraOptions.secretAccessKey = getAwsBedrockSecretAccessKey()
    }
  }

  // google-vertex
  if (aiSdkProviderId === 'google-vertex' || aiSdkProviderId === 'google-vertex-anthropic') {
    if (!isVertexAIConfigured()) {
      throw new Error('VertexAI is not configured. Please configure project, location and service account credentials.')
    }

    const { project, location, googleCredentials } = createVertexProvider(actualProvider)
    extraOptions.project = project
    extraOptions.location = location
    extraOptions.googleCredentials = {
      ...googleCredentials,
      privateKey: formatPrivateKey(googleCredentials.privateKey)
    }
    // Mobile app might not need the headers code from desktop if using AI SDK directly,
    // AI SDK handles google-vertex auth internally if credentials provided.
    
    // Desktop code adapts baseURL. Let's start with baseConfig from routeToEndpoint
    // but google-vertex provider in AI SDK does URL construction.
    // However, if we are bridging... AI SDK 'google-vertex' provider logic:
    // It takes project/location/googleCredentials.
    // The baseConfig.baseURL logic in desktop:
    baseConfig.baseURL += aiSdkProviderId === 'google-vertex' ? '/publishers/google' : '/publishers/anthropic/models'
  }

  if (aiSdkProviderId === 'cherryin') {
    if (model.endpoint_type) {
      extraOptions.endpointType = model.endpoint_type
    }
  }

  // 如果AI SDK支持该provider，使用原生配置
  if (hasProviderConfig(aiSdkProviderId) && aiSdkProviderId !== 'openai-compatible') {
    const options = ProviderConfigFactory.fromProvider(aiSdkProviderId, baseConfig, extraOptions)
    return {
      providerId: aiSdkProviderId as ProviderId,
      options
    }
  }

  // 否则fallback到openai-compatible
  const options = ProviderConfigFactory.createOpenAICompatible(baseConfig.baseURL, baseConfig.apiKey)
  return {
    providerId: 'openai-compatible',
    options: {
      ...options,
      name: actualProvider.id,
      ...extraOptions,
      includeUsage
    }
  }
}

/**
 * 检查是否支持使用新的AI SDK
 * 简化版：利用新的别名映射和动态provider系统
 */
export function isModernSdkSupported(provider: Provider): boolean {
  // 特殊检查：vertexai需要配置完整
  if (provider.type === 'vertexai' && !isVertexAIConfigured()) {
    return false
  }

  // 使用getAiSdkProviderId获取映射后的providerId，然后检查AI SDK是否支持
  const aiSdkProviderId = getAiSdkProviderId(provider)

  // 如果映射到了支持的provider，则支持现代SDK
  return hasProviderConfig(aiSdkProviderId)
}

/**
 * 准备特殊provider的配置,主要用于异步处理的配置
 */
export async function prepareSpecialProviderConfig(
  provider: Provider,
  config: ReturnType<typeof providerToAiSdkConfig>
) {
  switch (provider.id) {
    case 'copilot': {
      // window.api.copilot is not available on mobile.
      // Need alternative or stub.
      // Assuming mobile can't fully support Copilot auth flow yet if it relies on VSCode token extraction?
      // Or maybe we treat it as API Key provided by user?
      // Desktop uses window.api which bridges to main process.
      // For now, I will comment out the window.api call and assume manual token or skip copilot auth flow until later.
      // But user request didn't strictly ask for Copilot auth porting, just provider implementation.
      // Desktop implementation:
      // const { token } = await window.api.copilot.getToken(headers)
      // config.options.apiKey = token
      // config.options.headers = { ...headers, ...config.options.headers }
      
      // Mobile stub:
      // If we have a token stored, we use it.
      // Warning: This part is incomplete without the bridge.
      break
    }

    case 'cherryai': {
      config.options.fetch = async (url, options) => {
        // 在这里对最终参数进行签名
        const signature = await generateSignature({
          method: 'POST',
          path: '/chat/completions',
          query: '',
          body: JSON.parse(options.body)
        })
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            ...signature
          }
        })
      }
      break
    }

    case 'anthropic': {
      // Mobile anthropic oauth handling?
      // Desktop uses window.api.anthropic_oauth.
      // Mobile needs a different strategy or manual key.
      // Checking desktop:
      /*
      if (provider.authType === 'oauth') {
        const oauthToken = await window.api.anthropic_oauth.getAccessToken()
        config.options = {
          ...config.options,
          headers: {
            ...(config.options.headers ? config.options.headers : {}),
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            Authorization: `Bearer ${oauthToken}`
          },
          baseURL: 'https://api.anthropic.com/v1',
          apiKey: ''
        }
      }
      */
     // I will leave this out for now as it requires specific oauth bridge.
     // Standard API key auth works via providerToAiSdkConfig default logic.
     break
    }
  }

  return config
}

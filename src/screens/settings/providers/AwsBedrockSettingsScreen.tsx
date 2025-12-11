import type { RouteProp } from '@react-navigation/native'
import { useRoute } from '@react-navigation/native'
import { Button } from 'heroui-native'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView } from 'react-native'

import {
  Container,
  ExternalLink,
  Group,
  GroupTitle,
  HeaderBar,
  SafeAreaContainer,
  Text,
  TextField,
  XStack,
  YStack
} from '@/componentsV2'
import { Eye, EyeOff } from '@/componentsV2/icons/LucideIcon'
import PressableRow from '@/componentsV2/layout/PressableRow'
import { PROVIDER_URLS } from '@/config/providers'
import { useAwsBedrockSettings } from '@/hooks/useAwsBedrock'
import { useProvider } from '@/hooks/useProviders'
import type { ProvidersStackParamList } from '@/navigators/settings/ProvidersStackNavigator'

type AwsBedrockSettingsRouteProp = RouteProp<ProvidersStackParamList, 'AwsBedrockSettingsScreen'>

export default function AwsBedrockSettingsScreen() {
  const { t } = useTranslation()
  const route = useRoute<AwsBedrockSettingsRouteProp>()

  const { providerId } = route.params
  const { provider, isLoading } = useProvider(providerId)

  const {
    authType,
    accessKeyId,
    secretAccessKey,
    apiKey,
    region,
    setAuthType,
    setAccessKeyId,
    setSecretAccessKey,
    setApiKey,
    setRegion
  } = useAwsBedrockSettings()

  const [showSecretKey, setShowSecretKey] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [localAccessKeyId, setLocalAccessKeyId] = useState(accessKeyId)
  const [localSecretAccessKey, setLocalSecretAccessKey] = useState(secretAccessKey)
  const [localApiKey, setLocalApiKey] = useState(apiKey)
  const [localRegion, setLocalRegion] = useState(region)

  useEffect(() => {
    setLocalAccessKeyId(accessKeyId)
    setLocalSecretAccessKey(secretAccessKey)
    setLocalApiKey(apiKey)
    setLocalRegion(region)
  }, [accessKeyId, secretAccessKey, apiKey, region])

  const providerConfig = PROVIDER_URLS['aws-bedrock']
  const apiKeyWebsite = providerConfig?.websites?.apiKey

  if (isLoading) {
    return (
      <SafeAreaContainer className="items-center justify-center">
        <ActivityIndicator />
      </SafeAreaContainer>
    )
  }

  if (!provider) {
    return (
      <SafeAreaContainer>
        <HeaderBar title={t('settings.provider.not_found')} />
        <Container>
          <Text className="text-zinc-400/400 py-6 text-center">{t('settings.provider.not_found_message')}</Text>
        </Container>
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer className="flex-1">
      <HeaderBar title={t('settings.provider.aws-bedrock.title')} />
      <Container>
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack className="gap-6">
            {/* Info Alert */}
            <YStack className="gap-2">
              <Text className="text-sm opacity-60">{t('settings.provider.aws-bedrock.description')}</Text>
            </YStack>

            {/* Auth Type Selection */}
            <YStack className="gap-2">
              <GroupTitle>{t('settings.provider.aws-bedrock.auth_type')}</GroupTitle>
              <Group>
                <PressableRow onPress={() => setAuthType('iam')}>
                  <Text>{t('settings.provider.aws-bedrock.auth_type_iam')}</Text>
                  <XStack className="items-center gap-2">
                    {authType === 'iam' && <Text className="primary-text">✓</Text>}
                  </XStack>
                </PressableRow>
                <PressableRow onPress={() => setAuthType('apiKey')}>
                  <Text>{t('settings.provider.aws-bedrock.auth_type_api_key')}</Text>
                  <XStack className="items-center gap-2">
                    {authType === 'apiKey' && <Text className="primary-text">✓</Text>}
                  </XStack>
                </PressableRow>
              </Group>
              <Text className="px-3 text-xs opacity-40">{t('settings.provider.aws-bedrock.auth_type_help')}</Text>
            </YStack>

            {/* IAM Credentials */}
            {authType === 'iam' && (
              <>
                <YStack className="gap-2">
                  <GroupTitle>{t('settings.provider.aws-bedrock.access_key_id')}</GroupTitle>
                  <TextField>
                    <TextField.Input
                      className="h-12"
                      value={localAccessKeyId}
                      placeholder="Access Key ID"
                      onChangeText={setLocalAccessKeyId}
                      onBlur={() => setAccessKeyId(localAccessKeyId)}
                    />
                  </TextField>
                  <Text className="px-3 text-xs opacity-40">
                    {t('settings.provider.aws-bedrock.access_key_id_help')}
                  </Text>
                </YStack>

                <YStack className="gap-2">
                  <GroupTitle>{t('settings.provider.aws-bedrock.secret_access_key')}</GroupTitle>
                  <TextField>
                    <TextField.Input
                      className="h-12 pr-0"
                      value={localSecretAccessKey}
                      secureTextEntry={!showSecretKey}
                      placeholder="Secret Access Key"
                      onChangeText={setLocalSecretAccessKey}
                      onBlur={() => setSecretAccessKey(localSecretAccessKey)}>
                      <TextField.InputEndContent>
                        <Button
                          feedbackVariant="ripple"
                          size="sm"
                          variant="ghost"
                          isIconOnly
                          onPress={() => setShowSecretKey(!showSecretKey)}>
                          <Button.Label>
                            {showSecretKey ? <EyeOff className="text-white" size={16} /> : <Eye size={16} />}
                          </Button.Label>
                        </Button>
                      </TextField.InputEndContent>
                    </TextField.Input>
                  </TextField>
                  <XStack className="justify-between px-3">
                    <Text className="text-xs opacity-40">
                      {t('settings.provider.aws-bedrock.secret_access_key_help')}
                    </Text>
                    {apiKeyWebsite && <ExternalLink href={apiKeyWebsite} content={t('settings.provider.get_api_key')} />}
                  </XStack>
                </YStack>
              </>
            )}

            {/* API Key Auth */}
            {authType === 'apiKey' && (
              <YStack className="gap-2">
                <GroupTitle>{t('settings.provider.aws-bedrock.api_key')}</GroupTitle>
                <TextField>
                  <TextField.Input
                    className="h-12 pr-0"
                    value={localApiKey}
                    secureTextEntry={!showApiKey}
                    placeholder="Bedrock API Key"
                    onChangeText={setLocalApiKey}
                    onBlur={() => setApiKey(localApiKey)}>
                    <TextField.InputEndContent>
                      <Button
                        feedbackVariant="ripple"
                        size="sm"
                        variant="ghost"
                        isIconOnly
                        onPress={() => setShowApiKey(!showApiKey)}>
                        <Button.Label>
                          {showApiKey ? <EyeOff className="text-white" size={16} /> : <Eye size={16} />}
                        </Button.Label>
                      </Button>
                    </TextField.InputEndContent>
                  </TextField.Input>
                </TextField>
                <Text className="px-3 text-xs opacity-40">{t('settings.provider.aws-bedrock.api_key_help')}</Text>
              </YStack>
            )}

            {/* Region */}
            <YStack className="gap-2">
              <GroupTitle>{t('settings.provider.aws-bedrock.region')}</GroupTitle>
              <TextField>
                <TextField.Input
                  className="h-12"
                  value={localRegion}
                  placeholder="us-east-1"
                  onChangeText={setLocalRegion}
                  onBlur={() => setRegion(localRegion)}
                />
              </TextField>
              <Text className="px-3 text-xs opacity-40">{t('settings.provider.aws-bedrock.region_help')}</Text>
            </YStack>
          </YStack>
        </ScrollView>
      </Container>
    </SafeAreaContainer>
  )
}

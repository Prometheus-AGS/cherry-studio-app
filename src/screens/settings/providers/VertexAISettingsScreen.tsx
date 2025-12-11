import type { RouteProp } from '@react-navigation/native'
import { useRoute } from '@react-navigation/native'
import { Button } from 'heroui-native'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native'

import {
  Container,
  ExternalLink,
  GroupTitle,
  HeaderBar,
  SafeAreaContainer,
  Text,
  TextField,
  XStack,
  YStack
} from '@/componentsV2'
import { Eye, EyeOff } from '@/componentsV2/icons/LucideIcon'
import { PROVIDER_URLS } from '@/config/providers'
import { useProvider } from '@/hooks/useProviders'
import { useVertexAISettings } from '@/hooks/useVertexAI'
import type { ProvidersStackParamList } from '@/navigators/settings/ProvidersStackNavigator'

type VertexAISettingsRouteProp = RouteProp<ProvidersStackParamList, 'VertexAISettingsScreen'>

export default function VertexAISettingsScreen() {
  const { t } = useTranslation()
  const route = useRoute<VertexAISettingsRouteProp>()

  const { providerId } = route.params
  const { provider, isLoading } = useProvider(providerId)

  const {
    projectId,
    location,
    serviceAccount,
    setProjectId,
    setLocation,
    setServiceAccountPrivateKey,
    setServiceAccountClientEmail
  } = useVertexAISettings()

  const [showClientEmail, setShowClientEmail] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showProjectId, setShowProjectId] = useState(false)

  const [localProjectId, setLocalProjectId] = useState(projectId)
  const [localLocation, setLocalLocation] = useState(location)
  const [localClientEmail, setLocalClientEmail] = useState(serviceAccount.clientEmail)
  const [localPrivateKey, setLocalPrivateKey] = useState(serviceAccount.privateKey)

  useEffect(() => {
    setLocalProjectId(projectId)
    setLocalLocation(location)
    setLocalClientEmail(serviceAccount.clientEmail)
    setLocalPrivateKey(serviceAccount.privateKey)
  }, [projectId, location, serviceAccount])

  const providerConfig = PROVIDER_URLS['vertexai']
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
      <HeaderBar title={t('settings.provider.vertex_ai.service_account.title')} />
      <Container>
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack className="gap-6">
            {/* Info Alert */}
            <YStack className="gap-2">
              <Text className="text-sm opacity-60">
                {t('settings.provider.vertex_ai.service_account.description')}
              </Text>
            </YStack>

            {/* Service Account Client Email */}
            <YStack className="gap-2">
              <GroupTitle>{t('settings.provider.vertex_ai.service_account.client_email')}</GroupTitle>
              <TextField>
                <TextField.Input
                  className="h-12 pr-0"
                  value={localClientEmail}
                  secureTextEntry={!showClientEmail}
                  placeholder={t('settings.provider.vertex_ai.service_account.client_email_placeholder')}
                  onChangeText={setLocalClientEmail}
                  onBlur={() => setServiceAccountClientEmail(localClientEmail)}>
                  <TextField.InputEndContent>
                    <Button
                      feedbackVariant="ripple"
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      onPress={() => setShowClientEmail(!showClientEmail)}>
                      <Button.Label>
                        {showClientEmail ? <EyeOff className="text-white" size={16} /> : <Eye size={16} />}
                      </Button.Label>
                    </Button>
                  </TextField.InputEndContent>
                </TextField.Input>
              </TextField>
              <Text className="px-3 text-xs opacity-40">
                {t('settings.provider.vertex_ai.service_account.client_email_help')}
              </Text>
            </YStack>

            {/* Service Account Private Key */}
            <YStack className="gap-2">
              <GroupTitle>{t('settings.provider.vertex_ai.service_account.private_key')}</GroupTitle>
              <View className="relative rounded-xl bg-zinc-800/50" style={{ minHeight: 160 }}>
                <Button
                  feedbackVariant="ripple"
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
                  onPress={() => setShowPrivateKey(!showPrivateKey)}>
                  <Button.Label>
                    {showPrivateKey ? <EyeOff className="text-white" size={16} /> : <Eye size={16} />}
                  </Button.Label>
                </Button>
                <TextInput
                  className="flex-1 text-foreground rounded-xl"
                  value={localPrivateKey}
                  secureTextEntry={!showPrivateKey}
                  placeholder={t('settings.provider.vertex_ai.service_account.private_key_placeholder')}
                  placeholderTextColor="#666"
                  onChangeText={setLocalPrivateKey}
                  onBlur={() => setServiceAccountPrivateKey(localPrivateKey)}
                  multiline
                  textAlignVertical="top"
                  style={{
                    minHeight: 160,
                    paddingTop: 12,
                    paddingBottom: 12,
                    paddingLeft: 12,
                    paddingRight: 48,
                    fontSize: 14
                  }}
                />
              </View>
              <XStack className="justify-between px-3">
                <Text className="text-xs opacity-40">
                  {t('settings.provider.vertex_ai.service_account.private_key_help')}
                </Text>
                {apiKeyWebsite && <ExternalLink href={apiKeyWebsite} content={t('settings.provider.get_api_key')} />}
              </XStack>
            </YStack>

            {/* Project ID */}
            <YStack className="gap-2">
              <GroupTitle>{t('settings.provider.vertex_ai.project_id')}</GroupTitle>
              <TextField>
                <TextField.Input
                  className="h-12 pr-0"
                  value={localProjectId}
                  secureTextEntry={!showProjectId}
                  placeholder={t('settings.provider.vertex_ai.project_id_placeholder')}
                  onChangeText={setLocalProjectId}
                  onBlur={() => setProjectId(localProjectId)}>
                  <TextField.InputEndContent>
                    <Button
                      feedbackVariant="ripple"
                      size="sm"
                      variant="ghost"
                      isIconOnly
                      onPress={() => setShowProjectId(!showProjectId)}>
                      <Button.Label>
                        {showProjectId ? <EyeOff className="text-white" size={16} /> : <Eye size={16} />}
                      </Button.Label>
                    </Button>
                  </TextField.InputEndContent>
                </TextField.Input>
              </TextField>
              <Text className="px-3 text-xs opacity-40">{t('settings.provider.vertex_ai.project_id_help')}</Text>
            </YStack>

            {/* Location */}
            <YStack className="gap-2">
              <GroupTitle>{t('settings.provider.vertex_ai.location')}</GroupTitle>
              <TextField>
                <TextField.Input
                  className="h-12"
                  value={localLocation}
                  placeholder="us-central1"
                  onChangeText={setLocalLocation}
                  onBlur={() => setLocation(localLocation)}
                />
              </TextField>
              <Text className="px-3 text-xs opacity-40">{t('settings.provider.vertex_ai.location_help')}</Text>
            </YStack>
          </YStack>
        </ScrollView>
      </Container>
    </SafeAreaContainer>
  )
}

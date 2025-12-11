import { createStackNavigator, TransitionPresets } from '@react-navigation/stack'
import React from 'react'

import { ContextManagementSettingsScreen } from '@/screens/settings/context/ContextManagementSettingsScreen'

export type ContextManagementStackParamList = {
  ContextManagementSettingsScreen: undefined
}

const Stack = createStackNavigator<ContextManagementStackParamList>()

export default function ContextManagementStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureResponseDistance: 9999,
        ...TransitionPresets.SlideFromRightIOS
      }}>
      <Stack.Screen name="ContextManagementSettingsScreen" component={ContextManagementSettingsScreen} />
    </Stack.Navigator>
  )
}
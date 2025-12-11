import React from 'react'
import { View } from 'react-native'

import Text from './Text'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantStyles = {
  primary: 'bg-primary/20 border-primary',
  secondary: 'bg-secondary/20 border-secondary',
  success: 'bg-green-500/20 border-green-500',
  warning: 'bg-yellow-500/20 border-yellow-500',
  error: 'bg-red-500/20 border-red-500'
}

const sizeStyles = {
  sm: 'px-2 py-0.5',
  md: 'px-3 py-1',
  lg: 'px-4 py-1.5'
}

const textSizeStyles = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
}

export function Badge({ children, variant = 'primary', size = 'md', className = '' }: BadgeProps): React.ReactElement {
  const variantClass = variantStyles[variant]
  const sizeClass = sizeStyles[size]
  const textSize = textSizeStyles[size]

  return (
    <View className={`rounded-full border ${variantClass} ${sizeClass} ${className}`}>
      <Text className={`${textSize} font-medium`}>{children}</Text>
    </View>
  )
}

export default Badge
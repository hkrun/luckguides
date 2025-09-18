import React from 'react'
import { cn } from '@/lib/utils'

// 直接导入所有需要的国旗组件
import CN from 'country-flag-icons/react/3x2/CN'
import US from 'country-flag-icons/react/3x2/US'
import JP from 'country-flag-icons/react/3x2/JP'
import KR from 'country-flag-icons/react/3x2/KR'
import FR from 'country-flag-icons/react/3x2/FR'
import DE from 'country-flag-icons/react/3x2/DE'
import ES from 'country-flag-icons/react/3x2/ES'
import IT from 'country-flag-icons/react/3x2/IT'
import PT from 'country-flag-icons/react/3x2/PT'
import RU from 'country-flag-icons/react/3x2/RU'
import SA from 'country-flag-icons/react/3x2/SA'
import IN from 'country-flag-icons/react/3x2/IN'
import TH from 'country-flag-icons/react/3x2/TH'
import VN from 'country-flag-icons/react/3x2/VN'

interface FlagIconProps {
  countryCode: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-4 h-3',
  md: 'w-6 h-4',
  lg: 'w-8 h-6'
}

// 国旗组件映射
const flagComponents: Record<string, React.ComponentType<any>> = {
  CN,
  US,
  JP,
  KR,
  FR,
  DE,
  ES,
  IT,
  PT,
  RU,
  SA,
  IN,
  TH,
  VN,
}

export function FlagIcon({ countryCode, className, size = 'md' }: FlagIconProps) {
  // 处理特殊情况
  if (countryCode === 'auto') {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100 rounded-sm', sizeClasses[size], className)}>
        <span className="text-xs text-gray-500">🌐</span>
      </div>
    )
  }

  const FlagComponent = flagComponents[countryCode.toUpperCase()]

  if (!FlagComponent) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100 rounded-sm', sizeClasses[size], className)}>
        <span className="text-xs text-gray-500">{countryCode.toUpperCase()}</span>
      </div>
    )
  }

  return (
    <FlagComponent
      className={cn('rounded-sm object-cover', sizeClasses[size], className)}
      title={countryCode.toUpperCase()}
    />
  )
}

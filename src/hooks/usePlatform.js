import { Capacitor } from '@capacitor/core'

export function usePlatform() {
  const platform = Capacitor.getPlatform() // 'web' | 'ios' | 'android'
  const isNative = platform !== 'web'
  const isIOS = platform === 'ios'
  const isAndroid = platform === 'android'
  return { platform, isNative, isIOS, isAndroid }
}

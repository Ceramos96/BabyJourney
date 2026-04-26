import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { usePlatform } from './usePlatform.js'

export function useHaptics() {
  const { isNative } = usePlatform()

  const impact = async (style = ImpactStyle.Medium) => {
    if (!isNative) return
    try { await Haptics.impact({ style }) } catch {}
  }

  const notify = async (type = NotificationType.Success) => {
    if (!isNative) return
    try { await Haptics.notification({ type }) } catch {}
  }

  const selection = async () => {
    if (!isNative) return
    try { await Haptics.selectionStart() } catch {}
  }

  return { impact, notify, selection, ImpactStyle, NotificationType }
}

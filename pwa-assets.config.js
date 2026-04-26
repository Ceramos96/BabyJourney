import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      // sage-700 background for the maskable variant
      padding: 0.18,
      resizeOptions: { background: '#6B7A4F' },
    },
    apple: {
      sizes: [180],
      padding: 0.2,
      resizeOptions: { background: '#FBF8F2' },
    },
  },
  images: ['public/icon.svg'],
})

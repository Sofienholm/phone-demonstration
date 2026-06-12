import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // MindAR bundler sin egen three + vores GLTFLoader skal dele ÉN three-instans.
  resolve: {
    dedupe: ['three'],
  },
  // host: true gør at iPhonen kan ramme dev-serveren over lokalt netværk.
  server: {
    host: true,
  },
})

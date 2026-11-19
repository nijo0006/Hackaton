import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { networkInterfaces } from 'node:os'
import { defineConfig } from 'vite'

/** Computerens adresse på det lokale netværk (fx 10.136.130.184), så andre enheder kan åbne appen. */
function lanAddress(): string {
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) return net.address
    }
  }
  return ''
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  define: {
    __LAN_HOST__: JSON.stringify(command === 'serve' ? lanAddress() : ''),
  },
}))

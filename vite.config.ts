import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
	plugins: [
		react(),
		tailwindcss()
	],
	base: '/mex-os/',
	publicDir: 'mex-os-public',
	// Exclude root files from being processed
	server: {
		watch: {
			ignored: ['**/index.html']
		}
	},
	build: {
		outDir: 'mex-os',
		emptyOutDir: true,
		rollupOptions: {
			input: resolve(__dirname, 'mex-os-index.html')
		}
	}
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
	plugins: [react(), tailwindcss()],
	base: '/mex-os/',
	publicDir: 'mex-os-public',
	build: {
		outDir: 'mex-os',
		emptyOutDir: true,
		rollupOptions: {
			input: resolve(__dirname, 'mex-os-index.html')
		}
	}
})

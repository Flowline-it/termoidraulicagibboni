import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pocketbaseTarget = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

export default defineConfig({
	plugins: [react()],
	server: {
		host: true,
		port: 3000,
		strictPort: true,
		allowedHosts: ['.app.github.dev', '.github.dev', 'localhost'],
		proxy: {
			'/api': { target: pocketbaseTarget, changeOrigin: true },
			'/_/': { target: pocketbaseTarget, changeOrigin: true },
		},
	},
	preview: {
		host: true,
		port: 3000,
		allowedHosts: ['.app.github.dev', '.github.dev', 'localhost'],
		proxy: {
			'/api': { target: pocketbaseTarget, changeOrigin: true },
			'/_/': { target: pocketbaseTarget, changeOrigin: true },
		},
	},
	resolve: {
		extensions: ['.jsx', '.js', '.json'],
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
		},
	},
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
});

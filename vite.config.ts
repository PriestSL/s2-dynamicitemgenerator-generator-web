import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        minify: true
    },
    server: {
        port: Number(process.env.PORT) || 3000,
        host: true,
        allowedHosts: true
    },
    preview: {
        host: true,
        port: Number(process.env.PORT) || 3000,
        allowedHosts: true
    }
});

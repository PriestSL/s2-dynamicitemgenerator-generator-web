import mkcert from 'vite-plugin-mkcert'

export default {
    build: {
        minify: true
    },
    server: {
        port: process.env.PORT || 3000,
        host: true,
        allowedHosts: true
    },
    preview: {
        host: true,
        port: process.env.PORT || 3000, 
        allowedHosts: true
    },
    plugins: [
        mkcert()
    ]
}
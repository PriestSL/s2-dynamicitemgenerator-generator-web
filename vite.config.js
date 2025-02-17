export default {
    build: {
        minify: false
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
    }
}
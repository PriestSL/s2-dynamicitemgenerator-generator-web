export default {
    build: {
        minify: true
    },
    server: {
        port: process.env.PORT || 3000,
        host: true,
        allowedHosts: true
    },
}
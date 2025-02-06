export default {
    build: {
        minify: true
    },
    server: {
        port: process.env.PORT || 3000,
        host: true,
    },
    preview: {
        port: process.env.PORT || 3000,
        host: true,
    }
}
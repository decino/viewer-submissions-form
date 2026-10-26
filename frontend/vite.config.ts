import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND = "http://127.0.0.1:8081";

function devBaseURLPlaceholder(): Plugin {
    return {
        name: "dev-base-url-placeholder",
        apply: "serve",
        transformIndexHtml: {
            order: "pre",
            handler(html) {
                return html.replaceAll("__BASE_URL__", "http://localhost:5173");
            },
        },
    };
}

export default defineConfig({
    plugins: [react(), devBaseURLPlaceholder()],
    server: {
        host: true,
        allowedHosts: true,
        port: 5173,
        proxy: {
            "/socket.io": {
                target: BACKEND,
                changeOrigin: true,
                ws: true,
            },
            "/rest": {
                target: BACKEND,
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "../static",
        emptyOutDir: true,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: "vendor-react",
                            test: /[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
                        },
                    ],
                },
            },
        },
    },
});

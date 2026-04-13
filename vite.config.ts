import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("/antd/") || id.includes("@ant-design")) {
            return "vendor-antd";
          }
          if (
            id.includes("/react-markdown/") ||
            id.includes("/remark-gfm/")
          ) {
            return "vendor-markdown";
          }
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router/")
          ) {
            return "vendor-react";
          }
          return "vendor-misc";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});

import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import JavaScriptObfuscator from "javascript-obfuscator";

function buildObfuscatorPlugin(): Plugin {
  return {
    name: "secct-javascript-obfuscator",
    apply: "build",
    enforce: "post",
    renderChunk(code, chunk) {
      if (!chunk.fileName.endsWith(".js")) {
        return null;
      }
      const result = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: false,
        renameGlobals: false,
      });
      return {
        code: result.getObfuscatedCode(),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), buildObfuscatorPlugin()],
  esbuild: {
    drop: ["console", "debugger"],
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  build: {
    minify: "esbuild",
    sourcemap: false,
  },
  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});

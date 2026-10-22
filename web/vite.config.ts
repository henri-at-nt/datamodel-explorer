import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In development the API runs on the server's port; in production the server serves the built app itself.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": `http://127.0.0.1:${process.env.PORT || 3000}` } },
  build: { chunkSizeWarningLimit: 1500 },
});

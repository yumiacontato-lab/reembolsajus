import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const clerkPublishableKey =
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    env.VITE_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY ||
    env.CLERK_PUBLISHABLE_KEY ||
    "";

  return {
    server: {
      host: "0.0.0.0",
      port: Number(process.env.PORT) || 5000,
      allowedHosts: true,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(clerkPublishableKey),
    },
  };
});

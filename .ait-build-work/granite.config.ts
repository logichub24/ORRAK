import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "orrak",
  brand: {
    displayName: "\uC624\uB974\uB77D",
    primaryColor: "#12B7DE",
    icon: "https://static.toss.im/appsintoss/32449/1ba1ec05-93f8-4fa1-b88c-f6835b6f2c95.png",
  },
  web: {
    host: "0.0.0.0",
    port: 4180,
    commands: {
      dev: "vite --host 0.0.0.0 --port 4180",
      build: "vite build --outDir .granite-dist",
    },
  },
  permissions: [
    {
      name: "clipboard",
      access: "write",
    },
  ],
  outdir: ".granite-dist",
});

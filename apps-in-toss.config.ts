import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "orrak",

  brand: {
    primaryColor: "#12B7DE"
  },

  permissions: [
    {
      name: "clipboard",
      access: "write",
    },
  ],

  webBundleDir: ".granite-dist"
});

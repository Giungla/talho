/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom", // "jsdom"
    // browser: {
    //   enabled: true,
    //   instances: [
    //
    //   ],
    // },
    include: ["./tests/*.test.ts"],
    exclude: [
      "./src",
      "./node_modules",
      "./dist",
      "./build-commands",
      "./.idea",
      "./dev",
      "./types",
      "./utils/*",
      "utils/*",
    ],
  },
  exclude: [
    "./node_modules",
    "./dist",
    "./utils",
    "utils",
  ],
})

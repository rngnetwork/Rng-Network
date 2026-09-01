import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // 1. Global ignores must be placed at the very top of the array
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".github/**",
  ]),

  ...nextVitals,
  ...nextTs,
  
  // 2. Turn the rule back ON here
  {
    rules: {
      "@next/next/no-img-element": "error" // Or use "warn"
    }
  },
]);

export default eslintConfig;

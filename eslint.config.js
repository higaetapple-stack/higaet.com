import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
          patterns: [
            {
              // HIGAET Registry Architecture (ADR-0001) — block direct
              // imports from any division registry. Providers are the
              // only allowed consumers (granted an override below).
              group: [
                "@/content/academy/*",
                "@/content/hub/*",
                "@/content/technologies/*",
                "@/content/blog/*",
                "@/content/careers/*",
                "@/content/ai/*",
                "@/content/lms/*",
              ],
              message:
                "HIGAET Registry Architecture (ADR-0001): division registries are private. Import the corresponding getter from `@/content/providers` instead (e.g. `getAcademyCourses`). Only files inside `src/content/providers/` may consume `src/content/<division>/*` directly.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // HIGAET Registry Architecture (ADR-0001) — provider override.
    // The provider layer is the single approved consumer of division
    // registries. Disable the cross-division import restriction here.
    files: ["src/content/providers/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  eslintPluginPrettier,
);

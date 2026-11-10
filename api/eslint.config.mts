import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vitestPlugin from "@vitest/eslint-plugin"
import { defineConfig } from "eslint/config";

export default defineConfig([
    { ignores: ["dist/", "migrations/"] },
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.node },
    },
    {
        files: ["src/**/*.spec.ts", "src/**/*.e2e-spec.ts"],
        plugins: { vitest: vitestPlugin },
        rules: {
            ...vitestPlugin.configs.recommended.rules
        }
    },
    tseslint.configs.recommended,
]);

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import jestPlugin from "eslint-plugin-jest";
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
        plugins: { jest: jestPlugin },
        languageOptions: {
          globals: jestPlugin.environments.globals.globals
        }
    },
    tseslint.configs.recommended,
]);

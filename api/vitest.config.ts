import { defineConfig, configDefaults } from "vitest/config";
export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        mockReset: true,
        exclude: [...configDefaults.exclude, "**/dist/**"],
    },
});

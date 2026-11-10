import { defineConfig, configDefaults } from "vitest/config";
export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        include: [...configDefaults.include, "**/*.e2e-spec.ts"],
        mockReset: true,
        exclude: [...configDefaults.exclude, "**/dist/**"],
    },
});

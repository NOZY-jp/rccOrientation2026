import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // テストファイルのパターン
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    // グローバルなテストAPI（describe, it, expect）を有効化
    globals: true,
  },
});

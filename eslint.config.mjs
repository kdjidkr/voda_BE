// eslint.config.mjs
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default tseslint.config(
  // 1. 검사에서 제외할 폴더 및 파일 설정
  {
    ignores: [
      'dist/**',          // 빌드 결과물 폴더 제외
      'node_modules/**',  // 의존성 d폴더 제외
      'eslint.config.mjs', // 설정 파일 자신 제외
      'prisma.config.ts'   // 필요 시 특정 설정 파일 제외
    ],
  },
  
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  {
    // 2. TypeScript 파일(.ts)에만 상세 규칙 적용
    files: ['src/**/*.ts'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // 'any' 사용 시 에러 대신 경고만 띄우기 (학습 중에는 any가 필요할 수 있음)
      '@typescript-eslint/no-explicit-any': 'warn',
      // 'next' 처럼 미들웨어에서 쓰이는 변수는 미사용 시에도 허용하기
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { 'argsIgnorePattern': '^next$', 'varsIgnorePattern': '^next$' }
      ],
    },
  }
);
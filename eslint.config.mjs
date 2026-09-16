// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import headerPlugin from '@tony.ganchev/eslint-plugin-header';
import importPlugin from 'eslint-plugin-import';
import noUnsanitizedPlugin from 'eslint-plugin-no-unsanitized';
import eslintPrettier from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import unicornPlugin from 'eslint-plugin-unicorn';
import globals from 'globals';
import path from 'node:path';
import tsEslint from 'typescript-eslint';

import cloudscapeBuildTools from '@cloudscape-design/build-tools/eslint/index.js';

export default tsEslint.config(
  includeIgnoreFile(path.resolve('.gitignore')),
  {
    settings: {
      react: { version: 'detect' },
    },
  },
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  noUnsanitizedPlugin.configs.recommended,
  eslintPrettier,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        // it is a part of es6, but supported in IE11
        Set: true,
        Map: true,
        WeakMap: true,
      },
    },
    plugins: {
      '@cloudscape-design/build-tools': cloudscapeBuildTools,
      unicorn: unicornPlugin,
      header: headerPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
    },
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'all' }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true, allowShortCircuit: true }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'react/display-name': 'off',
      'react/no-danger': 'error',
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      'react/prop-types': 'off',
      'react/jsx-boolean-value': ['error', 'always'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': [
        'error',
        {
          additionalHooks: '(useContainerQuery|useContainerBreakpoints)',
        },
      ],
      'unicorn/filename-case': 'error',
      curly: 'error',
      'dot-notation': 'error',
      eqeqeq: 'error',
      'no-return-await': 'error',
      'require-await': 'error',
      'header/header': [
        'error',
        {
          header: {
            commentType: 'line',
            lines: [
              ' Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.',
              ' SPDX-License-Identifier: Apache-2.0',
            ],
          },
          leadingComments: {
            comments: [
              {
                commentType: 'block',
                lines: ['*', ' * @jest-environment node', ' '],
              },
            ],
          },
          trailingEmptyLines: {
            minimum: 2,
          },
        },
      ],
      'no-warning-comments': 'warn',
      'import/extensions': ['error', 'ignorePackages'],
      '@cloudscape-design/build-tools/no-internal-in-public-interfaces': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['jest*.{js,cjs}', 'jest/*.{js,cjs}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ['**/__tests__/**', 'test-pages/**'],
    rules: {
      'import/extensions': 'off',
    },
  },
  {
    files: ['**/__integ__/**'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // useBrowser is not a React hook
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  }
);

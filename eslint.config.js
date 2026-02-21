import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...tsEslint.configs.recommended,

	{
		files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],

		plugins: {
			'@typescript-eslint': tsEslint.plugin,
			'@stylistic': stylistic,
			'simple-import-sort': simpleImportSort
		},

		languageOptions: {
			parser: tsEslint.parser,
			parserOptions: {
				sourceType: 'module'
			},
			globals: {
				...globals.browser,
				...globals.node
			}
		},

		rules: {
			semi: ['error', 'always'],
			'prefer-const': 'error',

			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',

			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],

			'@typescript-eslint/no-explicit-any': 'warn',

			'@typescript-eslint/consistent-type-imports': [
				'error',
				{
					prefer: 'type-imports',
					fixStyle: 'separate-type-imports'
				}
			],

			/* ======================
			   STYLISTIC FORMATTING
			   ====================== */

			'@stylistic/quotes': [
				'error',
				'single',
				{
					avoidEscape: true,
					allowTemplateLiterals: 'always'
				}
			],

			'@stylistic/jsx-quotes': ['error', 'prefer-double'],

			'@stylistic/brace-style': ['error', 'stroustrup'],

			'@stylistic/indent': [
				'error',
				'tab',
				{
					// ignoredNodes: [
					// 	'TemplateLiteral',
					// 	'TemplateLiteral *'
					// ]
				}
			],

			'@stylistic/template-curly-spacing': ['error', 'never'],
			'@stylistic/template-tag-spacing': ['error', 'never'],
			'@stylistic/no-multi-spaces': 'error',
			'@stylistic/eol-last': ['error', 'always'],
			'@stylistic/comma-dangle': ['error', 'never'],
			'@stylistic/semi-spacing': ['error'],
			'@stylistic/space-infix-ops': 'error',
			'@stylistic/key-spacing': ['error'],
			'@stylistic/keyword-spacing': ['error'],
			'@stylistic/space-before-blocks': ['error'],
			'@stylistic/arrow-spacing': ['error']
		}
	},

	{
		files: ['src/**/*.{ts,tsx}'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json'
			}
		}
	},

	{
		ignores: ['dist', 'node_modules']
	}
];

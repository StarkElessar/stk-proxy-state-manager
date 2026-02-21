import { defineConfig } from '@rsbuild/core';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
	lib: [
		{
			format: 'esm',
			bundle: true,
			dts: true,
			syntax: 'es2020'
		},
		{
			format: 'cjs',
			bundle: true,
			syntax: 'es2020'
		}
	],
	source: {
		entry: {
			index: './src/index.ts'
		}
	}
});

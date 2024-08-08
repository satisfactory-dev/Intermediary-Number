import config from '@signpostmarv/eslint-config';
import parser from '@typescript-eslint/parser';

export default [
	{
		languageOptions: {
			parser,
			parserOptions: {
				project: ['./tsconfig.eslint.json'],
			},
		},
	},
	...config,
	{
		ignores: [
			'**/*.js',
			'**/*.d.ts',
		]
	}
];

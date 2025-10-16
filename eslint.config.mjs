import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

// Root shared ESLint baseline for the monorepo. Packages may extend or merge this.
export default [
	...compat.extends("prettier"),
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
		},
		plugins: {},
		rules: {
			curly: "error",
			"no-with": "warn",
			"no-unused-vars": "warn",
			"no-undef": "error",
		},
	},
];

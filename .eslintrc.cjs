/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2023: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  settings: {
    "import/resolver": {
      typescript: { project: "./tsconfig.json" },
      node: { extensions: [".js", ".ts", ".tsx"] }
    }
  },
  plugins: [
    "@typescript-eslint",
    "react-hooks",
    "react-refresh",
    "import",
    "unused-imports"
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:react-refresh/recommended",
    "prettier"
  ],
  rules: {
    // Remove unused imports automatically
    "unused-imports/no-unused-imports": "error",
    // Replace TS unused vars with ignore patterns
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "import/order": [
      "warn",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }
    ],
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
  },
  ignorePatterns: [
    "dist",
    "node_modules",
    "coverage",
    "*.config.*",
    "public"
  ]
};

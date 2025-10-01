#!/usr/bin/env bash
set -e
echo "Installing dependencies..."
npm i -D @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint eslint-config-prettier eslint-plugin-import eslint-plugin-react-hooks eslint-plugin-react-refresh eslint-plugin-unused-imports prettier husky lint-staged sort-package-json
echo "Initializing Husky..."
npm run prepare
echo "Done. Restart VS Code to apply auto-fix on save."

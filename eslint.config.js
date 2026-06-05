import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },

  // ── Code front (navigateur) : src/**/*.{js,jsx} ──────────────
  {
    files: ['src/**/*.{js,jsx}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Nouveau transform JSX : pas besoin d'importer React
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Pas de PropTypes dans ce projet
      'react/prop-types': 'off',
      // Apostrophes dans le texte JSX : non-bug, bruit pur
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      // Règle v7 très agressive : signale des patterns ref fonctionnels
      // (ex: scheduleRef.current = ... dans useAdmin). Désactivée pour
      // éviter le bruit ; rules-of-hooks (critique) reste actif.
      'react-hooks/refs': 'off',
      // useEffect deps : utile mais souvent intentionnel → warning
      'react-hooks/exhaustive-deps': 'warn',
      // Avertit si un composant exporte autre chose (HMR Fast Refresh)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Tolère les variables préfixées par _ (args ignorés volontairement)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // ── Code back (Node) : api/**/*.js + fichiers de config ──────
  {
    files: ['api/**/*.js', '*.config.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // ── Tests : globals Vitest ───────────────────────────────────
  {
    files: ['src/__tests__/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.vitest },
    },
  },
]

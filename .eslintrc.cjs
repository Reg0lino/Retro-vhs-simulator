module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // Turn off the most "noisy" rules
    '@typescript-eslint/no-explicit-any': 'off',      // Allows you to use 'any' without errors
    '@typescript-eslint/no-unused-vars': 'warn',     // Unused variables become warnings, not errors
    '@typescript-eslint/no-empty-function': 'off',
    'react-refresh/only-export-components': 'off',    // Stops errors when exporting types/consts from components
    'react-hooks/exhaustive-deps': 'warn',           // Warnings for missing dependencies in useEffect
    'no-case-declarations': 'off',
    'no-debugger': 'warn',
    'prefer-const': 'warn',
    '@typescript-eslint/ban-ts-comment': 'off',      // Allows @ts-ignore if you really need it
  },
}
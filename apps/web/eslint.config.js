import js from '@eslint/js'
import tseslint from 'typescript-eslint'
export default [js.configs.recommended,...tseslint.configs.recommended,{files:['src/**/*.{js,ts,tsx}'],languageOptions:{parser:tseslint.parser,globals:{window:'readonly',document:'readonly',history:'readonly',location:'readonly',alert:'readonly',BigInt:'readonly',FormData:'readonly'}},rules:{'no-unused-vars':'off','@typescript-eslint/no-unused-vars':'off','@typescript-eslint/no-explicit-any':'off','prefer-const':'off','no-undef':'off'}}]

import js from '@eslint/js'
export default [js.configs.recommended,{files:['src/**/*.js'],languageOptions:{globals:{window:'readonly',document:'readonly',history:'readonly',location:'readonly',alert:'readonly',BigInt:'readonly',FormData:'readonly'}},rules:{'no-unused-vars':'error'}}]

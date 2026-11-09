// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Ruido de estilo / deuda previa, no bugs (ver PR de Fase 0):
    // ~53 usos de `any` en código existente; se tipan por zonas en fases posteriores.
    '@typescript-eslint/no-explicit-any': 'off',
    // `Icon.vue` es el nombre usado en todo el proyecto (<Icon name=...>).
    'vue/multi-word-component-names': 'off',
    // Los defineEmits con firmas de llamada separadas son legibles y válidos.
    '@typescript-eslint/unified-signatures': 'off',
    // Estilo de plantilla (orden de atributos, self-closing): fuera de alcance (sin Prettier en Fase 0).
    'vue/attributes-order': 'off',
    'vue/html-self-closing': 'off',
    'vue/v-on-event-hyphenation': 'off',
  },
}, {
  // Icon.vue renderiza SVGs propios del repo, no HTML de usuario. En el resto, v-html sigue avisando.
  files: ['app/components/Icon.vue'],
  rules: { 'vue/no-v-html': 'off' },
})

<script setup lang="ts">
/**
 * LocationCombobox — input con lista filtrable pequeña (con scroll), en vez del
 * datalist nativo del navegador (que renderiza un dropdown enorme sin estilo).
 * allowCustom permite quedarse con un valor que no está en `options` (sector
 * libre cuando no aparece en el dataset).
 */
const props = defineProps<{
  modelValue: string
  options: string[]
  placeholder?: string
  disabled?: boolean
  allowCustom?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const query = ref(props.modelValue)
watch(() => props.modelValue, (v) => {
  if (v !== query.value) query.value = v
})

const isOpen = ref(false)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.toLowerCase().includes(q))
})

function selectOption(opt: string) {
  query.value = opt
  emit('update:modelValue', opt)
  isOpen.value = false
}

function onInput() {
  isOpen.value = true
  if (props.allowCustom) emit('update:modelValue', query.value)
}

function onFocus() {
  isOpen.value = true
}

function onBlur() {
  // Delay para que el mousedown de la opción se procese antes de cerrar.
  setTimeout(() => {
    isOpen.value = false
    if (props.allowCustom) {
      emit('update:modelValue', query.value.trim())
    } else if (!props.options.includes(query.value)) {
      query.value = props.modelValue
    }
  }, 150)
}
</script>

<template>
  <div class="relative">
    <input
      v-model="query"
      type="text"
      class="field-input"
      :placeholder="placeholder"
      :disabled="disabled"
      autocomplete="off"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    />
    <div
      v-if="isOpen && filtered.length"
      class="absolute left-0 right-0 z-[2000] mt-1 max-h-40 overflow-y-auto rounded-xl border shadow-lg py-1"
      style="background: #fff; border-color: var(--color-border);"
    >
      <button
        v-for="opt in filtered"
        :key="opt"
        type="button"
        class="block w-full text-left px-3 py-1.5 text-sm hover:bg-black/5"
        @mousedown.prevent="selectOption(opt)"
      >
        {{ opt }}
      </button>
    </div>
  </div>
</template>

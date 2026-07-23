<script setup lang="ts">
/**
 * VerifiedBadge — check en el color neón, con tooltip "Verificado".
 * Visible solo si verificationTier >= 1 (asignado a mano por ahora, ver
 * User.verificationTier en schema.prisma).
 */
defineProps<{ verificationTier?: number | null }>()
</script>

<template>
  <span
    v-if="(verificationTier ?? 0) >= 1"
    class="tooltip inline-flex items-center flex-shrink-0"
    data-tip="Verificado"
  >
    <Icon name="shieldCheck" class="w-4 h-4" style="color: var(--color-neon-dark);" />
  </span>
</template>

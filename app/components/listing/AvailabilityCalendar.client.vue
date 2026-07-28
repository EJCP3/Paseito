<script setup lang="ts">
/**
 * AvailabilityCalendar — Vista pública de solo lectura de la disponibilidad
 * de una villa. Pinta los días según sus AvailabilityRange; sin edición.
 */
import type { AvailabilityRange } from '~~/shared/types/listing'
import { AvailabilityStatus, AvailabilityStatusLabels } from '~~/shared/types/enums'

const props = defineProps<{ ranges: AvailabilityRange[] }>()

const statusColor: Record<string, string> = {
  [AvailabilityStatus.AVAILABLE]: 'green',
  [AvailabilityStatus.BLOCKED]: 'gray',
  [AvailabilityStatus.BOOKED]: 'red',
}

const attributes = computed(() =>
  props.ranges.map((r) => ({
    key: r.id,
    dates: { start: new Date(r.startDate), end: new Date(r.endDate) },
    highlight: statusColor[r.status] || 'gray',
    popover: { visibility: 'hover', label: AvailabilityStatusLabels[r.status] },
  }))
)
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-4 mb-3 text-xs" style="color: var(--color-muted);">
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background:#22c55e;" />Disponible</span>
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background:#9ca3af;" />Bloqueado</span>
      <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background:#ef4444;" />Ocupado</span>
    </div>
    <Calendar :attributes="attributes" expanded :min-date="new Date()" />
  </div>
</template>

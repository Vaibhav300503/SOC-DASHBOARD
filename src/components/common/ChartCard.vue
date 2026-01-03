<template>
  <DashboardCard :title="title" :subtitle="subtitle" :size="size" :loading="loading">
    <template #header-action>
      <slot name="header-action"></slot>
    </template>

    <!-- Chart Container -->
    <div class="w-full h-full min-h-64">
      <slot></slot>
    </div>

    <template #footer>
      <slot name="footer"></slot>
    </template>
  </DashboardCard>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'medium'
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

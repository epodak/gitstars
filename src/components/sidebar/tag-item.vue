<template>
  <div
    class="tag-item flex h-9 cursor-pointer items-center justify-between border-t border-solid border-t-gray-700 px-4 text-xs hover:bg-white/10"
  >
    <div class="flex h-full items-center">
      <svg-icon :name="tag.icon || 'tag'" />
      <span class="ml-2">{{ tag.label }}</span>
    </div>
    <div class="flex items-center">
      <slot name="suffix"></slot>
      <span v-if="tag.count" class="ml-1">{{ tag.count }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tag: {
    type: Object,
    required: true,
  },
});
</script>

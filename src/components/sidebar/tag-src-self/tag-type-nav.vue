<template>
  <ul
    class="broder-solid flex h-8 flex-none justify-between border-t border-gray-600 text-xs"
  >
    <li
      v-for="nav in ['language', 'topic', 'list']"
      :key="nav"
      :class="{ selected: nav === tagStore.selectedTagTypeNav }"
      class="h-full w-1/4 flex-auto cursor-pointer border-r border-solid border-gray-500 text-center capitalize leading-8 last:border-none"
      @click="handleClickNav(nav)"
    >
      {{ nav }}s
    </li>
  </ul>
</template>

<script setup>
import { useTagStore } from '@/store/tag';

const tagStore = useTagStore();

function handleClickNav(nav) {
  tagStore.$patch({ selectedTagTypeNav: nav });
}
</script>

<style scoped>
.selected {
  position: relative;
  background: #ffffff22;
}

.selected::before {
  content: '';
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--primary);
}
</style>

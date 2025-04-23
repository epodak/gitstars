<template>
  <div class="flex flex-col">
    <div v-if="tagStore.loadingLists" class="flex justify-center py-4">
      <svg-icon name="loading" class="animate-spin text-2xl text-gray-300" />
    </div>

    <div v-else-if="Object.keys(sortedListMap).length === 0" class="text-center py-4 text-gray-500 text-sm">
      {{ $t('noLists') || 'No starred lists found' }}
    </div>

    <template v-else>
      <TagItem
        v-for="(repositoryIds, list) in sortedListMap"
        :key="list"
        :tag="{
          label: list,
          count: repositoryIds.length,
        }"
        :class="{ selected: tagStore.selectedTag === list && tagStore.selectedTagType === 'list' }"
        @click="handleClickTag(list)"
      />
    </template>

    <div class="mt-4 px-2">
      <a
        href="https://github.com/settings/stars"
        class="text-xs text-gray-500 hover:text-primary flex items-center justify-center"
        target="_blank"
      >
        <svg-icon name="settings" class="mr-1 text-sm" />
        {{ $t('manageLists') || 'Manage starred lists' }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useTagStore } from '@/store/tag';
import TagItem from '../tag-item.vue';

const tagStore = useTagStore();

// 当组件挂载时获取用户的 starred lists
onMounted(() => {
  if (Object.keys(tagStore.listMap).length === 0 && !tagStore.loadingLists) {
    tagStore.fetchStarredLists();
  }
});

const sortedListMap = computed(() => {
  const filterText = tagStore.filterText.toLowerCase();
  const listMap = { ...tagStore.listMap };
  const result = {};

  // 过滤
  Object.keys(listMap)
    .filter((key) => key.toLowerCase().includes(filterText))
    .forEach((key) => {
      result[key] = listMap[key];
    });

  // 排序
  const sortedKeys = Object.keys(result).sort((a, b) => {
    if (tagStore.sortType === 'ascend') {
      return a.localeCompare(b);
    }
    return b.localeCompare(a);
  });

  return sortedKeys.reduce((acc, key) => {
    acc[key] = result[key];
    return acc;
  }, {});
});

const handleClickTag = (list) => {
  tagStore.$patch({
    selectedTag: list,
    selectedTagType: 'list',
  });
};
</script>

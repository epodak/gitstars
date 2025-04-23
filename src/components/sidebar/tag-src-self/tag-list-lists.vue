<template>
  <div class="flex flex-col">
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
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useTagStore } from '@/store/tag';
import TagItem from '../tag-item.vue';

const tagStore = useTagStore();

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

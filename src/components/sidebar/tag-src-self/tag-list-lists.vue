<template>
  <div class="flex flex-col">
    <div v-if="tagStore.loadingLists" class="flex justify-center py-4">
      <svg-icon name="loading" class="animate-spin text-2xl text-gray-300" />
    </div>

    <div v-else-if="Object.keys(sortedListMap).length === 0" class="text-center py-4 text-gray-500 text-sm">
      {{ $t('noLists') || 'No lists found' }}
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
      >
        <template #suffix>
          <div
            class="cursor-pointer text-gray-400 hover:text-red-500 ml-1"
            @click.stop="handleRemoveList(list)"
          >
            <svg-icon name="delete" class="text-xs" />
          </div>
        </template>
      </TagItem>
    </template>

    <!-- 添加新列表 -->
    <div class="mt-2 px-2">
      <div class="flex items-center">
        <input
          v-model="newListName"
          type="text"
          class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
          :placeholder="$t('newListPlaceholder') || 'New list name'"
          @keyup.enter="handleAddList"
        />
        <button
          class="ml-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          @click="handleAddList"
        >
          {{ $t('addList') || 'Add' }}
        </button>
      </div>
    </div>

    <div class="mt-4 px-2">
      <a
        :href="`https://github.com/${userStore.userinfo.login}?tab=stars`"
        class="text-xs text-gray-500 hover:text-primary flex items-center justify-center"
        target="_blank"
      >
        <svg-icon name="settings" class="mr-1 text-sm" />
        {{ $t('viewStars') || 'View stars on GitHub' }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useTagStore } from '@/store/tag';
import { useUserStore } from '@/store/user';
import TagItem from '../tag-item.vue';

const tagStore = useTagStore();
const userStore = useUserStore();

// 新列表名称
const newListName = ref('');

// 当组件挂载时获取用户的列表
onMounted(() => {
  if (Object.keys(tagStore.listMap).length === 0 && !tagStore.loadingLists) {
    tagStore.fetchStarredLists();
  }
});

// 添加新列表
const handleAddList = () => {
  if (newListName.value.trim()) {
    tagStore.addList(newListName.value.trim());
    newListName.value = '';
  }
};

// 删除列表
const handleRemoveList = (listName) => {
  if (confirm($t('confirmDeleteList') || `Are you sure you want to delete the list "${listName}"?`)) {
    tagStore.removeList(listName);
    if (tagStore.selectedTag === listName && tagStore.selectedTagType === 'list') {
      tagStore.$patch({ selectedTag: '', selectedTagType: '' });
    }
  }
};

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

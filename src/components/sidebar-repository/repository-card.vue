<template>
  <div class="flex items-center justify-between font-bold text-[#948aec]">
    <h2>
      <span
        v-if="medalMap[repository.ranking]"
        v-html="medalMap[repository.ranking]"
        class="mr-1"
      ></span>
      <a
        :href="`https://github.com/${repository.owner.login}/${repository.name}`"
        rel="noopener noreferrer"
        class="hover:underline"
      >
        {{ repository.owner.login }} / {{ repository.name }}
      </a>
      <svg-icon name="share" class="ml-1 text-xs" />
    </h2>

    <a
      v-if="repository.homepage"
      :href="repository.homepage"
      class="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#948aec] hover:text-white"
      rel="noopener noreferrer"
    >
      <svg-icon name="link" />
    </a>
  </div>

  <ul
    class="flex flex-wrap text-xs text-gray-300"
    :class="{ disabled: disableTopic }"
    @click="handleClickTopic"
  >
    <li
      v-for="topic in repository.topics"
      :key="topic"
      :data-topic="topic"
      :class="{
        'selected-tag':
          !disableTopic &&
          tagStore.selectedTagType === 'topic' &&
          tagStore.selectedTag === topic,
      }"
      class="tag-topic mr-1 mt-1 rounded-full border border-solid border-gray-300 px-2 hover:border-[#948aec] hover:bg-[#948aec] hover:!text-white"
    >
      {{ topic }}
    </li>
  </ul>

  <div class="my-3 text-xs text-[#666]">{{ repository.description }}</div>

  <div class="flex justify-between text-xs font-bold text-[#76d0a3]">
    <div>
      <span class="inline-flex items-center">
        <svg-icon name="star-fill" class="mr-1" />
        <span>{{ repository.stargazers_count }}</span>
      </span>

      <span class="ml-3 inline-flex items-center">
        <svg-icon name="branch" class="mr-1" />
        <span>{{ repository.forks_count }}</span>
      </span>

      <!-- 添加到列表的下拉菜单 -->
      <div class="relative ml-3 inline-block" v-if="tagStore.tagSrc === 'star'">
        <button
          @click.stop="showListDropdown = !showListDropdown"
          class="inline-flex items-center text-gray-500 hover:text-[#76d0a3]"
        >
          <svg-icon name="list" class="mr-1" />
          <span>{{ $t('addToList') || 'Add to list' }}</span>
        </button>

        <div
          v-if="showListDropdown"
          class="absolute left-0 top-full z-10 mt-1 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
        >
          <div class="max-h-48 overflow-y-auto">
            <div
              v-for="(_, listName) in tagStore.listMap"
              :key="listName"
              class="cursor-pointer px-4 py-2 text-gray-700 hover:bg-gray-100"
              @click.stop="addToList(listName)"
            >
              <div class="flex items-center justify-between">
                <span>{{ listName }}</span>
                <svg-icon
                  v-if="isInList(listName)"
                  name="check"
                  class="text-[#76d0a3]"
                />
              </div>
            </div>
          </div>
          <div class="border-t border-gray-100 px-4 py-2">
            <input
              v-model="newListName"
              type="text"
              class="mb-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
              :placeholder="$t('newListPlaceholder') || 'New list name'"
              @keyup.enter="createAndAddToList"
            />
            <button
              class="w-full rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
              @click.stop="createAndAddToList"
            >
              {{ $t('createList') || 'Create list' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <span>{{ repository.language }}</span>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useTagStore } from '@/store/tag';

const props = defineProps({
  repository: {
    type: Object,
    required: true,
  },
});

const medalMap = {
  1: '&#129351;',
  2: '&#129352;',
  3: '&#129353;',
};
const tagStore = useTagStore();
const disableTopic = computed(() => tagStore.tagSrc !== 'star');

function handleClickTopic(e) {
  if (disableTopic.value) return;

  let elTag = e.target;
  while (!elTag.dataset.topic) {
    elTag = elTag.parentElement;
    if (!elTag) return;
  }
  tagStore.$patch({
    selectedTagTypeNav: 'topic',
    selectedTagType: 'topic',
    selectedTag: elTag.dataset.topic,
  });
}

// 列表下拉菜单
const showListDropdown = ref(false);
const newListName = ref('');

// 点击其他地方时关闭下拉菜单
function handleClickOutside(event) {
  const dropdown = document.querySelector('.relative.ml-3.inline-block');
  if (dropdown && !dropdown.contains(event.target)) {
    showListDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 检查仓库是否在列表中
function isInList(listName) {
  return tagStore.listMap[listName]?.includes(props.repository.id);
}

// 添加到列表
function addToList(listName) {
  if (isInList(listName)) {
    tagStore.removeRepositoryFromList(props.repository.id, listName);
  } else {
    tagStore.addRepositoryToList(props.repository.id, listName);
  }
  showListDropdown.value = false;
}

// 创建新列表并添加
function createAndAddToList() {
  if (newListName.value.trim()) {
    const listName = newListName.value.trim();
    tagStore.addList(listName);
    tagStore.addRepositoryToList(props.repository.id, listName);
    newListName.value = '';
    showListDropdown.value = false;
  }
}
</script>

<style scoped>
.selected-tag {
  border-color: var(--primary);
  color: var(--primary);
}

.disabled .tag-topic {
  cursor: not-allowed;
}
</style>

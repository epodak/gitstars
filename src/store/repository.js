import { nextTick } from 'vue';
import { defineStore } from 'pinia';
import { getStarredRepositories } from '@/server/github';
import { STARRED_REPOS } from '@/constants';

// 缓存过期时间（毫秒）- 24小时
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
import { useTagStore } from '@/store/tag';
import { useRankingStore } from '@/store/ranking';

const PAGE_SIZE = 100;
const PARALLEL_NUM = 2;

/**
 * 通过 HTTP 获取 repositories 并更新
 * Github 接口使用 HTTP2 协议，无并发限制
 *
 * @param {Array} storeRepositories
 * @returns
 */
async function rsolveRepositoriesByHTTP(page = 1) {
  const parallelRequests = [];

  for (let i = 0; i < PARALLEL_NUM; i += 1) {
    parallelRequests.push(
      getStarredRepositories({ page, per_page: PAGE_SIZE }),
    );
    page += 1;
  }
  const httpRepositories = (await Promise.all(parallelRequests)).flat();

  if (httpRepositories.length === PAGE_SIZE * PARALLEL_NUM) {
    return httpRepositories.concat(await rsolveRepositoriesByHTTP(page));
  }
  return httpRepositories;
}

export const useRepositoryStore = defineStore('repository', {
  state: () => ({
    /**
     * 所有 repositories
     */
    all: [],
    /**
     * 选中的 repository id
     */
    selectedId: null,
    /**
     * repositories 过滤内容
     */
    filterText: '',
    /**
     * 是否正在 HTTP 请求 repositories
     */
    loading: true,
    /**
     * repositories 排序
     * time 或 star
     */
    sortType: 'time',
  }),

  getters: {
    /**
     * 当前条件下的 repositories
     */
    filteredRepositories: (state) => {
      let repositoriesTmp = [];
      const tagStore = useTagStore();
      const rankingStore = useRankingStore();

      if (tagStore.tagSrc === 'star') {
        if (!tagStore.selectedTag) {
          /**
           * 当前未选中 tag
           * 展示所有 repositories
           * 不可直接使用 state.all
           * 下文的排序处理会对 repositoriesTmp 进行变更
           * 变更会触发 tag 分析
           * 导致 tag 数据累加（错误）
           */
          repositoriesTmp = [...state.all];
        } else if (tagStore.selectedTagType === 'topic') {
          /**
           * 当前选中的 tag 属于 Topics
           * 从 topicMap 找到 tag 及其对应的 repositories id
           */
          const repositoryIds = tagStore.topicMap[tagStore.selectedTag];
          if (repositoryIds) {
            repositoriesTmp = state.all.filter((repository) =>
              repositoryIds.includes(repository.id),
            );
          }
        } else if (tagStore.selectedTagType === 'language') {
          /**
           * 当前选中的 tag 属于 Languages
           * 从 languageMap 找到 tag 及其对应的 repositories id
           */
          const repositoryIds = tagStore.languageMap[tagStore.selectedTag];
          if (repositoryIds) {
            repositoriesTmp = state.all.filter((repository) =>
              repositoryIds.includes(repository.id),
            );
          }
        } else if (tagStore.selectedTagType === 'list') {
          /**
           * 当前选中的 tag 属于 Lists
           * 从 listMap 找到 tag 及其对应的 repositories id
           */
          const repositoryIds = tagStore.listMap[tagStore.selectedTag];
          if (repositoryIds) {
            repositoriesTmp = state.all.filter((repository) =>
              repositoryIds.includes(repository.id),
            );
          }
        }
      } else if (tagStore.tagSrc === 'ranking') {
        if (rankingStore.selectedLanguage) {
          repositoriesTmp = [
            ...(rankingStore.languageMap[rankingStore.selectedLanguage] ?? []),
          ];
        } else {
          repositoriesTmp = [...(rankingStore.languageMap.all ?? [])];
        }
      }

      /**
       * 过滤对当前展示的 repositories
       */
      if (state.filterText) {
        const filterText = state.filterText.toLowerCase();
        repositoriesTmp = repositoriesTmp.filter(
          (repository) =>
            repository.owner.login.toLowerCase().includes(filterText) ||
            repository.name.toLowerCase().includes(filterText) ||
            repository.description?.toLowerCase().includes(filterText),
        );
      }

      /**
       * 根据当前排序类型对当前展示的 repositories 排序
       * repositories 默认已经按 star 时间排序
       * 只需处理按 star 数量排序
       */
      if (
        tagStore.tagSrc === 'star' &&
        repositoriesTmp.length > 0 &&
        state.sortType === 'star'
      ) {
        repositoriesTmp.sort((a, b) => b.stargazers_count - a.stargazers_count);
      }

      return repositoriesTmp;
    },

    /**
     * 当前选中的 repository
     */
    selectedRepository: (state) => {
      const rankingStore = useRankingStore();
      return (
        state.all.find((item) => item.id === state.selectedId) ||
        rankingStore.repositories.find((item) => item.id === state.selectedId)
      );
    },
  },

  actions: {
    /**
     * 获取 repositories
     * LocalStorage 或 HTTP
     */
    async resolveRepositories() {
      this.loading = true;
      let localData = localStorage.getItem(STARRED_REPOS);
      let shouldFetchFromAPI = true;

      if (localData) {
        try {
          const parsedData = JSON.parse(localData);

          // 检查是否有缓存时间戳
          if (parsedData.timestamp && parsedData.repositories) {
            const now = Date.now();
            // 如果缓存未过期，使用缓存数据
            if (now - parsedData.timestamp < CACHE_EXPIRY) {
              this.all = parsedData.repositories;
              shouldFetchFromAPI = false;
              console.log('Using cached repositories data');
            } else {
              console.log('Cache expired, fetching fresh data');
            }
          } else if (Array.isArray(parsedData)) {
            // 兼容旧版本存储格式
            this.all = parsedData;
          }
        } catch (error) {
          console.error('Error parsing cached repositories:', error);
        }
      }

      // 如果需要从API获取数据
      if (shouldFetchFromAPI) {
        nextTick(async () => {
          try {
            const repos = await rsolveRepositoriesByHTTP();
            // 先清空，避免新老数据 DIFF 过程中更新 DOM 导致页面崩溃
            this.all = [];

            nextTick(() => {
              this.all = repos;
              // 存储数据和时间戳
              const dataToCache = {
                repositories: repos,
                timestamp: Date.now()
              };
              localStorage.setItem(STARRED_REPOS, JSON.stringify(dataToCache));
            });
          } catch (error) {
            console.error('Error fetching repositories:', error);
          }
        });
      }

      this.loading = false;
    },
  },
});

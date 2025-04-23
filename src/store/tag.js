import { defineStore } from 'pinia';
import { useRepositoryStore } from './repository';

/**
 * 统计分析 Topics 获取所有 topic 及其对应的 repositories
 */
function analyzeTopics() {
  const topicMap = {};
  const repositoryStore = useRepositoryStore();

  repositoryStore.all.forEach((repository) => {
    repository.topics.forEach((topic) => {
      if (topicMap[topic]) {
        topicMap[topic].push(repository.id);
      } else {
        topicMap[topic] = [repository.id];
      }
    });
  });
  return topicMap;
}

/**
 * 统计分析 Languages 获取所有 language 及其对应的 repositories
 */
function analyzeLanguages() {
  const languageMap = {};
  const repositoryStore = useRepositoryStore();

  repositoryStore.all.forEach((repository) => {
    if (!repository.language) return;

    if (languageMap[repository.language]) {
      languageMap[repository.language].push(repository.id);
    } else {
      languageMap[repository.language] = [repository.id];
    }
  });
  return languageMap;
}

/**
 * 从 GitHub API 获取用户的自定义 starred lists
 * 这个函数会异步获取数据，所以需要在其他地方调用
 */
import { getStarredLists, getStarredListRepositories } from '@/server/github';

async function fetchUserStarredLists() {
  try {
    // 获取用户的所有 starred lists
    const lists = await getStarredLists();
    const listMap = {};

    // 如果有 lists，则获取每个 list 中的仓库
    if (lists && lists.length > 0) {
      for (const list of lists) {
        try {
          const repos = await getStarredListRepositories(list.id);
          if (repos && repos.length > 0) {
            // 将仓库 ID 存储到 map 中
            listMap[list.name] = repos.map(repo => repo.id);
          }
        } catch (error) {
          console.error(`Error fetching repositories for list ${list.name}:`, error);
        }
      }
    }

    return listMap;
  } catch (error) {
    console.error('Error fetching starred lists:', error);
    return {};
  }
}

export const useTagStore = defineStore('tag', {
  state: () => ({
    /**
     * tag 来源
     *  1. 自己 star 的仓库
     *  2. Github 排行榜
     */
    tagSrc: 'star',
    /**
     * 当前选中 tag
     * topic 或 language
     */
    selectedTag: '',
    /**
     * 当前选中 tag 类型
     * topic 和 language 的 tag 名可能相同
     * 需要此标识判断当前选中的 tag 是属于什么类型
     */
    selectedTagType: '',
    /**
     * 当前选中 tag 类别
     * 用于 sidebar 底部 Topics 和 Languages 的高亮状态
     */
    selectedTagTypeNav: 'topic',
    /**
     * tag 搜索内容
     */
    filterText: '',
    /**
     * tag 排序
     */
    sortType: 'descend',
    /**
     * Topics
     */
    topicMap: {},
    /**
     * Languages
     */
    languageMap: {},
    /**
     * Lists - 用户的自定义 starred lists
     */
    listMap: {},
    /**
     * 是否正在加载 lists
     */
    loadingLists: false,
  }),

  actions: {
    /**
     * 统计分析 topics 和 languages
     */
    analyze() {
      this.topicMap = analyzeTopics();
      this.languageMap = analyzeLanguages();
      this.fetchStarredLists();
    },

    /**
     * 获取用户的自定义 starred lists
     */
    async fetchStarredLists() {
      this.loadingLists = true;

      try {
        // 尝试从 localStorage 获取缓存的 lists
        const cachedLists = localStorage.getItem('gitstars_user_lists');
        if (cachedLists) {
          const parsedCache = JSON.parse(cachedLists);
          if (parsedCache.timestamp && (Date.now() - parsedCache.timestamp < 24 * 60 * 60 * 1000)) {
            this.listMap = parsedCache.lists;
            this.loadingLists = false;
            console.log('Using cached starred lists');
            return;
          }
        }

        // 如果没有缓存或缓存过期，从 API 获取
        const lists = await fetchUserStarredLists();
        this.listMap = lists;

        // 缓存到 localStorage
        localStorage.setItem('gitstars_user_lists', JSON.stringify({
          lists,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Error in fetchStarredLists:', error);
      } finally {
        this.loadingLists = false;
      }
    },
  },
});

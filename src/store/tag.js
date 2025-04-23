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
 * 模拟用户的自定义 starred lists
 * 由于 GitHub API 没有直接提供获取用户自定义星标列表的端点
 * 我们实现一个本地存储的解决方案
 */
function getDefaultLists() {
  // 默认列表，模拟 GitHub 的分类
  return {
    'Recently Added': [],
    'Frontend': [],
    'Backend': [],
    'Tools': [],
    'Learning': [],
    'Projects': []
  };
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
    fetchStarredLists() {
      this.loadingLists = true;

      try {
        // 尝试从 localStorage 获取用户自定义的 lists
        const userLists = localStorage.getItem('gitstars_user_lists');
        if (userLists) {
          this.listMap = JSON.parse(userLists);
        } else {
          // 如果没有用户自定义的列表，使用默认列表
          this.listMap = getDefaultLists();
          this.saveUserLists();
        }
      } catch (error) {
        console.error('Error loading user lists:', error);
        this.listMap = getDefaultLists();
      } finally {
        this.loadingLists = false;
      }
    },

    /**
     * 保存用户的自定义列表
     */
    saveUserLists() {
      try {
        localStorage.setItem('gitstars_user_lists', JSON.stringify(this.listMap));
      } catch (error) {
        console.error('Error saving user lists:', error);
      }
    },

    /**
     * 添加新的列表
     */
    addList(listName) {
      if (!this.listMap[listName]) {
        this.listMap[listName] = [];
        this.saveUserLists();
      }
    },

    /**
     * 删除列表
     */
    removeList(listName) {
      if (this.listMap[listName]) {
        delete this.listMap[listName];
        this.saveUserLists();
      }
    },

    /**
     * 将仓库添加到列表
     */
    addRepositoryToList(repositoryId, listName) {
      if (this.listMap[listName] && !this.listMap[listName].includes(repositoryId)) {
        this.listMap[listName].push(repositoryId);
        this.saveUserLists();
      }
    },

    /**
     * 从列表中移除仓库
     */
    removeRepositoryFromList(repositoryId, listName) {
      if (this.listMap[listName]) {
        const index = this.listMap[listName].indexOf(repositoryId);
        if (index !== -1) {
          this.listMap[listName].splice(index, 1);
          this.saveUserLists();
        }
      }
    },
  },
});

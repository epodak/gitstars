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
 * 统计分析 Lists 获取所有 list 及其对应的 repositories
 * 这里我们根据仓库的某些特征将其分组为不同的列表
 */
function analyzeLists() {
  const listMap = {};
  const repositoryStore = useRepositoryStore();

  // 示例：按照更新时间分组
  const recentlyUpdated = [];
  const archived = [];
  const highStars = [];
  const personal = [];

  repositoryStore.all.forEach((repository) => {
    // 最近更新的仓库（30天内）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const updatedAt = new Date(repository.updated_at);
    if (updatedAt > thirtyDaysAgo) {
      recentlyUpdated.push(repository.id);
    }

    // 已归档的仓库
    if (repository.archived) {
      archived.push(repository.id);
    }

    // 高星仓库（超过1000星）
    if (repository.stargazers_count > 1000) {
      highStars.push(repository.id);
    }

    // 个人仓库（非组织）
    if (repository.owner.type === 'User') {
      personal.push(repository.id);
    }
  });

  if (recentlyUpdated.length > 0) listMap['Recently Updated'] = recentlyUpdated;
  if (archived.length > 0) listMap['Archived'] = archived;
  if (highStars.length > 0) listMap['High Stars'] = highStars;
  if (personal.length > 0) listMap['Personal'] = personal;

  return listMap;
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
     * Lists
     */
    listMap: {},
  }),

  actions: {
    /**
     * 统计分析 topics 和 languages
     */
    analyze() {
      this.topicMap = analyzeTopics();
      this.languageMap = analyzeLanguages();
      this.listMap = analyzeLists();
    },
  },
});

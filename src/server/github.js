import { httpRequestGithub } from './http-request';

export async function getUserInfo() {
  return httpRequestGithub.get('/user');
}

export async function getStarredRepositories(params) {
  return httpRequestGithub.get('/user/starred', { params });
}

export async function getRepositoryReadme(params) {
  return httpRequestGithub.get(`/repos/${params.owner}/${params.name}/readme`);
}

export async function getReadmeByMarkdown(content) {
  return httpRequestGithub.post('/markdown', {
    text: content,
  });
}

// 获取用户的 starred lists
export async function getStarredLists() {
  return httpRequestGithub.get('/user/starred-lists');
}

// 获取特定 list 中的仓库
export async function getStarredListRepositories(listId) {
  return httpRequestGithub.get(`/user/starred-lists/${listId}/repos`);
}

export async function getGithubRankingLanguageList() {
  const res = await fetch(
    'https://raw.githubusercontent.com/cfour-hi/github-ranking/main/languages.json',
  );
  const list = await res.json();
  return list;
}

export async function getGithubRankingLanguageMap() {
  const res = await fetch(
    `https://raw.githubusercontent.com/cfour-hi/github-ranking/main/ranking.json`,
  );
  const map = await res.json();
  return map;
}

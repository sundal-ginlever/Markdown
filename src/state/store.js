/**
 * Reactive State Store for DocVault
 */

const listeners = new Set();

export const S = new Proxy({
  raw: [],
  md: [],
  logs: {},
  activeDoc: null,
  mode: 'view',
  logOpen: false,
  pendingFile: null,
  rtStatus: 'disconnected', // 'connected' | 'disconnected' | 'connecting'
  selectedStyle: localStorage.getItem('dv_style') || 'dev',
  secOpen: { raw: true, md: true },
  lang: localStorage.getItem('dv_lang') || 'ko',
  folders: [],
  docFolder: {},
  favorites: JSON.parse(localStorage.getItem('dv_favs') || '[]'),
  docTags: JSON.parse(localStorage.getItem('dv_tags') || '{}'),
  ai: {
    provider: 'claude',
    keys: { claude: '', gpt4: '', gemini: '', local: '' },
    models: {
      claude: 'claude-3-5-sonnet-20240620',
      gpt4: 'gpt-4o',
      gemini: 'gemini-1.5-pro',
      local: ''
    },
    localUrl: ''
  },
  sort: 'new'
}, {
  set(target, key, value) {
    target[key] = value;
    notify();
    return true;
  }
});

export const QA = new Proxy({
  history: {},
  activeDocId: null,
  loading: false,
  expanded: false,
}, {
  set(target, key, value) {
    target[key] = value;
    notify();
    return true;
  }
});

export const SEARCH = new Proxy({
  query: '',
  filter: 'all',
  activeHls: [],
  hlIdx: 0,
}, {
  set(target, key, value) {
    target[key] = value;
    notify();
    return true;
  }
});

function notify() {
  listeners.forEach(fn => fn(S, QA, SEARCH));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const STYLES = [
  {
    id: 'dev',
    name: '개발 문서',
    cls: 'c-dev',
    icon: '💻',
    desc: '코드 블록, API 명세, 기술 문서 최적화',
    tags: ['Technical', 'Code'],
    color: '#3b82f6',
    prompt: (fn, ext, isSh, cnt) => `You are a technical writer. Convert "${fn}" (${ext}) into a professional technical document.
Use clean headers, emphasize code blocks with language tags, and create tables for parameters or data.
${isSh ? `This is a spreadsheet with ${cnt} sheets. Use Markdown tables.` : ''}`
  },
  {
    id: 'blog',
    name: '블로그',
    cls: 'c-blog',
    icon: '📝',
    desc: '매력적인 제목과 가독성 높은 서술형 스타일',
    tags: ['Article', 'Social'],
    color: '#ec4899',
    prompt: (fn) => `Convert "${fn}" into an engaging blog post.
Use a catchy title, intros, summaries, and clear bullet points.
Make it readable and interesting for a general audience.`
  },
  {
    id: 'report',
    name: '보고서',
    cls: 'c-report',
    icon: '📊',
    desc: '핵심 요약(Executive Summary)과 데이터 중심 구성',
    tags: ['Business', 'Analysis'],
    color: '#10b981',
    prompt: (fn) => `Convert "${fn}" into a formal business report.
Include an Executive Summary, Key Findings, and Recommendations.
Use professional tone and structure.`
  },
  {
    id: 'wiki',
    name: '위키',
    cls: 'c-wiki',
    icon: '📚',
    desc: '지식 베이스(Obsidian)를 위한 연결 지향 구조',
    tags: ['Knowledge', 'Personal'],
    color: '#8b5cf6',
    prompt: (fn) => `Convert "${fn}" into a Wiki/Obsidian style note.
Use YAML frontmatter, [[Internal Links]], and tags.
Structure it for long-term knowledge management.`
  },
  {
    id: 'doc',
    name: '공식 문서',
    cls: 'c-doc',
    icon: '📖',
    desc: '구조화된 섹션과 엄격한 문법 규격 준수',
    tags: ['Official', 'Clean'],
    color: '#f59e0b',
    prompt: (fn) => `Convert "${fn}" into formal documentation.
Use strict hierarchy, cross-references, and clear definitions.
Maintain a high level of clarity and precision.`
  },
  {
    id: 'custom',
    name: '커스텀',
    cls: 'c-custom',
    icon: '⚙️',
    desc: '사용자 정의 프롬프트를 통한 자유로운 변환',
    tags: ['User', 'Flex'],
    color: '#6366f1',
    prompt: () => `Convert based on user instructions.`
  }
];

// ============================================================
// 相思门户网 · 页面数据
// 所有页面展示数据集中管理，由 index.html 通过
// <script src="data.js"></script> 引入后动态渲染。
// ============================================================

// 热门搜索词
const hotKeywords = [
  '联合国气候峰会',
  '中欧经贸',
  '全球市场'
];

// 头条焦点 · 三张头条卡（含标题、图片、描述、标签）
const topCards = [
  {
    title: '全球气候峰会就减排目标达成阶段性共识',
    image: 'https://picsum.photos/seed/green-policy/640/420',
    description: '聚焦多边气候治理新进展',
    tag: '联合国气候峰会'
  },
  {
    title: '跨境物流提速为中欧贸易注入新动能',
    image: 'https://picsum.photos/seed/rail-europe/640/420',
    description: '中欧班列通道持续扩容',
    tag: '中欧经贸'
  },
  {
    title: '国产芯片产业迎来新一轮升级机遇',
    image: 'https://picsum.photos/seed/semiconductor/640/420',
    description: '供应链本土化进程加快',
    tag: '全球市场'
  }
];

// 封面头条（标题、描述、图片）
const coverNews = {
  title: '今日重点：多措并举稳增长 民生保障再升级',
  description: '聚焦宏观经济、产业政策与本地发展前沿',
  image: 'https://picsum.photos/seed/city-skyline/1280/720'
};

// 最新要闻列表（标题、时间）
const latestNews = [
  { title: '国务院常务会议部署下半年稳增长重点任务', time: '10分钟前' },
  { title: '央行公开市场操作今日净投放 流动性合理充裕', time: '32分钟前' },
  { title: '本地新开轨道交通线路启动空载试运行', time: '22分钟前' },
  { title: '多国领导人就加强区域合作达成初步共识', time: '42分钟前' },
  { title: '人工智能大模型加速在制造业落地应用', time: '1小时前' },
  { title: '国家博物馆推出馆藏精品特展', time: '2小时前' },
  { title: '城市书房建设扩容 公共文化服务再提升', time: '3小时前' }
];

// 频道精选（频道名、标题、描述、图片）
const channelNews = [
  {
    id: 'channel-intl',
    name: '国际',
    title: '欧洲多国推进能源结构绿色转型',
    description: '可再生能源装机占比持续提升',
    image: 'https://picsum.photos/seed/world-diplomacy/520/300'
  },
  {
    id: 'channel-finance',
    name: '财经',
    title: '消费市场持续回暖 新业态激发内需',
    description: '人民币汇率保持基本稳定',
    image: 'https://picsum.photos/seed/market-finance/520/300'
  },
  {
    id: 'channel-tech',
    name: '科技',
    title: '大模型加速行业落地应用',
    description: '算力基础设施建设提速',
    image: 'https://picsum.photos/seed/ai-tech/520/300'
  },
  {
    id: 'channel-culture',
    name: '文化',
    title: '国家博物馆推出馆藏精品特展',
    description: '城市公共文化服务提质增效',
    image: 'https://picsum.photos/seed/museum-culture/520/300'
  }
];

// 便民服务（icon 为 SVG path 字符串）
const services = [
  { name: '天气', icon: 'M3 12a9 9 0 1118 0M3 12h18M12 3a15 15 0 010 18M7.7 7.7a10 10 0 010 8.6M16.3 7.7a10 10 0 010 8.6' },
  { name: '快递查询', icon: 'M20 8l-4-3H4a6 6 0 016 6h10zM20 8v8a2 2 0 01-2 2H6a4 4 0 01-4-4v-3m0 5.5L6 21m3-3.5L9 21M2 13h18' },
  { name: '招聘信息', icon: 'M20 7a2 2 0 00-2-2h-3l1-2h-6l1 2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7zM8 12h8M8 16h5' },
  { name: '政务平台', icon: 'M4 21V9l8-5 8 5v12M4 21h16M9 21v-6h6v6M12 11v2' },
  { name: '交通出行', icon: 'M4 6a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 6h12m-5 5a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2z' },
  { name: '医疗预约', icon: 'M12 3v18M3 12h18M8 4l4 4 4-4M8 20l4-4 4 4' },
  { name: '教育考试', icon: 'M12 3L2 8l10 5 10-5-10-5zM4 10v6m0 0a8 5 0 0016 0M6 12.5V17a6 3.5 0 0012 0v-4.5' },
  { name: '生活缴费', icon: 'M3 7h18M3 12h18M3 17h18M6 5v2M12 10v2M18 15v2' }
];

// 热点专题（名称、图标 SVG path）
const topics = [
  { name: '高质量发展调研行', icon: 'M3 17l4-6 4 3 4-8 3 5 3-2' },
  { name: '乡村振兴观察', icon: 'M12 21a9 9 0 100-18M12 21c2-3 3-6 3-9M12 21c-2-3-3-6-3-9m3 0a5 5 0 100-10' },
  { name: '数字城市建设', icon: 'M12 3l8 4-8 4-8-4 8-4zM4 11l8 4 8-4M4 17l8 4 8-4' },
  { name: '绿色低碳生活', icon: 'M5 14a7 7 0 1114 0M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4m-9 3h4' }
];

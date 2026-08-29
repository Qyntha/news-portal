// ============================================================
// 相思门户网 · 静态页面数据
// 文章相关数据由后端 API 提供（api.js），本文件仅保留
// 页面静态配置：热词、公告、封面头条、便民服务、学习资料。
// ============================================================

// 热门搜索词
const hotKeywords = [
  '联合国气候峰会',
  '中欧经贸',
  '全球市场'
];

// 顶部公告（仅展示第一条）
const announcements = [
  '📢 欢迎访问相思门户网，本地视野，全球资讯。'
];

// 封面头条（标题、描述、图片）
const coverNews = {
  title: '今日重点：多措并举稳增长 民生保障再升级',
  description: '聚焦宏观经济、产业政策与本地发展前沿',
  image: 'https://picsum.photos/seed/city-skyline/1280/720'
};

// 便民服务（icon 为 SVG path 字符串）
const services = [
  { name: '天气', link: 'https://www.weather.com.cn', icon: 'M3 12a9 9 0 1118 0M3 12h18M12 3a15 15 0 010 18M7.7 7.7a10 10 0 010 8.6M16.3 7.7a10 10 0 010 8.6' },
  { name: '快递查询', link: 'https://www.kuaidi100.com', icon: 'M20 8l-4-3H4a6 6 0 016 6h10zM20 8v8a2 2 0 01-2 2H6a4 4 0 01-4-4v-3m0 5.5L6 21m3-3.5L9 21M2 13h18' },
  { name: '招聘信息', link: 'https://www.zhipin.com', icon: 'M20 7a2 2 0 00-2-2h-3l1-2h-6l1 2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7zM8 12h8M8 16h5' },
  { name: '政务平台', link: 'https://www.gov.cn', icon: 'M4 21V9l8-5 8 5v12M4 21h16M9 21v-6h6v6M12 11v2' },
  { name: '交通出行', link: 'https://www.12306.cn', icon: 'M4 6a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm0 6h12m-5 5a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 100 2 1 1 0 000-2z' },
  { name: '医疗预约', link: 'https://www.guahao.com', icon: 'M12 3v18M3 12h18M8 4l4 4 4-4M8 20l4-4 4 4' },
  { name: '教育考试', link: 'https://www.neea.edu.cn', icon: 'M12 3L2 8l10 5 10-5-10-5zM4 10v6m0 0a8 5 0 0016 0M6 12.5V17a6 3.5 0 0012 0v-4.5' },
  { name: '生活缴费', link: 'https://www.95598.cn', icon: 'M3 7h18M3 12h18M3 17h18M6 5v2M12 10v2M18 15v2' }
];

// 学习资料（名称、图标 SVG path）
const topics = [
  { name: '外文报纸', icon: 'M4 5a2 2 0 012-2h12a2 2 0 012 2v11a2 2 0 01-2 2H8l-4 4V5zM8 8h8M8 11h8M8 14h5' },
  { name: '电子课本', icon: 'M12 3L2 8l10 5 10-5-10-5zM4 10v6m0 0a8 5 0 0016 0M6 12.5V17a6 3.5 0 0012 0v-4.5' },
  { name: '学习工具', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z' },
  { name: '教育资讯', icon: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0' },
  { name: '阅读推荐', icon: 'M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2v16z' }
];

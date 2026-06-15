-- ============================================================
-- 个人网站数据库初始化脚本
-- 适用数据库：MySQL 8.0+
-- 使用方法：mysql -u root -p < init.sql
-- ============================================================

-- 创建数据库（如果不存在），使用UTF-8字符集
CREATE DATABASE IF NOT EXISTS personal_website
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 切换到目标数据库
USE personal_website;

-- ============================================================
-- 表1：管理员用户表 (admin_users)
-- 用途：存储后台管理系统的管理员登录账号
-- 密码使用bcrypt加密存储，不可逆
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id          INT AUTO_INCREMENT PRIMARY KEY  COMMENT '用户ID',
  username    VARCHAR(50)  NOT NULL UNIQUE    COMMENT '登录用户名',
  password    VARCHAR(255) NOT NULL           COMMENT 'bcrypt加密后的密码',
  nickname    VARCHAR(50)  DEFAULT '管理员'    COMMENT '管理员显示昵称',
  email       VARCHAR(100) DEFAULT NULL       COMMENT '联系邮箱',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员用户表';

-- 插入默认管理员账号 (密码: admin123，bcrypt加密后的hash)
-- ★部署时请立即修改密码★
INSERT INTO admin_users (username, password, nickname) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '站长');

-- ============================================================
-- 表2：站点配置表 (site_config)
-- 用途：存储整个网站的基础信息（可通过后台动态修改）
-- 使用单行键值对模式，方便管理后台直接修改
-- ============================================================
CREATE TABLE IF NOT EXISTS site_config (
  id          INT AUTO_INCREMENT PRIMARY KEY  COMMENT '配置ID',
  config_key  VARCHAR(100) NOT NULL UNIQUE    COMMENT '配置键名',
  config_value TEXT                           COMMENT '配置值（支持长文本）',
  description VARCHAR(255) DEFAULT ''         COMMENT '配置项说明',
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点配置表（键值对模式）';

-- 插入默认站点配置
INSERT INTO site_config (config_key, config_value, description) VALUES
('site_title',       'CodeNinja - 个人主页',         '网站标题（浏览器标签页显示）'),
('site_subtitle',    '全栈开发 · 技术随笔 · 生活记录', '网站副标题/SEO描述'),
('avatar_url',       '/assets/images/default-avatar.png', '个人头像URL'),
('nickname',         'CodeNinja',                   '个人昵称'),
('signature',        '用代码构建世界，用文字记录思考。', '个性签名/一句话介绍'),
('bio',              '一名热爱技术、热爱生活的全栈开发者。\n\n专注于Web开发和开源技术，喜欢探索前沿技术并分享经验。\n\n工作之余，喜欢摄影、阅读和旅行。', '个人简介（支持换行）'),
('tech_stack',       '[\"JavaScript\",\"Node.js\",\"Python\",\"React\",\"Vue\",\"MySQL\",\"Docker\",\"Git\",\"Linux\",\"AWS\"]', '技术标签（JSON数组格式）'),
('experience',       '[{\"title\":\"高级前端工程师 @ ABC科技\",\"period\":\"2023 - 至今\",\"desc\":\"负责公司核心产品前端架构设计\"},{\"title\":\"全栈开发工程师 @ XYZ互联\",\"period\":\"2020 - 2023\",\"desc\":\"Node.js后端开发 + 前端React项目\"},{\"title\":\"计算机科学 本科\",\"period\":\"2016 - 2020\",\"desc\":\"某大学 计算机科学与技术专业\"}]', '从业/学习经历（JSON数组）'),
('social_links',     '[{\"name\":\"GitHub\",\"url\":\"https://github.com\",\"icon\":\"github\"},{\"name\":\"Email\",\"url\":\"mailto:hello@example.com\",\"icon\":\"email\"},{\"name\":\"微信\",\"url\":\"#\",\"icon\":\"wechat\"}]', '社交账号链接（JSON数组）'),
('footer_copyright', '© 2026 CodeNinja. All Rights Reserved.', '页脚版权信息');

-- ============================================================
-- 表3：文章分类表 (article_categories)
-- 用途：文章的分类体系，用于筛选和导航
-- ============================================================
CREATE TABLE IF NOT EXISTS article_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY  COMMENT '分类ID',
  name        VARCHAR(50) NOT NULL UNIQUE     COMMENT '分类名称',
  slug        VARCHAR(50) NOT NULL UNIQUE     COMMENT '分类别名（URL友好）',
  description VARCHAR(255) DEFAULT ''         COMMENT '分类描述',
  sort_order  INT DEFAULT 0                   COMMENT '排序顺序（数字越小越靠前）',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章分类表';

-- 插入默认分类
INSERT INTO article_categories (name, slug, description, sort_order) VALUES
('技术分享', 'tech', '编程技术、开发经验分享', 1),
('随笔杂谈', 'essay', '生活随笔、个人感悟', 2),
('项目实战', 'project', '实战项目总结与复盘', 3),
('学习笔记', 'notes', '学习过程中的笔记整理', 4);

-- ============================================================
-- 表4：文章表 (articles)
-- 用途：存储所有文章内容，是博客系统的核心表
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id            INT AUTO_INCREMENT PRIMARY KEY  COMMENT '文章ID',
  title         VARCHAR(200) NOT NULL           COMMENT '文章标题',
  summary       VARCHAR(500) DEFAULT ''         COMMENT '文章摘要（用于列表展示）',
  content       LONGTEXT                        COMMENT '文章正文（HTML格式）',
  cover_image   VARCHAR(500) DEFAULT NULL       COMMENT '封面图片URL',
  category_id   INT DEFAULT NULL                COMMENT '所属分类ID',
  tags          VARCHAR(500) DEFAULT ''         COMMENT '标签（逗号分隔）',
  status        TINYINT DEFAULT 1               COMMENT '状态：1=已发布 0=草稿 2=已下架',
  is_pinned     TINYINT DEFAULT 0               COMMENT '是否置顶：1=置顶 0=不置顶',
  view_count    INT DEFAULT 0                   COMMENT '阅读次数',
  published_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章内容表';

-- 插入一篇示例文章
INSERT INTO articles (title, summary, content, category_id, tags, status, is_pinned) VALUES
('欢迎来到我的个人网站',
 '这是我的第一篇博客文章，感谢你的到访！',
 '<h2>🎉 你好，世界！</h2><p>欢迎来到我的个人网站，这里将记录我的技术探索和生活感悟。</p><p>网站刚刚搭建完成，后续会持续更新内容，敬请期待！</p><h3>关于本站</h3><ul><li>前端：原生 HTML + CSS + JavaScript，极致暗黑主题</li><li>后端：Node.js + Express API 服务</li><li>数据库：MySQL</li><li>服务器：Apache 反向代理</li></ul><p>感谢你的到访，希望你喜欢这个站点！</p>',
 1, '网站,Hello World', 1, 1);

-- ============================================================
-- 表5：留言板表 (messages)
-- 用途：存储访客提交的留言，需后台审核后在前端展示
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id          INT AUTO_INCREMENT PRIMARY KEY  COMMENT '留言ID',
  nickname    VARCHAR(50) NOT NULL            COMMENT '留言者昵称',
  email       VARCHAR(100) DEFAULT ''         COMMENT '留言者邮箱（不对外展示）',
  content     TEXT NOT NULL                   COMMENT '留言内容',
  reply       TEXT DEFAULT NULL               COMMENT '管理员回复内容',
  status      TINYINT DEFAULT 0               COMMENT '审核状态：0=待审核 1=已通过 2=已拒绝',
  ip_address  VARCHAR(50) DEFAULT ''          COMMENT '留言者IP地址',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '留言时间',
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='留言板表';

-- 插入两条示例留言
INSERT INTO messages (nickname, email, content, status) VALUES
('访客小明', 'xiaoming@example.com', '网站很棒！暗黑主题很酷，期待更多文章。', 1),
('路人甲', 'someone@example.com', '你好，可以交换友链吗？', 1);

-- ============================================================
-- 表6：项目展示表 (projects)
-- 用途：存储个人项目/作品集信息，展示在前端项目展示页
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id            INT AUTO_INCREMENT PRIMARY KEY  COMMENT '项目ID',
  title         VARCHAR(200) NOT NULL           COMMENT '项目名称',
  description   TEXT                            COMMENT '项目介绍',
  thumbnail     VARCHAR(500) DEFAULT NULL       COMMENT '项目缩略图URL',
  demo_url      VARCHAR(500) DEFAULT ''         COMMENT '在线预览链接',
  github_url    VARCHAR(500) DEFAULT ''         COMMENT 'Git仓库链接',
  tech_tags     VARCHAR(300) DEFAULT ''         COMMENT '技术标签（逗号分隔）',
  sort_order    INT DEFAULT 0                   COMMENT '排序顺序',
  status        TINYINT DEFAULT 1               COMMENT '状态：1=展示 0=隐藏',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目展示表';

-- 插入示例项目
INSERT INTO projects (title, description, tech_tags, demo_url, github_url, sort_order) VALUES
('个人网站项目', '基于Node.js+MySQL+原生前端构建的个人网站，暗黑主题，响应式设计。', 'Node.js,Express,MySQL,HTML5,CSS3', '#', 'https://github.com', 1),
('在线工具箱', '一套常用的在线工具集合，包含JSON格式化、Base64编解码、时间戳转换等。', 'JavaScript,CSS3', '#', 'https://github.com', 2),
('天气应用', '调用第三方API实现的天气预报Web应用，支持城市搜索和7天预报。', 'JavaScript,REST API,SVG', '#', 'https://github.com', 3);

-- ============================================================
-- 表7：相册表 (gallery)
-- 用途：存储相册图片，支持分类管理和前端大图预览
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery (
  id            INT AUTO_INCREMENT PRIMARY KEY  COMMENT '图片ID',
  title         VARCHAR(200) DEFAULT ''         COMMENT '图片标题/描述',
  image_url     VARCHAR(500) NOT NULL           COMMENT '图片URL',
  thumbnail_url VARCHAR(500) DEFAULT NULL       COMMENT '缩略图URL（可留空，前端用CSS缩放）',
  category      VARCHAR(50) DEFAULT '未分类'     COMMENT '图片分类（如：旅行、日常、工作）',
  sort_order    INT DEFAULT 0                   COMMENT '排序顺序',
  status        TINYINT DEFAULT 1               COMMENT '状态：1=展示 0=隐藏',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='相册图片表';

-- 插入示例图片（实际使用时请替换为真实图片URL）
INSERT INTO gallery (title, image_url, category, sort_order) VALUES
('示例图片1 - 城市风光', '/assets/images/gallery-placeholder-1.jpg', '风景', 1),
('示例图片2 - 代码日常', '/assets/images/gallery-placeholder-2.jpg', '日常', 2),
('示例图片3 - 落日',       '/assets/images/gallery-placeholder-3.jpg', '风景', 3);

-- ============================================================
-- 表8：访客统计表 (visitor_stats)
-- 用途：记录每日访客数据，首页展示总访问量
-- ============================================================
CREATE TABLE IF NOT EXISTS visitor_stats (
  id          INT AUTO_INCREMENT PRIMARY KEY  COMMENT '记录ID',
  visit_date  DATE NOT NULL DEFAULT (CURRENT_DATE) COMMENT '访问日期',
  visit_count INT DEFAULT 1                    COMMENT '当日访问次数',
  UNIQUE KEY uk_date (visit_date)              COMMENT '每天一条记录，避免重复'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访客统计表';

-- 插入几天的示例数据
INSERT INTO visitor_stats (visit_date, visit_count) VALUES
(CURRENT_DATE - INTERVAL 6 DAY, 23),
(CURRENT_DATE - INTERVAL 5 DAY, 31),
(CURRENT_DATE - INTERVAL 4 DAY, 18),
(CURRENT_DATE - INTERVAL 3 DAY, 42),
(CURRENT_DATE - INTERVAL 2 DAY, 27),
(CURRENT_DATE - INTERVAL 1 DAY, 35),
(CURRENT_DATE, 1);

-- ============================================================
-- 脚本执行完成提示
-- ============================================================
-- ★ 部署注意事项 ★
-- 1. 请立即登录后台修改默认管理员密码（默认: admin / admin123）
-- 2. 在管理后台「站点设置」中更新个人信息
-- 3. 替换相册和项目的示例图片为真实图片
-- 4. 如需重置数据，可运行：DROP DATABASE personal_website; 然后重新执行本脚本
-- ============================================================

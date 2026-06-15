<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v24.13-339933?logo=nodedotjs" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.21-000000?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/Apache-2.4-D22128?logo=apache" alt="Apache">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="license">
</p>

<h1 align="center">
  &lt;<span style="color:#a78bfa">C</span>odeNinja /&gt;
</h1>

<p align="center">
  <strong>全栈个人网站</strong> — 暗黑科技风 · 博客/项目/相册/留言板 · 音乐播放器
</p>

<p align="center">
  <a href="#-项目结构">结构</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-配置">配置</a> •
  <a href="#-API接口">API</a> •
  <a href="#-管理后台">后台</a> •
  <a href="#-音乐播放器">音乐</a> •
  <a href="#-部署架构">架构</a>
</p>

---

## ✨ 功能特性

| 模块 | 说明 |
|------|------|
| 🏠 **首页** | Hero 展示 + 实时统计数据 + 最新文章 + 精选项目 + 快捷导航 |
| 👤 **关于我** | 个人简介 + 技术栈标签 + 经历时间线 + 社交链接 |
| 📝 **文章博客** | 分类筛选 + 关键词搜索 + 分页 + 文章详情 |
| 🚀 **项目展示** | 项目卡片 + 技术标签 + 在线预览/Git 仓库链接 |
| 📷 **相册** | 分类筛选 + 大图灯箱预览 + ESC 关闭 |
| 💬 **留言板** | 访客留言提交 + 管理员审核回复 + 分页 |
| 🎵 **音乐播放器** | 可拖动 · 可视化频谱 · 三种播放模式 · 键盘快捷键 · **页面切换不中断** |
| 🔐 **管理后台** | 仪表盘 · 文章/项目/相册 CRUD · 留言审核 · 站点设置 |
| 🌌 **粒子星空** | Canvas 动态粒子背景 + 连线效果 |
| ✨ **滚动动画** | IntersectionObserver 驱动的渐入动画 |
| 📱 **响应式** | 适配桌面端 / 平板 / 手机 |

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | 原生 HTML5 + CSS3 + JavaScript（零框架） |
| **后端** | Node.js + Express 4 |
| **数据库** | MySQL 8.0 |
| **Web 服务器** | Apache 2.4（静态文件 + 反向代理） |
| **内网穿透** | ngrok |
| **认证** | JWT（jsonwebtoken）+ bcryptjs |
| **上传** | multer（multipart/form-data） |

---

## 📁 项目结构

```
personal/
├── frontend/                     # 前端页面（原生 HTML/CSS/JS）
│   ├── index.html                # ★ 应用壳层（SPA 路由 + 持久化音乐播放器）
│   ├── about.html                # 关于我
│   ├── articles.html             # 文章列表
│   ├── article-detail.html       # 文章详情（支持 ?id=N 参数）
│   ├── projects.html             # 项目展示
│   ├── gallery.html              # 相册
│   ├── guestbook.html            # 留言板
│   ├── admin/                    # 管理后台（独立，非 SPA）
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── articles.html
│   │   ├── messages.html
│   │   ├── projects.html
│   │   ├── gallery.html
│   │   └── settings.html
│   ├── css/
│   │   ├── style.css             # 全局样式（暗黑主题 + 霓虹辉光 + 玻璃拟态）
│   │   └── admin.css             # 后台样式
│   ├── js/
│   │   ├── api.js                # API 请求封装（fetch + JWT + 错误处理）
│   │   ├── main.js               # 通用脚本（粒子、导航、滚动动画）
│   │   ├── music-player.js       # 音乐播放器模块（全局持久化）
│   │   ├── router.js             # SPA 路由器（History API）
│   │   └── admin.js              # 后台通用脚本
│   └── assets/images/            # 图片资源
├── backend/                      # Node.js 后端
│   ├── server.js                 # ★ 入口文件（Express 服务 + 路由注册）
│   ├── package.json              # 依赖声明
│   ├── config/
│   │   └── db.js                 # 数据库连接池配置
│   ├── routes/                   # API 路由模块
│   │   ├── auth.js               # POST /api/auth/login
│   │   ├── articles.js           # CRUD /api/articles
│   │   ├── messages.js           # CRUD /api/messages
│   │   ├── projects.js           # CRUD /api/projects
│   │   ├── gallery.js            # CRUD /api/gallery
│   │   ├── settings.js           # GET+PUT /api/settings
│   │   ├── stats.js              # GET+POST /api/stats
│   │   └── music.js              # GET /api/music/list（扫描本地 MP3）
│   └── middleware/
│       └── auth.js               # JWT 签发 + 验证中间件
├── database/
│   └── init.sql                  # 数据库初始化（8 张表 + 示例数据）
├── start.bat                     # Windows 一键启动脚本
├── deploy.md                     # 详细部署文档
└── .gitignore
```

---

## 🚀 快速开始

### 环境要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18 | 推荐 v24 |
| MySQL | ≥ 8.0 | 需创建 `personal_website` 数据库 |
| Apache | 2.4 | 或 Nginx / 直接访问 localhost:3000 |
| ngrok | 可选 | 用于外网访问 |

### 1. 克隆项目

```bash
git clone https://github.com/RookieZJW/PersonalWeb.git
cd PersonalWeb
```

### 2. 初始化数据库

```bash
mysql -u root -p < database/init.sql
```

执行后会自动创建 `personal_website` 数据库及 8 张表，并插入示例数据。

### 3. 配置数据库连接

编辑 `backend/config/db.js`，修改数据库密码：

```js
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '你的密码',   // ← 修改这里
  database: 'personal_website',
};
```

### 4. 安装后端依赖

```bash
cd backend
npm install
```

### 5. 启动后端

```bash
node server.js
# 开发模式（文件变更自动重启）
node --watch server.js
```

看到以下输出表示成功：

```
✅ 数据库连接成功: MySQL 8.0.36
🚀 API服务已启动: http://localhost:3000
```

### 6. 配置 Apache（可选）

编辑 Apache `httpd.conf`：

```apache
ServerName localhost:80
DocumentRoot "${SRVROOT}/htdocs/personal/frontend"
Alias /music/ "G:/music/"              # 音乐文件目录映射
ProxyPass /api/ http://localhost:3000/api/
ProxyPassReverse /api/ http://localhost:3000/api/
```

确保加载模块：`mod_proxy.so`、`mod_proxy_http.so`、`mod_rewrite.so`

### 7. 访问网站

| 地址 | 说明 |
|------|------|
| `http://localhost` | 本地主页（需 Apache） |
| `http://localhost:3000` | API 文档 |
| `http://localhost/admin/login.html` | 管理后台 |

> **Windows 用户**：直接双击 `start.bat` 一键启动 MySQL + Apache + Node.js + ngrok。

---

## ⚙️ 配置

### 音乐目录

默认扫描 `G:\music` 目录下的 `.mp3` 文件。修改 `backend/routes/music.js` 中的 `MUSIC_DIR` 变量即可自定义路径。

支持的文件名格式：
- `歌手 - 歌名.mp3` → 自动解析为艺术家/标题
- `歌名.mp3` → 艺术家显示为"Unknown"

### 数据库密码

修改 `backend/config/db.js` 中的 `password` 字段。

### JWT 密钥

修改 `backend/middleware/auth.js` 中的 `JWT_SECRET`。

### 网站个人信息

登录管理后台 → 站点设置 → 修改昵称、头像、签名、社交链接等。

---

## 📡 API 接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/settings` | 获取站点配置 | - |
| PUT | `/api/settings` | 更新站点配置 | Token |
| GET | `/api/stats` | 获取统计数据 | - |
| POST | `/api/stats` | 记录访问 | - |
| GET | `/api/articles` | 文章列表（分页/筛选/搜索） | - |
| GET | `/api/articles/:id` | 文章详情 | - |
| GET | `/api/articles/categories` | 文章分类 | - |
| POST | `/api/articles` | 创建文章 | Token |
| PUT | `/api/articles/:id` | 更新文章 | Token |
| DELETE | `/api/articles/:id` | 删除文章 | Token |
| GET | `/api/messages` | 留言列表 | - |
| POST | `/api/messages` | 提交留言 | - |
| PUT | `/api/messages/:id/approve` | 审核留言 | Token |
| DELETE | `/api/messages/:id` | 删除留言 | Token |
| GET | `/api/projects` | 项目列表 | - |
| POST | `/api/projects` | 创建项目 | Token |
| PUT | `/api/projects/:id` | 更新项目 | Token |
| DELETE | `/api/projects/:id` | 删除项目 | Token |
| GET | `/api/gallery` | 相册列表（支持分类筛选） | - |
| POST | `/api/gallery` | 上传图片 | Token |
| PUT | `/api/gallery/:id` | 更新图片 | Token |
| DELETE | `/api/gallery/:id` | 删除图片 | Token |
| GET | `/api/music/list` | 音乐播放列表 | - |
| POST | `/api/auth/login` | 管理员登录 | - |
| POST | `/api/auth/change-password` | 修改密码 | Token |

---

## 🎵 音乐播放器

音乐播放器作为全局持久化模块，在页面切换时**不会中断播放**。打开播放器后，音乐将在所有页面之间无缝持续播放。

### 操作

| 操作 | 方式 |
|------|------|
| 打开/关闭 | 点击右下角 🎵 按钮 |
| 拖拽移动 | 按住按钮或播放器标题栏拖动 |
| 位置记忆 | 自动保存到 localStorage，刷新后恢复 |

### 键盘快捷键

| 按键 | 功能 |
|------|------|
| `空格` | 播放/暂停 |
| `←` `→` | 快退/快进 5 秒 |
| `Ctrl+←` `Ctrl+→` | 上一首/下一首 |
| `↑` `↓` | 音量增减 |
| `M` | 切换播放模式（单曲循环 → 列表循环 → 随机播放） |

---

## 🔐 管理后台

- **地址**：`http://localhost/admin/login.html`
- **默认账号**：`admin`
- **默认密码**：`admin123`

> ⚠️ **首次登录后请立即修改密码！**

### 后台功能

| 模块 | 功能 |
|------|------|
| 仪表盘 | 文章数/项目数/留言数/图片数概览 |
| 文章管理 | 新建/编辑/删除文章，Markdown 编辑器 |
| 留言管理 | 审核通过/拒绝留言，管理员回复 |
| 项目管理 | 添加/编辑/删除项目卡片 |
| 相册管理 | 上传图片/分类/编辑/删除 |
| 站点设置 | 修改昵称/头像/签名/社交链接/技术栈/页脚 |

---

## 📊 部署架构

```
浏览器
  │
  ├── http://localhost
  └── https://xxx.ngrok-free.dev
         │
         ▼
    ┌─────────┐
    │ Apache  │  port 80
    │ 静态文件 + 反向代理
    └────┬────┘
         │
    ┌────┴────────────────┐
    │                     │
    ▼                     ▼
┌──────────┐    ┌──────────────┐
│ 静态文件  │    │ Node.js      │
│ frontend/ │    │ port 3000    │
│ /music/   │    │ REST API     │
│ (G:\music)│    └──────┬───────┘
└──────────┘           │
                   ┌───┴───┐
                   │ MySQL │  port 3306
                   │ 8.0   │
                   └───────┘
```

---

## 📦 依赖

### 后端（backend/package.json）

| 依赖 | 版本 | 用途 |
|------|------|------|
| express | ^4.21 | HTTP 框架 |
| mysql2 | ^3.11 | MySQL 数据库驱动 |
| bcryptjs | ^2.4 | 密码哈希 |
| jsonwebtoken | ^9.0 | JWT 令牌 |
| multer | ^1.4 | 文件上传 |
| cors | ^2.8 | 跨域支持 |

### 前端

零依赖框架，纯原生实现。SPA 路由和音乐播放器均为手写模块（总计约 700 行 JavaScript）。

---

## 📝 License

MIT © 2026 CodeNinja

---

<p align="center">
  <sub>Built with ❤️ using Node.js · Express · MySQL · Apache</sub>
</p>

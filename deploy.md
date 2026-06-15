# 个人网站 — 部署与运维文档

> 最后更新：2026-06-15

---

## 📋 环境要求

| 软件 | 版本 | 状态 |
|------|------|------|
| Node.js | v24.13.1 | ✅ |
| MySQL | 8.0.36 | ✅ |
| Apache | 2.4 | ✅ |
| ngrok | 3.39.7 | ✅ |

---

## ⚡ 一键启动（日常使用）

```
双击桌面：启动个人网站.bat
```

脚本自动完成：
1. 检查/启动 MySQL（端口 3306）
2. 检查/启动 Apache（端口 80）
3. 新窗口启动 Node.js 后端（端口 3000）
4. 新窗口启动 ngrok 内网穿透
5. 自动打开浏览器 → 本地 + 外网地址

**停止**：双击 `D:\Apache24\htdocs\personal\stop.bat`

> ⚠️ 启动后会弹出 2 个命令行窗口（Node后端 + ngrok），**不要关闭**，最小化即可。

---

## 🚀 手动启动步骤

### 第一步：MySQL

```cmd
:: 通常已开机自启，检查状态
sc query MySQL80 | findstr RUNNING
:: 如未运行
net start MySQL80
```

### 第二步：Apache

```cmd
cd /d D:\Apache24\bin
httpd.exe -k start
```

常用命令：
```cmd
httpd.exe -t          # 测试配置语法
httpd.exe -k restart  # 重启
httpd.exe -k stop     # 停止
```

### 第三步：Node.js 后端

```cmd
cd /d D:\Apache24\htdocs\personal\backend
node server.js
```

看到以下输出表示成功：
```
✅ 数据库连接成功: MySQL 8.0.36
🚀 API服务已启动: http://localhost:3000
```

### 第四步：ngrok 内网穿透（可选）

```cmd
cd /d G:\
ngrok.exe http 80
```

成功后显示外网地址：
```
Forwarding  https://xxxx.ngrok-free.dev → http://localhost:80
```

---

## 🌐 访问地址

| 地址 | 说明 |
|------|------|
| `http://localhost` | 本地主页 |
| `http://localhost/admin/login.html` | 管理后台 |
| `http://localhost:3000` | API 文档 |
| `http://127.0.0.1:4040` | ngrok 监控面板 |
| `https://xxxx.ngrok-free.dev` | 外网访问（ngrok 提供） |

---

## 🔐 管理后台

- 地址：`http://localhost/admin/login.html`
- 默认账号：`admin`
- 默认密码：`admin123`
- **首次登录后请立即修改密码！**

---

## 📁 项目目录结构

```
personal/
├── frontend/                  # 前端页面
│   ├── index.html             # 首页（Hero + 文章 + 项目 + 音乐播放器）
│   ├── about.html             # 关于我
│   ├── articles.html          # 文章列表
│   ├── article-detail.html    # 文章详情
│   ├── projects.html          # 项目展示
│   ├── gallery.html           # 相册
│   ├── guestbook.html         # 留言板
│   ├── admin/                 # 管理后台
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── articles.html
│   │   ├── messages.html
│   │   ├── projects.html
│   │   ├── gallery.html
│   │   └── settings.html
│   ├── css/
│   │   └── style.css          # 全局样式（暗黑主题）
│   ├── js/
│   │   ├── api.js             # API 请求封装
│   │   └── main.js            # 通用脚本
│   └── assets/
│       └── images/            # 图片资源
├── backend/                   # Node.js 后端
│   ├── server.js              # 入口文件
│   ├── config/
│   │   └── db.js              # ★ 数据库配置
│   ├── routes/
│   │   ├── auth.js            # 认证
│   │   ├── articles.js        # 文章
│   │   ├── messages.js        # 留言
│   │   ├── projects.js        # 项目
│   │   ├── gallery.js         # 相册
│   │   ├── settings.js        # 站点设置
│   │   ├── stats.js           # 统计
│   │   └── music.js           # 音乐播放器API
│   ├── middleware/
│   │   └── auth.js            # JWT 认证中间件
│   └── uploads/               # 上传文件
├── database/
│   └── init.sql               # 数据库初始化
├── start.bat                  # 一键启动脚本
├── stop.bat                   # 一键停止脚本
└── deploy.md                  # 本文件
```

---

## 🎵 音乐播放器

### 功能
- 自动扫描 `G:\music` 目录下的 MP3 文件
- 新增文件自动出现在播放列表，无需任何操作
- 可拖动到页面任意位置（位置自动保存）
- 支持键盘快捷键控制

### 添加音乐
```
直接把 .mp3 文件复制到 G:\music\
→ 刷新页面 → 播放列表自动更新
```

支持的文件名格式：
- `歌手 - 歌名.mp3` → 自动解析为歌手/歌名
- `歌名.mp3` → 歌手显示为"未知歌手"

### 操作快捷键

| 按键 | 功能 |
|------|------|
| `空格` | 播放/暂停 |
| `←` `→` | 快退/快进 5 秒 |
| `Ctrl+←` `Ctrl+→` | 上一首/下一首 |
| `↑` `↓` | 音量增减 |
| `M` | 切换播放模式 |

---

## 🗄️ 数据库

### 初始化

```bash
mysql -u root -p < D:\Apache24\htdocs\personal\database\init.sql
```

### 8 张数据表

| 表名 | 用途 |
|------|------|
| `admin_users` | 管理员账号 |
| `site_config` | 站点配置（标题/头像/社交链接等） |
| `articles` | 文章内容 |
| `article_categories` | 文章分类 |
| `messages` | 留言板 |
| `projects` | 项目展示 |
| `gallery` | 相册 |
| `visitor_stats` | 访客统计 |

### 修改数据库密码

编辑 `backend/config/db.js`：
```javascript
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '你的密码',     // ← 修改这里
  database: 'personal_website',
};
```

---

## ⚙️ Apache 配置要点

### 关键配置（`D:\Apache24\conf\httpd.conf`）

```apache
# 全局服务器名（消除启动警告）
ServerName localhost:80

# 前端根目录
DocumentRoot "${SRVROOT}/htdocs/personal/frontend"

# 音乐文件目录映射
Alias /music/ "G:/music/"

# API 反向代理 → Node.js
ProxyPass /api/ http://localhost:3000/api/
ProxyPassReverse /api/ http://localhost:3000/api/
```

### 必须加载的模块
```
mod_proxy.so
mod_proxy_http.so
mod_rewrite.so
mod_alias.so
mod_dir.so
mod_headers.so
```

---

## 🔧 已解决的问题记录

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 文章/留言 API 500 错误 | `mysql2` 的 `execute()` 不支持 `LIMIT ? OFFSET ?` | `db.js` 中改用 `pool.query()` |
| 文章管理页加载失败 | `status=""` 时 `parseInt("")` → `NaN` | 路由中增加空字符串判断 |
| 相册/头像图片不显示 | 数据库引用 `.jpg/.png` 但文件是 `.svg` | 创建占位图 + 更新数据库路径 |
| 音乐播放器格式错乱 | 播放器卡片缺少内容区 padding | 添加 `padding: 0 16px 14px` |
| 外网 API 调用失败 | `API_BASE` 写死 `localhost:3000` | 改为相对路径 `/api` |

---

## 🛠 常见问题排查

| 症状 | 检查项 |
|------|--------|
| 网站打不开 | Apache 是否启动？`sc query Apache2.4` |
| 页面无数据 | Node 后端是否在运行？访问 `http://localhost:3000` |
| 后台登录失败 | MySQL 是否运行？数据库密码是否正确？ |
| 图片不显示 | 文件是否存在于 `assets/images/`？ |
| 音乐不播放 | `G:\music` 目录是否有 MP3？Apache Alias 是否生效？ |
| 外网无法访问 | ngrok 是否在运行？URL 是否正确？ |
| 端口冲突 | `netstat -ano | findstr ":80"` 查看占用 |

### 日志位置
- Apache 错误：`D:\Apache24\logs\personal-error.log`
- Apache 访问：`D:\Apache24\logs\personal-access.log`
- Node 后端：运行窗口直接查看控制台输出
- ngrok：运行窗口直接查看，或 `http://127.0.0.1:4040`

---

## ⭐ 自定义修改指引

| 修改内容 | 文件 |
|----------|------|
| 数据库密码 | `backend/config/db.js` |
| JWT 密钥 | `backend/middleware/auth.js` |
| API 端口 | `backend/server.js`（`PORT` 变量） |
| Apache 端口 | `conf/httpd.conf`（`Listen`） |
| 音乐目录 | `backend/routes/music.js`（`MUSIC_DIR`）|
| 头像/昵称/签名 | 后台 → 站点设置 |
| 首页内容 | 后台管理各模块 |

---

## 📊 架构图

```
浏览器
  │
  ├─ http://localhost
  └─ https://xxx.ngrok-free.dev
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

部署完毕 🎉

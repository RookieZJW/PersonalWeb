/**
 * 个人网站后端API服务 — 入口文件
 * 基于 Express 框架，提供 RESTful API 接口
 *
 * 启动方式：node server.js
 * 开发模式：node --watch server.js（Node 18+自带文件监听热重启）
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/db');

// ==================== 导入路由模块 ====================
const authRoutes = require('./routes/auth');
const articlesRoutes = require('./routes/articles');
const messagesRoutes = require('./routes/messages');
const projectsRoutes = require('./routes/projects');
const galleryRoutes = require('./routes/gallery');
const settingsRoutes = require('./routes/settings');
const statsRoutes = require('./routes/stats');
const musicRoutes = require('./routes/music');

// ==================== 创建Express应用 ====================
const app = express();

// ★ 服务端口 — 可修改 ★
const PORT = 3000;

// ==================== 全局中间件配置 ====================

// CORS 跨域配置（允许前端页面跨域访问API）
app.use(cors({
  origin: '*',                    // 生产环境建议限制为具体域名
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析 JSON 请求体（限制大小防止恶意请求）
app.use(express.json({ limit: '10mb' }));

// 解析 URL 编码的请求体（表单提交）
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== 静态文件服务 ====================

// 上传文件目录（通过 /uploads/ 路径访问上传的图片等资源）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== API 路由注册 ====================

app.use('/api/auth', authRoutes);           // 管理员认证相关
app.use('/api/articles', articlesRoutes);   // 文章CRUD
app.use('/api/messages', messagesRoutes);   // 留言板
app.use('/api/projects', projectsRoutes);   // 项目展示
app.use('/api/gallery', galleryRoutes);     // 相册管理
app.use('/api/settings', settingsRoutes);   // 站点设置
app.use('/api/stats', statsRoutes);         // 访客统计
app.use('/api/music', musicRoutes);       // 音乐播放器

// ==================== 根路由 ====================

app.get('/', (req, res) => {
  res.json({
    name: '个人网站API服务',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET  /api/settings       - 获取站点信息',
      'GET  /api/stats          - 获取访客统计',
      'GET  /api/articles       - 文章列表',
      'GET  /api/articles/:id   - 文章详情',
      'POST /api/auth/login     - 管理员登录',
      'GET  /api/messages       - 留言列表',
      'POST /api/messages       - 提交留言',
      'GET  /api/projects       - 项目列表',
      'GET  /api/gallery        - 相册列表'
    ]
  });
});

// ==================== 404处理 ====================

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在: ' + req.method + ' ' + req.url
  });
});

// ==================== 全局错误处理 ====================

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== 启动服务 ====================

async function startServer() {
  console.log('========================================');
  console.log('  个人网站后端API服务');
  console.log('========================================');

  // 测试数据库连接
  const dbOk = await testConnection();
  if (!dbOk) {
    console.log('\n⚠️  数据库连接失败，但服务仍会启动（部分接口不可用）');
    console.log('请先执行 database/init.sql 初始化数据库\n');
  }

  // 启动HTTP服务
  app.listen(PORT, () => {
    console.log(`\n🚀 API服务已启动: http://localhost:${PORT}`);
    console.log(`📋 API文档: http://localhost:${PORT}/`);
    console.log(`📁 上传目录: ${path.join(__dirname, 'uploads')}`);
    console.log('\n按 Ctrl+C 停止服务\n');
  });
}

startServer();

/**
 * 项目管理路由
 * 路径前缀: /api/projects
 * 前端: GET 获取项目列表
 * 后台: POST/PUT/DELETE (需认证)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { query, queryOne, execute } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 配置文件上传（项目缩略图）
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/projects'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg/png/gif/webp 格式的图片'));
    }
  }
});

/**
 * GET /api/projects
 * 公开接口 — 获取项目列表
 */
router.get('/', async (req, res) => {
  try {
    const projects = await query(
      'SELECT * FROM projects WHERE status = 1 ORDER BY sort_order ASC, created_at DESC'
    );
    res.json({ code: 200, data: projects });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({ code: 500, message: '获取项目列表失败' });
  }
});

/**
 * POST /api/projects
 * 后台接口 — 添加项目（支持图片上传）
 */
router.post('/', authMiddleware, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, demo_url, github_url, tech_tags, sort_order } = req.body;
    const thumbnail = req.file ? '/uploads/projects/' + req.file.filename : null;

    if (!title) {
      return res.status(400).json({ code: 400, message: '项目名称不能为空' });
    }

    const result = await execute(
      'INSERT INTO projects (title, description, thumbnail, demo_url, github_url, tech_tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', thumbnail, demo_url || '', github_url || '', tech_tags || '', sort_order || 0]
    );

    res.json({ code: 200, message: '项目添加成功', data: { id: result.insertId, thumbnail } });
  } catch (error) {
    console.error('添加项目失败:', error);
    res.status(500).json({ code: 500, message: '添加项目失败' });
  }
});

/**
 * PUT /api/projects/:id
 * 后台接口 — 编辑项目
 */
router.put('/:id', authMiddleware, upload.single('thumbnail'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, demo_url, github_url, tech_tags, sort_order, status } = req.body;

    // 如果上传了新图片，更新缩略图
    let thumbnail = req.body.existing_thumbnail || null;
    if (req.file) {
      thumbnail = '/uploads/projects/' + req.file.filename;
    }

    await execute(
      `UPDATE projects SET title=?, description=?, thumbnail=?, demo_url=?, github_url=?,
       tech_tags=?, sort_order=?, status=? WHERE id=?`,
      [title, description, thumbnail, demo_url, github_url, tech_tags, sort_order || 0, status || 1, id]
    );

    res.json({ code: 200, message: '项目更新成功' });
  } catch (error) {
    console.error('更新项目失败:', error);
    res.status(500).json({ code: 500, message: '更新项目失败' });
  }
});

/**
 * DELETE /api/projects/:id
 * 后台接口 — 删除项目
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await execute('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '项目删除成功' });
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({ code: 500, message: '删除项目失败' });
  }
});

module.exports = router;

/**
 * 相册路由
 * 路径前缀: /api/gallery
 * 前端: GET 获取图片列表（支持分类筛选）
 * 后台: POST/PUT/DELETE (需认证，支持图片上传)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { query, execute } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 配置文件上传（相册图片）
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/gallery'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 相册图片限制10MB
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
 * GET /api/gallery
 * 公开接口 — 获取相册图片列表（支持分类筛选）
 * 查询参数: category (可选)
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM gallery WHERE status = 1';
    const params = [];

    if (category && category !== '全部') {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY sort_order ASC, created_at DESC';

    const images = await query(sql, params);

    // 同时获取所有分类名称
    const categories = await query(
      'SELECT DISTINCT category FROM gallery WHERE status = 1 ORDER BY category'
    );

    res.json({
      code: 200,
      data: {
        images,
        categories: categories.map(c => c.category)
      }
    });
  } catch (error) {
    console.error('获取相册失败:', error);
    res.status(500).json({ code: 500, message: '获取相册失败' });
  }
});

/**
 * POST /api/gallery
 * 后台接口 — 上传图片到相册
 */
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择要上传的图片' });
    }

    const { title, category, sort_order } = req.body;
    const imageUrl = '/uploads/gallery/' + req.file.filename;

    const result = await execute(
      'INSERT INTO gallery (title, image_url, category, sort_order) VALUES (?, ?, ?, ?)',
      [title || '', imageUrl, category || '未分类', sort_order || 0]
    );

    res.json({ code: 200, message: '图片上传成功', data: { id: result.insertId, image_url: imageUrl } });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ code: 500, message: '上传图片失败' });
  }
});

/**
 * PUT /api/gallery/:id
 * 后台接口 — 编辑图片信息
 */
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, sort_order, status } = req.body;

    let imageUrl = req.body.existing_image_url;
    if (req.file) {
      imageUrl = '/uploads/gallery/' + req.file.filename;
    }

    await execute(
      'UPDATE gallery SET title=?, image_url=?, category=?, sort_order=?, status=? WHERE id=?',
      [title || '', imageUrl, category || '未分类', sort_order || 0, status || 1, id]
    );

    res.json({ code: 200, message: '图片信息更新成功' });
  } catch (error) {
    console.error('更新图片失败:', error);
    res.status(500).json({ code: 500, message: '更新图片失败' });
  }
});

/**
 * DELETE /api/gallery/:id
 * 后台接口 — 删除图片
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await execute('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '图片删除成功' });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ code: 500, message: '删除图片失败' });
  }
});

module.exports = router;

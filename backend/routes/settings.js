/**
 * 站点设置路由
 * 路径前缀: /api/settings
 * 前端: GET 获取所有站点配置
 * 后台: PUT 更新站点配置 (需认证)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { query, execute } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// 配置头像上传
const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/avatars'),
  filename: (req, file, cb) => {
    const uniqueName = 'avatar-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 头像限制3MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片格式'));
    }
  }
});

/**
 * GET /api/settings
 * 公开接口 — 获取所有站点配置（转换为对象格式）
 */
router.get('/', async (req, res) => {
  try {
    const rows = await query('SELECT config_key, config_value FROM site_config');

    // 将键值对数组转换为对象
    const settings = {};
    rows.forEach(row => {
      // 尝试解析JSON格式的值
      try {
        settings[row.config_key] = JSON.parse(row.config_value);
      } catch (e) {
        settings[row.config_key] = row.config_value;
      }
    });

    res.json({ code: 200, data: settings });
  } catch (error) {
    console.error('获取站点设置失败:', error);
    res.status(500).json({ code: 500, message: '获取站点设置失败' });
  }
});

/**
 * PUT /api/settings
 * 后台接口 — 批量更新站点设置
 * 请求体: { "site_title": "新标题", "nickname": "新昵称", ... }
 */
router.put('/', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ code: 400, message: '没有需要更新的配置' });
    }

    // 逐条更新（使用事务保证原子性）
    const { pool } = require('../config/db');
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const [key, value] of Object.entries(updates)) {
        // 如果是对象或数组，序列化为JSON字符串存储
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

        await connection.execute(
          `INSERT INTO site_config (config_key, config_value, description)
           VALUES (?, ?, '')
           ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
          [key, stringValue]
        );
      }

      await connection.commit();
      res.json({ code: 200, message: '站点设置更新成功' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('更新站点设置失败:', error);
    res.status(500).json({ code: 500, message: '更新站点设置失败' });
  }
});

/**
 * POST /api/settings/avatar
 * 后台接口 — 上传头像
 */
router.post('/avatar', authMiddleware, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择头像文件' });
    }

    const avatarUrl = '/uploads/avatars/' + req.file.filename;

    // 更新数据库中的头像配置
    await execute(
      `INSERT INTO site_config (config_key, config_value) VALUES ('avatar_url', ?)
       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
      [avatarUrl]
    );

    res.json({ code: 200, message: '头像上传成功', data: { avatar_url: avatarUrl } });
  } catch (error) {
    console.error('上传头像失败:', error);
    res.status(500).json({ code: 500, message: '上传头像失败' });
  }
});

module.exports = router;

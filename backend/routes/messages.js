/**
 * 留言板路由
 * 路径前缀: /api/messages
 * 前端: GET 获取已审核留言, POST 提交留言
 * 后台: PUT 审核/回复, DELETE 删除 (需认证)
 */

const express = require('express');
const router = express.Router();
const { query, queryOne, execute } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/messages
 * 公开接口 — 获取已审核通过的留言（分页）
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
    const offset = (page - 1) * pageSize;

    // 前台只展示已审核通过的留言
    const total = (await queryOne(
      'SELECT COUNT(*) as total FROM messages WHERE status = 1'
    )).total;

    const messages = await query(
      `SELECT id, nickname, content, reply, created_at
       FROM messages
       WHERE status = 1
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    res.json({
      code: 200,
      data: {
        list: messages,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });

  } catch (error) {
    console.error('获取留言列表失败:', error);
    res.status(500).json({ code: 500, message: '获取留言列表失败' });
  }
});

/**
 * POST /api/messages
 * 公开接口 — 访客提交留言
 * 请求体: { nickname, email?, content }
 * 提交后状态为待审核(0)，需管理员在后台审核通过后才在前端展示
 */
router.post('/', async (req, res) => {
  try {
    const { nickname, email, content } = req.body;

    // 参数校验
    if (!nickname || !nickname.trim()) {
      return res.status(400).json({ code: 400, message: '请输入昵称' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '请输入留言内容' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ code: 400, message: '留言内容不能超过2000字' });
    }

    // 获取客户端IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    await execute(
      'INSERT INTO messages (nickname, email, content, ip_address, status) VALUES (?, ?, ?, ?, 0)',
      [nickname.trim(), (email || '').trim(), content.trim(), ip]
    );

    res.json({ code: 200, message: '留言提交成功，请等待审核后展示' });

  } catch (error) {
    console.error('提交留言失败:', error);
    res.status(500).json({ code: 500, message: '提交留言失败' });
  }
});

// ==================== 以下为后台管理接口 ====================

/**
 * GET /api/messages/admin
 * 后台接口 — 获取所有留言（含待审核）
 */
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, parseInt(req.query.pageSize) || 20);
    const offset = (page - 1) * pageSize;
    const { status } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status !== undefined && status !== '') {
      whereClause += ' AND status = ?';
      params.push(parseInt(status));
    }

    const total = (await queryOne(
      `SELECT COUNT(*) as total FROM messages ${whereClause}`, params
    )).total;

    const messages = await query(
      `SELECT * FROM messages ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      code: 200,
      data: { list: messages, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
    });
  } catch (error) {
    console.error('获取留言管理列表失败:', error);
    res.status(500).json({ code: 500, message: '获取留言列表失败' });
  }
});

/**
 * PUT /api/messages/:id/approve
 * 后台接口 — 审核/回复留言
 * 请求体: { status: 1|2, reply?: '回复内容' }
 */
router.put('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;

    await execute(
      'UPDATE messages SET status = ?, reply = ? WHERE id = ?',
      [status, reply || null, id]
    );

    res.json({ code: 200, message: '操作成功' });
  } catch (error) {
    console.error('审核留言失败:', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
});

/**
 * DELETE /api/messages/:id
 * 后台接口 — 删除留言
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await execute('DELETE FROM messages WHERE id = ?', [req.params.id]);
    res.json({ code: 200, message: '留言删除成功' });
  } catch (error) {
    console.error('删除留言失败:', error);
    res.status(500).json({ code: 500, message: '删除留言失败' });
  }
});

module.exports = router;

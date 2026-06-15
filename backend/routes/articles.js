/**
 * 文章管理路由
 * 路径前缀: /api/articles
 * 前端公开接口: GET /, GET /:id
 * 后台管理接口: POST /, PUT /:id, DELETE /:id (需认证)
 */

const express = require('express');
const router = express.Router();
const { query, queryOne, execute } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/articles
 * 公开接口 — 获取文章列表（分页 + 筛选 + 搜索）
 * 查询参数:
 *   page     - 页码（默认1）
 *   pageSize - 每页条数（默认10）
 *   category - 分类slug筛选
 *   keyword  - 标题关键词搜索
 *   status   - 状态筛选（后台使用，默认=1已发布）
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
    const { category, keyword, status } = req.query;
    const offset = (page - 1) * pageSize;

    // 构建动态查询条件（使用参数化查询防注入）
    let whereClause = 'WHERE 1=1';
    const params = [];

    // status 为空字符串=显示全部，未传=默认只显示已发布
    if (status !== undefined && status !== '') {
      whereClause += ' AND a.status = ?';
      params.push(parseInt(status));
    } else if (status === undefined) {
      whereClause += ' AND a.status = 1';
    }
    // status === '' 时不加 status 过滤，显示全部

    // 分类筛选
    if (category) {
      whereClause += ' AND c.slug = ?';
      params.push(category);
    }

    // 关键词搜索
    if (keyword) {
      whereClause += ' AND (a.title LIKE ? OR a.summary LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    // 查询总数
    const countResult = await queryOne(
      `SELECT COUNT(*) as total FROM articles a
       LEFT JOIN article_categories c ON a.category_id = c.id
       ${whereClause}`,
      params
    );
    const total = countResult.total;

    // 查询文章列表（带分类名称）
    const articles = await query(
      `SELECT a.id, a.title, a.summary, a.cover_image, a.tags, a.status,
              a.is_pinned, a.view_count, a.published_at, a.created_at,
              c.name as category_name, c.slug as category_slug
       FROM articles a
       LEFT JOIN article_categories c ON a.category_id = c.id
       ${whereClause}
       ORDER BY a.is_pinned DESC, a.published_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    res.json({
      code: 200,
      data: {
        list: articles,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });

  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({ code: 500, message: '获取文章列表失败' });
  }
});

/**
 * GET /api/articles/categories
 * 公开接口 — 获取所有文章分类
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(
      'SELECT id, name, slug, description FROM article_categories ORDER BY sort_order ASC'
    );
    res.json({ code: 200, data: categories });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ code: 500, message: '获取分类失败' });
  }
});

/**
 * GET /api/articles/:id
 * 公开接口 — 获取单篇文章详情
 * 自动增加阅读量
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const article = await queryOne(
      `SELECT a.*, c.name as category_name, c.slug as category_slug
       FROM articles a
       LEFT JOIN article_categories c ON a.category_id = c.id
       WHERE a.id = ? AND a.status = 1`,
      [id]
    );

    if (!article) {
      return res.status(404).json({ code: 404, message: '文章不存在或已下架' });
    }

    // 阅读量+1
    await execute('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [id]);
    article.view_count = (article.view_count || 0) + 1;

    res.json({ code: 200, data: article });

  } catch (error) {
    console.error('获取文章详情失败:', error);
    res.status(500).json({ code: 500, message: '获取文章详情失败' });
  }
});

// ==================== 以下为后台管理接口（需要登录） ====================

/**
 * POST /api/articles
 * 后台接口 — 新建文章
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, summary, content, cover_image, category_id, tags, status, is_pinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ code: 400, message: '标题和内容不能为空' });
    }

    const result = await execute(
      `INSERT INTO articles (title, summary, content, cover_image, category_id, tags, status, is_pinned, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, summary || '', content, cover_image || null, category_id || null, tags || '', status || 1, is_pinned || 0]
    );

    res.json({ code: 200, message: '文章创建成功', data: { id: result.insertId } });

  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({ code: 500, message: '创建文章失败' });
  }
});

/**
 * PUT /api/articles/:id
 * 后台接口 — 编辑文章
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, content, cover_image, category_id, tags, status, is_pinned } = req.body;

    await execute(
      `UPDATE articles SET title=?, summary=?, content=?, cover_image=?, category_id=?, tags=?, status=?, is_pinned=?
       WHERE id=?`,
      [title, summary, content, cover_image, category_id, tags, status, is_pinned, id]
    );

    res.json({ code: 200, message: '文章更新成功' });

  } catch (error) {
    console.error('更新文章失败:', error);
    res.status(500).json({ code: 500, message: '更新文章失败' });
  }
});

/**
 * DELETE /api/articles/:id
 * 后台接口 — 删除文章
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await execute('DELETE FROM articles WHERE id = ?', [id]);
    res.json({ code: 200, message: '文章删除成功' });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({ code: 500, message: '删除文章失败' });
  }
});

module.exports = router;

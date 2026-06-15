/**
 * 访客统计路由
 * 路径前缀: /api/stats
 * 前端: GET 获取统计数据, POST 记录访问
 */

const express = require('express');
const router = express.Router();
const { queryOne, execute } = require('../config/db');

/**
 * GET /api/stats
 * 公开接口 — 获取站点统计数据
 * 返回: 总访问量、今日访问量、文章数、项目数
 */
router.get('/', async (req, res) => {
  try {
    // 总访问量
    const totalVisits = await queryOne(
      'SELECT COALESCE(SUM(visit_count), 0) as total FROM visitor_stats'
    );

    // 今日访问量
    const todayVisits = await queryOne(
      'SELECT visit_count FROM visitor_stats WHERE visit_date = CURDATE()'
    );

    // 文章总数
    const articleCount = await queryOne(
      'SELECT COUNT(*) as total FROM articles WHERE status = 1'
    );

    // 项目总数
    const projectCount = await queryOne(
      'SELECT COUNT(*) as total FROM projects WHERE status = 1'
    );

    // 留言总数
    const messageCount = await queryOne(
      'SELECT COUNT(*) as total FROM messages WHERE status = 1'
    );

    res.json({
      code: 200,
      data: {
        totalVisits: totalVisits.total,
        todayVisits: todayVisits ? todayVisits.visit_count : 0,
        articleCount: articleCount.total,
        projectCount: projectCount.total,
        messageCount: messageCount.total
      }
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ code: 500, message: '获取统计数据失败' });
  }
});

/**
 * POST /api/stats
 * 公开接口 — 记录一次页面访问
 * 前端每次加载页面时调用（可防抖避免重复）
 */
router.post('/', async (req, res) => {
  try {
    // 使用 INSERT ... ON DUPLICATE KEY UPDATE 实现每日计数+1
    await execute(
      `INSERT INTO visitor_stats (visit_date, visit_count) VALUES (CURDATE(), 1)
       ON DUPLICATE KEY UPDATE visit_count = visit_count + 1`
    );
    res.json({ code: 200, message: 'ok' });
  } catch (error) {
    // 静默处理，不影响前端体验
    console.error('记录访问失败:', error);
    res.json({ code: 200, message: 'ok' });
  }
});

module.exports = router;

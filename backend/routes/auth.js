/**
 * 认证路由 — 管理员登录/登出
 * 路径前缀: /api/auth
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { queryOne } = require('../config/db');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * 管理员登录接口
 * 请求体: { username: 'admin', password: 'admin123' }
 * 返回: { code, message, data: { token, user } }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 参数校验
    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '请输入用户名和密码'
      });
    }

    // 查询用户
    const user = await queryOne(
      'SELECT id, username, password, nickname, email FROM admin_users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 验证密码（bcrypt比对）
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 生成JWT Token
    const token = generateToken({
      id: user.id,
      username: user.username
    });

    // 返回登录成功（不返回密码）
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email
        }
      }
    });

  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后重试'
    });
  }
});

/**
 * POST /api/auth/change-password
 * 修改管理员密码（需登录）
 * 请求体: { oldPassword: 'xxx', newPassword: 'xxx' }
 */
router.post('/change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ code: 401, message: '请先登录' });
    }

    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        code: 400,
        message: '新密码至少6位'
      });
    }

    // 验证旧密码
    const user = await queryOne('SELECT password FROM admin_users WHERE id = ?', [userId]);
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ code: 400, message: '原密码错误' });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { execute } = require('../config/db');
    await execute('UPDATE admin_users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ code: 200, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;

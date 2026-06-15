/**
 * JWT认证中间件
 * 用于保护管理后台的API接口
 * 验证请求头中的 Bearer Token
 */

const jwt = require('jsonwebtoken');

// ★ JWT密钥 — 部署时请修改为随机字符串 ★
const JWT_SECRET = 'personal_website_jwt_secret_key_2026_change_me';
const JWT_EXPIRES_IN = '24h'; // Token过期时间：24小时

/**
 * 生成JWT Token
 * @param {Object} payload - 要加密的数据（通常包含用户ID和用户名）
 * @returns {string} JWT token字符串
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证JWT Token的中间件
 * 从请求头 Authorization: Bearer <token> 中提取并验证
 * 验证通过后将用户信息挂载到 req.user
 */
function authMiddleware(req, res, next) {
  // 1. 获取请求头中的Authorization
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未登录或Token已过期，请重新登录'
    });
  }

  // 2. 提取Token
  const token = authHeader.split(' ')[1];

  // 3. 验证Token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 将解析出的用户信息挂载到请求对象上，后续路由可使用
    req.user = decoded;
    next();
  } catch (error) {
    // 区分不同类型的JWT错误
    let message = 'Token无效，请重新登录';
    if (error.name === 'TokenExpiredError') {
      message = 'Token已过期，请重新登录';
    }
    return res.status(401).json({
      code: 401,
      message: message
    });
  }
}

/**
 * 可选认证中间件
 * 如果携带了Token就验证，没带也放行（用于一些公开接口可选的用户识别）
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // Token无效也放行，只是不挂载用户信息
    }
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authMiddleware,
  optionalAuth
};

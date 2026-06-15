/**
 * 数据库连接配置文件
 * ★部署时需要修改此文件中的数据库连接信息★
 *
 * 使用 mysql2 的连接池模式，支持：
 * - 自动重连
 * - 连接复用（性能优于单连接）
 * - SQL注入防护（prepared statements）
 */

const mysql = require('mysql2/promise');

// ==================== ★需要修改的配置项★ ====================
const DB_CONFIG = {
  host: 'localhost',          // 数据库主机地址（本地一般为localhost）
  port: 3306,                 // 数据库端口（MySQL默认3306）
  user: 'root',               // ★ 数据库用户名
  password: 'Zhang20.',  // ★ 数据库密码（请修改为你的真实密码）
  database: 'personal_website',    // 数据库名称（与init.sql中创建的库名一致）
  charset: 'utf8mb4',         // 字符集（支持emoji等4字节字符）
  // 连接池配置
  waitForConnections: true,   // 连接池满时等待可用连接
  connectionLimit: 10,        // 最大连接数
  queueLimit: 0,              // 排队上限（0=无限）
  enableKeepAlive: true,      // TCP保活
  keepAliveInitialDelay: 0
};
// ==================== 配置项结束 ====================

/**
 * 创建数据库连接池
 * 整个应用共享一个连接池实例
 */
const pool = mysql.createPool(DB_CONFIG);

/**
 * 测试数据库连接
 * 在服务启动时调用，确保数据库可用
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功: MySQL ' + (await connection.query('SELECT VERSION()'))[0][0]['VERSION()']);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('请检查:');
    console.error('  1. MySQL服务是否已启动');
    console.error('  2. config/db.js 中的用户名密码是否正确');
    console.error('  3. 是否已执行 database/init.sql 初始化数据库');
    return false;
  }
}

/**
 * 执行SQL查询的辅助函数
 * @param {string} sql - SQL查询语句（使用?占位符防止注入）
 * @param {Array} params - 查询参数数组
 * @returns {Array} - 查询结果行数组
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * 执行SQL并返回第一条结果（用于单条查询）
 * @param {string} sql - SQL查询语句
 * @param {Array} params - 查询参数数组
 * @returns {Object|null} - 第一条结果或null
 */
async function queryOne(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 执行增删改SQL并返回影响行数和插入ID
 * @param {string} sql - SQL语句
 * @param {Array} params - 参数数组
 * @returns {Object} - { affectedRows, insertId }
 */
async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return {
    affectedRows: result.affectedRows,
    insertId: result.insertId
  };
}

module.exports = {
  pool,
  query,
  queryOne,
  execute,
  testConnection
};

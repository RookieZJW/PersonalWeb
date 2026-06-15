/**
 * 音乐播放器路由
 * 路径前缀: /api/music
 * GET /list  — 扫描 G:\music 目录返回 MP3 文件列表
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// ★ 音乐文件存放目录
const MUSIC_DIR = 'G:/music';

/**
 * 从文件名解析歌手和歌曲名
 * 支持格式: "歌手 - 歌名.mp3" 或 "歌名.mp3"
 */
function parseFilename(filename) {
  const nameWithoutExt = filename.replace(/\.mp3$/i, '');
  const parts = nameWithoutExt.split(' - ');
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
  }
  return { artist: '未知歌手', title: nameWithoutExt.trim() };
}

/**
 * GET /api/music/list
 * 扫描音乐目录，返回所有 MP3 文件列表
 * 每次请求实时扫描 → 新增文件自动出现
 */
router.get('/list', (req, res) => {
  try {
    if (!fs.existsSync(MUSIC_DIR)) {
      return res.json({ code: 200, data: [] });
    }

    const files = fs.readdirSync(MUSIC_DIR)
      .filter(f => f.toLowerCase().endsWith('.mp3'))
      .map((filename, index) => {
        const fullPath = path.join(MUSIC_DIR, filename);
        const stat = fs.statSync(fullPath);
        const { artist, title } = parseFilename(filename);
        return {
          id: index + 1,
          filename: filename,
          artist: artist,
          title: title,
          url: '/music/' + encodeURIComponent(filename),
          size: stat.size,
          sizeText: formatSize(stat.size)
        };
      });

    res.json({ code: 200, data: files });
  } catch (error) {
    console.error('扫描音乐目录失败:', error);
    res.status(500).json({ code: 500, message: '扫描音乐目录失败' });
  }
});

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

module.exports = router;

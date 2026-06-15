/**
 * API请求封装
 * 统一管理所有后端API调用，处理错误和Token
 */

// ★ 使用相对路径，Apache反向代理到Node.js后端
// 本地访问: http://localhost/api/xxx
// 外网访问: https://域名/api/xxx
const API_BASE = '/api';

/**
 * 通用请求函数
 * @param {string} url - API路径（不含BASE）
 * @param {Object} options - fetch选项
 * @returns {Promise} API响应数据
 */
async function request(url, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // 自动附加Token（如果已登录）
  const token = sessionStorage.getItem('admin_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(API_BASE + url, config);
    const data = await response.json();

    if (!response.ok) {
      // 401错误清除token
      if (response.status === 401) {
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_user');
        if (window.location.pathname.includes('/admin/') &&
            !window.location.pathname.includes('login.html')) {
          window.location.href = 'login.html';
        }
      }
      throw new Error(data.message || '请求失败');
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查后端服务是否启动');
    }
    throw error;
  }
}

// ==================== 认证相关 ====================
const authAPI = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  changePassword: (oldPassword, newPassword) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword })
    })
};

// ==================== 站点设置 ====================
const settingsAPI = {
  get: () => request('/settings'),
  update: (data) =>
    request('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return request('/settings/avatar', {
      method: 'POST',
      headers: {}, // 让浏览器自动设置Content-Type为multipart
      body: formData
    });
  }
};

// ==================== 文章相关 ====================
const articlesAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('/articles' + (query ? '?' + query : ''));
  },
  detail: (id) => request('/articles/' + id),
  categories: () => request('/articles/categories'),
  create: (data) =>
    request('/articles', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    request('/articles/' + id, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id) =>
    request('/articles/' + id, { method: 'DELETE' })
};

// ==================== 留言相关 ====================
const messagesAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('/messages' + (query ? '?' + query : ''));
  },
  adminList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('/messages/admin' + (query ? '?' + query : ''));
  },
  submit: (data) =>
    request('/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  approve: (id, data) =>
    request('/messages/' + id + '/approve', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  delete: (id) =>
    request('/messages/' + id, { method: 'DELETE' })
};

// ==================== 项目相关 ====================
const projectsAPI = {
  list: () => request('/projects'),
  create: (data) => {
    // 如果有文件，使用FormData
    if (data.thumbnail instanceof File) {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      return request('/projects', {
        method: 'POST',
        headers: {},
        body: formData
      });
    }
    return request('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  update: (id, data) => {
    if (data.thumbnail instanceof File) {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      return request('/projects/' + id, {
        method: 'PUT',
        headers: {},
        body: formData
      });
    }
    return request('/projects/' + id, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  delete: (id) =>
    request('/projects/' + id, { method: 'DELETE' })
};

// ==================== 相册相关 ====================
const galleryAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request('/gallery' + (query ? '?' + query : ''));
  },
  upload: (file, data = {}) => {
    const formData = new FormData();
    formData.append('image', file);
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    return request('/gallery', {
      method: 'POST',
      headers: {},
      body: formData
    });
  },
  update: (id, data) => {
    if (data.image instanceof File) {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      return request('/gallery/' + id, {
        method: 'PUT',
        headers: {},
        body: formData
      });
    }
    return request('/gallery/' + id, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  delete: (id) =>
    request('/gallery/' + id, { method: 'DELETE' })
};

// ==================== 统计相关 ====================
const statsAPI = {
  get: () => request('/stats')
};

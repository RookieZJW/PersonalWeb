/**
 * 管理后台通用脚本
 * 包含：登录验证、Token管理、退出登录、Toast提示
 */

(function() {
  'use strict';

  // ==================== 认证检查 ====================
  function checkAuth() {
    const token = sessionStorage.getItem('admin_token');
    const user = sessionStorage.getItem('admin_user');

    // 登录页不需要检查（但已登录则跳转后台首页）
    const isLoginPage = window.location.pathname.includes('login.html');

    if (isLoginPage) {
      if (token) {
        window.location.href = 'dashboard.html';
      }
      return;
    }

    // 其他后台页面必须登录
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    // 显示管理员昵称
    if (user) {
      try {
        const userData = JSON.parse(user);
        const userEl = document.getElementById('admin-nickname');
        if (userEl) userEl.textContent = userData.nickname || userData.username;
      } catch (e) {}
    }
  }

  // ==================== 退出登录 ====================
  function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_user');
        window.location.href = 'login.html';
      });
    }
  }

  // ==================== 侧边栏高亮 ====================
  function highlightSidebar() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.admin-sidebar a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && currentPath.endsWith(href)) {
        link.classList.add('active');
      }
    });
  }

  // ==================== 移动端侧边栏切换 ====================
  function initMobileSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }

  // ==================== Toast ====================
  window.showToast = function(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // ==================== 初始化 ====================
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initLogout();
    highlightSidebar();
    initMobileSidebar();
  });

})();

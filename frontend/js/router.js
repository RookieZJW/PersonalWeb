/**
 * SPA 路由 — 拦截内部链接，动态加载页面内容
 * 使音乐播放器在页面切换时保持不中断
 */
(function() {
  'use strict';

  // 防止重复初始化
  if (window.__routerInited) return;
  window.__routerInited = true;
  window.__routerActive = true;

  // 共享脚本（已在 shell 中加载，不需要重新执行）
  const SHARED_SCRIPTS = ['js/api.js', 'js/main.js', 'js/music-player.js', 'js/router.js'];

  // 内部页面路径（需要 SPA 拦截的）
  const APP_PAGES = ['index.html', 'about.html', 'articles.html', 'article-detail.html',
                     'projects.html', 'gallery.html', 'guestbook.html'];

  // 当前页面状态
  let currentPage = null;
  let isNavigating = false;

  // ==================== 页面加载 ====================
  async function loadPage(url, pushState = true) {
    if (isNavigating) return;
    isNavigating = true;

    try {
      // 显示加载状态（可选：顶部进度条）
      showLoadingIndicator();

      // 获取目标页面 HTML
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const html = await resp.text();

      // 解析 HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 提取标题
      const pageTitle = doc.title || '个人网站';

      // 提取 #app-content 内容
      const appContent = doc.getElementById('app-content');
      if (!appContent) {
        throw new Error('页面缺少 #app-content 容器');
      }

      // 提取内联脚本（排除共享脚本）
      const inlineScripts = [];
      const allScripts = doc.querySelectorAll('script');
      allScripts.forEach(script => {
        // 跳过共享脚本（有 src 且在共享列表中）
        const src = script.getAttribute('src');
        if (src) {
          if (SHARED_SCRIPTS.some(s => src.endsWith(s) || src === s)) return;
          // 其他有 src 的脚本（理论上不应该有）
          return;
        }
        // 内联脚本
        if (script.textContent.trim()) {
          inlineScripts.push(script.textContent);
        }
      });

      // 派发页面即将切换事件（清理上一页的副作用）
      const appContentEl = document.getElementById('app-content');
      if (appContentEl) {
        appContentEl.dispatchEvent(new CustomEvent('pagewillunload'));
      }

      // 先更新 URL（让页面脚本能读到正确的 location.search）
      if (pushState) {
        const state = { page: url, title: pageTitle };
        history.pushState(state, pageTitle, url);
      }
      currentPage = url;

      // 更新文档标题
      document.title = pageTitle;

      // 替换内容
      if (appContentEl) {
        appContentEl.innerHTML = appContent.innerHTML;
      }

      // 执行内联脚本（此时 location 已更新，脚本可正确读取 query string）
      executeScripts(inlineScripts);

      // 重新初始化通用模块
      reinitAfterNavigation(url);

      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'instant' });

      // 派发页面切换完成事件
      if (appContentEl) {
        appContentEl.dispatchEvent(new CustomEvent('pageloaded'));
      }

    } catch (err) {
      console.error('路由加载失败:', url, err);
      // 降级：直接跳转
      window.location.href = url;
    } finally {
      isNavigating = false;
      hideLoadingIndicator();
    }
  }

  // ==================== 脚本执行 ====================
  function executeScripts(scripts) {
    scripts.forEach(code => {
      try {
        // 创建 script 元素执行（保证作用域隔离，支持 async/await）
        const script = document.createElement('script');
        script.textContent = code;
        // 将脚本添加到 #app-content 末尾，执行后移除
        const appContent = document.getElementById('app-content');
        if (appContent) {
          appContent.appendChild(script);
          // 执行后清理（不移除也没关系，但保持DOM干净）
          // script.remove();  // 不移除，某些脚本可能需要留在DOM中
        }
      } catch (e) {
        console.error('执行页面脚本出错:', e);
      }
    });
  }

  // ==================== 导航后重新初始化 ====================
  function reinitAfterNavigation(url) {
    // 高亮当前导航链接
    highlightNavLink(url);

    // 重新观察滚动动画元素
    if (typeof window.reinitScrollAnimations === 'function') {
      window.reinitScrollAnimations();
    }

    // 关闭汉堡菜单（移动端）
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
      navLinks.classList.remove('open');
    }
  }

  function highlightNavLink(url) {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // 从 URL 提取页面名
    const pageName = url.replace(/^.*[\\/]/, '').split('?')[0];

    navbar.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      // 匹配规则：完全匹配，或 index.html 匹配首页
      const linkPage = href.replace(/^.*[\\/]/, '').split('?')[0];
      link.classList.remove('active');

      if (linkPage === pageName) {
        link.classList.add('active');
      } else if (pageName === 'index.html' && (linkPage === 'index.html' || linkPage === '/')) {
        link.classList.add('active');
      }
    });
  }

  // ==================== 加载指示器（顶部细线） ====================
  let loadingBar = null;
  let loadingTimer = null;

  function showLoadingIndicator() {
    if (!loadingBar) {
      loadingBar = document.createElement('div');
      loadingBar.className = 'spa-loading-bar';
      loadingBar.style.cssText = `
        position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--neon-blue),var(--neon-purple));
        z-index:10000;width:0;transition:width 0.3s ease;
      `;
      document.body.appendChild(loadingBar);
    }
    loadingBar.style.width = '0';
    requestAnimationFrame(() => {
      loadingBar.style.width = '70%';
    });
    // 安全超时
    loadingTimer = setTimeout(() => {
      loadingBar.style.width = '90%';
    }, 1000);
  }

  function hideLoadingIndicator() {
    clearTimeout(loadingTimer);
    if (loadingBar) {
      loadingBar.style.width = '100%';
      setTimeout(() => {
        if (loadingBar) {
          loadingBar.style.width = '0';
          setTimeout(() => {
            if (loadingBar) {
              loadingBar.remove();
              loadingBar = null;
            }
          }, 300);
        }
      }, 100);
    }
  }

  // ==================== 链接点击拦截 ====================
  document.addEventListener('click', function(e) {
    // 查找最近的 <a> 标签
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // 跳过外部链接、锚点、新窗口、admin 页面
    if (href.startsWith('http://') || href.startsWith('https://') ||
        href.startsWith('#') || href.startsWith('javascript:') ||
        href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    if (link.getAttribute('target') === '_blank' || link.getAttribute('download') !== null) {
      return;
    }

    // 跳过 admin 页面
    if (href.includes('admin/') || href.startsWith('admin/')) {
      return;
    }

    // 解析目标 URL
    let targetUrl;
    if (href.startsWith('/')) {
      targetUrl = href;
    } else {
      // 相对路径，基于当前页面解析
      targetUrl = new URL(href, window.location.href).pathname + (new URL(href, window.location.href).search);
    }

    // 检查是否是应用内页面
    const pageName = targetUrl.replace(/^.*[\\/]/, '').split('?')[0];
    if (!pageName.endsWith('.html')) return;

    // 如果不是我们管理的页面，跳过
    if (!APP_PAGES.some(p => targetUrl.endsWith(p) || targetUrl.includes('/' + p))) {
      return;
    }

    // 拦截！
    e.preventDefault();
    loadPage(targetUrl, true);
  });

  // ==================== 浏览器后退/前进 ====================
  window.addEventListener('popstate', function(e) {
    if (e.state && e.state.page) {
      loadPage(e.state.page, false);
    } else {
      // 没有状态，加载当前 URL 对应的页面
      const path = window.location.pathname + window.location.search;
      const pageName = path.replace(/^.*[\\/]/, '').split('?')[0];
      if (pageName.endsWith('.html') && APP_PAGES.some(p => pageName === p)) {
        loadPage(path, false);
      }
    }
  });

  // ==================== 初始化 ====================
  function init() {
    // 记录初始页面
    const path = window.location.pathname + window.location.search;
    const pageName = path.replace(/^.*[\\/]/, '').split('?')[0];

    if (pageName.endsWith('.html') && APP_PAGES.some(p => pageName === p)) {
      currentPage = path;
      // 用初始页面状态替换当前历史记录
      history.replaceState({ page: path, title: document.title }, document.title, path);
      highlightNavLink(path);
    }
  }

  // 在 DOMContentLoaded 时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== 暴露 API ====================
  window.router = {
    navigate: loadPage,
    getCurrentPage: () => currentPage
  };

})();

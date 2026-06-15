/**
 * 个人网站 — 全局脚本
 * 包含：粒子星空背景、导航栏、滚动动画、回到顶部、访客统计
 */

(function() {
  'use strict';

  // ==================== API基础路径 ====================
  const API_BASE = 'http://localhost:3000/api';

  // ==================== 粒子星空背景 ====================
  function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    // 根据屏幕宽度调整粒子数量（移动端减半）
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 50 : 100;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // 粒子类
    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + 10;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 0.3 + 0.1;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.6 + 0.1;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinkleOffset = Math.random() * Math.PI * 2;
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        // 超出屏幕后重置
        if (this.y < -10) {
          this.y = canvas.height + 10;
          this.x = Math.random() * canvas.width;
        }
        if (this.x < -10) this.x = canvas.width + 10;
        if (this.x > canvas.width + 10) this.x = -10;
      }

      draw() {
        const twinkle = Math.sin(Date.now() * this.twinkleSpeed + this.twinkleOffset) * 0.3 + 0.7;
        const alpha = this.opacity * twinkle;
        ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 初始化粒子
    function createParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    // 连线（近距离粒子之间）
    function drawConnections() {
      const maxDist = isMobile ? 80 : 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12;
            ctx.strokeStyle = `rgba(77, 168, 218, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      animationId = requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
  }

  // ==================== 导航栏 ====================
  function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // 滚动渐变效果
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // 高亮当前页面链接
    const currentPath = window.location.pathname;
    const links = navbar.querySelectorAll('.nav-links a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || (href !== '/' && currentPath.includes(href))) {
        link.classList.add('active');
      }
    });

    // 汉堡菜单（移动端）
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('open');
      });
      // 点击链接后关闭菜单
      navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinks.classList.remove('open'));
      });
    }
  }

  // ==================== 滚动渐入动画 ====================
  function initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // 延迟执行，让动画错开
          setTimeout(() => {
            entry.target.classList.add('animate-fade-in-up');
          }, Array.from(entry.target.parentNode?.children || []).indexOf(entry.target) * 80);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // 观察所有需要动画的卡片
    document.querySelectorAll('.card, .timeline-item, .gallery-item, .project-card, .article-card')
      .forEach(el => observer.observe(el));
  }

  // ==================== 回到顶部按钮 ====================
  function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==================== 访客统计 ====================
  function recordVisit() {
    // 使用sessionStorage防止同一会话重复计数
    if (sessionStorage.getItem('visit_recorded')) return;
    sessionStorage.setItem('visit_recorded', '1');

    fetch(API_BASE + '/stats', { method: 'POST' })
      .catch(() => {}); // 静默失败，不影响用户体验
  }

  // ==================== 通用Toast提示 ====================
  window.showToast = function(message, type = 'info') {
    // 移除已有toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 触发动画
    requestAnimationFrame(() => toast.classList.add('show'));

    // 3秒后自动消失
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // ==================== 初始化所有模块 ====================
  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavbar();
    initScrollAnimations();
    initBackToTop();
    recordVisit();
  });

})();

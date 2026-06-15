/**
 * 音乐播放器 — 全局持久化模块
 * 生成播放器DOM、管理播放状态，页面切换不中断播放
 */
(function() {
  'use strict';

  // 防止重复初始化
  if (window.__musicPlayerInited) return;
  window.__musicPlayerInited = true;

  // ==================== 生成 DOM ====================
  function createPlayerDOM() {
    const html = `
      <!-- 折叠态：浮动圆形按钮 -->
      <button class="music-toggle" id="music-toggle" title="打开音乐播放器&#10;拖拽可移动位置">
        <span class="music-toggle-icon">🎵</span>
        <span class="music-toggle-pulse"></span>
      </button>

      <!-- 展开态：可拖动播放器卡片 -->
      <div class="music-player" id="music-player">
        <div class="music-drag-handle" id="music-drag-handle" title="拖拽移动播放器">
          <span class="music-drag-dots">⋮⋮</span>
          <span class="music-drag-title">🎵 音乐播放器</span>
          <button class="music-close-btn" id="music-close-btn" title="关闭">✕</button>
        </div>

        <div class="music-visualizer" id="music-visualizer">
          <span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        <div class="music-info">
          <div class="music-title" id="music-title">未选择歌曲</div>
          <div class="music-artist" id="music-artist">点击歌曲开始播放</div>
        </div>

        <div class="music-progress" id="music-progress-bar">
          <div class="music-progress-track">
            <div class="music-progress-fill" id="music-progress-fill"></div>
            <div class="music-progress-thumb" id="music-progress-thumb"></div>
          </div>
        </div>
        <div class="music-time">
          <span id="music-current">00:00</span>
          <span id="music-duration">00:00</span>
        </div>

        <div class="music-controls">
          <button class="music-btn" id="btn-prev" title="上一首">⏮</button>
          <button class="music-btn music-btn-play" id="btn-play" title="播放/暂停">▶</button>
          <button class="music-btn" id="btn-next" title="下一首">⏭</button>
        </div>

        <div class="music-extra">
          <button class="music-btn music-btn-sm" id="btn-mode" title="列表循环">🔁</button>
          <button class="music-btn music-btn-sm" id="btn-volume-icon" title="静音">🔊</button>
          <div class="music-volume">
            <input type="range" id="volume-slider" min="0" max="100" value="70" title="音量">
          </div>
          <button class="music-btn music-btn-sm" id="btn-playlist-toggle" title="播放列表">📋</button>
        </div>

        <div class="music-playlist" id="music-playlist">
          <div class="music-playlist-header">
            <span>🎶 播放列表 (<span id="playlist-count">0</span> 首)</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">G:\\music</span>
          </div>
          <ul class="music-playlist-list" id="playlist-ul">
            <li style="text-align:center;padding:20px;color:var(--text-muted);">加载中...</li>
          </ul>
        </div>
      </div>

      <audio id="music-audio" preload="auto"></audio>
    `;

    const container = document.createElement('div');
    container.id = 'music-player-root';
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  // 创建DOM（仅一次）
  createPlayerDOM();

  // ==================== DOM 引用 ====================
  const audio = document.getElementById('music-audio');
  const toggle = document.getElementById('music-toggle');
  const player = document.getElementById('music-player');
  const dragHandle = document.getElementById('music-drag-handle');
  const closeBtn = document.getElementById('music-close-btn');
  const btnPlay = document.getElementById('btn-play');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnMode = document.getElementById('btn-mode');
  const btnVolIcon = document.getElementById('btn-volume-icon');
  const btnPlaylistToggle = document.getElementById('btn-playlist-toggle');
  const volumeSlider = document.getElementById('volume-slider');
  const progressBar = document.getElementById('music-progress-bar');
  const progressFill = document.getElementById('music-progress-fill');
  const progressThumb = document.getElementById('music-progress-thumb');
  const elTitle = document.getElementById('music-title');
  const elArtist = document.getElementById('music-artist');
  const elCurrent = document.getElementById('music-current');
  const elDuration = document.getElementById('music-duration');
  const playlistUl = document.getElementById('playlist-ul');
  const playlistCount = document.getElementById('playlist-count');
  const visualizer = document.getElementById('music-visualizer');

  // ==================== 状态 ====================
  let playlist = [];
  let currentIndex = -1;
  let isPlaying = false;
  let playMode = 1;
  const modeIcons = ['🔂', '🔁', '🔀'];
  const modeTitles = ['单曲循环', '列表循环', '随机播放'];
  let progressDragging = false;

  audio.volume = 0.7;
  volumeSlider.value = 70;

  // ==================== 工具函数 ====================
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(s) {
    if (isNaN(s)) return '00:00';
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  // ==================== 拖动系统 ====================
  function makeDraggable(el, handleEl) {
    let startX, startY, initLeft, initTop, dragging = false;

    function onStart(e) {
      if (e.target.closest('button') || e.target.closest('input') ||
          e.target.closest('.playlist-item') || e.target.closest('.music-progress')) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      dragging = true;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      startY = (e.touches ? e.touches[0].clientY : e.clientY);
      initLeft = rect.left;
      initTop = rect.top;
      el.style.transition = 'none';
    }

    function onMove(e) {
      if (!dragging) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = cx - startX, dy = cy - startY;
      let newLeft = initLeft + dx, newTop = initTop + dy;
      const maxX = window.innerWidth - el.offsetWidth - 8;
      const maxY = window.innerHeight - el.offsetHeight - 8;
      newLeft = Math.max(8, Math.min(newLeft, maxX));
      newTop = Math.max(8, Math.min(newTop, maxY));
      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      el.style.transition = '';
      savePosition(el);
    }

    (handleEl || el).addEventListener('mousedown', onStart);
    (handleEl || el).addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
  }

  function savePosition(el) {
    try {
      const key = el === toggle ? 'music-toggle-pos' : 'music-player-pos';
      localStorage.setItem(key, JSON.stringify({ left: el.style.left, top: el.style.top }));
    } catch (e) { /* ignore */ }
  }

  function restorePosition(el, key, defaultRight, defaultBottom) {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved && saved.left && saved.top) {
        el.style.left = saved.left;
        el.style.top = saved.top;
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        return;
      }
    } catch (e) { /* ignore */ }
    el.style.right = defaultRight;
    el.style.bottom = defaultBottom;
  }

  restorePosition(toggle, 'music-toggle-pos', '32px', '32px');
  restorePosition(player, 'music-player-pos', '28px', '96px');

  makeDraggable(toggle);
  makeDraggable(player, dragHandle);

  // ==================== 播放列表 ====================
  async function loadPlaylist() {
    try {
      const res = await fetch('/api/music/list');
      const data = await res.json();
      if (data.code === 200) {
        playlist = data.data;
        playlistCount.textContent = playlist.length;
        renderPlaylist();
      }
    } catch (e) {
      console.error('加载播放列表失败:', e);
    }
  }

  function renderPlaylist() {
    if (playlist.length === 0) {
      playlistUl.innerHTML = '<li style="text-align:center;padding:16px;color:var(--text-muted);">G:\\music 目录为空</li>';
      return;
    }
    playlistUl.innerHTML = playlist.map((s, i) => `
      <li class="playlist-item ${i === currentIndex ? 'active' : ''}" data-index="${i}">
        <span class="playlist-item-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="playlist-item-info">
          <span class="playlist-item-title">${escapeHtml(s.title)}</span>
          <span class="playlist-item-artist">${escapeHtml(s.artist)}</span>
        </span>
      </li>
    `).join('');

    playlistUl.querySelectorAll('.playlist-item').forEach(li => {
      li.addEventListener('click', () => playIndex(parseInt(li.dataset.index)));
    });
  }

  function playIndex(idx) {
    if (idx < 0 || idx >= playlist.length) return;
    currentIndex = idx;
    const song = playlist[idx];
    audio.src = song.url;
    audio.play().catch(e => {});
    elTitle.textContent = song.title;
    elArtist.textContent = song.artist;
    // 更新文档标题（如果路由器没有接管标题管理）
    if (!window.__routerActive) {
      document.title = '🎵 ' + song.title + ' - ' + song.artist + ' | CodeNinja';
    }
    btnPlay.textContent = '⏸';
    isPlaying = true;
    toggle.classList.add('playing');
    startVisualizer();
    highlightCurrent();
  }

  function highlightCurrent() {
    playlistUl.querySelectorAll('.playlist-item').forEach((li, i) => {
      li.classList.toggle('active', i === currentIndex);
    });
  }

  function togglePlay() {
    if (playlist.length === 0) return;
    if (currentIndex < 0) { playIndex(0); return; }
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => {});
    }
  }

  function prevSong() {
    if (!playlist.length) return;
    let idx = playMode === 2 ? Math.floor(Math.random() * playlist.length) :
      currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
    playIndex(idx);
  }

  function nextSong() {
    if (!playlist.length) return;
    let idx = playMode === 2 ? Math.floor(Math.random() * playlist.length) :
      currentIndex >= playlist.length - 1 ? 0 : currentIndex + 1;
    playIndex(idx);
  }

  function toggleMode() {
    playMode = (playMode + 1) % 3;
    btnMode.textContent = modeIcons[playMode];
    btnMode.title = modeTitles[playMode];
  }

  // ==================== 事件绑定 ====================

  toggle.addEventListener('click', (e) => {
    if (e.target._wasDragged) { e.target._wasDragged = false; return; }
    player.classList.toggle('open');
    toggle.classList.toggle('active');
    if (player.classList.contains('open')) loadPlaylist();
  });

  document.addEventListener('mouseup', () => {
    setTimeout(() => { toggle._wasDragged = false; }, 0);
  });

  closeBtn.addEventListener('click', () => {
    player.classList.remove('open');
    toggle.classList.remove('active');
  });

  btnPlay.addEventListener('click', togglePlay);
  btnPrev.addEventListener('click', prevSong);
  btnNext.addEventListener('click', nextSong);
  btnMode.addEventListener('click', toggleMode);

  volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value / 100;
    updateVolumeIcon();
  });

  btnVolIcon.addEventListener('click', () => {
    if (audio.volume > 0) {
      audio._lv = audio.volume;
      audio.volume = 0;
      volumeSlider.value = 0;
    } else {
      audio.volume = audio._lv || 0.7;
      volumeSlider.value = (audio._lv || 0.7) * 100;
    }
    updateVolumeIcon();
  });

  function updateVolumeIcon() {
    const v = audio.volume;
    btnVolIcon.textContent = v === 0 ? '🔇' : v < 0.3 ? '🔈' : v < 0.6 ? '🔉' : '🔊';
  }

  btnPlaylistToggle.addEventListener('click', () => {
    document.getElementById('music-playlist').classList.toggle('show');
    loadPlaylist();
  });

  // 进度条拖拽
  progressBar.addEventListener('mousedown', (e) => {
    progressDragging = true;
    seekProgress(e);
  });
  document.addEventListener('mousemove', (e) => {
    if (progressDragging) seekProgress(e);
  });
  document.addEventListener('mouseup', () => { progressDragging = false; });
  progressBar.addEventListener('touchstart', (e) => {
    progressDragging = true;
    seekProgress(e.touches[0]);
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    if (progressDragging) seekProgress(e.touches[0]);
  }, { passive: false });
  document.addEventListener('touchend', () => { progressDragging = false; });

  function seekProgress(e) {
    const track = progressBar.querySelector('.music-progress-track');
    const rect = track.getBoundingClientRect();
    let pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    progressFill.style.width = (pct * 100) + '%';
    progressThumb.style.left = (pct * 100) + '%';
    if (audio.duration) audio.currentTime = pct * audio.duration;
  }

  audio.addEventListener('timeupdate', () => {
    if (!progressDragging && audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = pct + '%';
      progressThumb.style.left = pct + '%';
      elCurrent.textContent = formatTime(audio.currentTime);
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    elDuration.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    playMode === 0 ? (audio.currentTime = 0, audio.play()) : nextSong();
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    btnPlay.textContent = '⏸';
    toggle.classList.add('playing');
    startVisualizer();
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    btnPlay.textContent = '▶';
    toggle.classList.remove('playing');
    stopVisualizer();
  });

  audio.addEventListener('error', () => {
    elTitle.textContent = '加载失败';
    elArtist.textContent = '请检查文件';
  });

  // ==================== 可视化频谱 ====================
  let visTimer;

  function startVisualizer() {
    stopVisualizer();
    const bars = visualizer.querySelectorAll('span');
    function anim() {
      bars.forEach(b => {
        b.style.height = (8 + Math.random() * 32) + 'px';
        b.style.opacity = 0.3 + Math.random() * 0.7;
      });
      visTimer = setTimeout(anim, 140);
    }
    anim();
  }

  function stopVisualizer() {
    clearTimeout(visTimer);
    visualizer.querySelectorAll('span').forEach(b => {
      b.style.height = '4px';
      b.style.opacity = '0.35';
    });
  }

  // ==================== 键盘快捷键 ====================
  document.addEventListener('keydown', function musicKeyboardHandler(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.ctrlKey ? prevSong() : (audio.currentTime -= 5);
        break;
      case 'ArrowRight':
        e.ctrlKey ? nextSong() : (audio.currentTime += 5);
        break;
      case 'ArrowUp':
        audio.volume = Math.min(1, audio.volume + 0.05);
        volumeSlider.value = audio.volume * 100;
        updateVolumeIcon();
        break;
      case 'ArrowDown':
        audio.volume = Math.max(0, audio.volume - 0.05);
        volumeSlider.value = audio.volume * 100;
        updateVolumeIcon();
        break;
      case 'm':
        toggleMode();
        break;
    }
  });

  // ==================== 暴露 API ====================
  window.musicPlayer = {
    get isPlaying() { return isPlaying; },
    get currentIndex() { return currentIndex; },
    get playlist() { return playlist; },
    playIndex,
    togglePlay,
    prevSong,
    nextSong,
    loadPlaylist
  };

  // ==================== 启动 ====================
  loadPlaylist();

})();

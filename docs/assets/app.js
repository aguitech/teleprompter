/* ==============================================================
   AGUITECH Teleprompter — Vanilla JS
   ============================================================== */

(function () {
  'use strict';

  // ============ STATE ============
  const state = {
    scripts: {},          // {id: {name, content, updated}}
    currentId: null,
    speed: 30,            // px/s
    fontSize: 48,
    width: 80,
    color: '#ffffff',
    mirror: false,
    countdown: false,
    playing: false,
    rafId: null,
    lastTs: 0,
    currentWordIdx: -1,
    currentScroll: 0,
  };

  const STORAGE_KEY = 'aguitech_teleprompter_v1';
  const SAMPLE_TEXT = `¡Bienvenido al Teleprompter de AGUITECH!

Este es un sistema profesional de teleprompter que funciona completamente en tu navegador, sin servidor, sin tracking, sin nada.

Características principales:

Velocidad ajustable. Usa las flechas izquierda y derecha para modificar la velocidad de desplazamiento en tiempo real.

Tamaño de fuente dinámico. Con las teclas más y menos puedes ajustar el tamaño del texto sin interrumpir la reproducción.

Modo espejo. Activa la tecla M para invertir horizontalmente el texto. Esto es útil cuando usas un cristal teleprompter que refleja la imagen.

Multi script. Puedes guardar varios guiones diferentes y cambiar entre ellos cuando quieras. Todo se guarda en tu navegador con localStorage.

Atajos de teclado. Space para reproducir o pausar. R para reiniciar. F para pantalla completa. Esc para salir del modo fullscreen.

Listo para grabar. Cuando tengas tu guion listo, presiona el botón de reproducir y mira directamente a la cámara. La línea de enfoque te ayuda a mantener la mirada estable.

¡Mucho éxito en tu presentación!`;

  // ============ DOM ============
  const $ = (id) => document.getElementById(id);
  const dom = {
    sidebar: $('sidebar'),
    app: document.querySelector('.app'),
    scriptSelect: $('script-select'),
    scriptName: $('script-name'),
    btnSave: $('btn-save'),
    btnDelete: $('btn-delete'),
    speedSlider: $('speed'),
    speedDisplay: $('speed-display'),
    sizeSlider: $('font-size'),
    sizeDisplay: $('size-display'),
    widthSlider: $('width'),
    widthDisplay: $('width-display'),
    colorSwatches: document.querySelectorAll('.color-swatch'),
    btnMirror: $('btn-mirror'),
    btnCountdown: $('btn-countdown'),
    sidebarToggle: $('sidebar-toggle'),
    sidebarToggle2: $('sidebar-toggle-2'),
    currentScriptName: $('current-script-name'),
    btnTest: $('btn-test'),
    btnPlay: $('btn-play'),
    btnFullscreen: $('btn-fullscreen'),
    editor: $('editor'),
    statWords: $('stat-words'),
    statChars: $('stat-chars'),
    statTime: $('stat-time'),
    prompterScroll: $('prompter-scroll'),
    prompterContent: $('prompter-content'),
    prompterWrapper: $('prompter-wrapper'),
    prompterCountdown: $('prompter-countdown'),
    countdownText: $('countdown-text'),
    prompterPlay: $('prompter-play'),
    prompterReset: $('prompter-reset'),
    floatingControls: $('floating-controls'),
    floatPlay: $('float-play'),
    floatReset: $('float-reset'),
    floatExit: $('float-exit'),
  };

  // ============ STORAGE ============
  function loadStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        state.scripts = data.scripts || {};
        if (data.settings) {
          Object.assign(state, data.settings);
        }
      }
    } catch (e) {
      console.warn('Storage corrupto, iniciando limpio', e);
      state.scripts = {};
    }
  }

  function saveStorage() {
    try {
      const settings = {
        speed: state.speed,
        fontSize: state.fontSize,
        width: state.width,
        color: state.color,
        mirror: state.mirror,
        countdown: state.countdown,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scripts: state.scripts,
        settings,
      }));
    } catch (e) {
      console.warn('No se pudo guardar', e);
    }
  }

  // ============ SCRIPT MANAGEMENT ============
  function genId() {
    return 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }

  function refreshScriptSelect() {
    const ids = Object.keys(state.scripts);
    dom.scriptSelect.innerHTML = '<option value="">— Nuevo script —</option>';
    ids.sort((a, b) => (state.scripts[b].updated || 0) - (state.scripts[a].updated || 0));
    ids.forEach(id => {
      const s = state.scripts[id];
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = s.name || '(sin nombre)';
      if (id === state.currentId) opt.selected = true;
      dom.scriptSelect.appendChild(opt);
    });
  }

  function saveCurrentScript() {
    const name = dom.scriptName.value.trim() || 'Sin título';
    const content = dom.editor.value;
    let id = state.currentId;
    if (!id) id = genId();
    state.scripts[id] = {
      name,
      content,
      updated: Date.now(),
    };
    state.currentId = id;
    refreshScriptSelect();
    updateCurrentTitle();
    saveStorage();
    flashSaveButton();
  }

  function loadScript(id) {
    const s = state.scripts[id];
    if (!s) return;
    state.currentId = id;
    dom.scriptName.value = s.name;
    dom.editor.value = s.content;
    updateCurrentTitle();
    renderPrompter();
    updateStats();
  }

  function deleteCurrentScript() {
    if (!state.currentId) return;
    if (!confirm('¿Borrar este script?')) return;
    delete state.scripts[state.currentId];
    state.currentId = null;
    dom.scriptName.value = '';
    refreshScriptSelect();
    updateCurrentTitle();
    saveStorage();
  }

  function updateCurrentTitle() {
    if (state.currentId && state.scripts[state.currentId]) {
      dom.currentScriptName.textContent = state.scripts[state.currentId].name;
    } else {
      dom.currentScriptName.textContent = state.scripts[Object.keys(state.scripts)[0]]?.name || 'Sin título';
    }
  }

  function flashSaveButton() {
    const orig = dom.btnSave.textContent;
    dom.btnSave.textContent = '✓ Guardado';
    setTimeout(() => { dom.btnSave.textContent = orig; }, 1500);
  }

  // ============ PROMPTER RENDER ============
  function renderPrompter() {
    const text = dom.editor.value.trim();
    if (!text) {
      dom.prompterContent.innerHTML = '<p style="color:#555;">— Tu guion aparecerá aquí —</p>';
      state.currentWordIdx = -1;
      return;
    }

    // Split en párrafos y luego en palabras
    const paragraphs = text.split(/\n\s*\n/);
    let html = '';
    let wordIdx = 0;

    paragraphs.forEach(para => {
      const words = para.trim().split(/\s+/);
      html += '<p>';
      words.forEach((w, i) => {
        html += `<span class="word" data-idx="${wordIdx}">${escapeHtml(w)}</span>`;
        if (i < words.length - 1) html += ' ';
        wordIdx++;
      });
      html += '</p>';
    });

    dom.prompterContent.innerHTML = html;
    dom.prompterContent.style.fontSize = state.fontSize + 'px';
    dom.prompterContent.style.width = state.width + '%';
    dom.prompterContent.style.color = state.color;
    dom.prompterContent.classList.toggle('mirror', state.mirror);

    // Reset scroll
    dom.prompterScroll.scrollTop = 0;
    state.currentWordIdx = -1;
    updateActiveWord();
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function updateActiveWord() {
    const wrapperRect = dom.prompterWrapper.getBoundingClientRect();
    const eyeline = wrapperRect.height / 2;
    const words = dom.prompterContent.querySelectorAll('.word');
    let activeIdx = -1;

    words.forEach((w, i) => {
      const r = w.getBoundingClientRect();
      const wordCenter = r.top + r.height / 2;
      if (wordCenter <= eyeline + 10) activeIdx = i;
    });

    if (activeIdx !== state.currentWordIdx) {
      words.forEach(w => w.classList.remove('active'));
      state.currentWordIdx = activeIdx;
      if (activeIdx >= 0 && words[activeIdx]) {
        words[activeIdx].classList.add('active');
      }
    }
  }

  // ============ STATS ============
  function updateStats() {
    const text = dom.editor.value;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const minutes = Math.ceil(words / 150);  // 150 wpm
    dom.statWords.textContent = words;
    dom.statChars.textContent = chars;
    dom.statTime.textContent = minutes;
  }

  // ============ PLAYBACK ============
  function startCountdown(cb) {
    let n = 3;
    dom.countdownText.textContent = n;
    dom.prompterCountdown.style.display = 'flex';
    const tick = () => {
      n--;
      if (n <= 0) {
        dom.prompterCountdown.style.display = 'none';
        cb();
        return;
      }
      dom.countdownText.textContent = n;
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  }

  function play() {
    if (!dom.editor.value.trim()) {
      flashEditor();
      return;
    }
    if (state.countdown) {
      startCountdown(_play);
    } else {
      _play();
    }
  }

  function _play() {
    state.playing = true;
    state.lastTs = performance.now();
    dom.btnPlay.textContent = '⏸ Pausar';
    dom.btnPlay.classList.add('playing');
    dom.prompterPlay.textContent = '⏸';
    dom.floatPlay.textContent = '⏸';
    loop();
  }

  function pause() {
    state.playing = false;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = null;
    dom.btnPlay.textContent = '▶ Reproducir';
    dom.btnPlay.classList.remove('playing');
    dom.prompterPlay.textContent = '▶';
    dom.floatPlay.textContent = '⏯';
  }

  function reset() {
    pause();
    dom.prompterScroll.scrollTop = 0;
    state.currentWordIdx = -1;
    updateActiveWord();
  }

  function toggle() {
    state.playing ? pause() : play();
  }

  function loop(ts) {
    if (!state.playing) return;
    if (!ts) ts = performance.now();
    const dt = (ts - state.lastTs) / 1000;
    state.lastTs = ts;

    // Avanza scroll
    const max = dom.prompterScroll.scrollHeight - dom.prompterScroll.clientHeight;
    dom.prompterScroll.scrollTop += state.speed * dt;

    updateActiveWord();

    if (dom.prompterScroll.scrollTop >= max - 5) {
      pause();
      return;
    }

    state.rafId = requestAnimationFrame(loop);
  }

  function flashEditor() {
    const orig = dom.editor.style.borderColor;
    dom.editor.style.borderColor = 'var(--danger)';
    setTimeout(() => { dom.editor.style.borderColor = ''; }, 600);
    dom.editor.focus();
  }

  // ============ FULLSCREEN ============
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      dom.prompterWrapper.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  function onFullscreenChange() {
    const isFs = !!document.fullscreenElement;
    dom.floatingControls.style.display = isFs ? 'flex' : 'none';
    // En fullscreen el sidebar ya está oculto, así que ocupa todo
    if (isFs) {
      dom.app.classList.add('sidebar-hidden');
    } else {
      // No forzar sidebar visible al salir
    }
  }

  // ============ EVENTS ============
  function bindEvents() {
    // Sidebar
    dom.sidebarToggle.addEventListener('click', () => dom.app.classList.add('sidebar-hidden'));
    dom.sidebarToggle2.addEventListener('click', () => dom.app.classList.remove('sidebar-hidden'));

    // Scripts
    dom.scriptSelect.addEventListener('change', e => {
      const id = e.target.value;
      if (id) loadScript(id);
      else {
        state.currentId = null;
        dom.scriptName.value = '';
        updateCurrentTitle();
      }
    });
    dom.btnSave.addEventListener('click', saveCurrentScript);
    dom.btnDelete.addEventListener('click', deleteCurrentScript);

    // Sliders
    dom.speedSlider.addEventListener('input', e => {
      state.speed = parseInt(e.target.value);
      dom.speedDisplay.textContent = state.speed;
      saveStorage();
    });
    dom.sizeSlider.addEventListener('input', e => {
      state.fontSize = parseInt(e.target.value);
      dom.sizeDisplay.textContent = state.fontSize;
      dom.prompterContent.style.fontSize = state.fontSize + 'px';
      saveStorage();
    });
    dom.widthSlider.addEventListener('input', e => {
      state.width = parseInt(e.target.value);
      dom.widthDisplay.textContent = state.width;
      dom.prompterContent.style.width = state.width + '%';
      saveStorage();
    });

    // Colors
    dom.colorSwatches.forEach(btn => {
      btn.addEventListener('click', () => {
        state.color = btn.dataset.color;
        dom.prompterContent.style.color = state.color;
        dom.colorSwatches.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        saveStorage();
      });
    });

    // Toggles
    dom.btnMirror.addEventListener('click', () => {
      state.mirror = !state.mirror;
      dom.prompterContent.classList.toggle('mirror', state.mirror);
      dom.btnMirror.textContent = `Mirror: ${state.mirror ? 'ON' : 'OFF'}`;
      dom.btnMirror.classList.toggle('active', state.mirror);
      saveStorage();
    });
    dom.btnCountdown.addEventListener('click', () => {
      state.countdown = !state.countdown;
      dom.btnCountdown.textContent = `Countdown: ${state.countdown ? 'ON' : 'OFF'}`;
      dom.btnCountdown.classList.toggle('active', state.countdown);
      saveStorage();
    });

    // Toolbar
    dom.btnTest.addEventListener('click', () => {
      dom.editor.value = SAMPLE_TEXT;
      renderPrompter();
      updateStats();
    });
    dom.btnPlay.addEventListener('click', toggle);
    dom.btnFullscreen.addEventListener('click', toggleFullscreen);

    // Prompter
    dom.prompterPlay.addEventListener('click', toggle);
    dom.prompterReset.addEventListener('click', reset);

    // Floating
    dom.floatPlay.addEventListener('click', toggle);
    dom.floatReset.addEventListener('click', reset);
    dom.floatExit.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
    });

    // Editor live render (con debounce)
    let debounceTimer;
    dom.editor.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        renderPrompter();
        updateStats();
      }, 300);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      const tag = e.target.tagName;
      const inEditor = (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT');

      if (e.code === 'Space' && !inEditor) {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === 'r' && !inEditor) { reset(); return; }
      if (e.key === 'f' && !inEditor) { toggleFullscreen(); return; }
      if (e.key === 'm' && !inEditor) {
        dom.btnMirror.click();
        return;
      }
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
        return;
      }

      if (!inEditor) {
        if (e.key === 'ArrowRight') {
          state.speed = Math.min(200, state.speed + 5);
          dom.speedSlider.value = state.speed;
          dom.speedDisplay.textContent = state.speed;
          saveStorage();
        }
        if (e.key === 'ArrowLeft') {
          state.speed = Math.max(5, state.speed - 5);
          dom.speedSlider.value = state.speed;
          dom.speedDisplay.textContent = state.speed;
          saveStorage();
        }
        if (e.key === '+' || e.key === '=') {
          state.fontSize = Math.min(120, state.fontSize + 4);
          dom.sizeSlider.value = state.fontSize;
          dom.sizeDisplay.textContent = state.fontSize;
          dom.prompterContent.style.fontSize = state.fontSize + 'px';
          saveStorage();
        }
        if (e.key === '-' || e.key === '_') {
          state.fontSize = Math.max(20, state.fontSize - 4);
          dom.sizeSlider.value = state.fontSize;
          dom.sizeDisplay.textContent = state.fontSize;
          dom.prompterContent.style.fontSize = state.fontSize + 'px';
          saveStorage();
        }
      }
    });

    // Fullscreen change
    document.addEventListener('fullscreenchange', onFullscreenChange);

    // Click en el prompter = toggle play
    dom.prompterContent.addEventListener('click', toggle);
  }

  // ============ INIT ============
  function init() {
    loadStorage();

    // Apply settings to UI
    dom.speedSlider.value = state.speed;
    dom.speedDisplay.textContent = state.speed;
    dom.sizeSlider.value = state.fontSize;
    dom.sizeDisplay.textContent = state.fontSize;
    dom.widthSlider.value = state.width;
    dom.widthDisplay.textContent = state.width;
    dom.colorSwatches.forEach(b => {
      b.classList.toggle('active', b.dataset.color === state.color);
    });
    dom.prompterContent.style.color = state.color;
    dom.btnMirror.textContent = `Mirror: ${state.mirror ? 'ON' : 'OFF'}`;
    dom.btnMirror.classList.toggle('active', state.mirror);
    dom.btnCountdown.textContent = `Countdown: ${state.countdown ? 'ON' : 'OFF'}`;
    dom.btnCountdown.classList.toggle('active', state.countdown);

    refreshScriptSelect();
    bindEvents();

    // Si hay scripts guardados, cargar el más reciente
    const ids = Object.keys(state.scripts);
    if (ids.length > 0) {
      const latest = ids.sort((a, b) =>
        (state.scripts[b].updated || 0) - (state.scripts[a].updated || 0)
      )[0];
      loadScript(latest);
    } else {
      dom.editor.value = SAMPLE_TEXT;
      renderPrompter();
      updateStats();
    }

    updateActiveWord();
  }

  // Esperar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

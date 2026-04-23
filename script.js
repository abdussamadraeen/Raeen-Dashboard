(function() {
    'use strict';

    // --- Toast Notification System ---
    const toastContainer = (() => {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 9999; pointer-events: none; max-width: 400px;`;
        document.body.appendChild(container);
        return container;
    })();

    function showToast(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        const bgColor = { 'success': '#10b981', 'error': '#ef4444', 'warning': '#f59e0b', 'info': '#3b82f6' }[type] || '#3b82f6';
        const icon = { 'success': '✓', 'error': '✕', 'warning': '⚠', 'info': 'ℹ' }[type] || 'ℹ';

        toast.style.cssText = `background: ${bgColor}; color: white; padding: 12px 16px; border-radius: 10px; margin-bottom: 10px; font-size: 0.9rem; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 10px; animation: slideInRight 0.3s ease-out; pointer-events: auto; cursor: default; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
        toast.innerHTML = `<span style="font-weight: bold; font-size: 1.1em;">${icon}</span><span>${message}</span>`;
        toastContainer.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        return toast;
    }

    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `@keyframes slideInRight { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }`;
        document.head.appendChild(style);
    }

    // --- IndexedDB for Local Media ---
    let db;
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AbdusDashboardDB', 1);
            request.onerror = (event) => reject('Database error: ' + event.target.errorCode);
            request.onsuccess = (event) => { db = event.target.result; resolve(db); };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('media')) db.createObjectStore('media', { keyPath: 'id' });
            };
        });
    };

    const saveMedia = async (file) => {
        if (!db) await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['media'], 'readwrite');
            const store = transaction.objectStore('media');
            const reader = new FileReader();
            reader.onload = (e) => {
                const request = store.put({ id: 'local_bg', data: e.target.result, type: file.type, name: file.name });
                request.onsuccess = () => resolve(e.target.result);
                request.onerror = () => reject('Save error');
            };
            reader.readAsDataURL(file);
        });
    };

    const getMedia = async () => {
        if (!db) await initDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(['media'], 'readonly');
            const store = transaction.objectStore('media');
            const request = store.get('local_bg');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    };

    // --- State Management ---
    const defaultSettings = {
        themePreference: 'system',
        backgroundType: 'canvas',
        backgroundValue: 'neural',
        canvasStyle: 'neural',
        showSearch: true,
        searchEngine: 'google',
        showTopSites: true,
        topSitesSource: 'favorites',
        shortcuts: [
            { name: 'GitHub', url: 'https://github.com', icon: 'https://github.githubassets.com/favicons/favicon.svg' },
            { name: 'Kaggle', url: 'https://kaggle.com', icon: 'https://www.kaggle.com/static/images/favicon.ico' }
        ],
        googleApps: [
            { name: 'Search', url: 'https://www.google.com/', icon: 'https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png' },
            { name: 'YouTube', url: 'https://www.youtube.com/', icon: 'https://www.youtube.com/favicon.ico' },
            { name: 'Gmail', url: 'https://mail.google.com/', icon: 'https://www.gstatic.com/images/branding/product/2x/gmail_96dp.png' },
            { name: 'Drive', url: 'https://drive.google.com/', icon: 'https://www.gstatic.com/images/branding/product/2x/drive_2020q4_96dp.png' },
            { name: 'Gemini', url: 'https://gemini.google.com/', icon: 'https://www.gstatic.com/images/branding/product/2x/gemini_96dp.png' }
        ],
        msApps: [
            { name: 'Copilot', url: 'https://copilot.microsoft.com/', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Microsoft_365_Copilot_Icon.svg' },
            { name: 'Outlook', url: 'https://outlook.live.com/', icon: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg' }
        ],
        aiApps: [
            { name: 'ChatGPT', url: 'https://chatgpt.com/', icon: 'https://chatgpt.com/favicon.ico' },
            { name: 'Gemini', url: 'https://gemini.google.com/', icon: 'https://gemini.google.com/favicon.ico' },
            { name: 'Claude', url: 'https://claude.ai/', icon: 'https://claude.ai/favicon.ico' },
            { name: 'Perplexity', url: 'https://www.perplexity.ai/', icon: 'https://www.perplexity.ai/favicon.ico' }
        ],
        customApps: [],
        showClock: true,
        clockFormat: 'auto',
        showCards: false,
        showCardDate: true,
        showCardFocus: true,
        showCardNote: true,
        showMainUI: true,
        customSearchUrl: 'https://www.google.com/search?q=%s'
    };

    let settings = { ...defaultSettings };
    try {
        const saved = localStorage.getItem('abdus_dashboard_settings');
        if (saved) settings = { ...settings, ...JSON.parse(saved) };
    } catch (e) { console.warn('Storage error:', e); }

    function saveSettings(noApply = false) {
        try { localStorage.setItem('abdus_dashboard_settings', JSON.stringify(settings)); } catch (e) {}
        if (!noApply) applySettings();
    }

    // --- Canvas Engine ---
    const CanvasEngine = (() => {
        let canvas, ctx, animationId, particles = [], width, height, theme = 'neural';
        let mouse = { x: null, y: null };

        const init = (el, style) => {
            canvas = el; ctx = canvas.getContext('2d');
            theme = style || 'neural';
            resize();
            window.addEventListener('resize', resize);
            window.addEventListener('mousemove', (e) => { mouse.x = e.x; mouse.y = e.y; });
            animate();
        };

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            createParticles();
        };

        const createParticles = () => {
            particles = [];
            const count = theme === 'rain' ? 100 : 80;
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * (theme === 'neural' ? 1 : 0.5),
                    vy: theme === 'rain' ? Math.random() * 15 + 5 : (Math.random() - 0.5) * 1,
                    radius: theme === 'bubbles' ? Math.random() * 20 + 5 : Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7b61ff';
            
            particles.forEach((p, i) => {
                if (theme === 'neural') {
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < 0 || p.x > width) p.vx *= -1;
                    if (p.y < 0 || p.y > height) p.vy *= -1;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(123, 97, 255, ${p.opacity})`; ctx.fill();
                    for (let j = i + 1; j < particles.length; j++) {
                        const p2 = particles[j];
                        const dx = p.x - p2.x, dy = p.y - p2.y, dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 150) {
                            ctx.beginPath(); ctx.strokeStyle = `rgba(123, 97, 255, ${(150 - dist) / 1000})`;
                            ctx.lineWidth = 1; ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        }
                    }
                } else if (theme === 'bubbles') {
                    p.y -= p.vy; if (p.y < -50) p.y = height + 50;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.3})`; ctx.lineWidth = 2; ctx.stroke();
                } else if (theme === 'rain') {
                    p.y += p.vy; if (p.y > height) { p.y = -20; p.x = Math.random() * width; }
                    ctx.beginPath(); ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.2})`;
                    ctx.lineWidth = 1; ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + 15); ctx.stroke();
                }
            });
            animationId = requestAnimationFrame(animate);
        };

        const stop = () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
        return { init, stop };
    })();

    // --- Search Engines ---
    const engines = {
        'google': { action: 'https://www.google.com/search', param: 'q' },
        'duckduckgo': { action: 'https://duckduckgo.com/', param: 'q' },
        'brave': { action: 'https://search.brave.com/search', param: 'q' },
        'bing': { action: 'https://www.bing.com/search', param: 'q' },
        'chatgpt': { action: 'https://chatgpt.com/', param: 'q' },
        'gemini': { action: 'https://gemini.google.com/app', param: 'q' },
        'claude': { action: 'https://claude.ai/chat', param: 'q' },
        'perplexity': { action: 'https://www.perplexity.ai/', param: 'q' },
        'custom_engine': { action: '', param: '' }
    };

    // --- DOM Elements Cache ---
    const dom = {
        bgLayer: document.getElementById('background-layer'),
        canvasLayer: document.getElementById('canvas-layer'),
        clockWidget: document.getElementById('clock-widget'),
        timeEl: document.getElementById('time'),
        searchWidget: document.getElementById('search-widget'),
        topSitesWidget: document.getElementById('top-sites-widget'),
        cardsWidget: document.getElementById('cards-widget'),
        cardDateEl: document.getElementById('card-date'),
        cardFocusEl: document.getElementById('card-focus'),
        cardNoteEl: document.getElementById('notes-panel'),
        searchForm: document.getElementById('search-form'),
        searchInput: document.getElementById('search-input'),
        searchSuggestions: document.getElementById('search-suggestions'),
        settingsBtn: document.getElementById('settings-btn'),
        modalOverlay: document.getElementById('settings-modal'),
        closeBtn: document.getElementById('close-modal-btn'),
        sidebarTabs: document.querySelectorAll('.sidebar-tab'),
        tabPanes: document.querySelectorAll('.tab-pane'),
        themeRadios: document.getElementsByName('theme_preference'),
        bgTypeSelect: document.getElementById('bg-type-select'),
        showMainUIToggle: document.getElementById('show-main-ui-toggle'),
        bgCanvasOptions: document.getElementById('bg-canvas-options'),
        canvasStyleSelect: document.getElementById('canvas-style-select'),
        bgBingOptions: document.getElementById('bg-bing-options'),
        bingGallery: document.getElementById('bing-gallery'),
        bgPresetOptions: document.getElementById('bg-preset-options'),
        galleryGrid: document.getElementById('gallery-grid'),
        galleryCategorySelect: document.getElementById('gallery-category-select'),
        bgSolidOptions: document.getElementById('bg-solid-options'),
        bgColorPicker: document.getElementById('bg-color-picker'),
        colorSwatches: document.querySelectorAll('.color-swatch'),
        bgLocalOptions: document.getElementById('bg-local-options'),
        bgLocalFile: document.getElementById('bg-local-file'),
        bgCustomOptions: document.getElementById('bg-custom-options'),
        bgCustomUrl: document.getElementById('bg-custom-url'),
        toggleSearch: document.getElementById('toggle-search'),
        engineRadios: document.getElementsByName('search_engine'),
        toggleTopSites: document.getElementById('toggle-topsites'),
        topsitesSourceRadios: document.getElementsByName('topsites_source'),
        toggleClock: document.getElementById('toggle-clock'),
        clockFormatSelect: document.getElementById('clock-format-select'),
        toggleCards: document.getElementById('toggle-cards'),
        toggleCardDate: document.getElementById('toggle-card-date'),
        toggleCardFocus: document.getElementById('toggle-card-focus'),
        toggleCardNote: document.getElementById('toggle-card-note'),
        newShortcutName: document.getElementById('new-shortcut-name'),
        newShortcutUrl: document.getElementById('new-shortcut-url'),
        addShortcutBtn: document.getElementById('add-shortcut-btn'),
        shortcutsList: document.getElementById('shortcuts-list'),
        cardDateValue: document.getElementById('card-date-value'),
        cardDateDay: document.getElementById('card-date-day'),
        cardFocusTime: document.getElementById('card-focus-time'),
        focusToggleBtn: document.getElementById('focus-toggle-btn'),
        focusResetBtn: document.getElementById('focus-reset-btn'),
        notesList: document.getElementById('notes-list'),
        notesCount: document.getElementById('notes-count'),
        addNoteBtn: document.getElementById('add-note-btn'),
        noteEditor: document.getElementById('note-editor'),
        noteBackBtn: document.getElementById('note-back-btn'),
        noteEditorTitle: document.getElementById('note-editor-title'),
        noteEditorBody: document.getElementById('note-editor-body'),
        noteCharCount: document.getElementById('note-char-count'),
        noteSaveStatus: document.getElementById('note-save-status'),
        noteDeleteBtn: document.getElementById('note-delete-btn'),
        appsLauncherBtn: document.getElementById('apps-launcher-btn'),
        appsDropdown: document.getElementById('apps-dropdown'),
        appTabs: document.querySelectorAll('.app-tab'),
        appPanes: document.querySelectorAll('.app-pane'),
        googleAppsGrid: document.getElementById('google-apps'),
        msAppsGrid: document.getElementById('ms-apps'),
        aiAppsGrid: document.getElementById('ai-apps'),
        customAppsGrid: document.getElementById('custom-apps'),
        addAppBtn: document.getElementById('add-app-btn'),
        addAppModal: document.getElementById('add-app-modal'),
        closeAddAppBtn: document.getElementById('close-add-app-btn'),
        saveAppBtn: document.getElementById('save-app-btn'),
        appNameInput: document.getElementById('app-name'),
        appUrlInput: document.getElementById('app-url'),
        appIconInput: document.getElementById('app-icon'),
        customSearchUrlInput: document.getElementById('custom-search-url')
    };

    // --- Bing Logic (WOW Improvisation) ---
    async function loadBingGallery() {
        if (!dom.bingGallery) return;
        dom.bingGallery.innerHTML = '<p class="subtext">Loading daily wallpapers...</p>';
        try {
            const mkt = navigator.language || 'en-US';
            const res = await fetch(`https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=${mkt}`);
            const data = await res.json();
            const images = data.images || [];
            dom.bingGallery.innerHTML = images.map(img => `
                <div class="bing-thumb-wrapper" style="cursor:pointer;" data-url="https://www.bing.com${img.url}">
                    <img src="https://www.bing.com${img.urlbase}_400x240.jpg" class="bing-thumb ${settings.backgroundValue === 'https://www.bing.com'+img.url ? 'active' : ''}" style="width:100%; border-radius:8px;">
                </div>
            `).join('');
            dom.bingGallery.querySelectorAll('.bing-thumb-wrapper').forEach(w => w.addEventListener('click', () => {
                settings.backgroundType = 'bing'; settings.backgroundValue = w.dataset.url;
                saveSettings();
            }));
        } catch (e) {
            dom.bingGallery.innerHTML = '<p class="subtext">Failed to fetch Bing gallery. Check your connection.</p>';
        }
    }

    // --- Theme Library (Restored) ---
    const themes = {
        nature: [
            { name: 'Rainy Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80' },
            { name: 'Mountain Peak', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80' }
        ],
        space: [
            { name: 'Galaxy', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=1920&q=80' }
        ]
    };

    function renderThemeLibrary() {
        if (!dom.galleryGrid) return;
        const cat = dom.galleryCategorySelect.value;
        let list = cat === 'all' ? Object.values(themes).flat() : (themes[cat] || []);
        dom.galleryGrid.innerHTML = list.map(t => `<div class="bg-option" style="background-image:url('${t.url}')" data-url="${t.url}"></div>`).join('');
        dom.galleryGrid.querySelectorAll('.bg-option').forEach(opt => opt.addEventListener('click', () => {
            settings.backgroundType = 'preset'; settings.backgroundValue = opt.dataset.url;
            saveSettings();
        }));
    }

    // --- Core Application Logic ---
    function applyTheme() {
        const root = document.documentElement;
        if (settings.themePreference === 'light') root.setAttribute('data-theme', 'light');
        else if (settings.themePreference === 'dark') root.removeAttribute('data-theme');
        else root.toggleAttribute('data-theme', window.matchMedia('(prefers-color-scheme: light)').matches);
    }

    async function applySettings() {
        applyTheme();
        const t = settings.backgroundType;
        
        // Background Cleanup
        CanvasEngine.stop();
        if (dom.canvasLayer) dom.canvasLayer.classList.add('hidden');
        if (dom.bgLayer) { dom.bgLayer.innerHTML = ''; dom.bgLayer.style.background = ''; }

        if (t === 'canvas') {
            if (dom.canvasLayer) {
                dom.canvasLayer.classList.remove('hidden');
                CanvasEngine.init(dom.canvasLayer, settings.canvasStyle || 'neural');
            }
        } else if (t === 'bing' || t === 'preset' || t === 'custom') {
            const url = t === 'bing' && settings.backgroundValue === 'bing_latest' ? `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1` : settings.backgroundValue;
            if (url.includes('.mp4') || url.includes('.webm')) {
                dom.bgLayer.innerHTML = `<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;"><source src="${url}"></video>`;
            } else {
                dom.bgLayer.style.backgroundImage = `url('${url}')`;
                dom.bgLayer.style.backgroundSize = 'cover';
                dom.bgLayer.style.backgroundPosition = 'center';
            }
        } else if (t === 'solid') {
            dom.bgLayer.style.background = settings.backgroundValue;
        } else if (t === 'local') {
            const media = await getMedia();
            if (media) {
                if (media.type.startsWith('video')) dom.bgLayer.innerHTML = `<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;"><source src="${media.data}"></video>`;
                else { dom.bgLayer.style.backgroundImage = `url('${media.data}')`; dom.bgLayer.style.backgroundSize = 'cover'; }
            }
        }

        // UI Toggles
        if(dom.searchWidget) dom.searchWidget.classList.toggle('hidden', !settings.showSearch);
        if(dom.topSitesWidget) dom.topSitesWidget.classList.toggle('hidden', !settings.showTopSites);
        if(dom.clockWidget) dom.clockWidget.style.display = settings.showClock ? 'block' : 'none';
        if(dom.cardsWidget) dom.cardsWidget.classList.toggle('hidden', !settings.showCards);
        
        syncModalUI();
        renderTopSites();
        renderApps();
    }

    function syncModalUI() {
        if (dom.bgTypeSelect) {
            dom.bgTypeSelect.value = settings.backgroundType;
            const t = settings.backgroundType;
            if(dom.bgCanvasOptions) dom.bgCanvasOptions.classList.toggle('hidden', t !== 'canvas');
            if(dom.bgBingOptions) dom.bgBingOptions.classList.toggle('hidden', t !== 'bing');
            if(dom.bgPresetOptions) dom.bgPresetOptions.classList.toggle('hidden', t !== 'preset');
            if(dom.bgSolidOptions) dom.bgSolidOptions.classList.toggle('hidden', t !== 'solid');
            if(dom.bgLocalOptions) dom.bgLocalOptions.classList.toggle('hidden', t !== 'local');
            if(dom.bgCustomOptions) dom.bgCustomOptions.classList.toggle('hidden', t !== 'custom');
        }
        if (dom.showMainUIToggle) dom.showMainUIToggle.checked = settings.showMainUI;
        [dom.searchWidget, dom.topSitesWidget, dom.cardsWidget, dom.clockWidget].forEach(el => { if (el) el.classList.toggle('immersive-hidden', !settings.showMainUI); });
        document.body.classList.toggle('immersive-mode', !settings.showMainUI);
    }

    // --- Search suggestions and Logic ---
    if (dom.searchInput) {
        let suggestTimeout;
        dom.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (!query) { if (dom.searchSuggestions) { dom.searchSuggestions.innerHTML = ''; dom.searchSuggestions.classList.add('hidden'); } return; }
            clearTimeout(suggestTimeout);
            suggestTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    const suggestions = data[1] || [];
                    if (!dom.searchSuggestions) return;
                    if (suggestions.length === 0) { dom.searchSuggestions.classList.add('hidden'); return; }
                    dom.searchSuggestions.innerHTML = suggestions.map((s, i) => `<li class="suggestion-item" data-text="${s.replace(/"/g,'&quot;')}" style="--item-index: ${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><span>${s}</span></li>`).join('');
                    dom.searchSuggestions.classList.remove('hidden');
                } catch(err) {}
            }, 150);
        });
    }

    // --- Top Sites Render ---
    function renderTopSites() {
        if(!dom.topSitesWidget) return;
        dom.topSitesWidget.innerHTML = '';
        settings.shortcuts.forEach((sc, i) => {
            const a = document.createElement('a'); a.href = sc.url; a.className = 'shortcut'; a.style.setProperty('--item-index', i);
            a.innerHTML = `<img src="${sc.icon || 'https://www.google.com/s2/favicons?domain='+sc.url+'&sz=128'}"><span>${sc.name}</span>`;
            dom.topSitesWidget.appendChild(a);
        });
    }

    // --- Apps Render ---
    function renderApps() {
        const render = (apps, grid) => {
            if(!grid) return;
            grid.innerHTML = apps.map((app, i) => `<a href="${app.url}" class="app-item"><img src="${app.icon}"><span>${app.name}</span></a>`).join('');
        };
        render(settings.googleApps, dom.googleAppsGrid);
        render(settings.msApps, dom.msAppsGrid);
        render(settings.aiApps, dom.aiAppsGrid);
        render(settings.customApps, dom.customAppsGrid);
    }

    // --- Event Listeners ---
    if (dom.bgTypeSelect) dom.bgTypeSelect.addEventListener('change', (e) => { settings.backgroundType = e.target.value; saveSettings(); if(e.target.value === 'bing') loadBingGallery(); if(e.target.value === 'preset') renderThemeLibrary(); });
    if (dom.canvasStyleSelect) dom.canvasStyleSelect.addEventListener('change', (e) => { settings.canvasStyle = e.target.value; saveSettings(); });
    if (dom.bgLocalFile) dom.bgLocalFile.addEventListener('change', async (e) => { if (e.target.files[0]) { await saveMedia(e.target.files[0]); settings.backgroundType = 'local'; saveSettings(); } });
    if (dom.bgCustomUrl) dom.bgCustomUrl.addEventListener('change', (e) => { settings.backgroundType = 'custom'; settings.backgroundValue = e.target.value; saveSettings(); });
    if (dom.showMainUIToggle) dom.showMainUIToggle.addEventListener('change', (e) => { settings.showMainUI = e.target.checked; saveSettings(); });

    // --- Time ---
    function updateTime() {
        if (!dom.timeEl) return;
        const now = new Date();
        dom.timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: settings.clockFormat !== '24h' });
    }

    // --- Init ---
    initDB().then(() => {
        applySettings();
        updateTime();
        setInterval(updateTime, 1000);
        if(settings.backgroundType === 'bing') loadBingGallery();
    });

    // Modal tabs
    if (dom.sidebarTabs) {
        dom.sidebarTabs.forEach(tab => tab.addEventListener('click', () => {
            dom.sidebarTabs.forEach(t => t.classList.remove('active')); dom.tabPanes.forEach(p => p.classList.remove('active'));
            tab.classList.add('active'); document.getElementById(tab.dataset.target).classList.add('active');
        }));
    }
    if(dom.settingsBtn) dom.settingsBtn.addEventListener('click', () => dom.modalOverlay.classList.remove('hidden'));
    if(dom.closeBtn) dom.closeBtn.addEventListener('click', () => dom.modalOverlay.classList.add('hidden'));

})();

// Immediately invoked function to encapsulate scope and guarantee execution
(function() {
    'use strict'; // Enforce strict mode for highest performance and error checking

    // --- IndexedDB for Local Media ---
    const DB_NAME = 'AbdusDashboardDB';
    const STORE_NAME = 'mediaStore';

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function saveLocalMedia(file) {
        try {
            const db = await initDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(file, 'bgMedia');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) { console.error('Failed to save media', e); }
    }

    async function loadLocalMedia() {
        try {
            const db = await initDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get('bgMedia');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        } catch (e) { return null; }
    }

    // --- State Management ---
    const defaultSettings = {
        themePreference: 'system',
        backgroundType: 'canvas',
        backgroundValue: 'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=en-US',
        showSearch: true,
        searchEngine: 'google',
        showTopSites: true,
        topSitesSource: 'favorites',
        shortcuts: [
            { name: 'GitHub', url: 'https://github.com', icon: 'https://github.githubassets.com/favicons/favicon.svg' },
            { name: 'Kaggle', url: 'https://kaggle.com', icon: 'https://www.kaggle.com/static/images/favicon.ico' },
            { name: 'Ecommerce', url: 'http://localhost:3000', icon: '' }
        ],
        googleApps: [
            { name: 'Account', url: 'https://myaccount.google.com/', icon: 'https://www.google.com/favicon.ico' },
            { name: 'Search', url: 'https://www.google.com/', icon: 'https://www.google.com/favicon.ico' },
            { name: 'Maps', url: 'https://maps.google.com/', icon: 'https://maps.google.com/favicon.ico' },
            { name: 'YouTube', url: 'https://www.youtube.com/', icon: 'https://www.youtube.com/favicon.ico' },
            { name: 'Gmail', url: 'https://mail.google.com/', icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
            { name: 'Drive', url: 'https://drive.google.com/', icon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png' },
            { name: 'Calendar', url: 'https://calendar.google.com/', icon: 'https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_v2.png' },
            { name: 'Photos', url: 'https://photos.google.com/', icon: 'https://ssl.gstatic.com/images/branding/product/1x/photos_2020q4_32dp.png' },
            { name: 'Meet', url: 'https://meet.google.com/', icon: 'https://ssl.gstatic.com/images/branding/product/1x/meet_2020q4_32dp.png' }
        ],
        msApps: [
            { name: 'Microsoft 365', url: 'https://www.microsoft365.com/', icon: 'https://res.cdn.office.net/officehub/images/content/images/favicon-8f211ea639.ico' },
            { name: 'Outlook', url: 'https://outlook.live.com/', icon: 'https://outlook.live.com/favicon.ico' },
            { name: 'OneDrive', url: 'https://onedrive.live.com/', icon: 'https://onedrive.live.com/favicon.ico' },
            { name: 'Teams', url: 'https://teams.microsoft.com/', icon: 'https://statics.teams.cdn.office.net/hashedassets-m/favicon/favicon.ico' },
            { name: 'OneNote', url: 'https://www.onenote.com/', icon: 'https://www.onenote.com/favicon.ico' },
            { name: 'To Do', url: 'https://to-do.microsoft.com/', icon: 'https://to-do.microsoft.com/favicon.ico' }
        ],
        customApps: [],
        showClock: true,
        clockFormat: 'auto',
        showCards: false,
        showCardDate: true,
        showCardFocus: true,
        showCardNote: true,
        canvasStyle: 'neural'
    };

    let settings = { ...defaultSettings };
    
    // Safety block: Graceful degradation if localStorage is denied
    try {
        const saved = localStorage.getItem('abdus_dashboard_settings');
        if (saved) settings = { ...settings, ...JSON.parse(saved) };
        
        // Migration: Fix broken YouTube icons
        if (settings.googleApps) {
            let migrated = false;
            settings.googleApps.forEach(app => {
                if (app.name === 'YouTube' && app.icon && app.icon.includes('1000885e')) {
                    app.icon = 'https://www.youtube.com/favicon.ico';
                    migrated = true;
                }
            });
            if (migrated) {
                try { localStorage.setItem('abdus_dashboard_settings', JSON.stringify(settings)); } catch(e){}
            }
        }
    } catch (e) { 
        console.warn('Storage error during init:', e); 
    }

    function saveSettings(noApply = false) {
        try {
            localStorage.setItem('abdus_dashboard_settings', JSON.stringify(settings));
        } catch (e) { console.error('Failed to save settings', e); }
        if (!noApply) applySettings();
    }

    // --- Categorized Theme Library ---
    const themeLibrary = {
        abstract: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&q=80",
            "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80",
            "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&q=80"
        ],
        nature: [
            "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1920&q=80",
            "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80",
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80",
            "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80"
        ],
        ocean: [
            "https://images.unsplash.com/photo-1498623116890-37e912163d5d?w=1920&q=80",
            "https://images.unsplash.com/photo-1439405326854-014607f694d7?w=1920&q=80",
            "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80"
        ],
        space: [
            "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80",
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80",
            "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1920&q=80"
        ],
        animals: [
            "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1920&q=80",
            "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1920&q=80",
            "https://images.unsplash.com/photo-1555169062-013468b47731?w=1920&q=80"
        ],
        chrome_earth: [
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80",
            "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&q=80"
        ],
        chrome_cityscapes: [
            "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1920&q=80",
            "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80"
        ],
        chrome_textures: [
            "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=1920&q=80",
            "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=1920&q=80"
        ],
        chrome_geometric: [
            "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1920&q=80",
            "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80"
        ],
        chrome_aapi: [
            "https://images.unsplash.com/photo-1542125387-c71274d94f0a?w=1920&q=80",
            "https://images.unsplash.com/photo-1528164344705-47542687000d?w=1920&q=80"
        ],
        chrome_lgbtq: [
            "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80",
            "https://images.unsplash.com/photo-1505909182942-e2f09aee3e89?w=1920&q=80"
        ]
    };

    // --- Search Engines ---
    const engines = {
        'google': { action: 'https://www.google.com/search', param: 'q' },
        'duckduckgo': { action: 'https://duckduckgo.com/', param: 'q' },
        'brave': { action: 'https://search.brave.com/search', param: 'q' },
        'bing': { action: 'https://www.bing.com/search', param: 'q' },
        'chatgpt': { action: 'https://chatgpt.com/', param: 'q' }
    };

    // --- DOM Elements Cache (O(1) lookups) ---
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
        bgCanvasOptions: document.getElementById('bg-canvas-options'),
        canvasStyleSelect: document.getElementById('canvas-style-select'),
        bgBingOptions: document.getElementById('bg-bing-options'),
        bgPresetOptions: document.getElementById('bg-preset-options'),
        bgSolidOptions: document.getElementById('bg-solid-options'),
        bgLocalOptions: document.getElementById('bg-local-options'),
        bgCustomOptions: document.getElementById('bg-custom-options'),
        bgColorPicker: document.getElementById('bg-color-picker'),
        bgCustomUrl: document.getElementById('bg-custom-url'),
        colorSwatches: document.querySelectorAll('.color-swatch'),
        localFileInput: document.getElementById('bg-local-file'),
        galleryGrid: document.getElementById('gallery-grid'),
        galleryCategorySelect: document.getElementById('gallery-category-select'),
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
        customAppsGrid: document.getElementById('custom-apps'),
        addAppBtn: document.getElementById('add-app-btn'),
        addAppModal: document.getElementById('add-app-modal'),
        closeAddAppBtn: document.getElementById('close-add-app-btn'),
        saveAppBtn: document.getElementById('save-app-btn'),
        appNameInput: document.getElementById('app-name'),
        appUrlInput: document.getElementById('app-url'),
        appIconInput: document.getElementById('app-icon')
    };

    // --- Render Gallery ---
    function renderGallery(filter = 'all') {
        if (!dom.galleryGrid) return;
        dom.galleryGrid.innerHTML = '';
        const fragment = document.createDocumentFragment(); // Batch DOM inserts
        
        let itemsToRender = [];
        if (filter === 'all') {
            itemsToRender = Object.values(themeLibrary).flat();
        } else if (themeLibrary[filter]) {
            itemsToRender = themeLibrary[filter];
        }

        itemsToRender.forEach(url => {
            const div = document.createElement('div');
            div.className = 'bg-option';
            div.dataset.url = url;
            div.style.backgroundImage = `url('${url.replace('w=1920', 'w=300')}')`;
            div.addEventListener('click', () => {
                settings.backgroundType = 'preset';
                settings.backgroundValue = url;
                saveSettings();
            });
            fragment.appendChild(div);
        });
        dom.galleryGrid.appendChild(fragment);
    }

    // --- Render Top Sites ---
    function renderTopSites() {
        if(!dom.topSitesWidget || !dom.shortcutsList) return;
        
        // 1. Render Management List (Only manual shortcuts)
        dom.shortcutsList.innerHTML = '';
        const listFragment = document.createDocumentFragment();
        settings.shortcuts.forEach((sc, index) => {
            const div = document.createElement('div');
            div.className = 'managed-item';
            div.innerHTML = `
                <div><strong>${sc.name}</strong><span>${sc.url}</span></div>
                <div class="managed-item-actions"><button data-index="${index}">Remove</button></div>
            `;
            listFragment.appendChild(div);
        });
        dom.shortcutsList.appendChild(listFragment);

        // 2. Render Dashboard Grid (Manual + History)
        dom.topSitesWidget.innerHTML = '';
        const widgetFragment = document.createDocumentFragment();
        
        // Helper to get domain hostname for reliable favicon fetching
        const getDomain = (urlStr) => {
            try { return new URL(urlStr).hostname; } catch(e) { return urlStr; }
        };

        // Helper to render a single shortcut
        const renderShortcut = (sc) => {
            const a = document.createElement('a');
            a.href = sc.url;
            a.className = 'shortcut';
            
            const img = document.createElement('img');
            let iconUrl = sc.icon;
            if (iconUrl && iconUrl.includes('s2/favicons')) iconUrl = null;
            img.src = iconUrl || `https://icon.horse/icon/${getDomain(sc.url)}`;
            img.alt = sc.name;
            img.onerror = () => { 
                if (img.src.includes('icon.horse')) {
                    img.src = `https://www.google.com/s2/favicons?domain=${getDomain(sc.url)}&sz=128`;
                } else {
                    img.style.display='none'; 
                    a.prepend(createIconPlaceholder(sc.name)); 
                }
            };
            a.appendChild(img);
            
            const span = document.createElement('span');
            span.textContent = sc.name;
            a.appendChild(span);
            widgetFragment.appendChild(a);
        };

        // Render manual shortcuts if setting is 'favorites' or 'frequently_visited'
        if (settings.topSitesSource === 'favorites') {
            settings.shortcuts.forEach(renderShortcut);
            dom.topSitesWidget.appendChild(widgetFragment);
        } else {
            // Fetch and append chrome history (top sites)
            if (typeof chrome !== 'undefined' && chrome.topSites) {
            chrome.topSites.get((topSites) => {
                // Filter out sites already in manual shortcuts
                const existingUrls = new Set(settings.shortcuts.map(s => s.url.replace(/\/$/, '')));
                
                let addedCount = 0;
                for (let site of topSites) {
                    if (addedCount >= 24) break; // Limit auto-added sites
                    const cleanUrl = site.url.replace(/\/$/, '');
                    if (!existingUrls.has(cleanUrl)) {
                        // Shorten name if it's too long
                        let title = site.title || cleanUrl;
                        if (title.length > 15) title = title.substring(0, 15) + '...';
                        
                        renderShortcut({ name: title, url: site.url, icon: '' });
                        addedCount++;
                    }
                }
                dom.topSitesWidget.appendChild(widgetFragment);
            });
            }
        }
    }

    function createIconPlaceholder(name) {
        const div = document.createElement('div');
        div.className = 'icon-placeholder';
        div.textContent = name.charAt(0).toUpperCase();
        return div;
    }

    // --- Live Canvas Engine (Neural Network) ---
    const CanvasEngine = {
        canvas: null,
        ctx: null,
        particles: [],
        animationFrame: null,
        mouse: { x: null, y: null, radius: 150 },
        isRunning: false,

        init(canvasEl) {
            this.canvas = canvasEl;
            if(!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('mousemove', (e) => { this.mouse.x = e.x; this.mouse.y = e.y; });
            window.addEventListener('mouseout', () => { this.mouse.x = null; this.mouse.y = null; });
        },

        resize() {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.initParticles();
        },

        initParticles() {
            this.particles = [];
            const numberOfParticles = (this.canvas.width * this.canvas.height) / 10000;
            for (let i = 0; i < numberOfParticles; i++) {
                const size = (Math.random() * 2) + 1;
                const x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
                const y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
                const directionX = (Math.random() * 2) - 1;
                const directionY = (Math.random() * 2) - 1;
                this.particles.push({ x, y, directionX, directionY, size });
            }
        },

        draw() {
            this.ctx.clearRect(0, 0, innerWidth, innerHeight);
            
            const gradient = this.ctx.createLinearGradient(0,0, innerWidth, innerHeight);
            gradient.addColorStop(0, '#0a0a1a');
            gradient.addColorStop(1, '#1a1a2e');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, innerWidth, innerHeight);

            for (let i = 0; i < this.particles.length; i++) {
                let p = this.particles[i];
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2, false);
                this.ctx.fillStyle = '#7b61ff';
                this.ctx.fill();

                if (settings.canvasStyle === 'neural') {
                    if (p.x > this.canvas.width || p.x < 0) p.directionX = -p.directionX;
                    if (p.y > this.canvas.height || p.y < 0) p.directionY = -p.directionY;
                    
                    p.x += p.directionX * 0.4;
                    p.y += p.directionY * 0.4;

                    if (this.mouse.x != null) {
                        let dx = this.mouse.x - p.x;
                        let dy = this.mouse.y - p.y;
                        let distance = Math.sqrt(dx*dx + dy*dy);
                        if (distance < this.mouse.radius) {
                            const forceDirectionX = dx / distance;
                            const forceDirectionY = dy / distance;
                            const force = (this.mouse.radius - distance) / this.mouse.radius;
                            p.x -= forceDirectionX * force * 1.5;
                            p.y -= forceDirectionY * force * 1.5;
                        }
                    }

                    for (let j = i; j < this.particles.length; j++) {
                        let p2 = this.particles[j];
                        let dx2 = p.x - p2.x;
                        let dy2 = p.y - p2.y;
                        let distance2 = (dx2*dx2 + dy2*dy2);
                        if (distance2 < 12000) {
                            let opacity = 1 - (distance2/12000);
                            this.ctx.strokeStyle = `rgba(123, 97, 255, ${opacity * 0.6})`;
                            this.ctx.lineWidth = 1;
                            this.ctx.beginPath();
                            this.ctx.moveTo(p.x, p.y);
                            this.ctx.lineTo(p2.x, p2.y);
                            this.ctx.stroke();
                        }
                    }
                } else if (settings.canvasStyle === 'bubbles') {
                    p.y -= (p.size * 0.3);
                    p.x += Math.sin(p.y * 0.05) * 0.5;
                    if (p.y < -50) {
                        p.y = this.canvas.height + 50;
                        p.x = Math.random() * this.canvas.width;
                    }
                } else if (settings.canvasStyle === 'rain') {
                    p.y += (p.size * 2);
                    if (p.y > this.canvas.height) {
                        p.y = -50;
                        p.x = Math.random() * this.canvas.width;
                    }
                }
            }
        },

        animate() {
            if (!this.isRunning) return;
            this.draw();
            this.animationFrame = requestAnimationFrame(() => this.animate());
        },

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            if (this.particles.length === 0) this.initParticles();
            this.animate();
        },

        stop() {
            this.isRunning = false;
            if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        }
    };

    // --- Core Logic ---
    function applyTheme() {
        const root = document.documentElement;
        if (settings.themePreference === 'light') {
            root.setAttribute('data-theme', 'light');
        } else if (settings.themePreference === 'dark') {
            root.removeAttribute('data-theme');
        } else {
            root.toggleAttribute('data-theme', window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
        }
    }

    function applySettings() {
        applyTheme();

        // Set Background
        const t = settings.backgroundType;
        
        if (t === 'canvas') {
            if (dom.bgLayer) dom.bgLayer.classList.add('hidden');
            if (dom.canvasLayer) dom.canvasLayer.classList.remove('hidden');
            CanvasEngine.start();
        } else {
            if (dom.canvasLayer) dom.canvasLayer.classList.add('hidden');
            if (dom.bgLayer) dom.bgLayer.classList.remove('hidden');
            CanvasEngine.stop();

            if (dom.bgLayer) {
                dom.bgLayer.innerHTML = '';
                const v = settings.backgroundValue;
                const applyBg = (url) => { dom.bgLayer.style.background = `url('${url}') no-repeat center center / cover`; };
                
                if (t === 'bing') {
                    if (settings.backgroundValue && settings.backgroundValue.includes('bing.com')) {
                        applyBg(settings.backgroundValue);
                    } else {
                        const lang = navigator.language || 'en-US';
                        const d = new Date();
                        const todayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                        applyBg(`https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=${lang}&cb=${todayStr}`);
                    }
                } else if (t === 'preset') {
                    const img = new Image();
                    img.onload = () => applyBg(v);
                    img.src = v;
                } else if (t === 'solid') {
                    dom.bgLayer.style.background = v;
                } else if (t === 'local') {
                    loadLocalMedia().then(file => {
                        if (file) {
                            const source = URL.createObjectURL(file);
                            if (file.type && file.type.startsWith('video/')) {
                                dom.bgLayer.style.background = 'none';
                                const video = document.createElement('video');
                                video.src = source; video.autoplay = true; video.loop = true; video.muted = true;
                                dom.bgLayer.appendChild(video);
                            } else {
                                applyBg(source);
                            }
                        }
                    });
                } else if (t === 'custom' && v) {
                    dom.bgLayer.style.background = 'var(--bg-body)';
                    
                    const ytMatch = v.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                    
                    if (ytMatch) {
                        const videoId = ytMatch[1];
                        dom.bgLayer.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}" frameborder="0" allow="autoplay; encrypted-media" style="position:absolute; width:100vw; height:56.25vw; min-height:100vh; min-width:177.77vh; top:50%; left:50%; transform:translate(-50%, -50%); pointer-events:none;"></iframe>`;
                    } else if (v.match(/\.(mp4|webm|ogg)$/i)) {
                        const video = document.createElement('video');
                        video.src = v;
                        video.autoplay = true;
                        video.muted = true;
                        video.loop = true;
                        dom.bgLayer.appendChild(video);
                    } else {
                        const applyBg = (url) => { dom.bgLayer.style.backgroundImage = `url('${url}')`; };
                        const img = new Image();
                        img.onload = () => applyBg(v);
                        img.onerror = () => applyBg(v); // Fallback if preloader is blocked by CORS
                        img.src = v;
                    }
                } else {
                    dom.bgLayer.style.background = 'var(--bg-body)';
                }
            }
        }

        // Toggle Widgets
        if(dom.searchWidget) dom.searchWidget.classList.toggle('hidden', !settings.showSearch);
        if(dom.topSitesWidget) dom.topSitesWidget.classList.toggle('hidden', !settings.showTopSites);
        if(dom.clockWidget) dom.clockWidget.style.display = settings.showClock ? 'block' : 'none';
        if(dom.cardsWidget) dom.cardsWidget.classList.toggle('hidden', !settings.showCards);
        
        if(dom.cardDateEl) dom.cardDateEl.style.display = settings.showCardDate !== false ? 'flex' : 'none';
        if(dom.cardFocusEl) dom.cardFocusEl.style.display = settings.showCardFocus !== false ? 'flex' : 'none';
        if(dom.cardNoteEl) dom.cardNoteEl.style.display = settings.showCardNote !== false ? 'flex' : 'none';

        renderTopSites();
        syncModalUI();
        updateTime();
    }

    function syncModalUI() {
        if (dom.themeRadios) Array.from(dom.themeRadios).forEach(r => r.checked = (r.value === settings.themePreference));
        if (dom.engineRadios) Array.from(dom.engineRadios).forEach(r => r.checked = (r.value === settings.searchEngine));
        if (dom.topsitesSourceRadios) Array.from(dom.topsitesSourceRadios).forEach(r => r.checked = (r.value === settings.topSitesSource));

        if (dom.bgTypeSelect) {
            dom.bgTypeSelect.value = settings.backgroundType;
            const t = settings.backgroundType;
            if(dom.bgCanvasOptions) dom.bgCanvasOptions.classList.toggle('hidden', t !== 'canvas');
            if(dom.bgBingOptions) dom.bgBingOptions.classList.toggle('hidden', t !== 'bing');
            if(dom.bgPresetOptions) dom.bgPresetOptions.classList.toggle('hidden', t !== 'preset');
            if(dom.bgSolidOptions) dom.bgSolidOptions.classList.toggle('hidden', t !== 'solid');
            if(dom.bgLocalOptions) dom.bgLocalOptions.classList.toggle('hidden', t !== 'local');
            if(dom.bgCustomOptions) dom.bgCustomOptions.classList.toggle('hidden', t !== 'custom');
            
            if(dom.canvasStyleSelect) dom.canvasStyleSelect.value = settings.canvasStyle || 'neural';

            if (t === 'solid' && !settings.backgroundValue.includes('url') && !settings.backgroundValue.includes('gradient')) {
                if(dom.bgColorPicker) dom.bgColorPicker.value = settings.backgroundValue.startsWith('#') ? settings.backgroundValue.substring(0,7) : '#1a1a2e';
            }
            if (t === 'custom' && dom.bgCustomUrl) dom.bgCustomUrl.value = settings.backgroundValue;
            
            document.querySelectorAll('.bg-option').forEach(d => d.classList.toggle('selected', t === 'preset' && d.dataset.url === settings.backgroundValue));
            if(dom.colorSwatches) dom.colorSwatches.forEach(s => s.classList.toggle('selected', t === 'solid' && s.dataset.color === settings.backgroundValue));
        }

        if (dom.toggleSearch) dom.toggleSearch.checked = settings.showSearch;
        if (dom.toggleTopSites) dom.toggleTopSites.checked = settings.showTopSites;
        if (dom.toggleClock) dom.toggleClock.checked = settings.showClock;
        if (dom.clockFormatSelect) dom.clockFormatSelect.value = settings.clockFormat || 'auto';
        if (dom.toggleCards) dom.toggleCards.checked = settings.showCards;
        if (dom.toggleCardDate) dom.toggleCardDate.checked = settings.showCardDate !== false;
        if (dom.toggleCardFocus) dom.toggleCardFocus.checked = settings.showCardFocus !== false;
        if (dom.toggleCardNote) dom.toggleCardNote.checked = settings.showCardNote !== false;
    }

    // --- Static Event Listeners ---
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
            if (settings.themePreference === 'system') applyTheme();
        });
    }

    // Search Form Submit Logic
    if (dom.searchForm && dom.searchInput) {
        dom.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = dom.searchInput.value.trim();
            if (!query) return;

            const engine = engines[settings.searchEngine] || engines['google'];
            const isAI = ['chatgpt'].includes(settings.searchEngine);
            
            const redirectUrl = isAI
                ? engine.action + '?q=' + encodeURIComponent(query)
                : engine.action + '?' + engine.param + '=' + encodeURIComponent(query);

            window.location.href = redirectUrl;
        });

        // Search Autocomplete Logic
        let suggestTimeout;
        let selectedSuggestionIndex = -1;
        
        dom.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (!query) {
                if (dom.searchSuggestions) {
                    dom.searchSuggestions.innerHTML = '';
                    dom.searchSuggestions.classList.add('hidden');
                }
                return;
            }
            
            clearTimeout(suggestTimeout);
            suggestTimeout = setTimeout(async () => {
                if (!dom.searchSuggestions) return;
                try {
                    // Using client=firefox for a clean JSON array response format
                    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    const suggestions = data[1] || [];
                    
                    if (suggestions.length === 0) {
                        dom.searchSuggestions.innerHTML = '';
                        dom.searchSuggestions.classList.add('hidden');
                        return;
                    }
                    
                    dom.searchSuggestions.innerHTML = suggestions.slice(0, 6).map((s, i) => 
                        `<li class="suggestion-item" data-index="${i}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            ${s}
                        </li>`
                    ).join('');
                    dom.searchSuggestions.classList.remove('hidden');
                    selectedSuggestionIndex = -1;
                } catch(err) {
                    // Ignore network errors or CORS blocks silently to prevent console spam
                }
            }, 150); // debounce 150ms
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (dom.searchSuggestions && !dom.searchForm.contains(e.target)) {
                dom.searchSuggestions.classList.add('hidden');
            }
        });
        
        // Show suggestions on focus if not empty
        dom.searchInput.addEventListener('focus', () => {
            if (dom.searchSuggestions && dom.searchSuggestions.innerHTML.trim() !== '') {
                dom.searchSuggestions.classList.remove('hidden');
            }
        });

        // Keyboard navigation (Arrow keys) and clicking on suggestions
        dom.searchForm.addEventListener('keydown', (e) => {
            if (!dom.searchSuggestions || dom.searchSuggestions.classList.contains('hidden')) return;
            const items = dom.searchSuggestions.querySelectorAll('.suggestion-item');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
                items.forEach((item, i) => item.classList.toggle('selected', i === selectedSuggestionIndex));
                dom.searchInput.value = items[selectedSuggestionIndex].textContent.trim();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedSuggestionIndex = selectedSuggestionIndex <= 0 ? items.length - 1 : selectedSuggestionIndex - 1;
                items.forEach((item, i) => item.classList.toggle('selected', i === selectedSuggestionIndex));
                dom.searchInput.value = items[selectedSuggestionIndex].textContent.trim();
            }
        });

        if (dom.searchSuggestions) {
            dom.searchSuggestions.addEventListener('click', (e) => {
                const item = e.target.closest('.suggestion-item');
                if (item) {
                    dom.searchInput.value = item.textContent.trim();
                    dom.searchSuggestions.classList.add('hidden');
                    dom.searchForm.dispatchEvent(new Event('submit'));
                }
            });
        }
    }

    // Settings Modal
    if (dom.settingsBtn && dom.modalOverlay) {
        dom.settingsBtn.addEventListener('click', () => {
            dom.modalOverlay.classList.remove('hidden');
            if (settings.backgroundType === 'bing') {
                loadBingGallery();
            }
        });
        if(dom.closeBtn) dom.closeBtn.addEventListener('click', () => {
            dom.modalOverlay.classList.add('hidden');
        });
    }
    if (dom.modalOverlay) dom.modalOverlay.addEventListener('click', (e) => { if (e.target === dom.modalOverlay) dom.modalOverlay.classList.add('hidden'); });

    if (dom.sidebarTabs) {
        dom.sidebarTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                dom.sidebarTabs.forEach(t => t.classList.remove('active'));
                dom.tabPanes.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const target = document.getElementById(tab.dataset.target);
                if(target) target.classList.add('active');
            });
        });
    }

    // Settings Bindings
    if (dom.themeRadios) Array.from(dom.themeRadios).forEach(r => r.addEventListener('change', (e) => { if(e.target.checked) { settings.themePreference = e.target.value; saveSettings(); } }));
    if (dom.engineRadios) Array.from(dom.engineRadios).forEach(r => r.addEventListener('change', (e) => { if(e.target.checked) { settings.searchEngine = e.target.value; saveSettings(); } }));
    if (dom.topsitesSourceRadios) Array.from(dom.topsitesSourceRadios).forEach(r => r.addEventListener('change', (e) => { if(e.target.checked) { settings.topSitesSource = e.target.value; saveSettings(); } }));
    if (dom.bgTypeSelect) dom.bgTypeSelect.addEventListener('change', (e) => {
        settings.backgroundType = e.target.value;
        if (settings.backgroundType === 'preset') {
            const firstAvailable = document.querySelector('.bg-option');
            settings.backgroundValue = firstAvailable ? firstAvailable.dataset.url : Object.values(themeLibrary)[0][0];
        }
        else if (settings.backgroundType === 'solid' && dom.colorSwatches.length) settings.backgroundValue = dom.colorSwatches[0].dataset.color;
        else if (settings.backgroundType === 'custom') settings.backgroundValue = dom.bgCustomUrl ? dom.bgCustomUrl.value : '';
        saveSettings();
    });
    if (dom.canvasStyleSelect) dom.canvasStyleSelect.addEventListener('change', (e) => {
        settings.canvasStyle = e.target.value;
        saveSettings();
    });
    if (dom.galleryCategorySelect) dom.galleryCategorySelect.addEventListener('change', (e) => {
        renderGallery(e.target.value);
        document.querySelectorAll('.bg-option').forEach(d => d.classList.toggle('selected', settings.backgroundType === 'preset' && d.dataset.url === settings.backgroundValue));
    });
    if (dom.colorSwatches) dom.colorSwatches.forEach(s => s.addEventListener('click', () => { settings.backgroundType = 'solid'; settings.backgroundValue = s.dataset.color; saveSettings(); }));
    if (dom.bgColorPicker) dom.bgColorPicker.addEventListener('input', (e) => { settings.backgroundType = 'solid'; settings.backgroundValue = e.target.value; saveSettings(); });
    if (dom.localFileInput) dom.localFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        await saveLocalMedia(file);
        settings.backgroundType = 'local';
        saveSettings();
    });
    if (dom.bgCustomUrl) dom.bgCustomUrl.addEventListener('change', (e) => { settings.backgroundValue = e.target.value; saveSettings(); });
    
    if (dom.toggleSearch) dom.toggleSearch.addEventListener('change', (e) => { settings.showSearch = e.target.checked; saveSettings(); });
    if (dom.toggleTopSites) dom.toggleTopSites.addEventListener('change', (e) => { settings.showTopSites = e.target.checked; saveSettings(); });
    if (dom.toggleClock) dom.toggleClock.addEventListener('change', (e) => { settings.showClock = e.target.checked; saveSettings(); });
    if (dom.clockFormatSelect) dom.clockFormatSelect.addEventListener('change', (e) => { settings.clockFormat = e.target.value; saveSettings(); });
    if (dom.toggleCards) dom.toggleCards.addEventListener('change', (e) => { settings.showCards = e.target.checked; saveSettings(); });
    if (dom.toggleCardDate) dom.toggleCardDate.addEventListener('change', (e) => { settings.showCardDate = e.target.checked; saveSettings(); });
    if (dom.toggleCardFocus) dom.toggleCardFocus.addEventListener('change', (e) => { settings.showCardFocus = e.target.checked; saveSettings(); });
    if (dom.toggleCardNote) dom.toggleCardNote.addEventListener('change', (e) => { settings.showCardNote = e.target.checked; saveSettings(); });

    // Shortcuts
    if (dom.addShortcutBtn) {
        dom.addShortcutBtn.addEventListener('click', () => {
            const name = dom.newShortcutName.value.trim();
            let url = dom.newShortcutUrl.value.trim();
            if (name && url) {
                if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
                let domain = '';
                try { domain = new URL(url).hostname; } catch(e) { domain = url; }
                let icon = `https://icon.horse/icon/${domain}`;
                settings.shortcuts.push({ name, url, icon });
                dom.newShortcutName.value = ''; dom.newShortcutUrl.value = '';
                saveSettings();
            }
        });
    }
    if (dom.shortcutsList) {
        dom.shortcutsList.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                settings.shortcuts.splice(parseInt(e.target.dataset.index, 10), 1);
                saveSettings();
            }
        });
    }

    // --- Time Engine ---
    let lastRenderedTime = '';
    function updateTime() {
        if (!dom.timeEl || !settings.showClock) return;
        
        const now = new Date();
        let format = settings.clockFormat || 'auto';
        let use24h = format === '24h';
        
        if (format === 'auto') use24h = false; // Default US formatting
        
        let hours = now.getHours();
        let minutes = now.getMinutes();
        
        if (!use24h) {
            hours = hours % 12;
            hours = hours ? hours : 12;
        } else {
            hours = hours < 10 ? '0' + hours : hours;
        }
        
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        const formatted = `${hours}:${minutes}`;
        
        // Only trigger DOM reflow if the minute actually changed
        if (formatted !== lastRenderedTime) {
            dom.timeEl.textContent = formatted;
            lastRenderedTime = formatted;
        }
    }

    // --- Cards Logic ---

    // ── Date Card ──
    function updateDateCard() {
        if (!dom.cardDateValue) return;
        const now = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        dom.cardDateValue.textContent = `${months[now.getMonth()]} ${now.getDate()}`;
        if (dom.cardDateDay) dom.cardDateDay.textContent = days[now.getDay()];
    }

    // ── Focus Timer (synced across tabs via localStorage timestamp) ──
    const FOCUS_DURATION = 25 * 60; // 25 minutes
    const FOCUS_KEY = 'abdus_focus_timer';
    let focusTickInterval = null;

    function getFocusState() {
        try {
            const raw = localStorage.getItem(FOCUS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch(e) { return null; }
    }

    function setFocusState(state) {
        try { localStorage.setItem(FOCUS_KEY, JSON.stringify(state)); } catch(e) {}
    }

    function clearFocusState() {
        try { localStorage.removeItem(FOCUS_KEY); } catch(e) {}
    }

    function renderFocusUI() {
        if (!dom.cardFocusTime || !dom.focusToggleBtn) return;
        const state = getFocusState();

        if (!state) {
            // Idle
            dom.cardFocusTime.textContent = '25:00';
            dom.focusToggleBtn.textContent = '\u25b6 Start';
            return;
        }

        if (state.running) {
            const remaining = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
            if (remaining <= 0) {
                clearFocusState();
                dom.cardFocusTime.textContent = '00:00';
                dom.focusToggleBtn.textContent = '\u25b6 Start';
                return;
            }
            const m = Math.floor(remaining / 60);
            const s = remaining % 60;
            dom.cardFocusTime.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            dom.focusToggleBtn.textContent = '\u23f8 Pause';
        } else {
            // Paused
            const sec = state.remaining || FOCUS_DURATION;
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            dom.cardFocusTime.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            dom.focusToggleBtn.textContent = '\u25b6 Resume';
        }
    }

    function startFocusTick() {
        if (focusTickInterval) clearInterval(focusTickInterval);
        focusTickInterval = setInterval(renderFocusUI, 500);
    }

    if (dom.focusToggleBtn) {
        dom.focusToggleBtn.addEventListener('click', () => {
            const state = getFocusState();
            if (!state) {
                // Start fresh
                setFocusState({ running: true, endTime: Date.now() + FOCUS_DURATION * 1000 });
            } else if (state.running) {
                // Pause
                const remaining = Math.max(0, Math.round((state.endTime - Date.now()) / 1000));
                setFocusState({ running: false, remaining });
            } else {
                // Resume from paused
                setFocusState({ running: true, endTime: Date.now() + (state.remaining || FOCUS_DURATION) * 1000 });
            }
            renderFocusUI();
        });
    }

    if (dom.focusResetBtn) {
        dom.focusResetBtn.addEventListener('click', () => {
            clearFocusState();
            if (focusTickInterval) clearInterval(focusTickInterval);
            renderFocusUI();
        });
    }

    // Listen for changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === FOCUS_KEY) renderFocusUI();
        if (e.key === 'abdus_notes') renderNotesList();
    });

    // ── Notes App ──
    const NOTES_KEY = 'abdus_notes';
    let currentNoteId = null;
    let saveTimeout = null;

    function getNotes() {
        try {
            const raw = localStorage.getItem(NOTES_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    }

    function saveNotes(notes) {
        try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch(e) {}
    }

    function formatNoteDate(ts) {
        const d = new Date(ts);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const h = d.getHours();
        const m = d.getMinutes();
        return `${months[d.getMonth()]} ${d.getDate()}, ${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
    }

    function renderNotesList() {
        if (!dom.notesList || !dom.notesCount) return;
        const notes = getNotes();
        dom.notesCount.textContent = notes.length;

        if (notes.length === 0) {
            dom.notesList.innerHTML = '<div class="notes-empty"><p>No notes yet</p><p style="font-size:0.72rem;margin-top:4px;">Tap "+ New" to create one</p></div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        notes.sort((a, b) => b.updated - a.updated);
        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.dataset.id = note.id;
            const preview = (note.body || '').substring(0, 80).replace(/\n/g, ' ') || 'Empty note';
            card.innerHTML = `
                <div class="note-card-title">${note.title || 'Untitled'}</div>
                <div class="note-card-preview">${preview}</div>
                <div class="note-card-meta">${formatNoteDate(note.updated)}</div>
            `;
            card.addEventListener('click', () => openNoteEditor(note.id));
            fragment.appendChild(card);
        });
        dom.notesList.innerHTML = '';
        dom.notesList.appendChild(fragment);
    }

    function openNoteEditor(id) {
        if (!dom.noteEditor || !dom.notesList) return;
        currentNoteId = id;
        const notes = getNotes();
        const note = notes.find(n => n.id === id);
        if (!note) return;

        dom.noteEditorTitle.value = note.title || '';
        dom.noteEditorBody.value = note.body || '';
        updateCharCount();
        if (dom.noteSaveStatus) dom.noteSaveStatus.textContent = 'Saved';

        dom.notesList.classList.add('hidden');
        dom.noteEditor.classList.remove('hidden');
        // Hide the header too
        const header = dom.notesList.previousElementSibling;
        // Focus the body
        dom.noteEditorBody.focus();
    }

    function closeNoteEditor() {
        if (!dom.noteEditor || !dom.notesList) return;
        saveCurrentNote();
        currentNoteId = null;
        dom.noteEditor.classList.add('hidden');
        dom.notesList.classList.remove('hidden');
        renderNotesList();
    }

    function saveCurrentNote() {
        if (currentNoteId === null) return;
        const notes = getNotes();
        const idx = notes.findIndex(n => n.id === currentNoteId);
        if (idx === -1) return;
        notes[idx].title = (dom.noteEditorTitle ? dom.noteEditorTitle.value : '') || '';
        notes[idx].body = (dom.noteEditorBody ? dom.noteEditorBody.value : '') || '';
        notes[idx].updated = Date.now();
        saveNotes(notes);
        if (dom.noteSaveStatus) dom.noteSaveStatus.textContent = 'Saved';
    }

    function updateCharCount() {
        if (!dom.noteCharCount || !dom.noteEditorBody) return;
        const len = dom.noteEditorBody.value.length;
        dom.noteCharCount.textContent = `${len} character${len !== 1 ? 's' : ''}`;
    }

    function autoSave() {
        if (dom.noteSaveStatus) dom.noteSaveStatus.textContent = 'Saving...';
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveCurrentNote();
            updateCharCount();
        }, 400);
    }

    // Notes event listeners
    if (dom.addNoteBtn) {
        dom.addNoteBtn.addEventListener('click', () => {
            const notes = getNotes();
            const newNote = { id: Date.now(), title: '', body: '', created: Date.now(), updated: Date.now() };
            notes.unshift(newNote);
            saveNotes(notes);
            renderNotesList();
            openNoteEditor(newNote.id);
        });
    }
    if (dom.noteBackBtn) dom.noteBackBtn.addEventListener('click', closeNoteEditor);
    if (dom.noteEditorTitle) dom.noteEditorTitle.addEventListener('input', autoSave);
    if (dom.noteEditorBody) dom.noteEditorBody.addEventListener('input', autoSave);
    if (dom.noteDeleteBtn) {
        dom.noteDeleteBtn.addEventListener('click', () => {
            if (currentNoteId === null) return;
            let notes = getNotes();
            notes = notes.filter(n => n.id !== currentNoteId);
            saveNotes(notes);
            closeNoteEditor();
        });
    }

    // --- Apps Launcher Logic ---
    function getDomainForApp(urlStr) {
        try { return new URL(urlStr).hostname; } catch(e) { return urlStr; }
    }

    let draggedItemIndex = null;
    let draggedArrayName = null;

    function renderAppsTab(appsArray, containerElement, arrayName) {
        if (!containerElement) return;
        containerElement.innerHTML = '';
        if (!appsArray) return;
        appsArray.forEach((app, index) => {
            const a = document.createElement('a');
            a.href = app.url;
            a.className = 'app-item';
            a.setAttribute('draggable', 'true');
            
            const img = document.createElement('img');
            img.src = app.icon || `https://icon.horse/icon/${getDomainForApp(app.url)}`;
            img.alt = app.name;
            img.onerror = () => { 
                if (img.src.includes('icon.horse')) {
                    img.src = `https://www.google.com/s2/favicons?domain=${getDomainForApp(app.url)}&sz=128`;
                } else {
                    img.style.display = 'none'; 
                    const placeholder = document.createElement('div');
                    placeholder.className = 'icon-placeholder';
                    placeholder.textContent = app.name.charAt(0).toUpperCase();
                    a.insertBefore(placeholder, span);
                }
            };
            a.appendChild(img);
            
            const span = document.createElement('span');
            span.textContent = app.name;
            a.appendChild(span);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-app-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.title = 'Remove';
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                settings[arrayName].splice(index, 1);
                saveSettings();
                renderApps();
            });
            a.appendChild(removeBtn);
            
            a.addEventListener('dragstart', (e) => {
                draggedItemIndex = index;
                draggedArrayName = arrayName;
                setTimeout(() => a.classList.add('dragging'), 0);
            });
            a.addEventListener('dragend', () => {
                a.classList.remove('dragging');
                draggedItemIndex = null;
                draggedArrayName = null;
                containerElement.querySelectorAll('.app-item').forEach(i => i.classList.remove('drag-over'));
            });
            a.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedArrayName === arrayName) {
                    a.classList.add('drag-over');
                }
            });
            a.addEventListener('dragleave', () => {
                a.classList.remove('drag-over');
            });
            a.addEventListener('drop', (e) => {
                e.preventDefault();
                a.classList.remove('drag-over');
                if (draggedArrayName === arrayName && draggedItemIndex !== null && draggedItemIndex !== index) {
                    const arr = settings[arrayName];
                    const item = arr.splice(draggedItemIndex, 1)[0];
                    arr.splice(index, 0, item);
                    saveSettings();
                    renderApps();
                }
            });

            containerElement.appendChild(a);
        });
    }

    function renderApps() {
        if (!settings.googleApps) settings.googleApps = defaultSettings.googleApps;
        if (!settings.msApps) settings.msApps = defaultSettings.msApps;
        if (!settings.customApps) settings.customApps = [];
        
        renderAppsTab(settings.googleApps, dom.googleAppsGrid, 'googleApps');
        renderAppsTab(settings.msApps, dom.msAppsGrid, 'msApps');
        renderAppsTab(settings.customApps, dom.customAppsGrid, 'customApps');
    }

    let activeAppTab = 'google-apps';

    if (dom.appsLauncherBtn && dom.appsDropdown) {
        dom.appsLauncherBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dom.appsDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!dom.appsDropdown.contains(e.target) && e.target !== dom.appsLauncherBtn) {
                dom.appsDropdown.classList.add('hidden');
            }
        });

        dom.appTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation(); // Keep dropdown open
                dom.appTabs.forEach(t => t.classList.remove('active'));
                dom.appPanes.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const targetId = tab.dataset.target;
                activeAppTab = targetId;
                const targetPane = document.getElementById(targetId);
                if (targetPane) targetPane.classList.add('active');
            });
        });
    }

    if (dom.addAppBtn) {
        dom.addAppBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dom.addAppModal) dom.addAppModal.classList.remove('hidden');
        });
    }
    if (dom.closeAddAppBtn) {
        dom.closeAddAppBtn.addEventListener('click', () => {
            if (dom.addAppModal) dom.addAppModal.classList.add('hidden');
        });
    }
    if (dom.saveAppBtn) {
        dom.saveAppBtn.addEventListener('click', () => {
            const name = dom.appNameInput.value.trim();
            let url = dom.appUrlInput.value.trim();
            const iconUrl = dom.appIconInput.value.trim();
            if (name && url) {
                if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
                
                let targetArray = 'googleApps';
                if (activeAppTab === 'ms-apps') targetArray = 'msApps';
                else if (activeAppTab === 'custom-apps') targetArray = 'customApps';
                
                if (!settings[targetArray]) settings[targetArray] = [];
                settings[targetArray].push({ name, url, icon: iconUrl });
                saveSettings();
                
                dom.appNameInput.value = '';
                dom.appUrlInput.value = '';
                if(dom.appIconInput) dom.appIconInput.value = '';
                dom.addAppModal.classList.add('hidden');
                renderApps();
            }
        });
    }

    // --- Bing Gallery Functionality ---
    async function loadBingGallery() {
        if (!dom.bingGallery) return;
        dom.bingGallery.innerHTML = 'Loading...';
        try {
            const lang = navigator.language || 'en-US';
            const bingUrl = `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=${lang}`;
            let data;
            try {
                const res = await fetch(bingUrl);
                if (!res.ok) throw new Error('Bing request failed');
                data = await res.json();
            } catch(e) {
                // Fallback to Peapix API if CORS is blocked (e.g. testing locally)
                const countryCode = lang.split('-')[1] ? lang.split('-')[1].toLowerCase() : 'us';
                const res = await fetch(`https://peapix.com/bing/feed?country=${countryCode}`);
                if (!res.ok) throw new Error('Peapix fallback failed');
                const peapixData = await res.json();
                data = {
                    images: peapixData.map(img => ({
                        url: img.imageUrl.replace('https://www.bing.com', ''),
                        urlbase: img.imageUrl.replace('_1920x1080.jpg', '').replace('https://www.bing.com', ''),
                        copyright: img.title
                    }))
                };
            }
            dom.bingGallery.innerHTML = '';
            
            data.images.forEach(image => {
                const imgUrl = image.url.startsWith('http') ? image.url : `https://www.bing.com${image.url}`;
                const thumbUrl = image.urlbase.startsWith('http') ? `${image.urlbase}_320x240.jpg` : `https://www.bing.com${image.urlbase}_320x240.jpg`;
                
                const thumb = document.createElement('img');
                thumb.src = thumbUrl;
                thumb.className = 'bing-thumb';
                thumb.title = image.copyright;
                if (settings.backgroundValue === imgUrl) thumb.classList.add('active');
                
                thumb.addEventListener('click', () => {
                    document.querySelectorAll('.bing-thumb').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    settings.backgroundValue = imgUrl;
                    saveSettings();
                });
                dom.bingGallery.appendChild(thumb);
            });
        } catch (error) {
            dom.bingGallery.innerHTML = '<span style="color:var(--danger)">Failed to load Bing gallery.</span>';
            console.error('Bing Gallery Error:', error);
        }
    }

    // --- Initialization ---
    renderApps();
    CanvasEngine.init(dom.canvasLayer);
    renderGallery();
    applySettings();
    updateTime();
    updateDateCard();
    renderFocusUI();
    startFocusTick();
    renderNotesList();
    setInterval(updateTime, 1000);
    if (settings.showSearch && dom.searchInput) dom.searchInput.focus();
})();

// Immediately invoked function to encapsulate scope and guarantee execution
(function() {
    'use strict'; // Enforce strict mode for highest performance and error checking

    // --- State Management ---
    const defaultSettings = {
        themePreference: 'system',
        backgroundType: 'canvas',
        backgroundValue: 'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=en-US',
        localBackgroundData: null,
        showSearch: true,
        searchEngine: 'google',
        showTopSites: true,
        shortcuts: [
            { name: 'GitHub', url: 'https://github.com', icon: 'https://github.githubassets.com/favicons/favicon.svg' },
            { name: 'Kaggle', url: 'https://kaggle.com', icon: 'https://www.kaggle.com/static/images/favicon.ico' },
            { name: 'Ecommerce', url: 'http://localhost:3000', icon: '' }
        ],
        showClock: true,
        clockFormat: 'auto',
        showCards: false
    };

    let settings = { ...defaultSettings };
    
    // Safety block: Graceful degradation if localStorage is denied
    try {
        const saved = localStorage.getItem('abdus_dashboard_settings');
        if (saved) settings = { ...settings, ...JSON.parse(saved) };
    } catch (e) { 
        console.warn('Storage denied. Running in ephemeral mode.'); 
    }

    function saveSettings() {
        try {
            localStorage.setItem('abdus_dashboard_settings', JSON.stringify(settings));
        } catch (e) {}
        applySettings();
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
        'chatgpt': { action: 'https://chatgpt.com/', param: 'q' },
        'copilot': { action: 'https://copilot.microsoft.com/', param: 'q' },
        'gemini': { action: 'https://gemini.google.com/app', param: 'q' }
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
        searchForm: document.getElementById('search-form'),
        searchInput: document.getElementById('search-input'),
        settingsBtn: document.getElementById('settings-btn'),
        modalOverlay: document.getElementById('settings-modal'),
        closeBtn: document.getElementById('close-modal-btn'),
        sidebarTabs: document.querySelectorAll('.sidebar-tab'),
        tabPanes: document.querySelectorAll('.tab-pane'),
        themeRadios: document.getElementsByName('theme_preference'),
        bgTypeSelect: document.getElementById('bg-type-select'),
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
        toggleClock: document.getElementById('toggle-clock'),
        clockFormatSelect: document.getElementById('clock-format-select'),
        toggleCards: document.getElementById('toggle-cards'),
        newShortcutName: document.getElementById('new-shortcut-name'),
        newShortcutUrl: document.getElementById('new-shortcut-url'),
        addShortcutBtn: document.getElementById('add-shortcut-btn'),
        shortcutsList: document.getElementById('shortcuts-list')
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
        
        dom.topSitesWidget.innerHTML = '';
        const widgetFragment = document.createDocumentFragment();
        
        settings.shortcuts.forEach(sc => {
            const a = document.createElement('a');
            a.href = sc.url;
            a.className = 'shortcut';
            
            if (sc.icon) {
                const img = document.createElement('img');
                img.src = sc.icon;
                img.alt = sc.name;
                img.onerror = () => { img.style.display='none'; a.prepend(createIconPlaceholder(sc.name)); };
                a.appendChild(img);
            } else {
                a.appendChild(createIconPlaceholder(sc.name));
            }
            
            const span = document.createElement('span');
            span.textContent = sc.name;
            a.appendChild(span);
            widgetFragment.appendChild(a);
        });
        dom.topSitesWidget.appendChild(widgetFragment);

        dom.shortcutsList.innerHTML = '';
        const listFragment = document.createDocumentFragment();
        settings.shortcuts.forEach((sc, index) => {
            const div = document.createElement('div');
            div.className = 'managed-item';
            div.innerHTML = `
                <div><strong>${sc.name}</strong> <span style="font-size:0.8em;opacity:0.7">${sc.url}</span></div>
                <div class="managed-item-actions"><button data-index="${index}">Remove</button></div>
            `;
            listFragment.appendChild(div);
        });
        dom.shortcutsList.appendChild(listFragment);
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

    // --- UI Physics Engine (Semantic Constellation) ---
    const UIPhysicsEngine = {
        elements: [],
        mouse: { x: -1000, y: -1000 },
        isRunning: false,

        init() {
            const shortcuts = document.querySelectorAll('.shortcut');
            const searchInput = document.getElementById('search-input');
            
            this.elements = [
                { el: searchInput, type: 'search', vx: 0, vy: 0, dx: 0, dy: 0, random: Math.random() * 10, mass: 2.0 },
                ...Array.from(shortcuts).map(el => ({ el, type: 'shortcut', vx: 0, vy: 0, dx: 0, dy: 0, random: Math.random() * 10, mass: 1.0 }))
            ];

            window.addEventListener('mousemove', (e) => { this.mouse.x = e.x; this.mouse.y = e.y; });
            window.addEventListener('mouseout', () => { this.mouse.x = -1000; this.mouse.y = -1000; });
            
            this.start();
        },

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.animate();
        },

        animate() {
            if (!this.isRunning) return;
            const time = performance.now() * 0.001;

            for(let i=0; i < this.elements.length; i++) {
                let state = this.elements[i];
                if (!state.el) continue;

                // 1. Organic Breathing (Sine waves)
                let breatheAmp = state.type === 'search' ? 3 : 8;
                let breatheX = Math.sin(time * 0.8 + state.random) * breatheAmp;
                let breatheY = Math.cos(time * 0.6 + state.random) * breatheAmp;

                // 2. Mouse Repulsion
                let rect = state.el.getBoundingClientRect();
                let centerX = rect.left + rect.width / 2;
                let centerY = rect.top + rect.height / 2;

                let dxMouse = centerX - this.mouse.x;
                let dyMouse = centerY - this.mouse.y;
                let distance = Math.sqrt(dxMouse*dxMouse + dyMouse*dyMouse);
                
                let forceX = 0, forceY = 0;
                let repelRadius = state.type === 'search' ? 250 : 180;
                let repelStrength = state.type === 'search' ? 30 : 60;

                if (distance < repelRadius && distance > 0) {
                    let force = (repelRadius - distance) / repelRadius;
                    forceX = (dxMouse / distance) * force * repelStrength;
                    forceY = (dyMouse / distance) * force * repelStrength;
                }

                // 3. Target Displacement
                let targetDx = breatheX + forceX;
                let targetDy = breatheY + forceY;

                // 4. Spring Physics
                let spring = 0.08 / state.mass;
                let friction = 0.85;

                let ax = (targetDx - state.dx) * spring;
                let ay = (targetDy - state.dy) * spring;

                state.vx += ax;
                state.vy += ay;
                state.vx *= friction;
                state.vy *= friction;

                state.dx += state.vx;
                state.dy += state.vy;

                // 5. Apply via CSS Variables
                state.el.style.setProperty('--dx', `${state.dx}px`);
                state.el.style.setProperty('--dy', `${state.dy}px`);
            }

            requestAnimationFrame(() => this.animate());
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
                const l = settings.localBackgroundData;
                
                if (t === 'bing') {
                    const todayStr = new Date().toISOString().split('T')[0];
                    dom.bgLayer.style.background = `url('https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=en-US&cb=${todayStr}') no-repeat center center / cover`;
                } else if (t === 'preset' || t === 'solid') {
                    dom.bgLayer.style.background = t === 'preset' ? `url('${v}') no-repeat center center / cover` : v;
                } else if ((t === 'local' && l) || (t === 'custom' && v)) {
                    const source = t === 'local' ? l : v;
                    if (source.match(/\.(mp4|webm|ogg)$/i) || source.startsWith('data:video/')) {
                        dom.bgLayer.style.background = 'none';
                        const video = document.createElement('video');
                        video.src = source; video.autoplay = true; video.loop = true; video.muted = true;
                        dom.bgLayer.appendChild(video);
                    } else {
                        dom.bgLayer.style.background = `url('${source}') no-repeat center center / cover`;
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

        renderTopSites();
        syncModalUI();
        updateTime();
    }

    function syncModalUI() {
        if (dom.themeRadios) Array.from(dom.themeRadios).forEach(r => r.checked = (r.value === settings.themePreference));
        if (dom.engineRadios) Array.from(dom.engineRadios).forEach(r => r.checked = (r.value === settings.searchEngine));

        if (dom.bgTypeSelect) {
            dom.bgTypeSelect.value = settings.backgroundType;
            const t = settings.backgroundType;
            if(dom.bgBingOptions) dom.bgBingOptions.classList.toggle('hidden', t !== 'bing');
            if(dom.bgPresetOptions) dom.bgPresetOptions.classList.toggle('hidden', t !== 'preset');
            if(dom.bgSolidOptions) dom.bgSolidOptions.classList.toggle('hidden', t !== 'solid');
            if(dom.bgLocalOptions) dom.bgLocalOptions.classList.toggle('hidden', t !== 'local');
            if(dom.bgCustomOptions) dom.bgCustomOptions.classList.toggle('hidden', t !== 'custom');

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
            const isAI = ['chatgpt', 'copilot', 'gemini'].includes(settings.searchEngine);
            const redirectUrl = isAI 
                ? engine.action + (settings.searchEngine !== 'gemini' ? '?q=' + encodeURIComponent(query) : '')
                : engine.action + '?' + engine.param + '=' + encodeURIComponent(query);

            if (isAI) {
                navigator.clipboard.writeText(query).then(() => {
                    dom.searchInput.value = 'Prompt Copied! Just paste (Ctrl+V) it...';
                    setTimeout(() => window.location.href = redirectUrl, 700);
                }).catch(() => window.location.href = redirectUrl);
            } else {
                window.location.href = redirectUrl;
            }
        });
    }

    // Settings Modal
    if (dom.settingsBtn) dom.settingsBtn.addEventListener('click', () => dom.modalOverlay.classList.remove('hidden'));
    if (dom.closeBtn) dom.closeBtn.addEventListener('click', () => dom.modalOverlay.classList.add('hidden'));
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
    if (dom.galleryCategorySelect) dom.galleryCategorySelect.addEventListener('change', (e) => {
        renderGallery(e.target.value);
        document.querySelectorAll('.bg-option').forEach(d => d.classList.toggle('selected', settings.backgroundType === 'preset' && d.dataset.url === settings.backgroundValue));
    });
    if (dom.colorSwatches) dom.colorSwatches.forEach(s => s.addEventListener('click', () => { settings.backgroundType = 'solid'; settings.backgroundValue = s.dataset.color; saveSettings(); }));
    if (dom.bgColorPicker) dom.bgColorPicker.addEventListener('input', (e) => { settings.backgroundType = 'solid'; settings.backgroundValue = e.target.value; saveSettings(); });
    if (dom.localFileInput) dom.localFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => { settings.backgroundType = 'local'; settings.localBackgroundData = event.target.result; saveSettings(); };
        reader.readAsDataURL(file);
    });
    if (dom.bgCustomUrl) dom.bgCustomUrl.addEventListener('change', (e) => { settings.backgroundValue = e.target.value; saveSettings(); });
    
    if (dom.toggleSearch) dom.toggleSearch.addEventListener('change', (e) => { settings.showSearch = e.target.checked; saveSettings(); });
    if (dom.toggleTopSites) dom.toggleTopSites.addEventListener('change', (e) => { settings.showTopSites = e.target.checked; saveSettings(); });
    if (dom.toggleClock) dom.toggleClock.addEventListener('change', (e) => { settings.showClock = e.target.checked; saveSettings(); });
    if (dom.clockFormatSelect) dom.clockFormatSelect.addEventListener('change', (e) => { settings.clockFormat = e.target.value; saveSettings(); });
    if (dom.toggleCards) dom.toggleCards.addEventListener('change', (e) => { settings.showCards = e.target.checked; saveSettings(); });

    // Shortcuts
    if (dom.addShortcutBtn) {
        dom.addShortcutBtn.addEventListener('click', () => {
            const name = dom.newShortcutName.value.trim();
            let url = dom.newShortcutUrl.value.trim();
            if (name && url) {
                if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
                let icon = '';
                try { icon = `${new URL(url).origin}/favicon.ico`; } catch(e){}
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
        let ampm = '';
        
        if (!use24h) {
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
        } else {
            hours = hours < 10 ? '0' + hours : hours;
        }
        
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        const formatted = use24h ? `${hours}:${minutes}` : `${hours}:${minutes}<span class="ampm">${ampm}</span>`;
        
        // Only trigger DOM reflow if the minute actually changed
        if (formatted !== lastRenderedTime) {
            dom.timeEl.innerHTML = formatted;
            lastRenderedTime = formatted;
        }
    }

    // --- Initialization ---
    CanvasEngine.init(dom.canvasLayer);
    UIPhysicsEngine.init();
    renderGallery();
    applySettings();
    updateTime();
    setInterval(updateTime, 1000);
    if (settings.showSearch && dom.searchInput) dom.searchInput.focus();
})();

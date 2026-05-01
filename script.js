(function () {
    'use strict';
    const urlParams = new URLSearchParams(window.location.search);
    const noRedirect = urlParams.has('no_redirect');
    const autoOpenSettings = urlParams.has('settings');

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
            const request = indexedDB.open('ProductivityHubDB', 4);
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
            // Store the file object directly. IndexedDB supports Blobs and Files.
            const request = store.put({ id: 'local_bg', data: file, type: file.type, name: file.name, timestamp: Date.now() });
            request.onsuccess = () => resolve(file);
            request.onerror = () => reject('Save error');
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
        backgroundType: 'solid',
        backgroundValue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        showSearch: true,
        searchEngine: 'google',
        showTopSites: true,
        topSitesSource: 'favorites',
        shortcuts: [],
        videoMuted: true,
        showClock: true,
        clockFormat: 'auto',
        showCards: true,
        showCardDate: true,
        showCardFocus: true,
        showCardNote: true,
        showMainUI: true,
        customSearchUrl: 'https://www.google.com/search?q=%s',
        ambientSound: 'none',
        ambientVolume: 50,
        dashboardTitle: 'Dashboard'
    };

    let settings = { ...defaultSettings };
    // --- Sync Settings for Background Script ---
    try {
        const stored = localStorage.getItem('raeen_dashboard_settings');
        if (stored) {
            settings = { ...settings, ...JSON.parse(stored) };
            // Push to chrome storage so background script can see it immediately
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({ 'raeen_dashboard_settings': settings });
            }
        }
    } catch (e) { }

    // --- NO REDIRECT (IFRAME MODE) ---
    // Instead of redirecting the whole window, we stay on index.html 
    // to keep the address bar clean (empty).

    function saveSettings(noApply = false) {
        try { localStorage.setItem('raeen_dashboard_settings', JSON.stringify(settings)); } catch (e) { }
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ 'raeen_dashboard_settings': settings });
        }
        if (!noApply) applySettings();
    }

    // --- Search Engines ---
    const engines = {
        'google': { action: 'https://www.google.com/search', param: 'q' },
        'duckduckgo': { action: 'https://duckduckgo.com/', param: 'q' },
        'brave': { action: 'https://search.brave.com/search', param: 'q' },
        'bing': { action: 'https://www.bing.com/search', param: 'q' },
        'chatgpt': { action: 'https://chatgpt.com/?q=', param: 'q' },
        'perplexity': { action: 'https://www.perplexity.ai/search?q=', param: 'q' },
        'custom_engine': { action: '', param: '' }
    };

    // --- DOM Elements Cache ---
    const dom = {
        bgLayer: document.getElementById('background-layer'),
        clockWidget: document.getElementById('clock-widget'),
        timeEl: document.getElementById('time'),
        searchWidget: document.getElementById('search-widget'),
        topSitesWidget: document.getElementById('top-sites-widget'),
        cardsWidget: document.getElementById('cards-widget'),
        cardDateEl: document.getElementById('card-date'),
        cardFocusEl: document.getElementById('card-focus'),
        cardNoteEl: document.getElementById('notes-panel'),
        notesEmpty: document.getElementById('notes-empty'),
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
        bgSolidOptions: document.getElementById('bg-solid-options'),
        bgColorPicker: document.getElementById('bg-color-picker'),
        colorSwatches: document.querySelectorAll('.color-swatch'),
        bgLocalOptions: document.getElementById('bg-local-options'),
        bgLocalFile: document.getElementById('bg-local-file'),
        dashboardTitleInput: document.getElementById('dashboard-title-input'),
        pageTitle: document.getElementById('page-title'),
        modalHeaderTitle: document.querySelector('.modal-header h2'),
        ambientSoundSelect: document.getElementById('ambient-sound-select'),
        ambientVolume: document.getElementById('ambient-volume'),
        ambientAudio: document.getElementById('ambient-audio'),
        toggleSearch: document.getElementById('toggle-search'),
        engineRadios: document.getElementsByName('search_engine'),
        customSearchUrlInput: document.getElementById('custom-search-url'),
        toggleTopSites: document.getElementById('toggle-topsites'),
        topsitesSourceRadios: document.getElementsByName('topsites_source'),
        toggleClock: document.getElementById('toggle-clock'),
        clockFormatSelect: document.getElementById('clock-format-select'),
        toggleCards: document.getElementById('toggle-cards'),
        toggleCardDate: document.getElementById('toggle-card-date'),
        toggleCardFocus: document.getElementById('toggle-card-focus'),
        toggleCardNote: document.getElementById('toggle-card-note'),
        videoSoundBtn: document.getElementById('video-sound-btn'),
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
        searchProviderIcon: document.getElementById('search-provider-icon'),
        engineFrame: document.getElementById('engine-frame')
    };

    // --- State Tracking ---
    let currentSettingsState = {
        backgroundType: null,
        backgroundValue: null
    };
    let currentBgObjectURL = null;

    function cleanupBackground() {
        if (currentBgObjectURL) {
            URL.revokeObjectURL(currentBgObjectURL);
            currentBgObjectURL = null;
        }
        if (dom.bgLayer) {
            dom.bgLayer.innerHTML = '';
            dom.bgLayer.style.background = '';
            dom.bgLayer.style.backgroundImage = '';
        }
    }

    function applyTheme() {
        const root = document.documentElement;
        if (settings.themePreference === 'light') {
            root.setAttribute('data-theme', 'light');
        } else if (settings.themePreference === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }
    }

    async function applySettings() {
        applyTheme();
        const t = settings.backgroundType;
        const v = settings.backgroundValue;

        // No-Redirect Iframe Logic
        if (!noRedirect && (t === 'google' || t === 'bing')) {
            const frameUrl = t === 'google'
                ? "https://www.google.com/webhp?raeen_dashboard=true"
                : "https://www.bing.com/?raeen_dashboard=true";

            if (dom.engineFrame) {
                if (dom.engineFrame.src !== frameUrl) dom.engineFrame.src = frameUrl;
                dom.engineFrame.classList.remove('hidden');
                // Optionally hide dashboard UI to make it feel like the real site
                if (dom.searchWidget) dom.searchWidget.classList.add('hidden');
                if (dom.topSitesWidget) dom.topSitesWidget.classList.add('hidden');
                if (dom.clockWidget) dom.clockWidget.classList.add('hidden');
                if (dom.cardsWidget) dom.cardsWidget.classList.add('hidden');
            }
            return;
        } else {
            if (dom.engineFrame) {
                dom.engineFrame.classList.add('hidden');
                dom.engineFrame.src = 'about:blank';
            }
        }

        // Only update background if it changed
        if (currentSettingsState.backgroundType !== t || currentSettingsState.backgroundValue !== v) {
            cleanupBackground();
            currentSettingsState.backgroundType = t;
            currentSettingsState.backgroundValue = v;

            if (t === 'solid') {
                dom.bgLayer.style.background = v;
            } else if (t === 'google') {
                // Dashboard fallback for Google theme
                dom.bgLayer.style.background = 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f17 100%)';
            } else if (t === 'bing') {
                // Dashboard fallback for Bing theme
                dom.bgLayer.style.background = 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)';
            } else if (t === 'local') {
                const media = await getMedia();
                if (media && media.data) {
                    currentBgObjectURL = URL.createObjectURL(media.data);

                    if (media.type.startsWith('video')) {
                        dom.bgLayer.innerHTML = `<video autoplay loop playsinline muted style="width:100%;height:100%;object-fit:cover;pointer-events:none;"></video>`;
                        const video = dom.bgLayer.querySelector('video');
                        video.src = currentBgObjectURL;
                        video.muted = settings.videoMuted;

                        if (dom.videoSoundBtn) {
                            dom.videoSoundBtn.classList.remove('hidden');
                            dom.videoSoundBtn.classList.toggle('muted', settings.videoMuted);
                        }
                    } else {
                        dom.bgLayer.style.backgroundImage = `url('${currentBgObjectURL}')`;
                        dom.bgLayer.style.backgroundSize = 'cover';
                        dom.bgLayer.style.backgroundPosition = 'center';
                        if (dom.videoSoundBtn) dom.videoSoundBtn.classList.add('hidden');
                    }
                } else {
                    console.warn('Local media not found in DB');
                    showToast('Local background not found. Please re-upload.', 'warning');
                    dom.bgLayer.style.background = 'var(--bg-body)';
                }
            } else if (t === 'custom') {
                if (v) {
                    if (v.match(/\.(mp4|webm|ogg)$/i)) {
                        dom.bgLayer.innerHTML = `<video autoplay loop playsinline muted style="width:100%;height:100%;object-fit:cover;pointer-events:none;"><source src="${v}"></video>`;
                        const video = dom.bgLayer.querySelector('video');
                        video.muted = settings.videoMuted;
                        if (dom.videoSoundBtn) {
                            dom.videoSoundBtn.classList.remove('hidden');
                            dom.videoSoundBtn.classList.toggle('muted', settings.videoMuted);
                        }
                    } else {
                        dom.bgLayer.style.backgroundImage = `url('${v}')`;
                        dom.bgLayer.style.backgroundSize = 'cover';
                        dom.bgLayer.style.backgroundPosition = 'center';
                        if (dom.videoSoundBtn) dom.videoSoundBtn.classList.add('hidden');
                    }
                }
            }
        } else {
            // Background didn't change, but video muted state might have
            const video = dom.bgLayer.querySelector('video');
            if (video) {
                video.muted = settings.videoMuted;
                if (dom.videoSoundBtn) dom.videoSoundBtn.classList.toggle('muted', settings.videoMuted);
            }
        }

        // Title Personalization
        if (dom.pageTitle) dom.pageTitle.textContent = settings.dashboardTitle || 'Dashboard';
        if (dom.modalHeaderTitle) dom.modalHeaderTitle.textContent = settings.dashboardTitle || 'Settings';

        // UI Toggles
        if (dom.searchWidget) dom.searchWidget.classList.toggle('hidden', !settings.showSearch);
        if (dom.topSitesWidget) dom.topSitesWidget.classList.toggle('hidden', !settings.showTopSites);
        if (dom.clockWidget) dom.clockWidget.classList.toggle('hidden', !settings.showClock);
        if (dom.cardsWidget) {
            const hasAnyCard = settings.showCardDate || settings.showCardFocus || settings.showCardNote;
            dom.cardsWidget.classList.toggle('hidden', !settings.showCards || !hasAnyCard);
        }

        // Individual Card Toggles
        if (dom.cardDateEl) dom.cardDateEl.classList.toggle('hidden', !settings.showCardDate);
        if (dom.cardFocusEl) dom.cardFocusEl.classList.toggle('hidden', !settings.showCardFocus);
        if (dom.cardNoteEl) dom.cardNoteEl.classList.toggle('hidden', !settings.showCardNote);

        syncModalUI();
        renderTopSites();
        updateTime();
        updateSearchUI();

        if (dom.modalOverlay && autoOpenSettings && !window.settingsOpenedOnce) {
            window.settingsOpenedOnce = true;
            dom.modalOverlay.classList.remove('hidden');
        }

        // Reveal the dashboard once settings are applied
        document.documentElement.style.backgroundColor = '';
        if (document.body) {
            document.body.style.visibility = 'visible';
            document.body.style.opacity = '1';
        }
    }

    function syncModalUI() {
        if (dom.bgTypeSelect) {
            dom.bgTypeSelect.value = settings.backgroundType;
            const t = settings.backgroundType;
            if (dom.bgSolidOptions) dom.bgSolidOptions.classList.toggle('hidden', t !== 'solid');
            if (dom.bgLocalOptions) dom.bgLocalOptions.classList.toggle('hidden', t !== 'local');
        }
        if (dom.ambientSoundSelect) dom.ambientSoundSelect.value = settings.ambientSound || 'none';
        if (dom.ambientVolume) dom.ambientVolume.value = settings.ambientVolume || 50;

        if (dom.showMainUIToggle) dom.showMainUIToggle.checked = settings.showMainUI;
        if (dom.toggleSearch) dom.toggleSearch.checked = settings.showSearch;
        if (dom.toggleTopSites) dom.toggleTopSites.checked = settings.showTopSites;
        if (dom.toggleCards) dom.toggleCards.checked = settings.showCards;
        if (dom.toggleCardDate) dom.toggleCardDate.checked = settings.showCardDate;
        if (dom.toggleCardFocus) dom.toggleCardFocus.checked = settings.showCardFocus;
        if (dom.toggleCardNote) dom.toggleCardNote.checked = settings.showCardNote;
        if (dom.toggleClock) dom.toggleClock.checked = settings.showClock;
        if (dom.dashboardTitleInput) dom.dashboardTitleInput.value = settings.dashboardTitle || '';

        if (dom.themeRadios) {
            dom.themeRadios.forEach(r => {
                r.checked = (r.value === settings.themePreference);
            });
        }
        if (dom.engineRadios) {
            dom.engineRadios.forEach(r => {
                r.checked = (r.value === settings.searchEngine);
            });
        }
        if (dom.topsitesSourceRadios) {
            dom.topsitesSourceRadios.forEach(r => {
                r.checked = (r.value === settings.topSitesSource);
            });
        }
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
                    dom.searchSuggestions.innerHTML = suggestions.map((s, i) => `<li class="suggestion-item" data-text="${s.replace(/"/g, '&quot;')}" style="--item-index: ${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><span>${s}</span></li>`).join('');
                    dom.searchSuggestions.classList.remove('hidden');
                } catch (err) { }
            }, 150);
        });

        if (dom.searchSuggestions) {
            dom.searchSuggestions.addEventListener('click', (e) => {
                const item = e.target.closest('.suggestion-item');
                if (item) {
                    dom.searchInput.value = item.dataset.text;
                    dom.searchSuggestions.classList.add('hidden');
                    dom.searchForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            });
        }
    }
    if (dom.searchForm) {
        dom.searchForm.addEventListener('submit', (e) => {
            const engine = settings.searchEngine;

            if (engine === 'custom_engine') {
                e.preventDefault();
                const q = dom.searchInput.value;
                if (!q) return;
                const url = settings.customSearchUrl.replace('%s', encodeURIComponent(q));
                window.location.href = url;
            } else if (engines[engine]) {
                dom.searchForm.action = engines[engine].action;
                dom.searchInput.name = engines[engine].param;
            } else {
                dom.searchForm.action = engines['google'].action;
                dom.searchInput.name = engines['google'].param;
            }
        });
    }

    function updateSearchUI() {
        if (!dom.searchInput || !dom.searchProviderIcon) return;
        const engine = settings.searchEngine;

        // Update Placeholder
        const engineName = engine.charAt(0).toUpperCase() + engine.slice(1);
        dom.searchInput.placeholder = `Search with ${engineName}...`;

        // Update Icon (Simple paths for common engines)
        if (engine === 'google') {
            dom.searchProviderIcon.innerHTML = `<path d="M12.48 10.92v3.28h4.74c-.18 1.1-.9 2.03-2.03 2.75v2.28h3.3c2.04-1.88 3.23-4.66 3.23-7.98 0-.8-.08-1.58-.22-2.33h-6.27z" fill="#4285F4"/><path d="M12.48 21c1.88 0 3.46-.62 4.62-1.7l-3.3-2.28c-1 .67-2.28 1.07-3.8 1.07-2.92 0-5.4-1.98-6.28-4.64H.44v2.4C1.6 18.2 4.8 21 12.48 21z" fill="#34A853"/><path d="M6.2 13.45c-.22-.67-.35-1.38-.35-2.13s.13-1.46.35-2.13V6.79H.44C-.16 8.04-.5 9.42-.5 11s.34 2.96.94 4.21l5.76-1.76z" fill="#FBBC05"/><path d="M12.48 5.86c1.64 0 3.12.56 4.28 1.66l3.2-3.2C17.94 2.34 15.44 1 12.48 1 4.8 1 1.6 3.8.44 6.79l5.76 1.76c.88-2.66 3.36-4.64 6.28-4.64z" fill="#EA4335"/>`;
            dom.searchProviderIcon.setAttribute('viewBox', '0 0 24 24');
        } else if (engine === 'bing') {
            dom.searchProviderIcon.innerHTML = `<path d="M10 2L4 4.5V17.5L10 22L16 17.5V10L10 12.5V7L13.5 8.5L14.5 7.5L10 4V2Z" fill="#00a1f1"/>`;
            dom.searchProviderIcon.setAttribute('viewBox', '0 0 24 24');
        } else {
            // Default magnifying glass
            dom.searchProviderIcon.innerHTML = `<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>`;
            dom.searchProviderIcon.setAttribute('viewBox', '0 0 24 24');
        }
    }

    // --- Top Sites Render ---
    function renderTopSites() {
        if (!dom.topSitesWidget) return;
        dom.topSitesWidget.innerHTML = '';

        if (settings.topSitesSource === 'frequently_visited' && typeof chrome !== 'undefined' && chrome.topSites) {
            chrome.topSites.get(sites => {
                const limit = sites.slice(0, 10);
                dom.topSitesWidget.innerHTML = limit.map((sc, i) => `
                    <a href="${sc.url}" class="shortcut" style="--item-index: ${i}">
                        <img src="https://www.google.com/s2/favicons?domain=${sc.url}&sz=128"><span>${sc.title || sc.url}</span>
                    </a>
                `).join('');
            });
        } else {
            settings.shortcuts.forEach((sc, i) => {
                const a = document.createElement('a'); a.href = sc.url; a.className = 'shortcut'; a.style.setProperty('--item-index', i);
                a.innerHTML = `<img src="${sc.icon || 'https://www.google.com/s2/favicons?domain=' + sc.url + '&sz=128'}"><span>${sc.name}</span>`;
                dom.topSitesWidget.appendChild(a);
            });
        }

        // Also render settings list
        if (dom.shortcutsList) {
            dom.shortcutsList.innerHTML = settings.shortcuts.map((sc, i) => `
                <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 4px; align-items: center;">
                    <div style="display: flex; flex-direction: column; overflow: hidden;">
                        <span style="font-weight: 500;">${sc.name}</span>
                        <span style="font-size: 0.75rem; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sc.url}</span>
                    </div>
                    <button class="remove-sc-btn" data-index="${i}" style="background: var(--danger); color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">Remove</button>
                </div>
            `).join('');
            document.querySelectorAll('.remove-sc-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    settings.shortcuts.splice(e.target.dataset.index, 1);
                    saveSettings();
                });
            });
        }
    }

    if (dom.addShortcutBtn) {
        dom.addShortcutBtn.addEventListener('click', () => {
            const name = dom.newShortcutName.value.trim();
            const url = dom.newShortcutUrl.value.trim();
            if (name && url) {
                settings.shortcuts.push({ name, url });
                dom.newShortcutName.value = '';
                dom.newShortcutUrl.value = '';
                saveSettings();
            }
        });
    }

    if (dom.topsitesSourceRadios) {
        dom.topsitesSourceRadios.forEach(r => r.addEventListener('change', (e) => {
            settings.topSitesSource = e.target.value;
            saveSettings();
        }));
    }

    if (dom.dashboardTitleInput) dom.dashboardTitleInput.addEventListener('input', (e) => {
        settings.dashboardTitle = e.target.value.trim() || 'Dashboard';
        saveSettings();
    });

    if (dom.bgTypeSelect) dom.bgTypeSelect.addEventListener('change', (e) => {
        settings.backgroundType = e.target.value;
        saveSettings();
        // Logic handled in applySettings via Iframe
    });
    if (dom.bgLocalFile) dom.bgLocalFile.addEventListener('change', async (e) => {
        if (e.target.files[0]) {
            await saveMedia(e.target.files[0]);
            settings.backgroundType = 'local';
            settings.backgroundValue = 'local_bg';
            saveSettings();
        }
    });
    if (dom.ambientSoundSelect) dom.ambientSoundSelect.addEventListener('change', (e) => { settings.ambientSound = e.target.value; saveSettings(); });
    if (dom.ambientVolume) dom.ambientVolume.addEventListener('input', (e) => { settings.ambientVolume = e.target.value; saveSettings(); });
    if (dom.showMainUIToggle) dom.showMainUIToggle.addEventListener('change', (e) => { settings.showMainUI = e.target.checked; saveSettings(); });
    if (dom.toggleCards) dom.toggleCards.addEventListener('change', (e) => { settings.showCards = e.target.checked; saveSettings(); });
    if (dom.toggleCardDate) dom.toggleCardDate.addEventListener('change', (e) => { settings.showCardDate = e.target.checked; saveSettings(); });
    if (dom.toggleCardFocus) dom.toggleCardFocus.addEventListener('change', (e) => { settings.showCardFocus = e.target.checked; saveSettings(); });
    if (dom.toggleCardNote) dom.toggleCardNote.addEventListener('change', (e) => { settings.showCardNote = e.target.checked; saveSettings(); });
    if (dom.toggleClock) dom.toggleClock.addEventListener('change', (e) => { settings.showClock = e.target.checked; saveSettings(); });
    if (dom.clockFormatSelect) dom.clockFormatSelect.addEventListener('change', (e) => { settings.clockFormat = e.target.value; saveSettings(); });
    if (dom.customSearchUrlInput) dom.customSearchUrlInput.addEventListener('input', (e) => { settings.customSearchUrl = e.target.value; saveSettings(); });
    if (dom.engineRadios) dom.engineRadios.forEach(r => r.addEventListener('change', (e) => { settings.searchEngine = e.target.value; saveSettings(); updateSearchUI(); }));
    if (dom.toggleSearch) dom.toggleSearch.addEventListener('change', (e) => { settings.showSearch = e.target.checked; saveSettings(); });
    if (dom.toggleTopSites) dom.toggleTopSites.addEventListener('change', (e) => { settings.showTopSites = e.target.checked; saveSettings(); });
    if (dom.themeRadios) dom.themeRadios.forEach(r => r.addEventListener('change', (e) => { settings.themePreference = e.target.value; saveSettings(); }));

    if (dom.videoSoundBtn) {
        dom.videoSoundBtn.addEventListener('click', () => {
            const video = dom.bgLayer.querySelector('video');
            if (video) {
                settings.videoMuted = !settings.videoMuted;
                video.muted = settings.videoMuted;
                dom.videoSoundBtn.classList.toggle('muted', settings.videoMuted);
                const svg = dom.videoSoundBtn.querySelector('svg');
                if (svg) {
                    svg.innerHTML = settings.videoMuted ?
                        '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.05-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l7.73 7.73H7v6h4l5 5v-6.73l4.25 4.25c.67-.64 1.24-1.37 1.7-2.18L5.73 3zM12 4L9.27 6.73 12 9.46V4z"/>' :
                        '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
                }
                saveSettings(true);
            }
        });
    }

    if (dom.colorSwatches) {
        dom.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                settings.backgroundType = 'solid';
                settings.backgroundValue = e.target.dataset.color || e.target.style.background;
                saveSettings();
            });
        });
    }

    if (dom.bgColorPicker) {
        dom.bgColorPicker.addEventListener('input', (e) => {
            settings.backgroundType = 'solid';
            settings.backgroundValue = e.target.value;
            saveSettings();
        });
    }

    // --- Cards Logic ---
    // Focus Timer
    let focusTimeLeft = 25 * 60; // For display
    let focusTimerData = { endTime: 0, pausedLeft: 25 * 60, isRunning: false };
    try {
        const stored = localStorage.getItem('raeen_dashboard_focus');
        if (stored) focusTimerData = JSON.parse(stored);
    } catch (e) { }

    function saveFocusState() {
        try { localStorage.setItem('raeen_dashboard_focus', JSON.stringify(focusTimerData)); } catch (e) { }
    }

    function syncFocusState() {
        if (focusTimerData.isRunning) {
            focusTimeLeft = Math.max(0, Math.floor((focusTimerData.endTime - Date.now()) / 1000));
            if (dom.focusToggleBtn) dom.focusToggleBtn.innerHTML = '⏸ Pause';
        } else {
            focusTimeLeft = focusTimerData.pausedLeft;
            if (dom.focusToggleBtn) dom.focusToggleBtn.innerHTML = '▶ Start';
        }
        updateFocusDisplay();
    }

    function updateFocusDisplay() {
        if (!dom.cardFocusTime) return;
        const m = Math.floor(focusTimeLeft / 60).toString().padStart(2, '0');
        const s = (focusTimeLeft % 60).toString().padStart(2, '0');
        dom.cardFocusTime.textContent = `${m}:${s}`;
    }

    setInterval(() => {
        if (focusTimerData.isRunning) {
            const left = Math.floor((focusTimerData.endTime - Date.now()) / 1000);
            if (left >= 0) {
                focusTimeLeft = left;
                updateFocusDisplay();
            } else {
                focusTimerData.isRunning = false;
                focusTimerData.pausedLeft = 25 * 60;
                saveFocusState();
                syncFocusState();
                showToast('Focus session complete!', 'success');
            }
        }
    }, 1000);

    if (dom.focusToggleBtn) {
        dom.focusToggleBtn.addEventListener('click', () => {
            if (focusTimerData.isRunning) {
                focusTimerData.pausedLeft = focusTimeLeft;
                focusTimerData.isRunning = false;
            } else {
                focusTimerData.endTime = Date.now() + focusTimerData.pausedLeft * 1000;
                focusTimerData.isRunning = true;
            }
            saveFocusState();
            syncFocusState();
        });
    }

    if (dom.focusResetBtn) {
        dom.focusResetBtn.addEventListener('click', () => {
            focusTimerData.isRunning = false;
            focusTimerData.pausedLeft = 25 * 60;
            saveFocusState();
            syncFocusState();
        });
    }
    syncFocusState();

    // Notes
    let notes = [];
    try {
        const storedNotes = localStorage.getItem('raeen_dashboard_notes');
        if (storedNotes) notes = JSON.parse(storedNotes);
    } catch (e) { }

    let currentEditingNoteId = null;

    function saveNotes(noRender = false) {
        try { localStorage.setItem('raeen_dashboard_notes', JSON.stringify(notes)); } catch (e) { }
        if (!noRender) renderNotes();
    }

    function renderNotes() {
        if (!dom.notesList || !dom.notesCount) return;
        dom.notesCount.textContent = notes.length;

        if (notes.length === 0) {
            dom.notesList.classList.add('hidden');
            if (dom.notesEmpty) dom.notesEmpty.classList.remove('hidden');
        } else {
            dom.notesList.classList.remove('hidden');
            if (dom.notesEmpty) dom.notesEmpty.classList.add('hidden');
            dom.notesList.innerHTML = notes.sort((a, b) => (b.date || 0) - (a.date || 0)).map(n => {
                const dateStr = n.date ? new Date(n.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
                return `
                    <div class="note-card" data-id="${n.id}">
                        <div class="note-card-title">${n.title || 'Untitled'}</div>
                        <div class="note-card-preview">${n.body || ''}</div>
                        <div class="note-card-meta">${dateStr}</div>
                    </div>
                `;
            }).join('');

            document.querySelectorAll('.note-card').forEach(el => {
                el.addEventListener('click', () => openNoteEditor(el.dataset.id));
            });
        }
    }

    function openNoteEditor(id) {
        const note = notes.find(n => n.id === id);
        if (!note) return;
        currentEditingNoteId = id;
        dom.noteEditorTitle.value = note.title;
        dom.noteEditorBody.value = note.body;
        updateNoteCharCount();
        dom.notesList.classList.add('hidden');
        dom.noteEditor.classList.remove('hidden');
    }

    function closeNoteEditor() {
        currentEditingNoteId = null;
        dom.noteEditor.classList.add('hidden');
        dom.notesList.classList.remove('hidden');
        renderNotes();
    }

    function updateNoteCharCount() {
        if (dom.noteCharCount) dom.noteCharCount.textContent = `${dom.noteEditorBody.value.length} characters`;
    }

    if (dom.addNoteBtn) {
        dom.addNoteBtn.addEventListener('click', () => {
            const newNote = { id: Date.now().toString(), title: '', body: '', date: Date.now() };
            notes.unshift(newNote);
            saveNotes();
            openNoteEditor(newNote.id);
        });
    }

    if (dom.noteBackBtn) {
        dom.noteBackBtn.addEventListener('click', closeNoteEditor);
    }

    if (dom.noteDeleteBtn) {
        dom.noteDeleteBtn.addEventListener('click', () => {
            notes = notes.filter(n => n.id !== currentEditingNoteId);
            saveNotes();
            closeNoteEditor();
        });
    }

    function saveCurrentNote() {
        if (!currentEditingNoteId) return;
        const note = notes.find(n => n.id === currentEditingNoteId);
        if (note) {
            note.title = dom.noteEditorTitle.value;
            note.body = dom.noteEditorBody.value;
            note.date = Date.now();
            saveNotes(true); // Don't re-render list while typing
            if (dom.noteSaveStatus) {
                dom.noteSaveStatus.textContent = 'Saving...';
                dom.noteSaveStatus.style.opacity = '1';
                setTimeout(() => { if (dom.noteSaveStatus) dom.noteSaveStatus.textContent = 'Saved'; }, 500);
            }
        }
    }

    if (dom.noteEditorTitle) dom.noteEditorTitle.addEventListener('input', saveCurrentNote);
    if (dom.noteEditorBody) {
        dom.noteEditorBody.addEventListener('input', () => {
            updateNoteCharCount();
            saveCurrentNote();
        });
    }

    renderNotes();

    // --- Time & Date ---
    function updateTime() {
        const now = new Date();
        if (dom.timeEl) {
            let use12h = settings.clockFormat === '12h';
            if (settings.clockFormat === 'auto') {
                use12h = new Intl.DateTimeFormat('default', { hour: 'numeric' }).resolvedOptions().hour12;
            }
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: use12h
            };
            let timeStr = now.toLocaleTimeString([], options);

            // CLEAN TIME: Remove any AM/PM and ensure HH:MM format
            timeStr = timeStr.replace(/\s?[AP]M/i, '').trim();
            const parts = timeStr.split(':');
            if (parts.length >= 2) timeStr = `${parts[0].padStart(2, '0')}:${parts[1]}`;

            dom.timeEl.textContent = timeStr;
        }
        if (dom.cardDateValue && dom.cardDateDay) {
            dom.cardDateValue.textContent = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
            dom.cardDateDay.textContent = now.toLocaleDateString([], { weekday: 'long' });
        }
    }

    // --- Init ---
    initDB().then(() => {
        applySettings();
        // Reveal immediately after settings are applied
        document.documentElement.style.backgroundColor = '';
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';

        updateTime();
        setInterval(updateTime, 1000);
    });

    // Handle Audio Autoplay block
    let audioInteractionDone = false;
    document.addEventListener('click', () => {
        if (!audioInteractionDone && settings.ambientSound !== 'none' && dom.ambientAudio.paused) {
            dom.ambientAudio.play().catch(() => { });
        }
        audioInteractionDone = true;
    }, { once: true });

    // Modal tabs
    if (dom.sidebarTabs) {
        dom.sidebarTabs.forEach(tab => tab.addEventListener('click', () => {
            dom.sidebarTabs.forEach(t => t.classList.remove('active')); dom.tabPanes.forEach(p => p.classList.remove('active'));
            tab.classList.add('active'); document.getElementById(tab.dataset.target).classList.add('active');
        }));
    }
    if (dom.settingsBtn) dom.settingsBtn.addEventListener('click', () => dom.modalOverlay.classList.remove('hidden'));
    if (dom.closeBtn) dom.closeBtn.addEventListener('click', () => dom.modalOverlay.classList.add('hidden'));

    // Cross-tab Synchronization
    window.addEventListener('storage', (e) => {
        if (e.key === 'raeen_dashboard_settings') {
            try {
                settings = { ...settings, ...JSON.parse(e.newValue) };
                applySettings();
                updateTime();
            } catch (err) { }
        } else if (e.key === 'raeen_dashboard_notes') {
            try {
                notes = JSON.parse(e.newValue) || [];
                if (!currentEditingNoteId) renderNotes();
            } catch (err) { }
        } else if (e.key === 'raeen_dashboard_focus') {
            try {
                focusTimerData = JSON.parse(e.newValue);
                syncFocusState();
            } catch (err) { }
        }
    });

})();

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

    // --- State Management ---
    const defaultSettings = {
        themePreference: 'system',
        backgroundType: 'bing',
        backgroundValue: 'bing_latest',
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
        bgBingOptions: document.getElementById('bg-bing-options'),
        bgSolidOptions: document.getElementById('bg-solid-options'),
        bgColorPicker: document.getElementById('bg-color-picker'),
        colorSwatches: document.querySelectorAll('.color-swatch'),
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
        appIconInput: document.getElementById('app-icon'),
        customSearchUrlInput: document.getElementById('custom-search-url')
    };

    // --- Render Top Sites ---
    function renderTopSites() {
        if(!dom.topSitesWidget || !dom.shortcutsList) return;
        dom.shortcutsList.innerHTML = '';
        settings.shortcuts.forEach((sc, index) => {
            const div = document.createElement('div');
            div.className = 'managed-item';
            div.innerHTML = `<div><strong>${sc.name}</strong><span>${sc.url}</span></div><div class="managed-item-actions"><button data-index="${index}">Remove</button></div>`;
            dom.shortcutsList.appendChild(div);
        });

        dom.topSitesWidget.innerHTML = '';
        const getDomain = (urlStr) => { try { return new URL(urlStr).hostname; } catch(e) { return urlStr; } };
        const renderShortcut = (sc, index = 0) => {
            const a = document.createElement('a');
            a.href = sc.url; a.className = 'shortcut'; a.style.setProperty('--item-index', index);
            const img = document.createElement('img');
            const primaryUrl = sc.icon || `https://icon.horse/icon/${getDomain(sc.url)}`;
            const fallbackUrl = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(sc.url)}&sz=128`;
            img.src = primaryUrl; img.alt = sc.name;
            img.onerror = () => { if (img.src === primaryUrl) img.src = fallbackUrl; else { img.style.display='none'; a.prepend(createIconPlaceholder(sc.name)); } };
            a.appendChild(img);
            const span = document.createElement('span'); span.textContent = sc.name; a.appendChild(span);
            dom.topSitesWidget.appendChild(a);
        };

        if (settings.topSitesSource === 'favorites') {
            settings.shortcuts.forEach((sc, index) => renderShortcut(sc, index));
        } else if (typeof chrome !== 'undefined' && chrome.topSites) {
            chrome.topSites.get((topSites) => {
                const existingUrls = new Set(settings.shortcuts.map(s => s.url.replace(/\/$/, '')));
                topSites.slice(0, 24).forEach((site, i) => {
                    if (!existingUrls.has(site.url.replace(/\/$/, ''))) {
                        renderShortcut({ name: site.title || site.url, url: site.url, icon: '' }, i);
                    }
                });
            });
        }
    }

    function createIconPlaceholder(name) {
        const div = document.createElement('div');
        div.className = 'icon-placeholder';
        div.textContent = name.charAt(0).toUpperCase();
        return div;
    }

    // --- Core Logic ---
    function applyTheme() {
        const root = document.documentElement;
        if (settings.themePreference === 'light') root.setAttribute('data-theme', 'light');
        else if (settings.themePreference === 'dark') root.removeAttribute('data-theme');
        else root.toggleAttribute('data-theme', window.matchMedia('(prefers-color-scheme: light)').matches);
    }

    function applySettings() {
        applyTheme();
        const t = settings.backgroundType;
        if (dom.bgLayer) {
            dom.bgLayer.innerHTML = '';
            const applyBg = (url) => { dom.bgLayer.style.backgroundImage = `url('${url}')`; dom.bgLayer.style.backgroundRepeat = 'no-repeat'; dom.bgLayer.style.backgroundPosition = 'center'; dom.bgLayer.style.backgroundSize = 'cover'; };
            if (t === 'bing') {
                const lang = navigator.language || 'en-US';
                const todayStr = new Date().toISOString().split('T')[0];
                applyBg(`https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=${lang}&cb=${todayStr}`);
            } else if (t === 'solid') {
                dom.bgLayer.style.background = settings.backgroundValue;
            }
        }

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
            if(dom.bgBingOptions) dom.bgBingOptions.classList.toggle('hidden', t !== 'bing');
            if(dom.bgSolidOptions) dom.bgSolidOptions.classList.toggle('hidden', t !== 'solid');
            if(dom.bgColorPicker) dom.bgColorPicker.value = settings.backgroundValue.startsWith('#') ? settings.backgroundValue.substring(0,7) : '#1a1a2e';
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

        if (dom.showMainUIToggle) dom.showMainUIToggle.checked = settings.showMainUI;
        [dom.searchWidget, dom.topSitesWidget, dom.cardsWidget, dom.clockWidget].forEach(el => { if (el) el.classList.toggle('immersive-hidden', !settings.showMainUI); });
        document.body.classList.toggle('immersive-mode', !settings.showMainUI);
        if (dom.customSearchUrlInput) dom.customSearchUrlInput.value = settings.customSearchUrl || '';
    }

    // --- Search Logic ---
    if (dom.searchForm && dom.searchInput) {
        dom.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = dom.searchInput.value.trim();
            if (!query) return;
            const engine = engines[settings.searchEngine] || engines['google'];
            const url = settings.searchEngine === 'custom_engine' ? (settings.customSearchUrl || '').replace('%s', encodeURIComponent(query)) : `${engine.action}${engine.action.includes('?') ? '&' : '?'}${engine.param || 'q'}=${encodeURIComponent(query)}`;
            window.location.href = url;
        });

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

        document.addEventListener('click', (e) => { if (dom.searchSuggestions && !dom.searchForm.contains(e.target)) dom.searchSuggestions.classList.add('hidden'); });
        dom.searchInput.addEventListener('focus', () => { if (dom.searchSuggestions && dom.searchSuggestions.innerHTML.trim() !== '') dom.searchSuggestions.classList.remove('hidden'); });
        if (dom.searchSuggestions) {
            dom.searchSuggestions.addEventListener('click', (e) => {
                const item = e.target.closest('.suggestion-item');
                if (item) { dom.searchInput.value = item.dataset.text; dom.searchSuggestions.classList.add('hidden'); dom.searchForm.dispatchEvent(new Event('submit')); }
            });
        }
    }

    // --- Settings Modal ---
    if (dom.settingsBtn && dom.modalOverlay) {
        dom.settingsBtn.addEventListener('click', () => dom.modalOverlay.classList.remove('hidden'));
        if(dom.closeBtn) dom.closeBtn.addEventListener('click', () => dom.modalOverlay.classList.add('hidden'));
    }
    if (dom.modalOverlay) dom.modalOverlay.addEventListener('click', (e) => { if (e.target === dom.modalOverlay) dom.modalOverlay.classList.add('hidden'); });
    if (dom.sidebarTabs) {
        dom.sidebarTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                dom.sidebarTabs.forEach(t => t.classList.remove('active')); dom.tabPanes.forEach(p => p.classList.remove('active'));
                tab.classList.add('active'); const target = document.getElementById(tab.dataset.target); if(target) target.classList.add('active');
            });
        });
    }

    // Bindings
    if (dom.themeRadios) Array.from(dom.themeRadios).forEach(r => r.addEventListener('change', (e) => { if(e.target.checked) { settings.themePreference = e.target.value; saveSettings(); } }));
    if (dom.engineRadios) Array.from(dom.engineRadios).forEach(r => r.addEventListener('change', (e) => { if(e.target.checked) { settings.searchEngine = e.target.value; saveSettings(); } }));
    if (dom.topsitesSourceRadios) Array.from(dom.topsitesSourceRadios).forEach(r => r.addEventListener('change', (e) => { if(e.target.checked) { settings.topSitesSource = e.target.value; saveSettings(); } }));
    if (dom.bgTypeSelect) dom.bgTypeSelect.addEventListener('change', (e) => { settings.backgroundType = e.target.value; saveSettings(); });
    if (dom.colorSwatches) dom.colorSwatches.forEach(s => s.addEventListener('click', () => { settings.backgroundType = 'solid'; settings.backgroundValue = s.dataset.color; saveSettings(); }));
    if (dom.bgColorPicker) dom.bgColorPicker.addEventListener('input', (e) => { settings.backgroundType = 'solid'; settings.backgroundValue = e.target.value; saveSettings(); });
    if (dom.toggleSearch) dom.toggleSearch.addEventListener('change', (e) => { settings.showSearch = e.target.checked; saveSettings(); });
    if (dom.toggleTopSites) dom.toggleTopSites.addEventListener('change', (e) => { settings.showTopSites = e.target.checked; saveSettings(); });
    if (dom.toggleClock) dom.toggleClock.addEventListener('change', (e) => { settings.showClock = e.target.checked; saveSettings(); });
    if (dom.showMainUIToggle) dom.showMainUIToggle.addEventListener('change', (e) => { settings.showMainUI = e.target.checked; saveSettings(); });
    if (dom.clockFormatSelect) dom.clockFormatSelect.addEventListener('change', (e) => { settings.clockFormat = e.target.value; saveSettings(); });
    if (dom.toggleCards) dom.toggleCards.addEventListener('change', (e) => { settings.showCards = e.target.checked; saveSettings(); });
    if (dom.toggleCardDate) dom.toggleCardDate.addEventListener('change', (e) => { settings.showCardDate = e.target.checked; saveSettings(); });
    if (dom.toggleCardFocus) dom.toggleCardFocus.addEventListener('change', (e) => { settings.showCardFocus = e.target.checked; saveSettings(); });
    if (dom.toggleCardNote) dom.toggleCardNote.addEventListener('change', (e) => { settings.showCardNote = e.target.checked; saveSettings(); });
    if (dom.customSearchUrlInput) dom.customSearchUrlInput.addEventListener('change', (e) => { settings.customSearchUrl = e.target.value; saveSettings(); });

    if (dom.addShortcutBtn) {
        dom.addShortcutBtn.addEventListener('click', () => {
            const name = dom.newShortcutName.value.trim(), url = dom.newShortcutUrl.value.trim();
            if (name && url) {
                const cleanUrl = url.match(/^https?:\/\//i) ? url : 'http://' + url;
                settings.shortcuts.push({ name, url: cleanUrl, icon: '' });
                dom.newShortcutName.value = ''; dom.newShortcutUrl.value = ''; saveSettings();
            }
        });
    }
    if (dom.shortcutsList) dom.shortcutsList.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') { settings.shortcuts.splice(parseInt(e.target.dataset.index, 10), 1); saveSettings(); } });

    // --- Time ---
    function updateTime() {
        if (!dom.timeEl || !settings.showClock) return;
        const now = new Date();
        let h = now.getHours(), m = now.getMinutes();
        if (settings.clockFormat !== '24h') { h = h % 12 || 12; } else { h = h < 10 ? '0' + h : h; }
        dom.timeEl.textContent = `${h}:${m < 10 ? '0' + m : m}`;
    }

    // --- Date Card ---
    function updateDateCard() {
        if (!dom.cardDateValue) return;
        const now = new Date();
        dom.cardDateValue.textContent = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]} ${now.getDate()}`;
        if (dom.cardDateDay) dom.cardDateDay.textContent = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
    }

    // --- Focus Timer ---
    const FOCUS_KEY = 'abdus_focus_timer';
    function getFocusState() { try { return JSON.parse(localStorage.getItem(FOCUS_KEY)); } catch(e) { return null; } }
    function renderFocusUI() {
        if (!dom.cardFocusTime || !dom.focusToggleBtn) return;
        const state = getFocusState();
        if (!state) { dom.cardFocusTime.textContent = '25:00'; dom.focusToggleBtn.textContent = '▶ Start'; return; }
        const sec = state.running ? Math.max(0, Math.round((state.endTime - Date.now()) / 1000)) : state.remaining;
        const m = Math.floor(sec / 60), s = sec % 60;
        dom.cardFocusTime.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        dom.focusToggleBtn.textContent = state.running ? '⏸ Pause' : '▶ Resume';
        if (sec <= 0 && state.running) localStorage.removeItem(FOCUS_KEY);
    }
    if (dom.focusToggleBtn) dom.focusToggleBtn.addEventListener('click', () => {
        const state = getFocusState();
        if (!state) localStorage.setItem(FOCUS_KEY, JSON.stringify({ running: true, endTime: Date.now() + 1500000 }));
        else if (state.running) localStorage.setItem(FOCUS_KEY, JSON.stringify({ running: false, remaining: Math.round((state.endTime - Date.now()) / 1000) }));
        else localStorage.setItem(FOCUS_KEY, JSON.stringify({ running: true, endTime: Date.now() + state.remaining * 1000 }));
        renderFocusUI();
    });
    if (dom.focusResetBtn) dom.focusResetBtn.addEventListener('click', () => { localStorage.removeItem(FOCUS_KEY); renderFocusUI(); });

    // --- Notes ---
    const NOTES_KEY = 'abdus_notes';
    function getNotes() { try { return JSON.parse(localStorage.getItem(NOTES_KEY)) || []; } catch(e) { return []; } }
    function saveNotes(notes) { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }
    function renderNotesList() {
        if (!dom.notesList) return;
        const notes = getNotes(); dom.notesCount.textContent = notes.length;
        if (!notes.length) { dom.notesList.innerHTML = '<div class="notes-empty">No notes yet</div>'; return; }
        dom.notesList.innerHTML = notes.sort((a,b) => b.updated - a.updated).map(n => `<div class="note-card" data-id="${n.id}"><div class="note-card-title">${n.title || 'Untitled'}</div><div class="note-card-preview">${(n.body || '').substring(0, 50)}</div></div>`).join('');
        dom.notesList.querySelectorAll('.note-card').forEach(c => c.addEventListener('click', () => openNoteEditor(parseInt(c.dataset.id))));
    }
    function openNoteEditor(id) {
        const note = getNotes().find(n => n.id === id); if (!note) return;
        dom.noteEditorTitle.value = note.title; dom.noteEditorBody.value = note.body;
        dom.notesList.classList.add('hidden'); dom.noteEditor.classList.remove('hidden');
        dom.noteEditorBody.focus(); dom.noteEditor.dataset.currentId = id;
    }
    if (dom.addNoteBtn) dom.addNoteBtn.addEventListener('click', () => {
        const notes = getNotes(), id = Date.now();
        notes.push({ id, title: '', body: '', updated: id });
        saveNotes(notes); renderNotesList(); openNoteEditor(id);
    });
    if (dom.noteBackBtn) dom.noteBackBtn.addEventListener('click', () => {
        const notes = getNotes(), id = parseInt(dom.noteEditor.dataset.currentId), idx = notes.findIndex(n => n.id === id);
        if (idx !== -1) { notes[idx].title = dom.noteEditorTitle.value; notes[idx].body = dom.noteEditorBody.value; notes[idx].updated = Date.now(); saveNotes(notes); }
        dom.noteEditor.classList.add('hidden'); dom.notesList.classList.remove('hidden'); renderNotesList();
    });
    if (dom.noteDeleteBtn) dom.noteDeleteBtn.addEventListener('click', () => {
        const id = parseInt(dom.noteEditor.dataset.currentId);
        saveNotes(getNotes().filter(n => n.id !== id));
        dom.noteEditor.classList.add('hidden'); dom.notesList.classList.remove('hidden'); renderNotesList();
    });

    // --- Apps ---
    function renderAppsTab(apps, grid, name) {
        if (!grid) return;
        grid.innerHTML = (apps || []).map((app, i) => `<a href="${app.url}" class="app-item shortcut" style="--item-index: ${i}"><img src="${app.icon || 'https://icon.horse/icon/' + (new URL(app.url).hostname)}" onerror="this.style.display='none';this.nextSibling.style.display='flex'"> <div class="icon-placeholder" style="display:none">${app.name[0]}</div> <span>${app.name}</span></a>`).join('');
    }
    function renderApps() {
        renderAppsTab(settings.googleApps, dom.googleAppsGrid, 'googleApps');
        renderAppsTab(settings.msApps, dom.msAppsGrid, 'msApps');
        renderAppsTab(settings.customApps, dom.customAppsGrid, 'customApps');
    }
    if (dom.appsLauncherBtn) dom.appsLauncherBtn.addEventListener('click', (e) => { e.stopPropagation(); dom.appsDropdown.classList.toggle('hidden'); });
    document.addEventListener('click', () => dom.appsDropdown && dom.appsDropdown.classList.add('hidden'));
    if (dom.appTabs) dom.appTabs.forEach(tab => tab.addEventListener('click', (e) => {
        e.stopPropagation(); dom.appTabs.forEach(t => t.classList.remove('active')); dom.appPanes.forEach(p => p.classList.remove('active'));
        tab.classList.add('active'); document.getElementById(tab.dataset.target).classList.add('active');
    }));

    // --- Init ---
    renderApps(); applySettings(); updateDateCard(); renderFocusUI(); renderNotesList();
    setInterval(() => { updateTime(); renderFocusUI(); }, 1000);
    window.addEventListener('storage', () => { renderFocusUI(); renderNotesList(); });
})();

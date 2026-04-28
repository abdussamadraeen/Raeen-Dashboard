chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'open_dashboard') {
        const url = chrome.runtime.getURL('index.html?no_redirect=true&settings=true');
        chrome.tabs.update(sender.tab.id, { url: url });
    }
});

// --- INDUSTRIAL STRENGTH REDIRECT ---
// This handles the redirect before the page even paints
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
        const url = tab.url || tab.pendingUrl || '';
        if (!url) return;

        const isNewTab = url.startsWith('chrome://newtab') || 
                         url.startsWith('edge://newtab') || 
                         url.startsWith('brave://newtab') ||
                         url.startsWith('about:newtab') || 
                         url.includes(chrome.runtime.id + '/index.html');
        
        const hasNoRedirect = url.includes('no_redirect=true');

        if (isNewTab && !hasNoRedirect) {
            chrome.storage.local.get('raeen_dashboard_settings', (res) => {
                const settings = res.raeen_dashboard_settings;
                if (settings) {
                    if (settings.backgroundType === 'google') {
                        chrome.tabs.update(tabId, { url: 'https://www.google.com/webhp?raeen_dashboard=true' });
                    } else if (settings.backgroundType === 'bing') {
                        chrome.tabs.update(tabId, { url: 'https://www.bing.com/?raeen_dashboard=true' });
                    }
                }
            });
        }
    }
});

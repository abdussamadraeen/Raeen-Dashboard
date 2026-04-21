// Content script: Auto-paste search query into AI chat input fields
(function() {
    'use strict';

    // Extract query from URL
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (!query) return;

    // Clean the query param from the URL (so it doesn't persist on refresh)
    const cleanUrl = window.location.origin + window.location.pathname;
    history.replaceState(null, '', cleanUrl);

    // Strategy: Try multiple times as these SPAs load inputs dynamically
    let attempts = 0;
    const maxAttempts = 30; // Try for ~15 seconds
    const interval = 500;

    const tryPaste = setInterval(() => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(tryPaste);
            return;
        }

        // Find the chat input (each AI uses different selectors)
        let inputEl = null;

        // Gemini
        if (window.location.hostname.includes('gemini.google.com')) {
            // Gemini uses a rich text editor or a contenteditable div
            inputEl = document.querySelector('.ql-editor[contenteditable="true"]')
                   || document.querySelector('div[contenteditable="true"][role="textbox"]')
                   || document.querySelector('.input-area-container textarea')
                   || document.querySelector('rich-textarea .ql-editor');
        }

        // Copilot
        if (window.location.hostname.includes('copilot.microsoft.com')) {
            inputEl = document.querySelector('#userInput')
                   || document.querySelector('textarea[name="search"]')
                   || document.querySelector('.cib-serp-main textarea')
                   || document.querySelector('textarea[placeholder]');
        }

        if (!inputEl) return;

        clearInterval(tryPaste);

        // Insert the text
        if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
            // Standard input element
            const nativeSet = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
                           || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
            if (nativeSet) {
                nativeSet.call(inputEl, query);
            } else {
                inputEl.value = query;
            }
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (inputEl.isContentEditable) {
            // ContentEditable div (Gemini uses this)
            inputEl.focus();
            inputEl.textContent = '';
            document.execCommand('insertText', false, query);
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Focus the element
        inputEl.focus();

        // Auto-submit after a short delay
        setTimeout(() => {
            // Try to find and click the send button
            const sendBtn = document.querySelector('button[aria-label="Send"]')
                         || document.querySelector('button.send-button')
                         || document.querySelector('.send-button-container button')
                         || document.querySelector('button[data-testid="send-button"]')
                         || document.querySelector('.input-area button[mat-icon-button]');
            
            if (sendBtn && !sendBtn.disabled) {
                sendBtn.click();
            } else {
                // Fallback: simulate Enter keypress
                inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            }
        }, 800);

    }, interval);
})();

// Auto-paste search query into AI chat input fields
(function () {
    'use strict';

    // Extract query from URL
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (!query) return;

    // Clean the query param from the URL
    history.replaceState(null, '', window.location.origin + window.location.pathname);

    // Configurable selectors for different platforms
    const selectors = {
        chatgpt: ['#prompt-textarea', 'textarea[data-id="root"]'],
        gemini: ['[contenteditable="true"]', '.input-area textarea'],
        copilot: ['textarea', 'input[type="text"]'],
        perplexity: ['textarea', 'input[placeholder*="Ask"]'],
        claude: ['div[contenteditable="true"]', 'textarea'],
        defaultSend: [
            'button[aria-label="Send"]',
            'button[aria-label="Submit"]',
            'button.send-button',
            'button[data-testid="send-button"]',
            'button[mat-icon-button]',
            '.input-area button'
        ]
    };

    // Utility: find element by selectors
    function findElement(selectors) {
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) return el;
        }
        return null;
    }

    // Utility: set value safely
    function setValue(el, value) {
        try {
            if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
                const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
                if (nativeSetter) {
                    nativeSetter.call(el, value);
                } else {
                    el.value = value;
                }
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (el.isContentEditable) {
                el.focus();
                el.textContent = '';
                document.execCommand('insertText', false, value);
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } catch(e) {
            console.error('Error setting input value:', e);
        }
    }

    // Try multiple times (SPA loading)
    let attempts = 0;
    const maxAttempts = 30;
    const interval = 500;

    const tryPaste = setInterval(() => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(tryPaste);
            console.log('AI Inject: Max attempts reached without finding input element');
            return;
        }

        let inputEl = null;
        const host = window.location.hostname;

        try {
            if (host.includes('chatgpt.com')) {
                inputEl = findElement(selectors.chatgpt);
            } else if (host.includes('gemini.google.com')) {
                inputEl = findElement(selectors.gemini);
            } else if (host.includes('copilot.microsoft.com')) {
                inputEl = findElement(selectors.copilot);
            } else if (host.includes('perplexity.ai')) {
                inputEl = findElement(selectors.perplexity);
            } else if (host.includes('claude.ai')) {
                inputEl = findElement(selectors.claude);
            }
        } catch(e) {
            console.error('AI Inject: Error detecting host:', e);
        }

        if (!inputEl) {
            if (attempts > 1 && attempts % 10 === 0) {
                console.log('AI Inject: Attempt ' + attempts + '/' + maxAttempts);
            }
            return;
        }

        clearInterval(tryPaste);

        // Insert query
        try {
            setValue(inputEl, query);
            inputEl.focus();
            console.log('✓ AI Inject: Query inserted successfully');

            // Auto-submit
            setTimeout(() => {
                try {
                    const sendBtn = findElement(selectors.defaultSend);
                    if (sendBtn && !sendBtn.disabled) {
                        sendBtn.click();
                        console.log('✓ AI Inject: Message sent automatically');
                    } else {
                        inputEl.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            bubbles: true
                        }));
                        console.log('✓ AI Inject: Enter key dispatched');
                    }
                } catch(submitError) {
                    console.error('AI Inject: Error during submit:', submitError);
                }
            }, 800);
        } catch(insertError) {
            console.error('AI Inject: Error inserting query:', insertError);
        }

    }, interval);
})();

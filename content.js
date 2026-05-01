(function() {
    // Only run in the top frame to prevent duplicate buttons
    if (window.self !== window.top) return;
    
    // Prevent duplicate injection in the same frame
    if (document.querySelector('.raeen-settings-btn')) return;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('raeen_dashboard') || window.location.href.includes('raeen_dashboard=true')) {
        const btn = document.createElement('a');
        btn.className = 'raeen-settings-btn';
        btn.href = '#';
        btn.title = "Back to Dashboard";
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
        `;
        
        btn.style.cssText = `
            position: fixed !important;
            bottom: 30px !important;
            left: 30px !important;
            z-index: 2147483647 !important;
            background: rgba(255, 255, 255, 0.2) !important;
            backdrop-filter: blur(10px) !important;
            color: white !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            border-radius: 50% !important;
            width: 50px !important;
            height: 50px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'rotate(45deg) scale(1.1)';
            btn.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'rotate(0deg) scale(1)';
            btn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.runtime.sendMessage({ action: 'open_dashboard' });
        });

        document.body.appendChild(btn);
    }
})();

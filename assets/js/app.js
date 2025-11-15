/**
 * NewBook Assistant Web App - Main Application
 *
 * Handles:
 * - Module loading and switching
 * - Tab navigation
 * - Manual refresh
 * - Loading states
 */

const NAWAApp = (function() {
    'use strict';

    let currentModule = null;
    let currentTab = null;
    let modules = {};

    /**
     * Initialize the app
     */
    function init() {
        console.log('NAWAApp: Initializing...');

        // Load modules for current user
        loadModules();

        // Set up event listeners
        setupEventListeners();

        // Register service worker
        registerServiceWorker();
    }

    /**
     * Load available modules for current user
     */
    async function loadModules() {
        showLoading('Loading modules...');

        try {
            const response = await fetch(nawaSettings.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'nawa_get_modules',
                    nonce: nawaSettings.nonce
                })
            });

            const data = await response.json();

            if (data.success) {
                modules = data.data.modules;
                console.log('NAWAApp: Loaded modules:', modules);

                // Render module selector if multiple modules
                if (Object.keys(modules).length > 1) {
                    renderModuleSelector();
                }

                // Load first module by default
                const firstModuleId = Object.keys(modules)[0];
                if (firstModuleId) {
                    switchModule(firstModuleId);
                }
            } else {
                showError('Failed to load modules');
            }
        } catch (error) {
            console.error('NAWAApp: Error loading modules:', error);
            showError('Error loading modules: ' + error.message);
        }
    }

    /**
     * Render module selector
     */
    function renderModuleSelector() {
        const selector = document.getElementById('nawa-module-selector');
        if (!selector) return;

        let html = '<div class="nawa-module-buttons">';
        for (const moduleId in modules) {
            const module = modules[moduleId];
            html += `
                <button class="nawa-module-btn" data-module="${moduleId}">
                    <span class="material-symbols-outlined">${module.icon}</span>
                    <span>${module.name}</span>
                </button>
            `;
        }
        html += '</div>';

        selector.innerHTML = html;
        selector.style.display = 'block';

        // Add click handlers
        selector.querySelectorAll('.nawa-module-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const moduleId = this.dataset.module;
                switchModule(moduleId);
            });
        });
    }

    /**
     * Switch to a different module
     */
    function switchModule(moduleId) {
        console.log('NAWAApp: Switching to module:', moduleId);

        currentModule = moduleId;
        const module = modules[moduleId];

        // Update active module button
        document.querySelectorAll('.nawa-module-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.module === moduleId);
        });

        // Render tabs for this module
        renderTabs(module.tabs);

        // Load first tab
        const firstTabId = Object.keys(module.tabs)[0];
        if (firstTabId) {
            switchTab(firstTabId);
        }
    }

    /**
     * Render tabs for current module
     */
    function renderTabs(tabs) {
        const tabNav = document.getElementById('nawa-tab-nav');
        const bottomNav = document.getElementById('nawa-bottom-nav');

        let html = '';
        for (const tabId in tabs) {
            const tab = tabs[tabId];
            const badgeHtml = tab.badge_count > 0 ? `<span class="nawa-badge">${tab.badge_count}</span>` : '';

            html += `
                <button class="nawa-tab-btn" data-tab="${tab.id}">
                    <span class="material-symbols-outlined">${tab.icon}</span>
                    <span class="nawa-tab-label">${tab.name}</span>
                    ${badgeHtml}
                </button>
            `;
        }

        if (tabNav) {
            tabNav.innerHTML = html;
        }
        if (bottomNav) {
            bottomNav.innerHTML = html;
        }

        // Add click handlers
        document.querySelectorAll('.nawa-tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                switchTab(tabId);
            });
        });
    }

    /**
     * Switch to a different tab
     */
    function switchTab(tabId) {
        console.log('NAWAApp: Switching to tab:', tabId);

        currentTab = tabId;

        // Update active tab buttons
        document.querySelectorAll('.nawa-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Trigger module-specific tab load
        const event = new CustomEvent('nawa:tab-change', {
            detail: {
                module: currentModule,
                tab: tabId
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Manual refresh current tab
     */
    function refreshCurrentTab() {
        console.log('NAWAApp: Refreshing tab:', currentTab);

        const event = new CustomEvent('nawa:refresh', {
            detail: {
                module: currentModule,
                tab: currentTab
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('nawa-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshCurrentTab);
        }
    }

    /**
     * Register service worker for PWA
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            const swUrl = nawaSettings.serviceWorkerUrl || '/sw.js';
            navigator.serviceWorker.register(swUrl, {
                scope: '/'
            })
                .then(registration => {
                    console.log('NAWAApp: Service worker registered:', registration);
                })
                .catch(error => {
                    console.log('NAWAApp: Service worker registration failed:', error);
                });
        }
    }

    /**
     * Show loading state
     */
    function showLoading(message = 'Loading...') {
        const content = document.getElementById('nawa-content');
        if (content) {
            content.innerHTML = `
                <div class="nawa-loading">
                    <div class="nawa-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    /**
     * Show error state
     */
    function showError(message) {
        const content = document.getElementById('nawa-content');
        if (content) {
            content.innerHTML = `
                <div class="nawa-error">
                    <span class="material-symbols-outlined">error</span>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    /**
     * Update tab badge count
     */
    function updateBadge(tabId, count) {
        document.querySelectorAll(`.nawa-tab-btn[data-tab="${tabId}"]`).forEach(btn => {
            let badge = btn.querySelector('.nawa-badge');

            if (count > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'nawa-badge';
                    btn.appendChild(badge);
                }
                badge.textContent = count;
            } else if (badge) {
                badge.remove();
            }
        });
    }

    // Public API
    return {
        init,
        showLoading,
        showError,
        updateBadge,
        getCurrentModule: () => currentModule,
        getCurrentTab: () => currentTab
    };
})();

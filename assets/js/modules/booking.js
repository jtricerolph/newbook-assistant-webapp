/**
 * Booking Module JavaScript
 *
 * Handles loading booking-specific tabs:
 * - Summary
 * - Restaurant
 * - Checks
 */

const NAWABookingModule = (function() {
    'use strict';

    let currentBookingId = null;

    /**
     * Initialize booking module
     */
    function init() {
        console.log('NAWABookingModule: Initializing...');

        // Listen for tab changes
        document.addEventListener('nawa:tab-change', handleTabChange);

        // Listen for refresh events
        document.addEventListener('nawa:refresh', handleRefresh);
    }

    /**
     * Handle tab change events
     */
    function handleTabChange(event) {
        const { module, tab } = event.detail;

        // Only handle booking module tabs
        if (module !== 'booking') return;

        console.log('NAWABookingModule: Loading tab:', tab);

        switch (tab) {
            case 'summary':
                loadSummaryTab();
                break;
            case 'restaurant':
                loadRestaurantTab();
                break;
            case 'checks':
                loadChecksTab();
                break;
        }
    }

    /**
     * Handle refresh events
     */
    function handleRefresh(event) {
        const { module, tab } = event.detail;

        if (module !== 'booking') return;

        // Reload current tab
        handleTabChange(event);
    }

    /**
     * Load Summary Tab
     */
    async function loadSummaryTab() {
        NAWAApp.showLoading('Loading summary...');

        try {
            const response = await fetch(nawaSettings.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'nawa_booking_summary',
                    nonce: nawaSettings.nonce
                })
            });

            const data = await response.json();

            if (data.success) {
                displayContent(data.data.html);
                NAWAApp.updateBadge('summary', data.data.badge_count || 0);
            } else {
                NAWAApp.showError('Failed to load summary: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('NAWABookingModule: Error loading summary:', error);
            NAWAApp.showError('Error loading summary: ' + error.message);
        }
    }

    /**
     * Load Restaurant Tab
     */
    async function loadRestaurantTab() {
        // If no booking selected, show booking search
        if (!currentBookingId) {
            displayBookingSearch();
            return;
        }

        NAWAApp.showLoading('Loading restaurant matches...');

        try {
            const response = await fetch(nawaSettings.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'nawa_booking_restaurant',
                    nonce: nawaSettings.nonce,
                    booking_id: currentBookingId
                })
            });

            const data = await response.json();

            if (data.success) {
                displayContent(data.data.html);
                NAWAApp.updateBadge('restaurant', data.data.badge_count || 0);
            } else {
                NAWAApp.showError('Failed to load restaurant matches: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('NAWABookingModule: Error loading restaurant tab:', error);
            NAWAApp.showError('Error loading restaurant matches: ' + error.message);
        }
    }

    /**
     * Load Checks Tab
     */
    async function loadChecksTab() {
        // If no booking selected, show booking search
        if (!currentBookingId) {
            displayBookingSearch();
            return;
        }

        NAWAApp.showLoading('Running checks...');

        try {
            const response = await fetch(nawaSettings.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'nawa_booking_checks',
                    nonce: nawaSettings.nonce,
                    booking_id: currentBookingId
                })
            });

            const data = await response.json();

            if (data.success) {
                displayContent(data.data.html);
                NAWAApp.updateBadge('checks', data.data.badge_count || 0);
            } else {
                NAWAApp.showError('Failed to load checks: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('NAWABookingModule: Error loading checks:', error);
            NAWAApp.showError('Error loading checks: ' + error.message);
        }
    }

    /**
     * Display booking search interface
     */
    function displayBookingSearch() {
        const html = `
            <div class="nawa-booking-search">
                <div class="nawa-search-icon">
                    <span class="material-symbols-outlined">search</span>
                </div>
                <h2>Search for a Booking</h2>
                <form id="nawa-booking-search-form">
                    <input
                        type="number"
                        id="nawa-booking-id-input"
                        placeholder="Enter Booking ID"
                        required
                        autofocus
                    >
                    <button type="submit" class="nawa-btn nawa-btn-primary">
                        <span class="material-symbols-outlined">search</span>
                        Search
                    </button>
                </form>
            </div>
        `;

        displayContent(html);

        // Add form submit handler
        const form = document.getElementById('nawa-booking-search-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const input = document.getElementById('nawa-booking-id-input');
                const bookingId = parseInt(input.value);

                if (bookingId) {
                    setCurrentBooking(bookingId);

                    // Reload current tab to show results for this booking
                    const currentTab = NAWAApp.getCurrentTab();
                    if (currentTab) {
                        handleTabChange({
                            detail: {
                                module: 'booking',
                                tab: currentTab
                            }
                        });
                    }
                }
            });
        }
    }

    /**
     * Set current booking ID
     * Note: Does not automatically reload tabs - caller should handle tab switching/loading
     */
    function setCurrentBooking(bookingId) {
        console.log('NAWABookingModule: Setting current booking:', bookingId);
        currentBookingId = bookingId;
    }

    /**
     * Display content in main content area
     * Handles inline scripts properly (they don't execute with innerHTML)
     */
    function displayContent(html) {
        const content = document.getElementById('nawa-content');
        if (!content) return;

        // Set the HTML
        content.innerHTML = html;

        // Extract and execute inline scripts (innerHTML doesn't execute them)
        const scripts = content.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');

            // Copy attributes
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });

            // Copy script content
            newScript.textContent = oldScript.textContent;

            // Replace old script with new one (this executes it)
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        setCurrentBooking,
        getCurrentBooking: () => currentBookingId
    };
})();

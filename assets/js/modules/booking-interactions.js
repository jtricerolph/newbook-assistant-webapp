/**
 * Booking Interactions Module
 *
 * Adds interactivity to HTML returned from booking-match-api
 * Ported from Chrome extension sidepanel.js
 *
 * @package NewBookAssistantWebApp
 */

const NAWABookingInteractions = (function() {
    'use strict';

    /**
     * Initialize interactions
     */
    function init() {
        console.log('NAWABookingInteractions: Initializing...');

        // Event delegation for dynamic content
        document.addEventListener('click', handleGlobalClick, true);

        // Listen for tab changes to reinitialize
        document.addEventListener('nawa:tab-change', handleTabChange);
    }

    /**
     * Handle tab changes
     */
    function handleTabChange(event) {
        const { module, tab } = event.detail;
        if (module === 'booking') {
            // Reinitialize interactions when content loads
            setTimeout(() => {
                attachCardAccordions();
            }, 100);
        }
    }

    /**
     * Global click handler (event delegation)
     */
    function handleGlobalClick(event) {
        // Card expand/collapse
        const bookingHeader = event.target.closest('.booking-header');
        if (bookingHeader && !event.target.closest('.open-booking-btn')) {
            handleCardAccordion(bookingHeader);
            return;
        }

        // Staying card expand/collapse
        const stayingHeader = event.target.closest('.staying-header');
        if (stayingHeader && !event.target.closest('button')) {
            handleStayingCardAccordion(stayingHeader);
            return;
        }

        // Open in NewBook button
        const openBookingBtn = event.target.closest('.open-booking-btn');
        if (openBookingBtn) {
            event.stopPropagation();
            handleOpenInNewBook(openBookingBtn);
            return;
        }

        // Clickable issue rows (navigate to Restaurant)
        const clickableIssue = event.target.closest('.clickable-issue');
        if (clickableIssue) {
            event.stopPropagation();
            handleClickableIssue(clickableIssue);
            return;
        }

        // ResOS deep links
        const resosLink = event.target.closest('.resos-deep-link');
        if (resosLink) {
            event.stopPropagation();
            handleResosDeepLink(resosLink);
            return;
        }

        // Restaurant header links
        const restaurantHeaderLink = event.target.closest('.restaurant-header-link');
        if (restaurantHeaderLink) {
            event.preventDefault();
            event.stopPropagation();
            handleRestaurantHeaderLink(restaurantHeaderLink);
            return;
        }

        // Checks header links
        const checksHeaderLink = event.target.closest('.checks-header-link');
        if (checksHeaderLink) {
            event.preventDefault();
            event.stopPropagation();
            handleChecksHeaderLink(checksHeaderLink);
            return;
        }

        // Create booking links
        const createBookingLink = event.target.closest('.create-booking-link');
        if (createBookingLink) {
            event.preventDefault();
            event.stopPropagation();
            handleCreateBookingLink(createBookingLink);
            return;
        }
    }

    /**
     * Attach card accordions (called after content loads)
     */
    function attachCardAccordions() {
        // Already handled by global click handler
        console.log('NAWABookingInteractions: Card accordions ready');
    }

    /**
     * Handle booking card accordion
     */
    function handleCardAccordion(header) {
        const card = header.closest('.booking-card');
        if (!card) return;

        const bookingId = card.dataset.bookingId;
        const details = document.getElementById('details-' + bookingId);
        const icon = header.querySelector('.expand-icon');

        if (!details) return;

        const isCurrentlyExpanded = details.style.display === 'block';

        // Get container (summary-placed-pane or summary-cancelled-pane)
        const container = card.closest('.summary-placed-pane, .summary-cancelled-pane, .tab-content');

        // Close all other cards in same container (accordion behavior)
        if (container) {
            container.querySelectorAll('.booking-details').forEach(detail => {
                if (detail !== details) {
                    detail.style.display = 'none';
                }
            });
            container.querySelectorAll('.expand-icon').forEach(otherIcon => {
                if (otherIcon !== icon) {
                    otherIcon.textContent = '▼';
                }
            });
            container.querySelectorAll('.booking-card').forEach(c => {
                if (c !== card) {
                    c.classList.remove('expanded');
                }
            });
        }

        // Toggle current card
        if (!isCurrentlyExpanded) {
            details.style.display = 'block';
            if (icon) icon.textContent = '▲';
            card.classList.add('expanded');

            // Auto-scroll to top of card (smooth)
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        } else {
            details.style.display = 'none';
            if (icon) icon.textContent = '▼';
            card.classList.remove('expanded');
        }
    }

    /**
     * Handle staying card accordion
     */
    function handleStayingCardAccordion(header) {
        const card = header.closest('.staying-card');
        if (!card) return;

        const isExpanded = card.classList.contains('expanded');
        const container = card.closest('.tab-content');

        // Accordion behavior: close all other cards
        if (container) {
            container.querySelectorAll('.staying-card.expanded').forEach(expandedCard => {
                if (expandedCard !== card) {
                    expandedCard.classList.remove('expanded');
                }
            });
        }

        // Toggle current card
        if (!isExpanded) {
            card.classList.add('expanded');
            // Scroll to card
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
        } else {
            card.classList.remove('expanded');
        }
    }

    /**
     * Handle "Open in NewBook" button
     */
    function handleOpenInNewBook(button) {
        const bookingId = button.dataset.bookingId;
        if (!bookingId) return;

        const url = `https://appeu.newbook.cloud/bookings_view/${bookingId}`;
        window.open(url, '_blank');

        console.log('NAWABookingInteractions: Opening NewBook booking:', bookingId);
    }

    /**
     * Handle clickable issue rows (navigate to Restaurant tab)
     */
    function handleClickableIssue(issue) {
        const bookingId = issue.dataset.bookingId;
        const date = issue.dataset.date;
        const resosId = issue.dataset.resosId;

        console.log('NAWABookingInteractions: Clickable issue:', { bookingId, date, resosId });

        if (date && bookingId) {
            // Navigate to Restaurant tab
            navigateToRestaurantDate(date, parseInt(bookingId), resosId);
        } else if (issue.dataset.leadRoom) {
            // Group member - navigate to lead booking (Staying tab specific)
            const leadRoom = issue.dataset.leadRoom;
            navigateToLeadBooking(leadRoom, issue);
        }
    }

    /**
     * Handle ResOS deep links
     */
    function handleResosDeepLink(link) {
        const resosId = link.dataset.resosId;
        const restaurantId = link.dataset.restaurantId;
        const date = link.dataset.date;

        if (!resosId || !restaurantId || !date) return;

        const resosUrl = `https://app.resos.com/${restaurantId}/bookings/timetable/${date}/${resosId}`;
        window.open(resosUrl, '_blank');

        console.log('NAWABookingInteractions: Opening ResOS booking:', resosId);
    }

    /**
     * Handle restaurant header link
     */
    function handleRestaurantHeaderLink(link) {
        const bookingId = link.dataset.bookingId;
        if (bookingId) {
            navigateToRestaurantDate(null, parseInt(bookingId));
        }
    }

    /**
     * Handle checks header link
     */
    function handleChecksHeaderLink(link) {
        const bookingId = link.dataset.bookingId;
        if (bookingId) {
            navigateToChecksTab(parseInt(bookingId));
        }
    }

    /**
     * Handle create booking link
     */
    function handleCreateBookingLink(link) {
        const date = link.dataset.date;
        const bookingId = link.dataset.bookingId;

        if (date && bookingId) {
            navigateToRestaurantDate(date, parseInt(bookingId));
        }
    }

    /**
     * Navigate to Restaurant tab with specific date/booking
     */
    function navigateToRestaurantDate(date, bookingId, resosId) {
        console.log('NAWABookingInteractions: Navigate to Restaurant:', { date, bookingId, resosId });

        // Set current booking if provided
        if (bookingId && typeof NAWABookingModule !== 'undefined') {
            NAWABookingModule.setCurrentBooking(bookingId);
        }

        // Switch to Restaurant tab
        if (typeof NAWAApp !== 'undefined') {
            NAWAApp.switchTab('restaurant');
        }

        // TODO: Expand specific date/comparison row after tab loads
        // This will be implemented in Phase 2 when we add form interactions
    }

    /**
     * Navigate to Checks tab with booking
     */
    function navigateToChecksTab(bookingId) {
        console.log('NAWABookingInteractions: Navigate to Checks:', bookingId);

        // Set current booking
        if (bookingId && typeof NAWABookingModule !== 'undefined') {
            NAWABookingModule.setCurrentBooking(bookingId);
        }

        // Switch to Checks tab
        if (typeof NAWAApp !== 'undefined') {
            NAWAApp.switchTab('checks');
        }
    }

    /**
     * Navigate to lead booking (Staying tab - group member click)
     */
    function navigateToLeadBooking(leadRoom, currentIssue) {
        const currentCard = currentIssue.closest('.staying-card');
        const stayingTab = document.querySelector('[data-content="staying"]');
        if (!stayingTab) return;

        // Find lead booking card by room number
        const leadCard = Array.from(stayingTab.querySelectorAll('.staying-card')).find(card => {
            const roomNumberElement = card.querySelector('.room-number');
            return roomNumberElement && roomNumberElement.textContent.trim() === leadRoom;
        });

        if (leadCard) {
            // Close current card
            if (currentCard) {
                currentCard.classList.remove('expanded');
            }

            // Expand lead card
            leadCard.classList.add('expanded');

            // Scroll to lead card
            setTimeout(() => {
                leadCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);

            console.log('NAWABookingInteractions: Navigated to lead booking:', leadRoom);
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API
    return {
        init,
        navigateToRestaurantDate,
        navigateToChecksTab
    };
})();

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

        // ========== PHASE 2: RESTAURANT TAB FORM INTERACTIONS ==========

        // Data-action buttons (toggle create/update forms, submit)
        const actionButton = event.target.closest('[data-action]');
        if (actionButton) {
            event.preventDefault();
            event.stopPropagation();
            handleActionButton(actionButton);
            return;
        }

        // Service period accordion headers
        const periodHeader = event.target.closest('.period-header');
        if (periodHeader) {
            event.preventDefault();
            event.stopPropagation();
            handlePeriodHeader(periodHeader);
            return;
        }

        // Time slot selection
        const timeSlotBtn = event.target.closest('.time-slot-btn');
        if (timeSlotBtn && !timeSlotBtn.classList.contains('time-slot-unavailable')) {
            event.preventDefault();
            event.stopPropagation();
            handleTimeSlotSelection(timeSlotBtn);
            return;
        }

        // Form section toggles
        const sectionToggle = event.target.closest('.bma-section-toggle');
        if (sectionToggle) {
            event.preventDefault();
            event.stopPropagation();
            handleSectionToggle(sectionToggle);
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

    // ========== PHASE 2: RESTAURANT TAB FORM INTERACTION HANDLERS ==========

    /**
     * Handle data-action button clicks
     */
    function handleActionButton(button) {
        const action = button.dataset.action;
        const date = button.dataset.date;

        switch (action) {
            case 'toggle-create':
                toggleCreateForm(date);
                break;
            case 'toggle-update':
                const resosBookingId = button.dataset.resosBookingId;
                toggleUpdateForm(date, resosBookingId);
                break;
            case 'submit-create':
                submitCreateBooking(date);
                break;
            case 'submit-update':
                const updateResosId = button.dataset.resosBookingId;
                submitUpdateBooking(date, updateResosId);
                break;
        }
    }

    /**
     * Toggle create booking form
     */
    function toggleCreateForm(date) {
        const form = document.getElementById('create-form-' + date);
        const button = document.getElementById('create-btn-' + date);

        if (!form) return;

        const isCurrentlyVisible = form.style.display === 'block';

        if (!isCurrentlyVisible) {
            // Close any other open forms first
            document.querySelectorAll('[id^="create-form-"]').forEach(f => {
                if (f !== form) {
                    f.style.display = 'none';
                }
            });
            document.querySelectorAll('[id^="update-form-"]').forEach(f => {
                f.style.display = 'none';
            });

            // Show this form
            form.style.display = 'block';
            if (button) {
                button.textContent = 'Cancel';
            }

            // Auto-scroll to form
            setTimeout(() => {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);

            console.log('NAWABookingInteractions: Opened create form for', date);
        } else {
            // Hide form
            form.style.display = 'none';
            if (button) {
                button.textContent = 'Create Booking';
            }

            console.log('NAWABookingInteractions: Closed create form for', date);
        }
    }

    /**
     * Toggle update booking form
     */
    function toggleUpdateForm(date, resosBookingId) {
        const form = document.getElementById('update-form-' + date);
        const button = document.querySelector(`[data-action="toggle-update"][data-date="${date}"][data-resos-booking-id="${resosBookingId}"]`);

        if (!form) return;

        const isCurrentlyVisible = form.style.display === 'block';

        if (!isCurrentlyVisible) {
            // Close any other open forms first
            document.querySelectorAll('[id^="create-form-"]').forEach(f => {
                f.style.display = 'none';
            });
            document.querySelectorAll('[id^="update-form-"]').forEach(f => {
                if (f !== form) {
                    f.style.display = 'none';
                }
            });

            // Show this form
            form.style.display = 'block';
            if (button) {
                button.textContent = 'Cancel';
            }

            // Auto-scroll to form
            setTimeout(() => {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);

            console.log('NAWABookingInteractions: Opened update form for', date, resosBookingId);
        } else {
            // Hide form
            form.style.display = 'none';
            if (button) {
                button.textContent = 'Update Booking';
            }

            console.log('NAWABookingInteractions: Closed update form for', date, resosBookingId);
        }
    }

    /**
     * Handle service period header click
     */
    function handlePeriodHeader(header) {
        const date = header.dataset.date;
        const periodIndex = header.dataset.periodIndex;
        const periodId = header.dataset.periodId;

        if (!date || periodIndex === undefined) return;

        togglePeriodSection(date, periodIndex, periodId);
    }

    /**
     * Toggle service period accordion section
     */
    function togglePeriodSection(date, periodIndex, periodId) {
        const container = document.getElementById('service-period-sections-' + date);
        if (!container) return;

        const periodHeader = container.querySelector(`[data-period-index="${periodIndex}"]`);
        const periodTimes = container.querySelector(`#period-times-${date}-${periodIndex}`);

        if (!periodHeader || !periodTimes) return;

        const isCurrentlyExpanded = periodHeader.classList.contains('expanded');

        // Close all other periods (exclusive accordion)
        container.querySelectorAll('.period-header').forEach(header => {
            if (header !== periodHeader) {
                header.classList.remove('expanded');
                const icon = header.querySelector('.collapse-icon');
                if (icon) icon.textContent = '▶';
            }
        });
        container.querySelectorAll('.period-times').forEach(times => {
            if (times !== periodTimes) {
                times.style.display = 'none';
            }
        });

        // Toggle current period
        if (!isCurrentlyExpanded) {
            periodHeader.classList.add('expanded');
            periodTimes.style.display = 'flex';
            const icon = periodHeader.querySelector('.collapse-icon');
            if (icon) icon.textContent = '▼';

            console.log('NAWABookingInteractions: Expanded period', periodIndex, 'for', date);
        } else {
            periodHeader.classList.remove('expanded');
            periodTimes.style.display = 'none';
            const icon = periodHeader.querySelector('.collapse-icon');
            if (icon) icon.textContent = '▶';

            console.log('NAWABookingInteractions: Collapsed period', periodIndex, 'for', date);
        }
    }

    /**
     * Handle time slot selection
     */
    function handleTimeSlotSelection(button) {
        const time = button.dataset.time;
        const periodId = button.dataset.periodId;
        const date = button.dataset.date;

        if (!time || !periodId || !date) return;

        selectTimeSlot(button, time, periodId, date);
    }

    /**
     * Select a time slot
     */
    function selectTimeSlot(button, time, periodId, date) {
        // Remove selected class from ALL time slot buttons (single selection across all periods)
        document.querySelectorAll('.time-slot-btn.selected').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Add selected class to clicked button
        button.classList.add('selected');

        // Update hidden fields
        const timeField = document.getElementById('time-selected-' + date);
        const periodField = document.getElementById('opening-hour-id-' + date);

        if (timeField) timeField.value = time;
        if (periodField) periodField.value = periodId;

        // Update booking time display if it exists
        const timeDisplay = document.querySelector(`#create-form-${date} .booking-time-display`);
        if (timeDisplay) {
            timeDisplay.textContent = time;
        }

        console.log('NAWABookingInteractions: Selected time', time, 'for period', periodId, 'on', date);
    }

    /**
     * Handle form section toggle
     */
    function handleSectionToggle(toggle) {
        const targetId = toggle.dataset.target;
        if (!targetId) return;

        toggleFormSection(targetId, toggle);
    }

    /**
     * Toggle form section visibility
     */
    function toggleFormSection(sectionId, toggleButton) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const isCurrentlyVisible = section.style.display === 'block';

        if (!isCurrentlyVisible) {
            section.style.display = 'block';
            // Rotate icon
            const icon = toggleButton.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.style.transform = 'rotate(180deg)';
            }
        } else {
            section.style.display = 'none';
            // Rotate icon back
            const icon = toggleButton.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.style.transform = 'rotate(0deg)';
            }
        }

        console.log('NAWABookingInteractions: Toggled section', sectionId);
    }

    /**
     * Submit create booking form
     */
    async function submitCreateBooking(date) {
        const form = document.getElementById('create-form-' + date);
        if (!form) return;

        // Check if already processing
        if (form.dataset.processing === 'true') {
            console.log('NAWABookingInteractions: Create already processing');
            return;
        }

        // Validate required fields
        const guestName = form.querySelector('.form-guest-name')?.value;
        const timeSelected = form.querySelector('#time-selected-' + date)?.value;
        const partySize = form.querySelector('.form-party-size')?.value;

        if (!guestName || !timeSelected || !partySize) {
            showFeedback(date, 'create', 'error', 'Please fill in guest name, select a time, and enter party size');
            return;
        }

        // Set processing flag
        form.dataset.processing = 'true';

        // Collect form data
        const formData = {
            date: date,
            time: timeSelected,
            opening_hour_id: form.querySelector('#opening-hour-id-' + date)?.value,
            guest_name: guestName,
            party_size: parseInt(partySize),
            phone: form.querySelector('.form-phone')?.value || '',
            email: form.querySelector('.form-email')?.value || '',
            note: form.querySelector('.form-note')?.value || '',
            // Collect dietary requirements from checkboxes
            dietary_requirements: Array.from(form.querySelectorAll('.dietary-checkbox:checked')).map(cb => cb.value)
        };

        try {
            showFeedback(date, 'create', 'info', 'Creating booking...');

            // Call API
            const response = await fetch(nawaSettings.apiUrl + 'bookings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nawaSettings.nonce
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                showFeedback(date, 'create', 'success', data.message || 'Booking created successfully!');
                // Reload Restaurant tab to show updated data
                setTimeout(() => {
                    if (typeof NAWAApp !== 'undefined') {
                        NAWAApp.refreshCurrentTab();
                    }
                }, 1500);
            } else {
                showFeedback(date, 'create', 'error', data.message || 'Failed to create booking');
                form.dataset.processing = 'false';
            }
        } catch (error) {
            console.error('NAWABookingInteractions: Error creating booking:', error);
            showFeedback(date, 'create', 'error', 'Error: ' + error.message);
            form.dataset.processing = 'false';
        }
    }

    /**
     * Submit update booking form
     */
    async function submitUpdateBooking(date, resosBookingId) {
        const form = document.getElementById('update-form-' + date);
        if (!form) return;

        // Check if already processing
        if (form.dataset.processing === 'true') {
            console.log('NAWABookingInteractions: Update already processing');
            return;
        }

        // Set processing flag
        form.dataset.processing = 'true';

        // Collect only checked fields for update
        const updates = {};

        // Check which fields should be updated
        if (form.querySelector('.update-time')?.checked) {
            updates.time = form.querySelector('#time-selected-' + date)?.value;
            updates.opening_hour_id = form.querySelector('#opening-hour-id-' + date)?.value;
        }
        if (form.querySelector('.update-party-size')?.checked) {
            updates.party_size = parseInt(form.querySelector('.form-party-size')?.value);
        }
        if (form.querySelector('.update-note')?.checked) {
            updates.note = form.querySelector('.form-note')?.value;
        }

        // Must have at least one field to update
        if (Object.keys(updates).length === 0) {
            showFeedback(date, 'update', 'error', 'Please select at least one field to update');
            form.dataset.processing = 'false';
            return;
        }

        try {
            showFeedback(date, 'update', 'info', 'Updating booking...');

            // Call API
            const response = await fetch(nawaSettings.apiUrl + 'bookings/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nawaSettings.nonce
                },
                body: JSON.stringify({
                    resos_booking_id: resosBookingId,
                    date: date,
                    updates: updates
                })
            });

            const data = await response.json();

            if (data.success) {
                showFeedback(date, 'update', 'success', data.message || 'Booking updated successfully!');
                // Reload Restaurant tab to show updated data
                setTimeout(() => {
                    if (typeof NAWAApp !== 'undefined') {
                        NAWAApp.refreshCurrentTab();
                    }
                }, 1500);
            } else {
                showFeedback(date, 'update', 'error', data.message || 'Failed to update booking');
                form.dataset.processing = 'false';
            }
        } catch (error) {
            console.error('NAWABookingInteractions: Error updating booking:', error);
            showFeedback(date, 'update', 'error', 'Error: ' + error.message);
            form.dataset.processing = 'false';
        }
    }

    /**
     * Show feedback message
     */
    function showFeedback(date, formType, type, message) {
        const feedbackElement = document.getElementById(`feedback-${formType}-${date}`);
        if (!feedbackElement) return;

        feedbackElement.textContent = message;
        feedbackElement.className = 'feedback-message feedback-' + type;
        feedbackElement.style.display = 'block';

        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                feedbackElement.style.display = 'none';
            }, 3000);
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

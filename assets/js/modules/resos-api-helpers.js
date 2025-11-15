/**
 * ResOS API Helper Functions
 *
 * Global helper functions used by inline scripts in booking-match-api HTML responses
 * These functions make API calls to fetch data needed for restaurant booking forms
 */

/**
 * Fetch opening hours for a specific date
 */
async function fetchOpeningHours(date) {
    try {
        const response = await fetch(`${nawaSettings.apiUrl}opening-hours?date=${date}`, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': nawaSettings.nonce
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching opening hours:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Fetch dietary choices
 */
async function fetchDietaryChoices() {
    try {
        const response = await fetch(`${nawaSettings.apiUrl}dietary-choices`, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': nawaSettings.nonce
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching dietary choices:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Fetch available times for a date, party size, and opening hour
 */
async function fetchAvailableTimes(date, people, openingHourId) {
    try {
        let url = `${nawaSettings.apiUrl}available-times?date=${date}&people=${people}`;
        if (openingHourId) {
            url += `&opening_hour_id=${openingHourId}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': nawaSettings.nonce
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching available times:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Fetch special events for a date
 */
async function fetchSpecialEvents(date) {
    try {
        const response = await fetch(`${nawaSettings.apiUrl}special-events?date=${date}`, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': nawaSettings.nonce
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching special events:', error);
        return { success: false, message: error.message, data: [] };
    }
}

/**
 * Build Gantt chart HTML
 */
function buildGanttChart(openingHours, specialEvents, availableTimes, bookings, mode, chartId) {
    // Default mode
    mode = mode || 'compact';

    // Calculate time range from opening hours
    let earliestTime = 2400;
    let latestTime = 0;

    openingHours.forEach(period => {
        if (period.open < earliestTime) earliestTime = period.open;
        if (period.close > latestTime) latestTime = period.close;
    });

    // Add padding (30 min before/after)
    earliestTime = Math.max(0, earliestTime - 30);
    latestTime = Math.min(2400, latestTime + 30);

    // Convert HHMM to minutes
    const startMinutes = Math.floor(earliestTime / 100) * 60 + (earliestTime % 100);
    const endMinutes = Math.floor(latestTime / 100) * 60 + (latestTime % 100);
    const totalMinutes = endMinutes - startMinutes;

    // Generate time markers (every hour)
    let markers = [];
    let currentHour = Math.floor(earliestTime / 100);
    while (currentHour * 100 <= latestTime) {
        markers.push(formatTime(currentHour * 100));
        currentHour++;
    }

    // Build HTML
    let html = '<div class="gantt-chart">';
    html += '<div class="gantt-header">';
    html += '<div class="gantt-title">Restaurant Timeline</div>';
    html += '</div>';

    html += '<div class="gantt-timeline">';

    // Time markers
    html += '<div class="gantt-time-markers">';
    markers.forEach(marker => {
        html += `<div class="time-marker">${marker}</div>`;
    });
    html += '</div>';

    // Booking rows
    html += '<div class="gantt-rows">';

    if (bookings && bookings.length > 0) {
        bookings.forEach(booking => {
            const timeHHMM = parseTimeToHHMM(booking.time);
            const bookingMinutes = Math.floor(timeHHMM / 100) * 60 + (timeHHMM % 100);

            // Calculate position (assume 90min duration)
            const leftPercent = ((bookingMinutes - startMinutes) / totalMinutes) * 100;
            const widthPercent = (90 / totalMinutes) * 100;

            const isResident = booking.is_hotel_guest || booking.hotel_booking_id;
            const residentClass = isResident ? ' is-resident' : '';

            html += '<div class="gantt-row">';
            html += `<div class="gantt-booking-bar${residentClass}" style="left: ${leftPercent}%; width: ${widthPercent}%;" data-people="${booking.people || '?'}" data-name="${booking.guest_name || 'Guest'}" data-is-resident="${isResident}">`;
            html += `${booking.people || '?'}`;
            html += '</div>';
            html += '</div>';
        });
    } else {
        html += '<div class="gantt-row"><p style="padding: 10px; text-align: center; color: #999;">No bookings yet</p></div>';
    }

    html += '</div>'; // Close gantt-rows
    html += '</div>'; // Close gantt-timeline
    html += '</div>'; // Close gantt-chart

    return html;
}

/**
 * Switch time tab (used by service period tabs)
 */
async function switchTimeTab(date, tabIndex) {
    const sectionsContainer = document.getElementById('time-slots-sections-' + date);
    const tabsContainer = document.getElementById('service-period-tabs-' + date);

    if (!sectionsContainer || !tabsContainer) return;

    // Update active tab button
    const allTabs = tabsContainer.querySelectorAll('.time-tab');
    allTabs.forEach((tab, index) => {
        if (index === tabIndex) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Show corresponding section
    const allSections = sectionsContainer.querySelectorAll('.time-tab-content');
    allSections.forEach((section, index) => {
        if (index === tabIndex) {
            section.classList.add('active');
            section.style.display = 'flex';
        } else {
            section.classList.remove('active');
            section.style.display = 'none';
        }
    });

    // If section doesn't have times loaded yet, load them
    const activeSection = allSections[tabIndex];
    if (activeSection && activeSection.innerHTML.includes('Loading available times')) {
        const periodId = activeSection.dataset.periodId;
        const form = document.getElementById('create-form-' + date);
        const people = parseInt(form.querySelector('.form-people').value) || 2;

        try {
            const timesData = await fetchAvailableTimes(date, people, periodId);

            if (timesData.success && timesData.html) {
                activeSection.innerHTML = timesData.html;

                // Add click handlers to time slot buttons
                const timeButtons = activeSection.querySelectorAll('.time-slot-btn');
                timeButtons.forEach(btn => {
                    btn.addEventListener('click', function() {
                        // Remove selected class from ALL buttons in ALL sections
                        const allButtons = sectionsContainer.querySelectorAll('.time-slot-btn');
                        allButtons.forEach(b => b.classList.remove('selected'));

                        // Add selected class to clicked button
                        this.classList.add('selected');

                        // Update hidden time field
                        const timeValue = this.dataset.time || this.textContent.trim();
                        document.getElementById('time-selected-' + date).value = timeValue;

                        // Update hidden opening hour ID field
                        const openingHourIdField = document.getElementById('opening-hour-id-' + date);
                        if (openingHourIdField) {
                            openingHourIdField.value = periodId;
                        }

                        // Update booking time display in summary header
                        const bookingTimeDisplay = document.getElementById('booking-time-display-' + date);
                        if (bookingTimeDisplay) {
                            const displayTime = this.textContent.trim();
                            bookingTimeDisplay.textContent = displayTime;
                        }
                    });
                });
            } else {
                activeSection.innerHTML = '<p style="padding: 10px; text-align: center; color: #666;">No available times</p>';
            }
        } catch (error) {
            console.error('Error loading times for tab:', error);
            activeSection.innerHTML = '<p style="color: #ef4444;">Error loading times</p>';
        }
    }
}

/**
 * Helper: Format HHMM time to HH:MM string
 */
function formatTime(hhmm) {
    const hours = Math.floor(hhmm / 100);
    const minutes = hhmm % 100;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Helper: Parse time string to HHMM integer
 */
function parseTimeToHHMM(timeStr) {
    if (typeof timeStr === 'number') return timeStr;

    // Handle "HH:MM" format
    if (typeof timeStr === 'string' && timeStr.includes(':')) {
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 100 + parseInt(parts[1]);
    }

    return parseInt(timeStr) || 0;
}

console.log('ResOS API helpers loaded');

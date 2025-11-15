/**
 * PWA Install Handler
 *
 * Handles "Add to Home Screen" functionality
 */

(function() {
    'use strict';

    let deferredPrompt;
    const installBtn = document.getElementById('nawa-install-btn');

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: beforeinstallprompt event fired');

        // Prevent the mini-infobar from appearing
        e.preventDefault();

        // Stash the event so it can be triggered later
        deferredPrompt = e;

        // Show install button
        if (installBtn) {
            installBtn.style.display = 'inline-flex';
        }
    });

    // Handle install button click
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                return;
            }

            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;

            console.log('PWA: User choice:', outcome);

            // Clear the deferred prompt
            deferredPrompt = null;

            // Hide the install button
            installBtn.style.display = 'none';
        });
    }

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
        console.log('PWA: App was installed');

        // Hide the install button
        if (installBtn) {
            installBtn.style.display = 'none';
        }

        // Clear the deferred prompt
        deferredPrompt = null;
    });

    // Check if already running as installed app
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA: Running as installed app');

        // Hide install button
        if (installBtn) {
            installBtn.style.display = 'none';
        }
    }
})();

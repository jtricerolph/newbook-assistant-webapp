<?php
/**
 * Service Worker Loader
 *
 * This file is accessed directly at /sw.js (via .htaccess rewrite)
 * Serves the service worker without WordPress redirects
 */

// Load WordPress
require_once '../../../wp-load.php';

// Set headers
header('Content-Type: application/javascript; charset=utf-8');
header('Service-Worker-Allowed: /');
header('Cache-Control: no-cache, must-revalidate');
header('X-Robots-Tag: none');

// Serve service worker file
$sw_file = __DIR__ . '/assets/js/service-worker.js';

if (file_exists($sw_file)) {
    readfile($sw_file);
} else {
    // Serve minimal service worker if file doesn't exist
    echo "// Service worker placeholder\n";
    echo "self.addEventListener('install', (event) => { self.skipWaiting(); });\n";
    echo "self.addEventListener('activate', (event) => { event.waitUntil(clients.claim()); });\n";
}

exit;

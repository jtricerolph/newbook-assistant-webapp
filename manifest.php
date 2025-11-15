<?php
/**
 * Manifest Loader
 *
 * This file is accessed directly at /manifest.json (via .htaccess rewrite)
 * Serves the manifest without WordPress redirects
 */

// Load WordPress
require_once '../../../wp-load.php';

// Get settings
$app_name = get_option('nawa_app_name', 'NewBook Assistant');
$theme_color = get_option('nawa_theme_color', '#1e3a8a');
$slug = get_option('nawa_page_slug', 'assistant');

// Build manifest
$manifest = array(
    'name' => $app_name,
    'short_name' => $app_name,
    'description' => 'Hotel operations management assistant',
    'start_url' => home_url('/' . $slug . '/'),
    'display' => 'standalone',
    'background_color' => '#ffffff',
    'theme_color' => $theme_color,
    'orientation' => 'portrait',
    'icons' => array(
        array(
            'src' => plugins_url('newbook-assistant-webapp/assets/icons/icon-192x192.png'),
            'sizes' => '192x192',
            'type' => 'image/png',
            'purpose' => 'any maskable'
        ),
        array(
            'src' => plugins_url('newbook-assistant-webapp/assets/icons/icon-512x512.png'),
            'sizes' => '512x512',
            'type' => 'image/png',
            'purpose' => 'any maskable'
        )
    ),
    'categories' => array('business', 'productivity'),
    'screenshots' => array()
);

// Set headers
header('Content-Type: application/manifest+json; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('X-Robots-Tag: none');

// Output JSON
echo json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
exit;

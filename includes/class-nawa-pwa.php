<?php
/**
 * PWA Handler Class
 *
 * Handles Progressive Web App functionality
 * - Manifest generation
 * - Service worker registration
 * - PWA meta tags
 *
 * @package NewBookAssistantWebApp
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class NAWA_PWA {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('init', array($this, 'register_manifest_endpoint'));
        add_action('init', array($this, 'register_service_worker_endpoint'));
        add_action('wp_head', array($this, 'add_pwa_meta_tags'));
    }

    /**
     * Register manifest.json endpoint
     */
    public function register_manifest_endpoint() {
        add_rewrite_rule(
            '^manifest\.json$',
            'index.php?nawa_manifest=1',
            'top'
        );
        add_rewrite_tag('%nawa_manifest%', '1');

        add_action('template_redirect', array($this, 'serve_manifest'));
    }

    /**
     * Register service worker endpoint
     */
    public function register_service_worker_endpoint() {
        add_rewrite_rule(
            '^sw\.js$',
            'index.php?nawa_service_worker=1',
            'top'
        );
        add_rewrite_tag('%nawa_service_worker%', '1');

        add_action('template_redirect', array($this, 'serve_service_worker'));
    }

    /**
     * Serve manifest.json
     */
    public function serve_manifest() {
        if (!get_query_var('nawa_manifest')) {
            return;
        }

        $app_name = get_option('nawa_app_name', 'NewBook Assistant');
        $theme_color = get_option('nawa_theme_color', '#1e3a8a');
        $slug = get_option('nawa_page_slug', 'assistant');

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
                    'src' => NAWA_PLUGIN_URL . 'assets/icons/icon-192x192.png',
                    'sizes' => '192x192',
                    'type' => 'image/png',
                    'purpose' => 'any maskable'
                ),
                array(
                    'src' => NAWA_PLUGIN_URL . 'assets/icons/icon-512x512.png',
                    'sizes' => '512x512',
                    'type' => 'image/png',
                    'purpose' => 'any maskable'
                )
            ),
            'categories' => array('business', 'productivity'),
            'screenshots' => array()
        );

        header('Content-Type: application/manifest+json');
        header('Service-Worker-Allowed: /');
        echo json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Serve service worker
     */
    public function serve_service_worker() {
        if (!get_query_var('nawa_service_worker')) {
            return;
        }

        $sw_file = NAWA_PLUGIN_DIR . 'assets/js/service-worker.js';

        if (file_exists($sw_file)) {
            header('Content-Type: application/javascript');
            header('Service-Worker-Allowed: /');
            readfile($sw_file);
        } else {
            // Serve minimal service worker if file doesn't exist
            header('Content-Type: application/javascript');
            echo "// Service worker placeholder\n";
            echo "self.addEventListener('install', (event) => { self.skipWaiting(); });\n";
            echo "self.addEventListener('activate', (event) => { event.waitUntil(clients.claim()); });\n";
        }

        exit;
    }

    /**
     * Add PWA meta tags to head
     */
    public function add_pwa_meta_tags() {
        // Only add on assistant page
        if (!get_query_var('nawa_assistant')) {
            return;
        }

        $app_name = get_option('nawa_app_name', 'NewBook Assistant');
        $theme_color = get_option('nawa_theme_color', '#1e3a8a');

        ?>
        <!-- PWA Meta Tags -->
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="<?php echo esc_attr($app_name); ?>">
        <meta name="theme-color" content="<?php echo esc_attr($theme_color); ?>">
        <link rel="manifest" href="<?php echo home_url('/manifest.json'); ?>">
        <link rel="apple-touch-icon" href="<?php echo NAWA_PLUGIN_URL; ?>assets/icons/icon-192x192.png">
        <?php
    }
}

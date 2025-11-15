<?php
/**
 * Plugin Name: NewBook Assistant Web App
 * Plugin URI: https://github.com/yourusername/newbook-assistant-webapp
 * Description: Progressive Web App for multi-department hotel operations management. Requires booking-match-api plugin.
 * Version: 1.0.0
 * Author: Hotel Number Four
 * Author URI: https://hotelnumberfour.co.uk
 * License: Proprietary
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: newbook-assistant-webapp
 * Domain Path: /languages
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('NAWA_VERSION', '1.0.0');
define('NAWA_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('NAWA_PLUGIN_URL', plugin_dir_url(__FILE__));
define('NAWA_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Required dependency check
register_activation_hook(__FILE__, 'nawa_check_dependencies');

/**
 * Check for required dependencies on activation
 */
function nawa_check_dependencies() {
    // Check if booking-match-api is active
    if (!class_exists('Booking_Match_API')) {
        deactivate_plugins(NAWA_PLUGIN_BASENAME);
        wp_die(
            '<h1>Dependency Missing</h1>' .
            '<p><strong>NewBook Assistant Web App</strong> requires the <strong>Booking Match API</strong> plugin to be installed and activated.</p>' .
            '<p><a href="' . admin_url('plugins.php') . '">&laquo; Return to Plugins</a></p>',
            'Plugin Activation Error',
            array('back_link' => true)
        );
    }
}

/**
 * Autoloader for plugin classes
 */
spl_autoload_register('nawa_autoloader');

function nawa_autoloader($class_name) {
    // Only autoload our classes
    if (strpos($class_name, 'NAWA_') !== 0) {
        return;
    }

    // Convert class name to file path
    // NAWA_Core -> class-nawa-core.php
    // NAWA_PWA -> class-nawa-pwa.php
    $class_name_lower = strtolower($class_name);
    $class_file = str_replace('_', '-', $class_name_lower);
    $file_path = NAWA_PLUGIN_DIR . 'includes/class-' . $class_file . '.php';

    if (file_exists($file_path)) {
        require_once $file_path;
    }
}

/**
 * Initialize the plugin
 */
function nawa_init() {
    // Check dependency at runtime too
    if (!class_exists('Booking_Match_API')) {
        add_action('admin_notices', 'nawa_dependency_notice');
        return;
    }

    // Initialize core plugin class
    NAWA_Core::instance();
}
add_action('plugins_loaded', 'nawa_init');

/**
 * Show admin notice if dependency is missing
 */
function nawa_dependency_notice() {
    ?>
    <div class="notice notice-error">
        <p>
            <strong>NewBook Assistant Web App</strong> requires the
            <strong>Booking Match API</strong> plugin to be installed and activated.
        </p>
    </div>
    <?php
}

/**
 * Activation hook
 */
function nawa_activate() {
    // Check dependencies
    nawa_check_dependencies();

    // Set default options
    add_option('nawa_page_slug', 'assistant');
    add_option('nawa_app_name', 'NewBook Assistant');
    add_option('nawa_theme_color', '#1e3a8a');

    // Initialize core to register rewrite rules BEFORE flushing
    require_once NAWA_PLUGIN_DIR . 'includes/class-nawa-core.php';
    require_once NAWA_PLUGIN_DIR . 'includes/class-nawa-pwa.php';
    require_once NAWA_PLUGIN_DIR . 'includes/class-nawa-modules.php';
    require_once NAWA_PLUGIN_DIR . 'includes/class-nawa-ajax.php';

    // Register rewrite rules manually (normally done on 'init')
    $slug = get_option('nawa_page_slug', 'assistant');
    add_rewrite_rule('^' . $slug . '/?$', 'index.php?nawa_assistant=1', 'top');
    add_rewrite_tag('%nawa_assistant%', '1');

    // PWA rewrite rules
    add_rewrite_rule('^manifest\.json$', 'index.php?nawa_manifest=1', 'top');
    add_rewrite_tag('%nawa_manifest%', '1');
    add_rewrite_rule('^sw\.js$', 'index.php?nawa_service_worker=1', 'top');
    add_rewrite_tag('%nawa_service_worker%', '1');

    // NOW flush rewrite rules (with rules registered)
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'nawa_activate');

/**
 * Deactivation hook
 */
function nawa_deactivate() {
    // Flush rewrite rules
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'nawa_deactivate');

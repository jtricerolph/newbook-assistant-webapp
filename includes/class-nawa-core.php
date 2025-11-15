<?php
/**
 * Core Plugin Class
 *
 * Initializes all plugin components
 *
 * @package NewBookAssistantWebApp
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class NAWA_Core {

    /**
     * Singleton instance
     */
    private static $instance = null;

    /**
     * Module registry
     */
    private $modules = array();

    /**
     * Get singleton instance
     */
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->load_components();
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        add_action('init', array($this, 'register_rewrite_rules'));
        add_action('template_redirect', array($this, 'template_redirect'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }

    /**
     * Load plugin components
     */
    private function load_components() {
        // Load PWA handler
        new NAWA_PWA();

        // Load module system
        $module_system = new NAWA_Modules();

        // Load AJAX handler
        new NAWA_AJAX();

        // Load booking module (Phase 1)
        require_once NAWA_PLUGIN_DIR . 'includes/modules/booking/class-booking-module.php';
        $booking_module = new NAWA_Booking_Module();
        $module_system->register_module($booking_module);
    }

    /**
     * Register custom rewrite rules for /assistant/ endpoint
     */
    public function register_rewrite_rules() {
        $slug = get_option('nawa_page_slug', 'assistant');
        add_rewrite_rule('^' . $slug . '/?$', 'index.php?nawa_assistant=1', 'top');
        add_rewrite_tag('%nawa_assistant%', '1');
    }

    /**
     * Handle template redirect for assistant page
     */
    public function template_redirect() {
        if (get_query_var('nawa_assistant')) {
            // Check if user is logged in
            if (!is_user_logged_in()) {
                auth_redirect();
                exit;
            }

            // Check if user has capability
            if (!current_user_can('read')) {
                wp_die('You do not have permission to access this page.');
            }

            // Load minimal template
            $template_file = NAWA_PLUGIN_DIR . 'templates/assistant-page.php';
            if (file_exists($template_file)) {
                include $template_file;
                exit;
            } else {
                wp_die('Template file not found.');
            }
        }
    }

    /**
     * Enqueue assets for assistant page
     */
    public function enqueue_assets() {
        if (!get_query_var('nawa_assistant')) {
            return;
        }

        // Enqueue main app CSS
        wp_enqueue_style(
            'nawa-app',
            NAWA_PLUGIN_URL . 'assets/css/app.css',
            array(),
            NAWA_VERSION
        );

        // Enqueue main app JS
        wp_enqueue_script(
            'nawa-app',
            NAWA_PLUGIN_URL . 'assets/js/app.js',
            array(),
            NAWA_VERSION,
            true
        );

        // Enqueue PWA install handler
        wp_enqueue_script(
            'nawa-pwa-install',
            NAWA_PLUGIN_URL . 'assets/js/pwa-install.js',
            array(),
            NAWA_VERSION,
            true
        );

        // Localize script with settings
        wp_localize_script('nawa-app', 'nawaSettings', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'apiUrl' => rest_url('bma/v1/'),
            'nonce' => wp_create_nonce('nawa_nonce'),
            'currentUser' => array(
                'id' => get_current_user_id(),
                'roles' => wp_get_current_user()->roles,
                'displayName' => wp_get_current_user()->display_name
            ),
            'appName' => get_option('nawa_app_name', 'NewBook Assistant'),
            'themeColor' => get_option('nawa_theme_color', '#1e3a8a')
        ));

        // Load module-specific assets
        do_action('nawa_enqueue_module_assets');
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'NewBook Assistant Settings',
            'NewBook Assistant',
            'manage_options',
            'newbook-assistant',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Handle form submission
        if (isset($_POST['nawa_settings_submit'])) {
            check_admin_referer('nawa_settings');

            update_option('nawa_page_slug', sanitize_title($_POST['nawa_page_slug']));
            update_option('nawa_app_name', sanitize_text_field($_POST['nawa_app_name']));
            update_option('nawa_theme_color', sanitize_hex_color($_POST['nawa_theme_color']));

            // Flush rewrite rules when slug changes
            flush_rewrite_rules();

            echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
        }

        $slug = get_option('nawa_page_slug', 'assistant');
        $app_name = get_option('nawa_app_name', 'NewBook Assistant');
        $theme_color = get_option('nawa_theme_color', '#1e3a8a');
        $assistant_url = home_url('/' . $slug . '/');

        ?>
        <div class="wrap">
            <h1>NewBook Assistant Settings</h1>

            <form method="post" action="">
                <?php wp_nonce_field('nawa_settings'); ?>

                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="nawa_page_slug">Page Slug</label>
                        </th>
                        <td>
                            <input type="text" id="nawa_page_slug" name="nawa_page_slug"
                                   value="<?php echo esc_attr($slug); ?>" class="regular-text">
                            <p class="description">
                                URL slug for the assistant page.
                                Current URL: <a href="<?php echo esc_url($assistant_url); ?>" target="_blank">
                                    <?php echo esc_html($assistant_url); ?>
                                </a>
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="nawa_app_name">App Name</label>
                        </th>
                        <td>
                            <input type="text" id="nawa_app_name" name="nawa_app_name"
                                   value="<?php echo esc_attr($app_name); ?>" class="regular-text">
                            <p class="description">Name displayed when installed as PWA</p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">
                            <label for="nawa_theme_color">Theme Color</label>
                        </th>
                        <td>
                            <input type="color" id="nawa_theme_color" name="nawa_theme_color"
                                   value="<?php echo esc_attr($theme_color); ?>">
                            <p class="description">App theme color for PWA</p>
                        </td>
                    </tr>
                </table>

                <?php submit_button('Save Settings', 'primary', 'nawa_settings_submit'); ?>
            </form>

            <hr>

            <h2>Dependency Status</h2>
            <table class="widefat">
                <thead>
                    <tr>
                        <th>Plugin</th>
                        <th>Status</th>
                        <th>Version</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Booking Match API</td>
                        <td>
                            <?php if (class_exists('Booking_Match_API')): ?>
                                <span style="color: green;">✓ Active</span>
                            <?php else: ?>
                                <span style="color: red;">✗ Not Active</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php echo defined('BMA_VERSION') ? esc_html(BMA_VERSION) : 'N/A'; ?>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <?php
    }
}

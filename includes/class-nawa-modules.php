<?php
/**
 * Module System Class
 *
 * Handles module registration and management
 * Modules are department-specific feature sets (booking, housekeeping, maintenance, etc.)
 *
 * @package NewBookAssistantWebApp
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class NAWA_Modules {

    /**
     * Singleton instance
     */
    private static $instance = null;

    /**
     * Registered modules
     */
    private static $modules = array();

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
        add_action('wp_ajax_nawa_get_modules', array($this, 'ajax_get_modules'));
    }

    /**
     * Register a module
     *
     * @param object $module Module instance (must implement get_config method)
     */
    public function register_module($module) {
        if (!method_exists($module, 'get_config')) {
            return false;
        }

        $config = $module->get_config();

        // Validate required fields
        if (empty($config['id']) || empty($config['name'])) {
            return false;
        }

        self::$modules[$config['id']] = array(
            'instance' => $module,
            'config' => $config
        );

        // Allow module to hook into enqueue
        add_action('nawa_enqueue_module_assets', array($module, 'enqueue_assets'));

        return true;
    }

    /**
     * Get all registered modules
     */
    public static function get_modules() {
        return self::$modules;
    }

    /**
     * Get modules for current user (filtered by roles)
     */
    public static function get_user_modules() {
        $user = wp_get_current_user();
        $user_roles = $user->roles;

        $available_modules = array();

        foreach (self::$modules as $module_id => $module_data) {
            $config = $module_data['config'];

            // Check if user has required role
            $allowed_roles = isset($config['roles']) ? $config['roles'] : array('administrator');

            // Administrator can access all modules
            if (in_array('administrator', $user_roles)) {
                $available_modules[$module_id] = $config;
                continue;
            }

            // Check if user has any of the allowed roles
            $has_access = false;
            foreach ($user_roles as $role) {
                if (in_array($role, $allowed_roles)) {
                    $has_access = true;
                    break;
                }
            }

            if ($has_access) {
                $available_modules[$module_id] = $config;
            }
        }

        return $available_modules;
    }

    /**
     * AJAX: Get modules for current user
     */
    public function ajax_get_modules() {
        check_ajax_referer('nawa_nonce', 'nonce');

        $modules = self::get_user_modules();

        wp_send_json_success(array(
            'modules' => $modules
        ));
    }

    /**
     * Get module by ID
     */
    public static function get_module($module_id) {
        return isset(self::$modules[$module_id]) ? self::$modules[$module_id] : null;
    }
}

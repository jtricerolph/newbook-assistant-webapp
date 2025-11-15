<?php
/**
 * AJAX Handler Class
 *
 * Handles AJAX requests from the frontend
 *
 * @package NewBookAssistantWebApp
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class NAWA_AJAX {

    /**
     * Constructor
     */
    public function __construct() {
        // General AJAX endpoints
        add_action('wp_ajax_nawa_test', array($this, 'ajax_test'));

        // Future: Add more AJAX handlers as needed
        // Modules can register their own AJAX handlers
    }

    /**
     * Test AJAX endpoint
     */
    public function ajax_test() {
        check_ajax_referer('nawa_nonce', 'nonce');

        wp_send_json_success(array(
            'message' => 'AJAX is working!',
            'user' => wp_get_current_user()->display_name,
            'timestamp' => current_time('mysql')
        ));
    }
}

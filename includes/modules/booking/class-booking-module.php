<?php
/**
 * Booking Module
 *
 * Handles booking assistant functionality
 * - Summary tab
 * - Restaurant tab
 * - Checks tab
 *
 * @package NewBookAssistantWebApp
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class NAWA_Booking_Module {

    /**
     * Constructor
     */
    public function __construct() {
        // Register AJAX handlers for tabs
        add_action('wp_ajax_nawa_booking_summary', array($this, 'ajax_summary'));
        add_action('wp_ajax_nawa_booking_restaurant', array($this, 'ajax_restaurant'));
        add_action('wp_ajax_nawa_booking_checks', array($this, 'ajax_checks'));
    }

    /**
     * Get module configuration
     */
    public function get_config() {
        return array(
            'id' => 'booking',
            'name' => 'Booking Assistant',
            'icon' => 'calendar_today',
            'description' => 'Manage hotel bookings and restaurant matches',
            'roles' => array('administrator', 'editor', 'booking_manager'),
            'tabs' => array(
                'summary' => array(
                    'id' => 'summary',
                    'name' => 'Summary',
                    'icon' => 'dashboard',
                    'badge_count' => 0
                ),
                'restaurant' => array(
                    'id' => 'restaurant',
                    'name' => 'Restaurant',
                    'icon' => 'restaurant',
                    'badge_count' => 0
                ),
                'checks' => array(
                    'id' => 'checks',
                    'name' => 'Checks',
                    'icon' => 'check_circle',
                    'badge_count' => 0
                )
            )
        );
    }

    /**
     * Enqueue module assets
     */
    public function enqueue_assets() {
        // Only enqueue on assistant page
        if (!get_query_var('nawa_assistant')) {
            return;
        }

        // Enqueue booking module CSS
        wp_enqueue_style(
            'nawa-booking-module',
            NAWA_PLUGIN_URL . 'assets/css/modules/booking.css',
            array('nawa-app'),
            NAWA_VERSION
        );

        // Enqueue booking module JS
        wp_enqueue_script(
            'nawa-booking-module',
            NAWA_PLUGIN_URL . 'assets/js/modules/booking.js',
            array('nawa-app'),
            NAWA_VERSION,
            true
        );

        // Enqueue booking interactions JS (Phase 1: Card accordion, navigation)
        wp_enqueue_script(
            'nawa-booking-interactions',
            NAWA_PLUGIN_URL . 'assets/js/modules/booking-interactions.js',
            array('nawa-app', 'nawa-booking-module'),
            NAWA_VERSION,
            true
        );
    }

    /**
     * AJAX: Get summary tab content
     */
    public function ajax_summary() {
        check_ajax_referer('nawa_nonce', 'nonce');

        // Check if booking-match-api is available
        if (!class_exists('BMA_REST_Controller')) {
            wp_send_json_error(array(
                'message' => 'Booking Match API not available'
            ));
        }

        // Call the REST controller directly (same WordPress installation)
        $controller = new BMA_REST_Controller();

        // Create a mock WP_REST_Request with webapp-summary context
        $request = new WP_REST_Request('GET', '/bma/v1/summary');
        $request->set_param('context', 'webapp-summary');
        $request->set_param('limit', 10); // Show 10 most recent bookings (default is 5)
        $request->set_param('cancelled_hours', 48); // Show cancelled bookings from last 48 hours (default is 24)

        // Get response
        $response = $controller->get_summary($request);

        // Return as JSON
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch summary data',
                'error' => $response->get_error_message()
            ));
        }

        // Format response for webapp frontend (combine placed + cancelled HTML)
        $html = '';
        if (!empty($response['html_placed'])) {
            $html .= $response['html_placed'];
        }
        if (!empty($response['html_cancelled'])) {
            $html .= $response['html_cancelled'];
        }

        wp_send_json_success(array(
            'html' => $html,
            'badge_count' => isset($response['badge_count']) ? $response['badge_count'] : 0,
            'placed_count' => isset($response['placed_count']) ? $response['placed_count'] : 0,
            'cancelled_count' => isset($response['cancelled_count']) ? $response['cancelled_count'] : 0
        ));
    }

    /**
     * AJAX: Get restaurant tab content
     */
    public function ajax_restaurant() {
        check_ajax_referer('nawa_nonce', 'nonce');

        $booking_id = isset($_POST['booking_id']) ? intval($_POST['booking_id']) : 0;

        if (!$booking_id) {
            wp_send_json_error(array('message' => 'No booking ID provided'));
        }

        // Check if booking-match-api is available
        if (!class_exists('BMA_REST_Controller')) {
            wp_send_json_error(array(
                'message' => 'Booking Match API not available'
            ));
        }

        // Call the REST controller directly (same WordPress installation)
        $controller = new BMA_REST_Controller();

        // Create a mock WP_REST_Request
        $request = new WP_REST_Request('POST', '/bma/v1/bookings/match');
        $request->set_body_params(array(
            'booking_id' => $booking_id,
            'context' => 'webapp-restaurant'
        ));

        // Get response
        $response = $controller->match_booking($request);

        // Return as JSON
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch restaurant matches',
                'error' => $response->get_error_message()
            ));
        }

        // Extract data from WP_REST_Response object
        $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;

        // Format response for webapp frontend
        wp_send_json_success(array(
            'html' => isset($data['html']) ? $data['html'] : '',
            'badge_count' => 0 // Restaurant tab doesn't use badge count
        ));
    }

    /**
     * AJAX: Get checks tab content
     */
    public function ajax_checks() {
        check_ajax_referer('nawa_nonce', 'nonce');

        $booking_id = isset($_POST['booking_id']) ? intval($_POST['booking_id']) : 0;

        if (!$booking_id) {
            wp_send_json_error(array('message' => 'No booking ID provided'));
        }

        // Check if booking-match-api is available
        if (!class_exists('BMA_REST_Controller')) {
            wp_send_json_error(array(
                'message' => 'Booking Match API not available'
            ));
        }

        // Call the REST controller directly (same WordPress installation)
        $controller = new BMA_REST_Controller();

        // Create a mock WP_REST_Request
        $request = new WP_REST_Request('GET', '/bma/v1/checks/' . $booking_id);
        $request->set_param('context', 'webapp-checks');

        // Get response
        $response = $controller->get_checks($request);

        // Return as JSON
        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch checks data',
                'error' => $response->get_error_message()
            ));
        }

        // Extract data from WP_REST_Response object
        $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;

        // Format response for webapp frontend
        wp_send_json_success(array(
            'html' => isset($data['html']) ? $data['html'] : '',
            'badge_count' => isset($data['badge_count']) ? $data['badge_count'] : 0
        ));
    }
}

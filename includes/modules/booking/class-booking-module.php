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

        // Register AJAX handlers for ResOS API helpers
        add_action('wp_ajax_nawa_opening_hours', array($this, 'ajax_opening_hours'));
        add_action('wp_ajax_nawa_dietary_choices', array($this, 'ajax_dietary_choices'));
        add_action('wp_ajax_nawa_available_times', array($this, 'ajax_available_times'));
        add_action('wp_ajax_nawa_special_events', array($this, 'ajax_special_events'));
        add_action('wp_ajax_nawa_booking_compare', array($this, 'ajax_booking_compare'));
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

        // Enqueue ResOS API helpers (used by inline scripts in API HTML responses)
        wp_enqueue_script(
            'nawa-resos-api-helpers',
            NAWA_PLUGIN_URL . 'assets/js/modules/resos-api-helpers.js',
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
        $request->set_param('force_refresh', false); // Use cache to avoid rate limiting
        $request->set_param('force_refresh_matches', false); // Use cache for matching data

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
            'context' => 'webapp-restaurant',
            'force_refresh' => false, // Use cache to avoid rate limiting
            'force_refresh_matches' => false // Use cache for matching data
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
        $request->set_param('force_refresh', false); // Use cache to avoid rate limiting

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

    /**
     * AJAX: Get opening hours for a date
     */
    public function ajax_opening_hours() {
        check_ajax_referer('nawa_nonce', 'nonce');

        $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';

        if (!$date) {
            wp_send_json_error(array('message' => 'No date provided'));
        }

        if (!class_exists('BMA_REST_Controller')) {
            wp_send_json_error(array('message' => 'Booking Match API not available'));
        }

        $controller = new BMA_REST_Controller();
        $request = new WP_REST_Request('GET', '/bma/v1/opening-hours');
        $request->set_param('date', $date);
        $request->set_param('context', 'chrome-extension'); // Get HTML format
        $request->set_param('force_refresh', false); // Use cache to avoid rate limiting

        $response = $controller->get_opening_hours($request);

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch opening hours',
                'error' => $response->get_error_message()
            ));
        }

        $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;
        // Return data as-is (BMA controller already formats it correctly)
        wp_send_json($data);
    }

    /**
     * AJAX: Get dietary choices
     */
    public function ajax_dietary_choices() {
        check_ajax_referer('nawa_nonce', 'nonce');

        if (!class_exists('BMA_REST_Controller')) {
            wp_send_json_error(array('message' => 'Booking Match API not available'));
        }

        $controller = new BMA_REST_Controller();
        $request = new WP_REST_Request('GET', '/bma/v1/dietary-choices');
        $request->set_param('context', 'chrome-extension'); // Get HTML format
        $request->set_param('force_refresh', false); // Use cache to avoid rate limiting

        $response = $controller->get_dietary_choices($request);

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch dietary choices',
                'error' => $response->get_error_message()
            ));
        }

        $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;
        // Return data as-is (BMA controller already formats it correctly)
        wp_send_json($data);
    }

    /**
     * AJAX: Get available times
     */
    public function ajax_available_times() {
        check_ajax_referer('nawa_nonce', 'nonce');

        $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';
        $people = isset($_POST['people']) ? intval($_POST['people']) : 2;
        $opening_hour_id = isset($_POST['opening_hour_id']) ? sanitize_text_field($_POST['opening_hour_id']) : '';

        if (!$date) {
            wp_send_json_error(array('message' => 'No date provided'));
        }

        if (!class_exists('BMA_REST_Controller')) {
            wp_send_json_error(array('message' => 'Booking Match API not available'));
        }

        $controller = new BMA_REST_Controller();
        $request = new WP_REST_Request('GET', '/bma/v1/available-times');
        $request->set_param('date', $date);
        $request->set_param('people', $people);
        if ($opening_hour_id) {
            $request->set_param('opening_hour_id', $opening_hour_id);
        }
        $request->set_param('context', 'chrome-extension'); // Get HTML format
        $request->set_param('force_refresh', false); // Use cache to avoid rate limiting

        $response = $controller->get_available_times($request);

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch available times',
                'error' => $response->get_error_message()
            ));
        }

        $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;
        // Return data as-is (BMA controller already formats it correctly)
        wp_send_json($data);
    }

    /**
     * AJAX: Get special events
     */
    public function ajax_special_events() {
        check_ajax_referer('nawa_nonce', 'nonce');

        $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';

        if (!$date) {
            wp_send_json_error(array('message' => 'No date provided'));
        }

        if (!class_exists('BMA_REST_Controller')) {
            wp_send_json_error(array('message' => 'Booking Match API not available'));
        }

        $controller = new BMA_REST_Controller();
        $request = new WP_REST_Request('GET', '/bma/v1/special-events');
        $request->set_param('date', $date);
        $request->set_param('context', 'chrome-extension'); // Get HTML format
        $request->set_param('force_refresh', false); // Use cache to avoid rate limiting

        $response = $controller->get_special_events($request);

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch special events',
                'error' => $response->get_error_message()
            ));
        }

        $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;
        // Return data as-is (BMA controller already formats it correctly)
        wp_send_json($data);
    }

    /**
     * AJAX: Get booking comparison
     */
    public function ajax_booking_compare() {
        check_ajax_referer('nawa_nonce', 'nonce');

        $resos_booking_id = isset($_POST['resos_booking_id']) ? sanitize_text_field($_POST['resos_booking_id']) : '';
        $hotel_booking_id = isset($_POST['hotel_booking_id']) ? intval($_POST['hotel_booking_id']) : 0;
        $date = isset($_POST['date']) ? sanitize_text_field($_POST['date']) : '';

        if (!$resos_booking_id || !$hotel_booking_id || !$date) {
            wp_send_json_error(array('message' => 'Missing required parameters'));
        }

        if (!class_exists('BMA_REST_Controller')) {
            wp_send_json_error(array('message' => 'Booking Match API not available'));
        }

        $controller = new BMA_REST_Controller();
        $request = new WP_REST_Request('POST', '/bma/v1/comparison');
        $request->set_body_params(array(
            'resos_booking_id' => $resos_booking_id,
            'booking_id' => $hotel_booking_id, // Use 'booking_id' not 'hotel_booking_id'
            'date' => $date,
            'context' => 'chrome-extension', // Use chrome-extension context for HTML format
            'force_refresh' => false // Use cache to avoid rate limiting
        ));

        $response = $controller->get_comparison($request);

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch comparison',
                'error' => $response->get_error_message()
            ));
        }

        $data = $response instanceof WP_REST_Response ? $response->get_data() : $response;
        // Return data as-is (BMA controller already formats it correctly)
        wp_send_json($data);
    }
}

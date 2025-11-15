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
    }

    /**
     * AJAX: Get summary tab content
     */
    public function ajax_summary() {
        check_ajax_referer('nawa_nonce', 'nonce');

        // Call booking-match-api endpoint with webapp-summary context
        $api_url = rest_url('bma/v1/summary');
        $api_url = add_query_arg('context', 'webapp-summary', $api_url);

        $response = wp_remote_get($api_url, array(
            'cookies' => $_COOKIE // Pass along authentication
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch summary data',
                'error' => $response->get_error_message()
            ));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        wp_send_json($data);
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

        // Call booking-match-api endpoint with webapp-restaurant context
        $api_url = rest_url('bma/v1/bookings/match');

        $response = wp_remote_post($api_url, array(
            'cookies' => $_COOKIE,
            'body' => json_encode(array(
                'booking_id' => $booking_id,
                'context' => 'webapp-restaurant'
            )),
            'headers' => array(
                'Content-Type' => 'application/json'
            )
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch restaurant matches',
                'error' => $response->get_error_message()
            ));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        wp_send_json($data);
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

        // Call booking-match-api endpoint with webapp-checks context
        $api_url = rest_url('bma/v1/checks/' . $booking_id);
        $api_url = add_query_arg('context', 'webapp-checks', $api_url);

        $response = wp_remote_get($api_url, array(
            'cookies' => $_COOKIE
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array(
                'message' => 'Failed to fetch checks data',
                'error' => $response->get_error_message()
            ));
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        wp_send_json($data);
    }
}

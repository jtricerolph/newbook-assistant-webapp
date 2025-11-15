# NewBook Assistant Web App - Developer Reference

**Version:** 1.0.0
**Last Updated:** 2025-11-15

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Code Flow](#code-flow)
3. [PHP Classes Reference](#php-classes-reference)
4. [JavaScript Reference](#javascript-reference)
5. [API Integration](#api-integration)
6. [Module System](#module-system)
7. [PWA Implementation](#pwa-implementation)
8. [Hooks & Filters](#hooks--filters)

---

## Architecture Overview

### Technology Stack
- **Backend**: WordPress plugin (PHP 7.4+)
- **Frontend**: Vanilla JavaScript (ES6+)
- **CSS**: Mobile-first responsive design
- **PWA**: Service Worker + Manifest

### Plugin Structure
```
newbook-assistant-webapp/
├── newbook-assistant-webapp.php    # Main plugin file, autoloader, activation
├── includes/                       # PHP classes
│   ├── class-nawa-core.php        # Core initialization
│   ├── class-nawa-pwa.php         # PWA manifest & service worker
│   ├── class-nawa-modules.php     # Module registration system
│   ├── class-nawa-ajax.php        # AJAX handlers
│   └── modules/                    # Department modules
│       └── booking/
│           └── class-booking-module.php
├── assets/
│   ├── js/
│   │   ├── app.js                 # Main application logic
│   │   ├── pwa-install.js         # Install prompt handler
│   │   ├── service-worker.js      # PWA offline functionality
│   │   └── modules/
│   │       └── booking.js         # Booking module frontend
│   ├── css/
│   │   ├── app.css                # Base mobile-first styles
│   │   └── modules/
│   │       └── booking.css        # Booking module styles
│   └── icons/                      # PWA icons (192x192, 512x512)
└── templates/
    └── assistant-page.php          # Minimal page template
```

---

## Code Flow

### 1. Page Load Flow

```
User navigates to /assistant/
    ↓
WordPress processes rewrite rule (nawa_assistant=1)
    ↓
NAWA_Core::template_redirect() checks authentication
    ↓
templates/assistant-page.php loads
    ↓
wp_head() enqueues assets (app.js, app.css, module assets)
    ↓
JavaScript initializes: NAWAApp.init()
    ↓
Load modules for current user (AJAX: nawa_get_modules)
    ↓
Render module selector (if multiple modules)
    ↓
Load first module and first tab
    ↓
Module-specific JavaScript loads content
```

### 2. Tab Loading Flow

```
User clicks tab button
    ↓
NAWAApp.switchTab(tabId)
    ↓
Update UI (active tab highlighting)
    ↓
Dispatch custom event: 'nawa:tab-change'
    ↓
Module JavaScript listens and responds
    ↓
(Booking example)
    ↓
NAWABookingModule.handleTabChange()
    ↓
Make AJAX call to WordPress (nawa_booking_summary)
    ↓
AJAX handler calls booking-match-api REST endpoint
    ↓
API returns HTML with webapp-* context
    ↓
Display content in #nawa-content area
    ↓
Update badge counts
```

### 3. Module Registration Flow

```
Plugin activation
    ↓
NAWA_Core::load_components()
    ↓
new NAWA_Modules() (module registry)
    ↓
Load module classes (e.g., NAWA_Booking_Module)
    ↓
Module returns config via get_config()
    ↓
NAWA_Modules::register_module() adds to registry
    ↓
Module registers AJAX handlers
    ↓
Module hooks into 'nawa_enqueue_module_assets'
```

---

## PHP Classes Reference

### NAWA_Core

**File:** `includes/class-nawa-core.php`
**Purpose:** Main plugin initialization and coordination

#### Properties
- `$instance` (static) - Singleton instance
- `$modules` (array) - Registered modules registry

#### Methods

**`instance()` → NAWA_Core**
- **Type:** Static
- **Returns:** Singleton instance
- **Description:** Get or create singleton instance

**`register_rewrite_rules()` → void**
- **Hooked:** `init`
- **Description:** Registers `/assistant/` rewrite rule
- **Variables Used:**
  - `nawa_page_slug` (option) - Default: 'assistant'
  - Creates rewrite tag: `%nawa_assistant%`

**`template_redirect()` → void**
- **Hooked:** `template_redirect`
- **Description:** Intercepts assistant page requests, checks auth, loads template
- **Flow:**
  1. Check `get_query_var('nawa_assistant')`
  2. Check `is_user_logged_in()` - redirect if not
  3. Check `current_user_can('read')`
  4. Load `templates/assistant-page.php`
  5. Exit

**`enqueue_assets()` → void**
- **Hooked:** `wp_enqueue_scripts`
- **Description:** Enqueues CSS/JS assets for assistant page only
- **Assets Enqueued:**
  - `nawa-app` (CSS) - Main styles
  - `nawa-app` (JS) - Main app logic
  - `nawa-pwa-install` (JS) - PWA install handler
- **Localized Data:** `nawaSettings`
  ```php
  [
    'ajaxUrl' => admin_url('admin-ajax.php'),
    'apiUrl' => rest_url('bma/v1/'),
    'nonce' => wp_create_nonce('nawa_nonce'),
    'currentUser' => [
      'id' => get_current_user_id(),
      'roles' => wp_get_current_user()->roles,
      'displayName' => wp_get_current_user()->display_name
    ],
    'appName' => get_option('nawa_app_name', 'NewBook Assistant'),
    'themeColor' => get_option('nawa_theme_color', '#1e3a8a')
  ]
  ```

**`add_admin_menu()` → void**
- **Hooked:** `admin_menu`
- **Description:** Adds settings page under Settings menu
- **Menu Location:** Settings → NewBook Assistant
- **Capability Required:** `manage_options`

**`render_settings_page()` → void**
- **Description:** Renders settings page HTML
- **Form Fields:**
  - `nawa_page_slug` - URL slug for assistant page
  - `nawa_app_name` - PWA app name
  - `nawa_theme_color` - PWA theme color
- **Actions:** Saves settings, flushes rewrite rules

---

### NAWA_PWA

**File:** `includes/class-nawa-pwa.php`
**Purpose:** Handles Progressive Web App functionality

#### Methods

**`register_manifest_endpoint()` → void**
- **Hooked:** `init`
- **Description:** Creates `/manifest.json` endpoint
- **Rewrite Rule:** `^manifest\.json$` → `nawa_manifest=1`

**`serve_manifest()` → void**
- **Hooked:** `template_redirect`
- **Description:** Serves PWA manifest.json
- **Output Format:** JSON
- **Manifest Structure:**
  ```json
  {
    "name": "NewBook Assistant",
    "short_name": "NewBook Assistant",
    "description": "Hotel operations management assistant",
    "start_url": "/assistant/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#1e3a8a",
    "orientation": "portrait",
    "icons": [
      {
        "src": "/wp-content/plugins/newbook-assistant-webapp/assets/icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": ".../icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  }
  ```

**`register_service_worker_endpoint()` → void**
- **Hooked:** `init`
- **Description:** Creates `/sw.js` endpoint
- **Rewrite Rule:** `^sw\.js$` → `nawa_service_worker=1`

**`serve_service_worker()` → void**
- **Hooked:** `template_redirect`
- **Description:** Serves service worker JavaScript file
- **Output Format:** application/javascript
- **Headers Set:**
  - `Content-Type: application/javascript`
  - `Service-Worker-Allowed: /`

**`add_pwa_meta_tags()` → void**
- **Hooked:** `wp_head`
- **Description:** Adds PWA meta tags to assistant page head
- **Meta Tags Added:**
  ```html
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="NewBook Assistant">
  <meta name="theme-color" content="#1e3a8a">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href=".../icon-192x192.png">
  ```

---

### NAWA_Modules

**File:** `includes/class-nawa-modules.php`
**Purpose:** Module registration and management system

#### Properties
- `$modules` (static array) - Registry of registered modules

#### Methods

**`register_module($module)` → bool**
- **Parameters:**
  - `$module` (object) - Module instance with `get_config()` method
- **Returns:** `true` on success, `false` on failure
- **Description:** Registers a module in the system
- **Validation:**
  - Checks for `get_config()` method
  - Requires `id` and `name` in config
- **Side Effects:**
  - Stores module instance and config
  - Hooks module's `enqueue_assets()` into `nawa_enqueue_module_assets`

**`get_modules()` → array**
- **Type:** Static
- **Returns:** Array of all registered modules
- **Format:**
  ```php
  [
    'booking' => [
      'instance' => NAWA_Booking_Module,
      'config' => [...]
    ]
  ]
  ```

**`get_user_modules()` → array**
- **Type:** Static
- **Returns:** Array of modules accessible to current user
- **Description:** Filters modules based on user roles
- **Logic:**
  - Administrators get all modules
  - Other users filtered by `roles` array in module config
- **Output Format:**
  ```php
  [
    'booking' => [
      'id' => 'booking',
      'name' => 'Booking Assistant',
      'icon' => 'calendar_today',
      'roles' => ['administrator', 'editor'],
      'tabs' => [...]
    ]
  ]
  ```

**`ajax_get_modules()` → void**
- **AJAX Action:** `nawa_get_modules`
- **Nonce:** `nawa_nonce`
- **Output:** JSON
  ```json
  {
    "success": true,
    "data": {
      "modules": { ... }
    }
  }
  ```

**`get_module($module_id)` → array|null**
- **Parameters:** `$module_id` (string)
- **Returns:** Module data or null if not found

---

### NAWA_Booking_Module

**File:** `includes/modules/booking/class-booking-module.php`
**Purpose:** Booking assistant module implementation

#### Methods

**`get_config()` → array**
- **Returns:** Module configuration array
- **Structure:**
  ```php
  [
    'id' => 'booking',
    'name' => 'Booking Assistant',
    'icon' => 'calendar_today',  // Material Symbol
    'description' => 'Manage hotel bookings and restaurant matches',
    'roles' => ['administrator', 'editor', 'booking_manager'],
    'tabs' => [
      'summary' => [
        'id' => 'summary',
        'name' => 'Summary',
        'icon' => 'dashboard',
        'badge_count' => 0
      ],
      'restaurant' => [
        'id' => 'restaurant',
        'name' => 'Restaurant',
        'icon' => 'restaurant',
        'badge_count' => 0
      ],
      'checks' => [
        'id' => 'checks',
        'name' => 'Checks',
        'icon' => 'check_circle',
        'badge_count' => 0
      ]
    ]
  ]
  ```

**`enqueue_assets()` → void**
- **Hooked:** `nawa_enqueue_module_assets`
- **Description:** Enqueues booking module specific assets
- **Assets:**
  - `nawa-booking-module` (CSS) - Booking styles
  - `nawa-booking-module` (JS) - Booking functionality

**`ajax_summary()` → void**
- **AJAX Action:** `nawa_booking_summary`
- **Nonce:** `nawa_nonce`
- **Description:** Proxies request to booking-match-api `/summary` endpoint
- **Flow:**
  1. Build API URL: `rest_url('bma/v1/summary')`
  2. Add context parameter: `?context=webapp-summary`
  3. Call via `wp_remote_get()` with cookies for auth
  4. Return JSON response
- **Output:**
  ```json
  {
    "success": true,
    "html_placed": "<div>...</div>",
    "html_cancelled": "<div>...</div>",
    "badge_count": 5
  }
  ```

**`ajax_restaurant()` → void**
- **AJAX Action:** `nawa_booking_restaurant`
- **Nonce:** `nawa_nonce`
- **Parameters:** `booking_id` (POST)
- **Description:** Proxies request to booking-match-api `/bookings/match`
- **API Call:**
  ```php
  POST rest_url('bma/v1/bookings/match')
  Body: {
    booking_id: 12345,
    context: 'webapp-restaurant'
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "html": "<div>...</div>",
    "badge_count": 2
  }
  ```

**`ajax_checks()` → void**
- **AJAX Action:** `nawa_booking_checks`
- **Nonce:** `nawa_nonce`
- **Parameters:** `booking_id` (POST)
- **Description:** Proxies request to booking-match-api `/checks/{id}`
- **API Call:**
  ```php
  GET rest_url('bma/v1/checks/' . $booking_id . '?context=webapp-checks')
  ```
- **Output:**
  ```json
  {
    "success": true,
    "html": "<div>...</div>",
    "badge_count": 0
  }
  ```

---

## JavaScript Reference

### NAWAApp (app.js)

**Purpose:** Main application controller

#### Properties (Private)
- `currentModule` (string|null) - Active module ID
- `currentTab` (string|null) - Active tab ID
- `modules` (object) - Loaded modules configuration

#### Methods

**`init()` → void**
- **Description:** Initialize the application
- **Called:** On DOMContentLoaded
- **Flow:**
  1. Log initialization
  2. Call `loadModules()`
  3. Call `setupEventListeners()`
  4. Call `registerServiceWorker()`

**`loadModules()` → Promise**
- **Description:** Fetch available modules for current user
- **AJAX Call:**
  ```javascript
  POST /wp-admin/admin-ajax.php
  action: nawa_get_modules
  nonce: nawaSettings.nonce
  ```
- **Response Handler:**
  1. Store modules in `modules` variable
  2. Render module selector if multiple modules
  3. Switch to first module automatically
- **Error Handling:** Shows error state via `showError()`

**`renderModuleSelector()` → void**
- **Description:** Renders module selection buttons
- **DOM Target:** `#nawa-module-selector`
- **HTML Generated:**
  ```html
  <div class="nawa-module-buttons">
    <button class="nawa-module-btn" data-module="booking">
      <span class="material-symbols-outlined">calendar_today</span>
      <span>Booking Assistant</span>
    </button>
    <!-- More modules... -->
  </div>
  ```
- **Event Handlers:** Adds click handlers for module switching

**`switchModule(moduleId)` → void**
- **Parameters:** `moduleId` (string)
- **Description:** Switch to different module
- **Flow:**
  1. Update `currentModule`
  2. Update active button styling
  3. Call `renderTabs()` with module tabs
  4. Switch to first tab

**`renderTabs(tabs)` → void**
- **Parameters:** `tabs` (object) - Tab configuration
- **Description:** Renders tab navigation
- **DOM Targets:**
  - `#nawa-tab-nav` (desktop)
  - `#nawa-bottom-nav` (mobile)
- **HTML Generated:**
  ```html
  <button class="nawa-tab-btn" data-tab="summary">
    <span class="material-symbols-outlined">dashboard</span>
    <span class="nawa-tab-label">Summary</span>
    <span class="nawa-badge">5</span>
  </button>
  ```
- **Event Handlers:** Adds click handlers for tab switching

**`switchTab(tabId)` → void**
- **Parameters:** `tabId` (string)
- **Description:** Switch to different tab
- **Flow:**
  1. Update `currentTab`
  2. Update active tab styling
  3. Dispatch `nawa:tab-change` custom event
- **Custom Event Detail:**
  ```javascript
  {
    module: 'booking',
    tab: 'summary'
  }
  ```

**`refreshCurrentTab()` → void**
- **Description:** Manually refresh current tab content
- **Flow:**
  1. Log refresh action
  2. Dispatch `nawa:refresh` custom event
- **Event Detail:**
  ```javascript
  {
    module: 'booking',
    tab: 'summary'
  }
  ```

**`setupEventListeners()` → void**
- **Description:** Set up global event listeners
- **Listeners:**
  - `#nawa-refresh-btn` click → `refreshCurrentTab()`

**`registerServiceWorker()` → void**
- **Description:** Register PWA service worker
- **File:** `/sw.js`
- **Browser Check:** Only if `navigator.serviceWorker` exists
- **Console Logging:** Success/failure messages

**`showLoading(message)` → void**
- **Parameters:** `message` (string) - Optional loading message
- **Description:** Display loading state
- **DOM Target:** `#nawa-content`
- **HTML:**
  ```html
  <div class="nawa-loading">
    <div class="nawa-spinner"></div>
    <p>Loading...</p>
  </div>
  ```

**`showError(message)` → void**
- **Parameters:** `message` (string) - Error message
- **Description:** Display error state
- **HTML:**
  ```html
  <div class="nawa-error">
    <span class="material-symbols-outlined">error</span>
    <p>Error message here</p>
  </div>
  ```

**`updateBadge(tabId, count)` → void**
- **Parameters:**
  - `tabId` (string) - Tab identifier
  - `count` (number) - Badge count
- **Description:** Update or remove badge on tab button
- **Logic:**
  - If count > 0: Show/update badge
  - If count === 0: Remove badge

**`getCurrentModule()` → string|null**
- **Returns:** Current active module ID

**`getCurrentTab()` → string|null**
- **Returns:** Current active tab ID

---

### NAWABookingModule (modules/booking.js)

**Purpose:** Booking module frontend logic

#### Properties (Private)
- `currentBookingId` (number|null) - Selected booking ID

#### Methods

**`init()` → void**
- **Description:** Initialize booking module
- **Event Listeners:**
  - `nawa:tab-change` → `handleTabChange()`
  - `nawa:refresh` → `handleRefresh()`

**`handleTabChange(event)` → void**
- **Parameters:** `event` (CustomEvent)
- **Event Detail:**
  ```javascript
  {
    module: 'booking',
    tab: 'summary'
  }
  ```
- **Description:** Handle tab change events
- **Flow:**
  1. Check if module === 'booking'
  2. Route to appropriate tab loader:
     - `summary` → `loadSummaryTab()`
     - `restaurant` → `loadRestaurantTab()`
     - `checks` → `loadChecksTab()`

**`handleRefresh(event)` → void**
- **Parameters:** `event` (CustomEvent)
- **Description:** Handle manual refresh
- **Flow:**
  1. Check if module === 'booking'
  2. Call `handleTabChange()` to reload current tab

**`loadSummaryTab()` → Promise**
- **Description:** Load summary tab content
- **AJAX Call:**
  ```javascript
  POST /wp-admin/admin-ajax.php
  action: nawa_booking_summary
  nonce: nawaSettings.nonce
  ```
- **Response:**
  ```javascript
  {
    success: true,
    html_placed: "<div>...</div>",
    html_cancelled: "<div>...</div>",
    badge_count: 5
  }
  ```
- **Flow:**
  1. Show loading state
  2. Make AJAX call
  3. Display HTML content
  4. Update badge count
  5. Handle errors

**`loadRestaurantTab()` → Promise**
- **Description:** Load restaurant matches for selected booking
- **Prerequisite:** `currentBookingId` must be set
- **If No Booking:** Shows booking search interface via `displayBookingSearch()`
- **AJAX Call:**
  ```javascript
  POST /wp-admin/admin-ajax.php
  action: nawa_booking_restaurant
  nonce: nawaSettings.nonce
  booking_id: 12345
  ```
- **Response:**
  ```javascript
  {
    success: true,
    html: "<div>...</div>",
    badge_count: 2
  }
  ```

**`loadChecksTab()` → Promise**
- **Description:** Load validation checks for selected booking
- **Prerequisite:** `currentBookingId` must be set
- **If No Booking:** Shows booking search interface
- **AJAX Call:**
  ```javascript
  POST /wp-admin/admin-ajax.php
  action: nawa_booking_checks
  nonce: nawaSettings.nonce
  booking_id: 12345
  ```

**`displayBookingSearch()` → void**
- **Description:** Show booking ID search form
- **HTML Generated:**
  ```html
  <div class="nawa-booking-search">
    <div class="nawa-search-icon">
      <span class="material-symbols-outlined">search</span>
    </div>
    <h2>Search for a Booking</h2>
    <form id="nawa-booking-search-form">
      <input type="number" placeholder="Enter Booking ID" required autofocus>
      <button type="submit">Search</button>
    </form>
  </div>
  ```
- **Event Handler:** Form submit → `setCurrentBooking()`

**`setCurrentBooking(bookingId)` → void**
- **Parameters:** `bookingId` (number)
- **Description:** Set current booking and reload tab
- **Flow:**
  1. Store booking ID in `currentBookingId`
  2. Call `handleTabChange()` to reload current tab with new booking

**`displayContent(html)` → void**
- **Parameters:** `html` (string)
- **Description:** Display HTML in content area
- **DOM Target:** `#nawa-content`

**`getCurrentBooking()` → number|null**
- **Returns:** Current booking ID or null

---

### PWA Install Handler (pwa-install.js)

**Purpose:** Handle PWA installation prompt

#### Variables
- `deferredPrompt` (Event|null) - Stored beforeinstallprompt event
- `installBtn` (Element) - Install button element

#### Event Listeners

**`beforeinstallprompt`**
- **Description:** Fired when browser detects PWA installability
- **Flow:**
  1. Prevent default mini-infobar
  2. Store event in `deferredPrompt`
  3. Show `#nawa-install-btn`

**Install Button Click**
- **Description:** Show install prompt when user clicks button
- **Flow:**
  1. Call `deferredPrompt.prompt()`
  2. Wait for user choice
  3. Clear `deferredPrompt`
  4. Hide install button

**`appinstalled`**
- **Description:** Fired when app is installed
- **Flow:**
  1. Log installation
  2. Hide install button
  3. Clear `deferredPrompt`

**Display Mode Check**
- **Description:** Check if already running as installed app
- **Media Query:** `(display-mode: standalone)`
- **If True:** Hide install button

---

## API Integration

### Booking Match API Endpoints Used

#### 1. Summary Endpoint

**URL:** `GET /wp-json/bma/v1/summary?context=webapp-summary`

**Authentication:** WordPress session cookies

**Parameters:**
- `context` (string) - `webapp-summary`
- `limit` (int, optional) - Number of bookings (default: 5)
- `force_refresh` (bool, optional) - Bypass cache

**Response:**
```json
{
  "success": true,
  "html_placed": "<div class='bma-booking-card'>...</div>",
  "html_cancelled": "<div>...</div>",
  "placed_count": 12,
  "cancelled_count": 3,
  "critical_count": 2,
  "warning_count": 5,
  "badge_count": 7
}
```

**Usage in Webapp:**
```javascript
// Called by NAWA_Booking_Module::ajax_summary()
const response = await fetch(
  '/wp-json/bma/v1/summary?context=webapp-summary',
  { credentials: 'same-origin' }
);
```

---

#### 2. Restaurant Matches Endpoint

**URL:** `POST /wp-json/bma/v1/bookings/match`

**Authentication:** WordPress session cookies

**Request Body:**
```json
{
  "booking_id": 12345,
  "context": "webapp-restaurant"
}
```

**Parameters:**
- `booking_id` (int, required) - NewBook booking ID
- `context` (string) - `webapp-restaurant`
- `force_refresh` (bool, optional) - Bypass cache

**Response:**
```json
{
  "success": true,
  "context": "webapp-restaurant",
  "html": "<div class='booking-match'>...</div>",
  "bookings_found": 1,
  "search_method": "direct",
  "badge_count": 2,
  "critical_count": 1,
  "warning_count": 1
}
```

**Badge Count Logic:**
- Critical: Package booking without restaurant reservation
- Warning: Multiple matches, non-primary matches

**Usage in Webapp:**
```javascript
// Called by NAWA_Booking_Module::ajax_restaurant()
const response = await fetch(
  '/wp-json/bma/v1/bookings/match',
  {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booking_id: 12345,
      context: 'webapp-restaurant'
    })
  }
);
```

---

#### 3. Checks Endpoint

**URL:** `GET /wp-json/bma/v1/checks/{booking_id}?context=webapp-checks`

**Authentication:** WordPress session cookies

**Parameters:**
- `booking_id` (int) - In URL path
- `context` (string) - `webapp-checks`
- `force_refresh` (bool, optional) - Bypass cache

**Response:**
```json
{
  "success": true,
  "html": "<div class='bma-checks'>...</div>",
  "badge_count": 0
}
```

**Current Implementation:**
- Placeholder/stub - actual checks logic TODO
- Always returns badge_count: 0
- Future: Twin bed checks, sofa bed checks, special requests

**Usage in Webapp:**
```javascript
// Called by NAWA_Booking_Module::ajax_checks()
const response = await fetch(
  '/wp-json/bma/v1/checks/12345?context=webapp-checks',
  { credentials: 'same-origin' }
);
```

---

### Authentication Flow

**Web App (Logged-in WordPress User):**
```
User logged into WordPress
    ↓
Navigate to /assistant/
    ↓
WordPress session cookie sent automatically
    ↓
AJAX calls include credentials: 'same-origin'
    ↓
API validates via WordPress session
    ↓
No app passwords needed
```

**vs Chrome Extension:**
```
Not logged into WordPress
    ↓
Uses WordPress Application Passwords
    ↓
Basic Auth header sent with each request
    ↓
API validates via app password
```

---

## Module System

### Creating a New Module

**Example: Housekeeping Module**

#### 1. Create Module Class

**File:** `includes/modules/housekeeping/class-housekeeping-module.php`

```php
<?php
class NAWA_Housekeeping_Module {

    public function __construct() {
        // Register AJAX handlers
        add_action('wp_ajax_nawa_housekeeping_rooms', array($this, 'ajax_rooms'));
    }

    public function get_config() {
        return array(
            'id' => 'housekeeping',
            'name' => 'Housekeeping',
            'icon' => 'cleaning_services',
            'description' => 'Room status and cleaning checklists',
            'roles' => array('administrator', 'housekeeping'),
            'tabs' => array(
                'rooms' => array(
                    'id' => 'rooms',
                    'name' => 'Rooms',
                    'icon' => 'hotel',
                    'badge_count' => 0
                ),
                'checklist' => array(
                    'id' => 'checklist',
                    'name' => 'Checklist',
                    'icon' => 'checklist',
                    'badge_count' => 0
                )
            )
        );
    }

    public function enqueue_assets() {
        if (!get_query_var('nawa_assistant')) {
            return;
        }

        wp_enqueue_style(
            'nawa-housekeeping-module',
            NAWA_PLUGIN_URL . 'assets/css/modules/housekeeping.css',
            array('nawa-app'),
            NAWA_VERSION
        );

        wp_enqueue_script(
            'nawa-housekeeping-module',
            NAWA_PLUGIN_URL . 'assets/js/modules/housekeeping.js',
            array('nawa-app'),
            NAWA_VERSION,
            true
        );
    }

    public function ajax_rooms() {
        check_ajax_referer('nawa_nonce', 'nonce');

        // Fetch room data
        // Return JSON with HTML and badge count
        wp_send_json_success(array(
            'html' => '<div>Room status...</div>',
            'badge_count' => 3
        ));
    }
}
```

#### 2. Register Module

**File:** `includes/class-nawa-core.php`

```php
private function load_components() {
    // ... existing code ...

    // Load housekeeping module
    require_once NAWA_PLUGIN_DIR . 'includes/modules/housekeeping/class-housekeeping-module.php';
    $housekeeping_module = new NAWA_Housekeeping_Module();
    $module_system->register_module($housekeeping_module);
}
```

#### 3. Create Frontend JavaScript

**File:** `assets/js/modules/housekeeping.js`

```javascript
const NAWAHousekeepingModule = (function() {
    'use strict';

    function init() {
        document.addEventListener('nawa:tab-change', handleTabChange);
        document.addEventListener('nawa:refresh', handleRefresh);
    }

    function handleTabChange(event) {
        const { module, tab } = event.detail;
        if (module !== 'housekeeping') return;

        switch (tab) {
            case 'rooms':
                loadRoomsTab();
                break;
            case 'checklist':
                loadChecklistTab();
                break;
        }
    }

    async function loadRoomsTab() {
        NAWAApp.showLoading('Loading rooms...');

        const response = await fetch(nawaSettings.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'nawa_housekeeping_rooms',
                nonce: nawaSettings.nonce
            })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('nawa-content').innerHTML = data.html;
            NAWAApp.updateBadge('rooms', data.badge_count || 0);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {};
})();
```

#### 4. Module Automatically Appears

- Shows in module selector (if user has role)
- Tabs rendered when module selected
- Frontend JavaScript handles tab loading
- AJAX handlers process requests

---

## PWA Implementation

### Service Worker Lifecycle

**File:** `assets/js/service-worker.js`

#### Install Event
```javascript
self.addEventListener('install', (event) => {
  // Cache critical assets
  caches.open('newbook-assistant-v1')
    .then(cache => cache.addAll(['/assistant/', ...]))
    .then(() => self.skipWaiting());
});
```

**Cached Assets:**
- `/assistant/` (main page)
- Future: Add CSS, JS, icons

#### Activate Event
```javascript
self.addEventListener('activate', (event) => {
  // Delete old caches
  caches.keys()
    .then(names => names.filter(name => name !== 'newbook-assistant-v1'))
    .then(names => names.map(name => caches.delete(name)))
    .then(() => self.clients.claim());
});
```

#### Fetch Event
```javascript
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  // Skip admin-ajax.php (always network)
  // Skip /wp-json/ (always network)

  // Try cache first, fallback to network
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => caches.match('/assistant/'))  // Offline fallback
  );
});
```

**Network-First Resources:**
- AJAX requests (`admin-ajax.php`)
- REST API calls (`/wp-json/`)

**Cache-First Resources:**
- Static assets (CSS, JS)
- Page HTML (`/assistant/`)

---

### Manifest Configuration

**Endpoint:** `/manifest.json`

**Generated Dynamically:**
```javascript
{
  "name": "NewBook Assistant",           // From settings
  "short_name": "NewBook Assistant",
  "description": "Hotel operations management assistant",
  "start_url": "/assistant/",            // From page slug setting
  "display": "standalone",               // Fullscreen app mode
  "background_color": "#ffffff",
  "theme_color": "#1e3a8a",             // From settings
  "orientation": "portrait",
  "icons": [
    {
      "src": "/wp-content/plugins/.../icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": ".../icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "productivity"]
}
```

---

## Hooks & Filters

### Actions

**`nawa_enqueue_module_assets`**
- **Fired:** During `wp_enqueue_scripts`
- **Purpose:** Allow modules to enqueue their assets
- **Used By:** All registered modules
- **Example:**
  ```php
  add_action('nawa_enqueue_module_assets', array($this, 'enqueue_assets'));
  ```

### Filters

**None currently defined** - Future expansion:
- `nawa_module_config` - Filter module configuration
- `nawa_page_slug` - Filter assistant page slug
- `nawa_user_capabilities` - Filter required capabilities

---

## WordPress Options

### Settings Stored

**`nawa_page_slug`**
- **Type:** String
- **Default:** `'assistant'`
- **Purpose:** URL slug for assistant page
- **Example:** `'dashboard'` → `/dashboard/`

**`nawa_app_name`**
- **Type:** String
- **Default:** `'NewBook Assistant'`
- **Purpose:** PWA app name
- **Used In:** Manifest, meta tags, page title

**`nawa_theme_color`**
- **Type:** String (hex color)
- **Default:** `'#1e3a8a'`
- **Purpose:** PWA theme color
- **Used In:** Manifest, meta tags

---

## Custom Events

### JavaScript Custom Events

**`nawa:tab-change`**
- **Dispatched By:** `NAWAApp.switchTab()`
- **Listened By:** Module JavaScript files
- **Event Detail:**
  ```javascript
  {
    module: 'booking',  // Current module ID
    tab: 'summary'      // New tab ID
  }
  ```
- **Purpose:** Notify modules when tab changes

**`nawa:refresh`**
- **Dispatched By:** `NAWAApp.refreshCurrentTab()`
- **Listened By:** Module JavaScript files
- **Event Detail:**
  ```javascript
  {
    module: 'booking',  // Current module ID
    tab: 'summary'      // Current tab ID
  }
  ```
- **Purpose:** Manually refresh current tab content

---

## Error Handling

### PHP Error Handling

**Dependency Check:**
```php
// On activation
if (!class_exists('Booking_Match_API')) {
    deactivate_plugins(NAWA_PLUGIN_BASENAME);
    wp_die('Dependency Missing: Booking Match API required');
}

// On runtime
if (!class_exists('Booking_Match_API')) {
    add_action('admin_notices', 'nawa_dependency_notice');
    return;  // Don't initialize
}
```

**AJAX Error Responses:**
```php
wp_send_json_error(array(
    'message' => 'User-friendly error message',
    'error' => $technical_error_details
));
```

### JavaScript Error Handling

**AJAX Call Pattern:**
```javascript
try {
    const response = await fetch(...);
    const data = await response.json();

    if (data.success) {
        // Handle success
    } else {
        NAWAApp.showError(data.message || 'Unknown error');
    }
} catch (error) {
    console.error('Module: Error:', error);
    NAWAApp.showError('Error: ' + error.message);
}
```

---

## Security

### Nonce Verification

**All AJAX Calls:**
```php
check_ajax_referer('nawa_nonce', 'nonce');
```

**Nonce Created:**
```php
wp_localize_script('nawa-app', 'nawaSettings', array(
    'nonce' => wp_create_nonce('nawa_nonce')
));
```

**JavaScript Usage:**
```javascript
body: new URLSearchParams({
    action: 'nawa_booking_summary',
    nonce: nawaSettings.nonce  // ← Verified on server
})
```

### Capability Checks

**Page Access:**
```php
if (!is_user_logged_in()) {
    auth_redirect();
}

if (!current_user_can('read')) {
    wp_die('Permission denied');
}
```

**Settings Page:**
```php
if (!current_user_can('manage_options')) {
    return;
}
```

**Module Access:**
- Filtered by `roles` array in module config
- Administrators always have access
- Other roles checked against module's allowed roles

---

## Performance Considerations

### Caching Strategy

**API Responses:**
- Handled by booking-match-api plugin
- Webapp does not add additional caching
- Uses same cache as Chrome extension

**Static Assets:**
- Service worker caches CSS/JS
- Browser caching via WordPress defaults

**Module Loading:**
- Modules loaded once on page load
- AJAX calls only fetch content (not module config)

### Optimization Tips

**1. Lazy Load Modules:**
```javascript
// Only load module assets when module is activated
// Currently: All module assets loaded upfront
// Future: Dynamic script loading
```

**2. Debounce Refresh:**
```javascript
// Prevent rapid refresh clicks
let refreshTimeout;
function debouncedRefresh() {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
        refreshCurrentTab();
    }, 500);
}
```

**3. Cache Module Data:**
```javascript
// Cache module data in sessionStorage
const cachedModules = sessionStorage.getItem('nawa_modules');
if (cachedModules) {
    modules = JSON.parse(cachedModules);
} else {
    // Fetch from server
}
```

---

## Debugging

### Enable Debug Mode

**PHP Debugging:**
```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

**JavaScript Console:**
- All major operations logged to console
- Look for `NAWAApp:` and `NAWABookingModule:` prefixes

**Network Tab:**
- Monitor AJAX calls to `admin-ajax.php`
- Check request parameters and responses
- Verify nonce is being sent

### Common Issues

**1. "Dependency Missing" Error**
- Ensure booking-match-api is installed and activated
- Check version compatibility (requires v1.4.0+)

**2. AJAX Calls Fail**
- Check nonce is valid (not expired)
- Verify user is logged in
- Check browser console for errors

**3. Module Not Showing**
- Verify user has correct role
- Check module registration in `NAWA_Core::load_components()`
- Inspect `modules` variable in browser console

**4. PWA Not Installing**
- Check manifest.json is accessible
- Verify service worker is registered
- Ensure HTTPS connection (required for PWA)

---

## Version History

### v1.0.0 (2025-11-15)
- Initial release
- PWA infrastructure (manifest, service worker, install prompt)
- Module system with role-based access
- Booking module with 3 tabs (Summary, Restaurant, Checks)
- Mobile-first responsive design
- Integration with booking-match-api via webapp contexts

---

## Future Enhancements

### Planned Features

**1. Additional Modules:**
- Housekeeping (room status, cleaning checklists)
- Maintenance (work orders, room occupancy)
- Cash Up (integration with cash up plugin)

**2. Enhanced PWA:**
- Offline mode with queued actions
- Background sync for updates
- Push notifications

**3. Performance:**
- Dynamic module loading
- sessionStorage caching
- Optimistic UI updates

**4. UX Improvements:**
- Pull-to-refresh gesture
- Swipe between tabs
- Dark mode support

---

## Contact & Support

**Developer:** Hotel Number Four
**Repository:** `newbook-assistant-webapp`
**Dependencies:** booking-match-api (v1.4.0+)

For issues or questions, refer to the main README.md or contact the development team.

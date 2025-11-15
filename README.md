# NewBook Assistant Web App

A Progressive Web App (PWA) WordPress plugin for multi-department hotel operations management.

## Description

This plugin provides a mobile-optimized web interface for hotel staff across different departments (booking, housekeeping, maintenance, cashup) to manage their daily operations.

## Features

### Booking Module (Phase 1)
- Summary tab: Recent bookings overview
- Restaurant tab: Matched restaurant bookings
- Checks tab: Validation checks
- Integrates with booking-match-api plugin

### Future Modules
- Housekeeping: Room status, cleaning checklists
- Maintenance: Work orders, room occupancy
- Cash Up: Integration with cash up plugin

## Requirements

- WordPress 6.0+
- PHP 7.4+
- **Required dependency:** booking-match-api plugin (v1.4.0+)

## Installation

Install via WP Pusher or upload manually to `/wp-content/plugins/`.

## PWA Features

- Install as web app on mobile devices
- Offline-capable service worker
- Mobile-first responsive design
- Touch-friendly interface

## Usage

1. Install and activate booking-match-api plugin
2. Activate this plugin
3. Navigate to `/assistant/` (or configured slug)
4. Use "Add to Home Screen" on mobile devices

## Development

```bash
git clone <repository-url>
cd newbook-assistant-webapp
# No build process required - vanilla PHP/JS
```

## License

Proprietary - Hotel Number Four

## Author

Created for Hotel Number Four operations management.

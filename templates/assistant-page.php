<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title><?php echo get_option('nawa_app_name', 'NewBook Assistant'); ?></title>

    <?php
    // Enqueue WordPress assets
    wp_head();
    ?>
</head>
<body class="nawa-body">

    <!-- App Container -->
    <div id="nawa-app" class="nawa-app">

        <!-- Header -->
        <header class="nawa-header">
            <div class="nawa-header-content">
                <h1 class="nawa-app-title"><?php echo esc_html(get_option('nawa_app_name', 'NewBook Assistant')); ?></h1>
                <div class="nawa-header-actions">
                    <button id="nawa-install-btn" class="nawa-btn nawa-btn-install" style="display: none;">
                        <span class="material-symbols-outlined">get_app</span>
                        Install
                    </button>
                    <button id="nawa-refresh-btn" class="nawa-btn nawa-btn-refresh">
                        <span class="material-symbols-outlined">refresh</span>
                    </button>
                    <div class="nawa-user-menu">
                        <span class="nawa-user-name"><?php echo esc_html(wp_get_current_user()->display_name); ?></span>
                        <a href="<?php echo wp_logout_url(); ?>" class="nawa-logout-link">
                            <span class="material-symbols-outlined">logout</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Module Selector (if user has access to multiple modules) -->
        <div id="nawa-module-selector" class="nawa-module-selector" style="display: none;">
            <!-- Populated by JavaScript -->
        </div>

        <!-- Tab Navigation -->
        <nav id="nawa-tab-nav" class="nawa-tab-nav">
            <!-- Populated by JavaScript based on active module -->
        </nav>

        <!-- Content Area -->
        <main id="nawa-content" class="nawa-content">
            <div class="nawa-loading">
                <div class="nawa-spinner"></div>
                <p>Loading...</p>
            </div>
        </main>

        <!-- Bottom Navigation (Mobile) -->
        <nav id="nawa-bottom-nav" class="nawa-bottom-nav">
            <!-- Populated by JavaScript -->
        </nav>

    </div>

    <!-- Load Material Symbols -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200">

    <?php wp_footer(); ?>

    <!-- Initialize App -->
    <script>
        // Initialize app when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof NAWAApp !== 'undefined') {
                NAWAApp.init();
            }
        });
    </script>

</body>
</html>

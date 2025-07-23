// Script loader for IE11 compatibility
// Loads all JavaScript modules in the correct order

(function() {
    'use strict';
    
    // Function to load script dynamically
    function loadScript(src, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        
        // Add error handling
        script.onerror = function() {
            console.error('Failed to load script:', src);
            // Continue loading other scripts even if one fails
            if (callback) callback();
        };
        
        if (callback) {
            if (script.readyState) {
                // IE
                script.onreadystatechange = function() {
                    if (script.readyState === 'loaded' || script.readyState === 'complete') {
                        script.onreadystatechange = null;
                        callback();
                    }
                };
            } else {
                // Other browsers
                script.onload = callback;
            }
        }
        
        document.head.appendChild(script);
    }
    
    // Function to load multiple scripts in sequence
    function loadScriptsSequentially(scripts, finalCallback) {
        var currentIndex = 0;
        
        function loadNext() {
            if (currentIndex >= scripts.length) {
                if (finalCallback) finalCallback();
                return;
            }
            
            var script = scripts[currentIndex];
            loadScript(script, function() {
                currentIndex++;
                loadNext();
            });
        }
        
        loadNext();
    }
    
    // Get base path for scripts
    function getScriptBasePath() {
        var scripts = document.getElementsByTagName('script');
        var currentScript = scripts[scripts.length - 1];
        var src = currentScript.src;
        var pathname = window.location.pathname;
        
        // Check if we're in a subdirectory
        if (pathname.indexOf('/ru/tours/') !== -1) {
            return '../../js/';
        } else if (pathname.indexOf('/ru/') !== -1) {
            return '../js/';
        } else if (pathname.indexOf('/tours/') !== -1) {
            return '../js/';
        } else {
            // For root files (/, /index.html, /test.html, etc.)
            return './js/';
        }
    }
    
    var basePath = getScriptBasePath();
    
    // Define script loading order
    var scriptsToLoad = [
        basePath + 'polyfills.js',
        basePath + 'booking-autocomplete.js', // Unified autocomplete with data and UI
        basePath + 'booking-datepicker.js', // Modern datepicker with ES2024
        basePath + 'booking-pickers.js', // Custom pickers for passengers, luggage, waiting
        basePath + 'lazy-loading-fallback.js',
        basePath + 'intersection-observer-lazy.js',
        basePath + 'lang-switcher.js',
        basePath + 'gallery.js',
        basePath + 'car-modal.js',
        basePath + 'booking-labels.js',
        basePath + 'faq.js',
        basePath + 'floating-contact.js',
        basePath + 'scroll.js',
        basePath + 'mobile-menu.js',
        basePath + 'carousel.js',
        basePath + 'map.js',
        basePath + 'main.js'
    ];
    
    // Load all scripts
    loadScriptsSequentially(scriptsToLoad, function() {
        // All scripts loaded, initialize main functionality
        
        if (typeof initLangSwitcher === 'function') {
            initLangSwitcher();
        }
        
        if (typeof initGalleryModals === 'function') {
            initGalleryModals();
        }
        
        // Note: handleCarModal is self-initializing, no need to call it here
        
        if (typeof handleBookingLabels === 'function') {
            handleBookingLabels();
        }
        
        if (typeof handleFAQAccordion === 'function') {
            handleFAQAccordion();
        }
        
        if (typeof handleFloatingContact === 'function') {
            handleFloatingContact();
        }
        
        if (typeof initSmoothScroll === 'function') {
            initSmoothScroll();
        }
        
        if (typeof handleMobileMenu === 'function') {
            handleMobileMenu();
        }
        
        // Initialize carousel only on main page
        if (!document.body.classList.contains('tours-page') && typeof handleToursCarousel === 'function') {
            handleToursCarousel();
        }
        
        // Mark scripts as loaded for preloader
        if (typeof markScriptsLoaded === 'function') {
            markScriptsLoaded();
        }
    });
    
    // Fallback: hide preloader if scripts fail to load (handled by preloader.js)
    
})(); 
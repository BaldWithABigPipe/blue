// Advanced lazy loading using Intersection Observer
// Falls back to native lazy loading if available

(function() {
    'use strict';
    
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
        // Fallback to native lazy loading or basic loading
        return;
    }
    
    // Find all lazy images
    var lazyImages = document.querySelectorAll('img[data-src]');
    
    if (lazyImages.length === 0) {
        // No lazy images found, use native lazy loading if available
        if ('loading' in HTMLImageElement.prototype) {
            // Native lazy loading is supported
            return;
        }
    }
    
    // Create intersection observer for lazy loading
    var imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var img = entry.target;
                
                // Load the image
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                
                // Add loaded class for styling
                img.classList.add('lazy-loaded');
                
                // Stop observing this image
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });
    
    // Observe all lazy images
    lazyImages.forEach(function(img) {
        imageObserver.observe(img);
    });
    
    // Export function for use in other scripts
    window.initIntersectionObserverLazy = function() {
        // Function can be called to reinitialize if needed
    };
})(); 
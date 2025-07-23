// Lazy loading fallback for IE11 and older browsers
// Removes loading="lazy" attribute and applies basic lazy loading

(function() {
    'use strict';
    
    // Check if native lazy loading is supported
    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading is supported
        return;
    }
    
    // Remove loading="lazy" from all images
    var images = document.querySelectorAll('img[loading="lazy"]');
    for (var i = 0; i < images.length; i++) {
        images[i].removeAttribute('loading');
    }
    
    // Apply basic lazy loading fallback
    if (images.length > 0) {
        // Basic intersection observer fallback
        if ('IntersectionObserver' in window) {
            // Use intersection observer if available
            var imageObserver = new IntersectionObserver(function(entries, observer) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        img.src = img.dataset.src || img.src;
                        observer.unobserve(img);
                    }
                });
            });
            
            images.forEach(function(img) {
                imageObserver.observe(img);
            });
        }
    }
})(); 
// Simple preloader hide script
(function() {
  'use strict';
  
  // Hide preloader when page is loaded
  function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('preloader--hidden');
      
      // Remove from DOM after animation
      setTimeout(() => {
        if (preloader && preloader.parentNode) {
          preloader.parentNode.removeChild(preloader);
        }
      }, 500);
    }
  }
  
  // Hide on window load
  window.addEventListener('load', () => {
    setTimeout(hidePreloader, 500);
  });
  
  // Fallback: hide after 3 seconds
  setTimeout(hidePreloader, 3000);
  
  // Export function for manual control
  window.hidePreloader = hidePreloader;
})(); 
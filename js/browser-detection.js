/**
 * Browser detection and conditional CSS loading
 * Loads IE11 fallback CSS only when needed
 */

(function() {
  'use strict';
  
  // Function to detect IE11 (most reliable method)
  const isIE11 = function() {
    return !!window.MSInputMethodContext && !!document.documentMode;
  };
  
  // Function to detect IE10 and below
  const isIE10OrBelow = function() {
    return document.all && !window.atob;
  };
  
  // Function to detect any IE version
  const isIE = function() {
    return isIE11() || isIE10OrBelow();
  };
  
  // Function to detect Edge (legacy)
  const isLegacyEdge = function() {
    return navigator.userAgent.indexOf('Edge') > -1 && !window.chrome;
  };
  
  // Function to load CSS dynamically with error handling
  const loadCSS = function(href) {
    return new Promise(function(resolve, reject) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = href;
      link.setAttribute('data-ie-fallback', 'true');
      
      // Add event listeners for loading states
      link.onload = function() {
        resolve(link);
      };
      
      link.onerror = function() {
        reject(new Error('Failed to load IE11 fallback CSS: ' + href));
      };
      
      // Insert at the beginning of head for proper cascade
      const head = document.head || document.getElementsByTagName('head')[0];
      head.insertBefore(link, head.firstChild);
    });
  };
  
  // Main detection and loading logic
  const initBrowserDetection = function() {
    // Check if we're in IE or legacy Edge
    if (isIE() || isLegacyEdge()) {
      // Add browser-specific classes for additional targeting
      document.documentElement.classList.add('ie11');
      document.body.classList.add('ie11');
      
      if (isIE11()) {
        document.documentElement.classList.add('ie11-specific');
        document.body.classList.add('ie11-specific');
      }
      
      if (isLegacyEdge()) {
        document.documentElement.classList.add('legacy-edge');
        document.body.classList.add('legacy-edge');
      }
      
      // Determine correct path for CSS file
      const currentPath = window.location.pathname;
      const isRussianVersion = currentPath.includes('/ru/');
      const cssPath = isRussianVersion ? '../css/ie11-fallback.css' : 'css/ie11-fallback.css';
      
      // Load IE11 fallback CSS
      if (isIE11) {
          var link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = basePath + 'ie11-fallback.css';
          document.head.appendChild(link);
          
          // Add IE11 class to body
          document.body.classList.add('ie11');
      }
    }
  };
  
  // Run detection immediately
  initBrowserDetection();
  
  // Expose detection functions globally for other scripts
  window.browserDetection = {
    isIE11: isIE11,
    isIE10OrBelow: isIE10OrBelow,
    isIE: isIE,
    isLegacyEdge: isLegacyEdge,
    init: initBrowserDetection
  };
  
})(); 
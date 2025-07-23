// Optimized Preloader Module
// Handles preloader with professional Lottie animation

class Preloader {
  constructor() {
    this.state = {
      scriptsLoaded: false,
      imagesLoaded: false,
      domReady: false,
      windowLoaded: false,
      lottieLoaded: false
    };
    
    this.preloader = null;
    this.lottieContainer = null;
    this.animation = null;
    this.loadTimeout = null;
    this.minDisplayTime = 2000; // 2 seconds minimum display time
    this.startTime = Date.now();
    this.canHide = false;
    this.hideTimeout = null;
    
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready before creating preloader
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.createPreloader();
        this.loadLottieLibrary();
        this.setupEventListeners();
      });
    } else {
      // DOM is already ready
      this.createPreloader();
      this.loadLottieLibrary();
      this.setupEventListeners();
    }
  }
  
  createPreloader() {
    // Check if document.body exists
    if (!document.body) {
      setTimeout(() => this.createPreloader(), 10);
      return;
    }
    
    // Remove existing preloader if any
    const existingPreloader = document.querySelector('.preloader');
    if (existingPreloader) {
      existingPreloader.remove();
    }
    
    // Create new preloader with Lottie - initially visible
    this.preloader = document.createElement('div');
    this.preloader.className = 'preloader'; // No hidden class initially
    this.preloader.innerHTML = `
      <div class="preloader__content">
        <div class="preloader__lottie-container" id="lottiePreloader"></div>
        <div class="preloader__text">${this.getLoadingText()}</div>
      </div>
    `;
    
    document.body.appendChild(this.preloader);
    this.lottieContainer = document.getElementById('lottiePreloader');
  }
  
  getLoadingText() {
    // Detect language and return appropriate text
    const pathname = window.location.pathname;
    if (pathname.indexOf('/ru/') !== -1) {
      return 'Загрузка...';
    } else {
      return 'Loading...';
    }
  }
  
  loadLottieLibrary() {
    // Check if Lottie is already loaded
    if (window.lottie) {
      this.initLottieAnimation();
      return;
    }
    
    // Load Lottie library (optimized version for better performance)
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/lottie-web@5.7.14/build/player/lottie.min.js';
    script.onload = () => {
      console.log('Lottie library loaded successfully');
      this.initLottieAnimation();
    };
    script.onerror = () => {
      console.warn('Lottie library failed to load, using fallback');
      this.useFallbackAnimation();
    };
    
    // Add timeout for script loading
    const scriptTimeout = setTimeout(() => {
      console.warn('Lottie script loading timeout, using fallback');
      this.useFallbackAnimation();
    }, 3000);
    
    script.onload = () => {
      clearTimeout(scriptTimeout);
      console.log('Lottie library loaded successfully');
      this.initLottieAnimation();
    };
    
    document.head.appendChild(script);
  }
  
  initLottieAnimation() {
    if (!window.lottie || !this.lottieContainer) {
      this.useFallbackAnimation();
      return;
    }
    
    try {
      // Determine correct path to Lottie file based on current page
      const pathname = window.location.pathname;
      let lottiePath;
      
      // Use professional animation file
      const animationFile = 'preloader.json';
      
      if (pathname.indexOf('/ru/') !== -1) {
        // Russian version - go up one level
        lottiePath = `../preloader/${animationFile}`;
      } else if (pathname.indexOf('/tours/') !== -1) {
        // Tour pages - go up one level
        lottiePath = `../preloader/${animationFile}`;
      } else if (pathname.indexOf('/ru/tours/') !== -1) {
        // Russian tour pages - go up two levels
        lottiePath = `../../preloader/${animationFile}`;
      } else {
        // Root pages
        lottiePath = `./preloader/${animationFile}`;
      }
      
      // Load animation with optimized settings
      this.loadLottieAnimation(lottiePath);
      
    } catch (error) {
      console.warn('Lottie animation error:', error);
      this.useFallbackAnimation();
    }
  }
  
  loadLottieAnimation(lottiePath) {
    // Load animation with optimized settings for professional animation
    this.animation = lottie.loadAnimation({
      container: this.lottieContainer,
      renderer: 'svg', // SVG for better quality and performance
      loop: true,
      autoplay: true,
      path: lottiePath,
      rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
        progressiveLoad: false, // Load all at once for better performance
        hideOnTransparent: true,
        className: 'preloader__lottie-svg'
      }
    });
    
    // Add error handling for network issues
    if (!this.animation) {
      console.warn('Failed to create Lottie animation, using fallback');
      this.useFallbackAnimation();
      return;
    }
    
    // Add timeout for loading (reduced for better UX)
    this.loadTimeout = setTimeout(() => {
      console.warn('Lottie animation loading timeout, using fallback');
      this.useFallbackAnimation();
    }, 2000); // 2 seconds timeout for faster fallback
    
    this.animation.addEventListener('DOMLoaded', () => {
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = null;
      }
      this.state.lottieLoaded = true;
      this.checkPreloaderHide();
    });
    
    this.animation.addEventListener('error', (error) => {
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = null;
      }
      console.warn('Lottie animation failed to load:', error);
      this.useFallbackAnimation();
    });
  }
  
  useFallbackAnimation() {
    // Enhanced fallback animation that matches the professional style
    if (this.lottieContainer) {
      this.lottieContainer.innerHTML = `
        <div class="preloader__spinner">
          <div class="preloader__spinner-inner"></div>
          <div class="preloader__spinner-outer"></div>
          <div class="preloader__spinner-pulse"></div>
        </div>
      `;
    }
    this.state.lottieLoaded = true;
    this.checkPreloaderHide();
    
    // Log for debugging
    console.log('Using fallback animation - Lottie failed to load');
  }
  
  setupEventListeners() {
    // DOM ready event
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.state.domReady = true;
        this.checkImagesLoaded();
        this.checkPreloaderHide();
      });
    } else {
      this.state.domReady = true;
      this.checkImagesLoaded();
      this.checkPreloaderHide();
    }
    
    // Window load event
    window.addEventListener('load', () => {
      this.state.windowLoaded = true;
      this.checkPreloaderHide();
    });
    
    // Fallback: hide preloader after 4 seconds maximum (faster loading)
    setTimeout(() => {
      if (this.preloader && !this.preloader.classList.contains('preloader--hidden')) {
        console.warn('Forcing preloader hide after maximum timeout');
        this.hidePreloader();
      }
    }, 4000);
  }
  
  checkImagesLoaded() {
    const images = document.querySelectorAll('img');
    const totalImages = images.length;
    let loadedImages = 0;
    
    // Only wait for critical images (first 20) for faster loading
    const criticalImages = Math.min(totalImages, 20);
    
    if (totalImages === 0) {
      this.state.imagesLoaded = true;
      this.checkPreloaderHide();
      return;
    }
    
    const imageLoadHandler = () => {
      loadedImages++;
      if (loadedImages >= criticalImages) {
        this.state.imagesLoaded = true;
        this.checkPreloaderHide();
      }
    };
    
    // Check already loaded images
    for (let i = 0; i < Math.min(images.length, criticalImages); i++) {
      if (images[i].complete) {
        loadedImages++;
      } else {
        images[i].addEventListener('load', imageLoadHandler);
        images[i].addEventListener('error', imageLoadHandler);
      }
    }
    
    // If all critical images are already loaded
    if (loadedImages >= criticalImages) {
      this.state.imagesLoaded = true;
      this.checkPreloaderHide();
    }
    
    // Fallback: mark images as loaded after 2 seconds regardless
    setTimeout(() => {
      if (!this.state.imagesLoaded) {
        this.state.imagesLoaded = true;
        this.checkPreloaderHide();
      }
    }, 2000);
  }
  
  checkPreloaderHide() {
    // Check if minimum display time has passed
    const elapsedTime = Date.now() - this.startTime;
    const minTimePassed = elapsedTime >= this.minDisplayTime;
    
    // Hide preloader when most conditions are met (don't wait for all images)
    const basicConditionsMet = this.state.domReady && this.state.windowLoaded && this.state.lottieLoaded;
    const allConditionsMet = this.state.scriptsLoaded && this.state.imagesLoaded && basicConditionsMet;
    
    if (allConditionsMet) {
      if (minTimePassed) {
        console.log('All conditions met and minimum time passed, hiding preloader');
        this.hidePreloader();
      } else {
        // Wait for remaining time
        const remainingTime = this.minDisplayTime - elapsedTime;
        console.log(`All conditions met, but waiting ${remainingTime}ms for minimum display time`);
        
        // Clear any existing hide timeout
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
        }
        
        this.hideTimeout = setTimeout(() => {
          console.log('Minimum display time reached, hiding preloader');
          this.hidePreloader();
        }, remainingTime);
      }
    } else if (basicConditionsMet && minTimePassed) {
      // Hide even if some conditions not met, but basic ones are and minimum time passed
      console.log('Basic conditions met and minimum time passed, hiding preloader');
      this.hidePreloader();
    }
  }
  
  showPreloader() {
    if (this.preloader) {
      this.preloader.classList.remove('preloader--hidden');
      if (this.animation) {
        this.animation.play();
      }
    }
  }
  
  hidePreloader() {
    if (this.preloader && !this.preloader.classList.contains('preloader--hidden')) {
      console.log('Hiding preloader with animation');
      
      // Stop animation
      if (this.animation) {
        this.animation.stop();
      }
      
      // Clear timeout if exists
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
        this.loadTimeout = null;
      }
      
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      
      // Add hidden class
      this.preloader.classList.add('preloader--hidden');
      
      // Remove from DOM after animation
      setTimeout(() => {
        if (this.preloader && this.preloader.parentNode) {
          this.preloader.parentNode.removeChild(this.preloader);
        }
      }, 500);
    }
  }
  
  markScriptsLoaded() {
    this.state.scriptsLoaded = true;
    this.checkPreloaderHide();
  }
}

// Initialize preloader when DOM is ready
let preloader;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    preloader = new Preloader();
  });
} else {
  // DOM is already ready
  preloader = new Preloader();
}

// Export functions for use in other scripts
window.showPreloader = () => {
  if (preloader) {
    preloader.showPreloader();
  }
};

window.hidePreloader = () => {
  if (preloader) {
    preloader.hidePreloader();
  }
};

window.markScriptsLoaded = () => {
  if (preloader) {
    preloader.markScriptsLoaded();
  }
}; 
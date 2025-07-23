// Tours carousel functionality - IE11 compatible
var handleToursCarousel = function() {
  var toursFlex = document.querySelector('.tours__flex');
  var items = document.querySelectorAll('.tours__item');
  var prevBtn = document.querySelector('.tours__nav-btn.tours__prev');
  var nextBtn = document.querySelector('.tours__nav-btn.tours__next');
  
  if (!toursFlex || !items.length) return;
  
  var currentIndex = 0;
  var autoPlayInterval;
  var isTransitioning = false;
  
  // Debounce function for performance
  var debounce = function(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  };
  
  var getItemsPerView = function() {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    if (window.innerWidth <= 1280) return 3;
    return 4; // Desktop: exactly 4 items
  };
  
  var getGap = function() {
    if (window.innerWidth <= 400) return 8; // 0.5rem - smaller gap for better centering
    if (window.innerWidth <= 600) return 16; // 1rem
    if (window.innerWidth <= 900) return 24; // 1.5rem
    if (window.innerWidth <= 1280) return 24; // 1.5rem
    return 32; // 2rem
  };
  
  var getCarouselPadding = function() {
    if (window.innerWidth <= 400) return 24; // 1.5rem - reduced padding for better centering
    if (window.innerWidth <= 600) return 32; // 2rem
    if (window.innerWidth <= 768) return 40; // 2.5rem
    if (window.innerWidth <= 900) return 48; // 3rem
    if (window.innerWidth <= 1024) return 56; // 3.5rem
    if (window.innerWidth <= 1280) return 64; // 4rem
    if (window.innerWidth <= 1600) return 72; // 4.5rem
    return 80; // 5rem
  };
  
  var calculateItemWidth = function() {
    var carouselWrapper = toursFlex.closest('.tours__carousel-wrapper');
    var containerWidth = carouselWrapper.offsetWidth;
    var itemsPerView = getItemsPerView();
    var gap = getGap();
    var padding = getCarouselPadding();
    
    // Available width = container width - left padding - right padding
    var availableWidth = containerWidth - (padding * 2);
    
    // For single item view on small screens, use fixed width for better centering
    if (window.innerWidth <= 400 && itemsPerView === 1) {
      // Use a fixed width that works well for centering
      return Math.min(280, availableWidth - gap);
    }
    
    // Item width = (available width - gaps between items) / number of items
    var totalGaps = (itemsPerView - 1) * gap;
    var itemWidth = (availableWidth - totalGaps) / itemsPerView;
    
    return Math.floor(itemWidth); // Ensure integer for precise positioning
  };
  
  var itemsPerView = getItemsPerView();
  var maxIndex = Math.max(0, items.length - itemsPerView);
  
  var updateCarousel = function() {
    // Recalculate items per view based on screen size
    itemsPerView = getItemsPerView();
    maxIndex = Math.max(0, items.length - itemsPerView);
    
    // Calculate item width and gap
    var itemWidth = calculateItemWidth();
    var gap = getGap();
    
    // Set item widths to ensure exact fit
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      item.style.width = itemWidth + 'px';
      item.style.flexShrink = '0';
      item.style.flexGrow = '0';
    }
    
    // Set gap dynamically
    toursFlex.style.gap = gap + 'px';
    
    // Calculate the exact position for current index
    var stepDistance = itemWidth + gap;
    var totalMoveDistance = currentIndex * stepDistance;
    
    // Apply smooth transition
    toursFlex.style.transition = 'transform 0.3s ease-in-out';
    toursFlex.style.transform = 'translateX(-' + totalMoveDistance + 'px)';
    
    // Always enable buttons for infinite loop
    var buttons = [prevBtn, nextBtn];
    for (var j = 0; j < buttons.length; j++) {
      var btn = buttons[j];
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    }
  };
  
  var handleSlideTransition = function(direction) {
    if (isTransitioning) return;
    
    isTransitioning = true;
    
    if (direction === 'next') {
      currentIndex++;
      // Loop to beginning if we reach the end
      if (currentIndex > maxIndex) {
        currentIndex = 0;
      }
    } else {
      currentIndex--;
      // Loop to end if we go before the beginning
      if (currentIndex < 0) {
        currentIndex = maxIndex;
      }
    }
    
    updateCarousel();
    
    setTimeout(function() {
      isTransitioning = false;
    }, 350);
  };
  
  var nextSlide = function() {
    handleSlideTransition('next');
  };
  
  var prevSlide = function() {
    handleSlideTransition('prev');
  };
  
  var startAutoPlay = function() {
    stopAutoPlay();
    autoPlayInterval = setInterval(nextSlide, 4000); // Change slide every 4 seconds
  };
  
  var stopAutoPlay = function() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  };
  
  var handleNavigation = function(direction) {
    if (isTransitioning) return;
    stopAutoPlay();
    handleSlideTransition(direction);
    startAutoPlay();
  };
  
  // Event listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      handleNavigation('prev');
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      handleNavigation('next');
    });
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') {
      handleNavigation('prev');
    } else if (e.key === 'ArrowRight') {
      handleNavigation('next');
    }
  });
  
  // Pause autoplay on hover
  toursFlex.addEventListener('mouseenter', stopAutoPlay);
  toursFlex.addEventListener('mouseleave', startAutoPlay);
  
  // Handle window resize with debouncing
  var debouncedResizeHandler = debounce(function() {
    var newItemsPerView = getItemsPerView();
    if (newItemsPerView !== itemsPerView) {
      itemsPerView = newItemsPerView;
      maxIndex = Math.max(0, items.length - itemsPerView);
      // Keep currentIndex within bounds but allow it to loop
      if (currentIndex > maxIndex) {
        currentIndex = 0;
      }
    }
    updateCarousel();
  }, 150);
  
  window.addEventListener('resize', debouncedResizeHandler);
  
  // Initialize
  updateCarousel();
  startAutoPlay();
  
  // Force recalculation on window load
  window.addEventListener('load', function() {
    setTimeout(updateCarousel, 100);
  });
};

// Initialize tours carousel only on main page (not on tours page)
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize carousel if we're not on the tours page
  if (!document.body.classList.contains('tours-page')) {
    handleToursCarousel();
  }
}); 
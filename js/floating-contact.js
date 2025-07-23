// Floating contact button module (BEM) - IE11 compatible
var handleFloatingContact = function() {
  var contactButton = document.getElementById('contactButton');
  var contactPopup = document.getElementById('contactPopup');
  
  if (!contactButton || !contactPopup) {
    return;
  }

  // Toggle popup function
  var togglePopup = function() {
    var isVisible = contactPopup.classList.contains('floating-contact__popup--visible');
    if (isVisible) {
      contactPopup.classList.remove('floating-contact__popup--visible');
      contactButton.setAttribute('aria-expanded', 'false');
    } else {
      contactPopup.classList.add('floating-contact__popup--visible');
      contactButton.setAttribute('aria-expanded', 'true');
    }
  };

  // Close popup function
  var closePopup = function() {
    contactPopup.classList.remove('floating-contact__popup--visible');
    contactButton.setAttribute('aria-expanded', 'false');
  };

  // Add click handler to button
  contactButton.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    togglePopup();
  });

  // Add keyboard handler to button
  contactButton.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePopup();
    }
  });

  // Close popup when clicking outside
  document.addEventListener('click', function(e) {
    var isClickInside = contactButton.contains(e.target) || contactPopup.contains(e.target);
    if (!isClickInside && contactPopup.classList.contains('floating-contact__popup--visible')) {
      closePopup();
    }
  });

  // Close popup on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && contactPopup.classList.contains('floating-contact__popup--visible')) {
      closePopup();
    }
  });

  // Hide button when footer or booking sections are visible on small screens
  var handleButtonVisibility = function() {
    if (window.innerWidth <= 600) {
      var footer = document.querySelector('.footer');
      var bookingSection = document.querySelector('.booking');
      
      if (footer && bookingSection) {
        var footerRect = footer.getBoundingClientRect();
        var bookingRect = bookingSection.getBoundingClientRect();
        var buttonRect = contactButton.getBoundingClientRect();
        
        // Check if footer is overlapping with button area
        var isFooterOverlapping = footerRect.top < (buttonRect.bottom + 20);
        
        // Check if booking section is overlapping with button area
        // More precise: check if booking section is taking up significant screen space
        var bookingSectionHeight = bookingRect.height;
        var screenHeight = window.innerHeight;
        var bookingSectionTop = bookingRect.top;
        var bookingSectionBottom = bookingRect.bottom;
        
        // Booking section is considered "active" if it takes up more than 30% of screen height
        // and is positioned in the lower part of the screen
        var isBookingActive = bookingSectionHeight > (screenHeight * 0.3) && 
                             bookingSectionBottom > (screenHeight * 0.7) &&
                             bookingSectionTop < (screenHeight * 0.9);
        
        if (isFooterOverlapping || isBookingActive) {
          contactButton.style.display = 'none';
        } else {
          contactButton.style.display = 'flex';
        }
      }
    } else {
      contactButton.style.display = 'flex';
    }
  };

  // Debounce function for performance optimization
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

  // Debounced version of handleButtonVisibility
  var debouncedHandleButtonVisibility = debounce(handleButtonVisibility, 10);

  // Handle button visibility on scroll and resize
  window.addEventListener('scroll', debouncedHandleButtonVisibility);
  window.addEventListener('resize', handleButtonVisibility);
  
  // Initial check
  handleButtonVisibility();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleFloatingContact);
} else {
  handleFloatingContact();
} 
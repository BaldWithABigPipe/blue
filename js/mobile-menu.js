// Mobile menu functionality - IE11 compatible
var handleMobileMenu = function() {
  var mobileMenuToggle = document.getElementById('mobile-menu-toggle') || document.querySelector('.mobile-menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu') || document.querySelector('.mobile-menu');
  var hamburger = document.querySelector('.burger-icon');
  
  // Check if all required elements exist
  if (!mobileMenu || !mobileMenuToggle || !hamburger) {
    return;
  }
  
  var toggleMobileMenu = function() {
    var isActive = mobileMenu.classList.contains('mobile-menu--active');
    
    if (isActive) {
      // Close menu
      mobileMenu.classList.remove('mobile-menu--active');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      // Open menu
      mobileMenu.classList.add('mobile-menu--active');
      hamburger.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };
  
  // Toggle menu on hamburger click
  mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  
  // Close menu when clicking on menu items
  var menuLinks = mobileMenu.querySelectorAll('.mobile-menu__link, .mobile-menu__languages-link');
  for (var i = 0; i < menuLinks.length; i++) {
    var link = menuLinks[i];
    link.addEventListener('click', function() {
      mobileMenu.classList.remove('mobile-menu--active');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
  
  // Close menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('mobile-menu--active')) {
      toggleMobileMenu();
    }
  });
  
  // Close menu on window resize (if screen becomes larger)
  window.addEventListener('resize', function() {
    if (window.innerWidth > 900 && mobileMenu.classList.contains('mobile-menu--active')) {
      toggleMobileMenu();
    }
  });
};

// Initialize mobile menu
document.addEventListener('DOMContentLoaded', handleMobileMenu); 
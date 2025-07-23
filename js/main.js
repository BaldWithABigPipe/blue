// Main entry point - IE11 compatible
// Preloader - only show, hide is handled by preloader itself
if (typeof showPreloader !== 'undefined') {
  showPreloader();
}

// Language switcher
if (typeof initLangSwitcher !== 'undefined') {
  initLangSwitcher();
}

// Gallery modals
if (typeof initGalleryModals !== 'undefined') {
  initGalleryModals();
}

// Car modal
if (typeof handleCarModal !== 'undefined') {
  handleCarModal();
}

// Booking labels
if (typeof handleBookingLabels !== 'undefined') {
  handleBookingLabels();
}

// FAQ accordion
if (typeof handleFAQAccordion !== 'undefined') {
  handleFAQAccordion();
}

// Floating contact
if (typeof handleFloatingContact !== 'undefined') {
  handleFloatingContact();
}

// Smooth scroll
if (typeof initSmoothScroll !== 'undefined') {
  initSmoothScroll();
}

// Ensure preloader works on all pages with correct base path
var basePath = document.currentScript && document.currentScript.src.indexOf('/js/') !== -1 ? './' : '../js/';
// Car modal module (BEM) - IE11 compatible
var handleCarModal = function() {
  var fleetSection = document.querySelector('.fleet');
  var fleetButtons = fleetSection ? fleetSection.querySelectorAll('.fleet__item-button') : [];
  var fleetItems = fleetSection ? fleetSection.querySelectorAll('.fleet__item') : [];
  var modals = document.querySelectorAll('.modal');
  var modalOverlays = document.querySelectorAll('.modal__overlay');
  var modalCloses = document.querySelectorAll('.modal__close');
  var modalThumbnails = document.querySelectorAll('.modal__thumbnail');
  
  // Global function to open car modal from booking section
  window.openCarModal = function(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('modal--active');
      document.body.style.overflow = 'hidden';
    }
  };
  
  // Define handleFleetButtonClick function before using it
  var handleFleetButtonClick = function() {
    var modalId = this.getAttribute('data-modal');
    var modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('modal--active');
      document.body.style.overflow = 'hidden';
    }
  };
  
  // Add event listeners to fleet buttons (for screen readers)
  for (var i = 0; i < fleetButtons.length; i++) {
    var button = fleetButtons[i];
    // Remove existing listener if any
    button.removeEventListener('click', handleFleetButtonClick);
    button.addEventListener('click', handleFleetButtonClick);
  }
  
  // Add event listeners to fleet items (for visual clicks)
  for (var j = 0; j < fleetItems.length; j++) {
    var item = fleetItems[j];
    item.addEventListener('click', function(e) {
      // Don't trigger if clicking on the button itself
      if (e.target.closest('.fleet__item-button')) {
        return;
      }
      
      var button = this.querySelector('.fleet__item-button');
      if (button) {
        var modalId = button.getAttribute('data-modal');
        var modal = document.getElementById(modalId);
        if (modal) {
          modal.classList.add('modal--active');
          document.body.style.overflow = 'hidden';
        }
      }
    });
    
    // Add keyboard support for Enter key
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var button = this.querySelector('.fleet__item-button');
        if (button) {
          var modalId = button.getAttribute('data-modal');
          var modal = document.getElementById(modalId);
          if (modal) {
            modal.classList.add('modal--active');
            document.body.style.overflow = 'hidden';
          }
        }
      }
    });
  }
  
  // Modal overlay click handlers
  for (var k = 0; k < modalOverlays.length; k++) {
    var overlay = modalOverlays[k];
    overlay.addEventListener('click', function() {
      var modal = this.closest('.modal');
      if (modal) {
        modal.classList.remove('modal--active');
        document.body.style.overflow = '';
      }
    });
  }
  
  // Modal close button handlers
  for (var l = 0; l < modalCloses.length; l++) {
    var closeBtn = modalCloses[l];
    closeBtn.addEventListener('click', function() {
      var modal = this.closest('.modal');
      if (modal) {
        modal.classList.remove('modal--active');
        document.body.style.overflow = '';
      }
    });
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    var activeModal = document.querySelector('.modal--active');
    if (!activeModal) return;
    
    if (e.key === 'Escape') {
      activeModal.classList.remove('modal--active');
      document.body.style.overflow = '';
    } else if (e.key === 'ArrowLeft') {
      var prevBtn = activeModal.querySelector('.modal__nav-btn--prev');
      if (prevBtn) prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      var nextBtn = activeModal.querySelector('.modal__nav-btn--next');
      if (nextBtn) nextBtn.click();
    }
  });
  
  // Thumbnail click handlers
  for (var m = 0; m < modalThumbnails.length; m++) {
    var thumbnail = modalThumbnails[m];
    thumbnail.addEventListener('click', function() {
      var modal = this.closest('.modal');
      var mainImg = modal ? modal.querySelector('.modal__main-img') : null;
      var newImageSrc = this.getAttribute('data-image');
      if (mainImg && newImageSrc) {
        mainImg.src = newImageSrc;
        mainImg.alt = this.alt || '';
      }
    });
  }
  
  // Navigation button handlers
  var navButtons = document.querySelectorAll('.modal__nav-btn');
  for (var n = 0; n < navButtons.length; n++) {
    var button = navButtons[n];
    button.addEventListener('click', function(e) {
      e.stopPropagation();
      var modal = this.closest('.modal');
      var direction = this.getAttribute('data-direction');
      var thumbnails = modal ? modal.querySelectorAll('.modal__thumbnail') : [];
      var mainImg = modal ? modal.querySelector('.modal__main-img') : null;
      
      if (!thumbnails.length || !mainImg) return;
      
      var currentIndex = 0;
      var currentSrc = mainImg.src;
      var currentFilename = currentSrc.split('/').pop();
      
      for (var o = 0; o < thumbnails.length; o++) {
        var thumb = thumbnails[o];
        var thumbSrc = thumb.getAttribute('data-image');
        var thumbFilename = thumbSrc.split('/').pop();
        if (thumbFilename === currentFilename) {
          currentIndex = o;
          break;
        }
      }
      
      var newIndex;
      if (direction === 'prev') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : thumbnails.length - 1;
      } else {
        newIndex = currentIndex < thumbnails.length - 1 ? currentIndex + 1 : 0;
      }
      
      var newThumbnail = thumbnails[newIndex];
      var newImageSrc = newThumbnail.getAttribute('data-image');
      var newImageAlt = newThumbnail.alt || '';
      
      mainImg.src = newImageSrc;
      mainImg.alt = newImageAlt;
    });
  }
}; 
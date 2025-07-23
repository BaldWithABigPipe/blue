// Gallery modal module (BEM) - IE11 compatible
var openGallery = function(galleryId) {
  var modal = document.getElementById('gallery-' + galleryId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

var closeGallery = function(galleryId) {
  var modal = document.getElementById('gallery-' + galleryId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

var changeMainImage = function(galleryId, imageSrc, thumbnailElement) {
  // Validate image source
  if (!imgSrc || imgSrc === '#' || imgSrc === '') {
    return;
  }
  
  var mainImage = document.getElementById('main-image-' + galleryId);
  var thumbnails = document.querySelectorAll('#gallery-' + galleryId + ' .gallery-modal__thumbnail');
  
  if (mainImage) mainImage.src = imageSrc;
  
  for (var i = 0; i < thumbnails.length; i++) {
    var thumb = thumbnails[i];
    thumb.classList.remove('active');
  }
  
  if (thumbnailElement) thumbnailElement.classList.add('active');
};

var initGalleryModals = function() {
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('gallery-modal')) {
      var galleryId = event.target.id.split('-')[1];
      closeGallery(galleryId);
    }
  });
  
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      var activeModal = document.querySelector('.gallery-modal.active');
      if (activeModal) {
        var galleryId = activeModal.id.split('-')[1];
        closeGallery(galleryId);
      }
    }
  });
}; 
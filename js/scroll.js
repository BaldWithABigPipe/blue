// Scroll module (BEM) - IE11 compatible
var initSmoothScroll = function() {
  var navLinks = document.querySelectorAll('a[href^="#"]');
  for (var i = 0; i < navLinks.length; i++) {
    var link = navLinks[i];
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var targetId = this.getAttribute('href');
      var targetSection = document.querySelector(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}; 
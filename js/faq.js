// FAQ accordion module (BEM) - IE11 compatible
var handleFAQAccordion = function() {
  var faqItems = document.querySelectorAll('.faq-item__header');
  for (var i = 0; i < faqItems.length; i++) {
    var item = faqItems[i];
    item.addEventListener('click', function() {
      var content = this.nextElementSibling;
      var isExpanded = this.getAttribute('aria-expanded') === 'true';
      
      // Close other items
      for (var j = 0; j < faqItems.length; j++) {
        var otherItem = faqItems[j];
        if (otherItem !== this) {
          otherItem.setAttribute('aria-expanded', 'false');
          if (otherItem.nextElementSibling) {
            otherItem.nextElementSibling.setAttribute('aria-hidden', 'true');
          }
        }
      }
      
      // Toggle current item
      this.setAttribute('aria-expanded', (!isExpanded).toString());
      if (content) {
        content.setAttribute('aria-hidden', isExpanded.toString());
      }
    });
  }
}; 
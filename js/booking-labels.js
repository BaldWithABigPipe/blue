// Booking labels module (BEM) - IE11 compatible
var handleBookingLabels = function() {
  var bookingInputs = document.querySelectorAll('.booking__input');
  for (var i = 0; i < bookingInputs.length; i++) {
    var input = bookingInputs[i];
    var label = input.nextElementSibling;
    if (!label || !label.classList.contains('booking__label')) continue;
    
    var updateLabelStyle = function() {
      if (input === document.activeElement) {
        // Make parent containers overflow visible when focused
        var inputWrap = input.closest('.booking__input-wrap');
        var field = input.closest('.booking__field');
        var fieldsGroup = input.closest('.booking__fields-group');
        var rowDetails = input.closest('.booking__row--details');
        
        if (inputWrap) inputWrap.style.overflow = 'visible';
        if (field) field.style.overflow = 'visible';
        if (fieldsGroup) fieldsGroup.style.overflow = 'visible';
        if (rowDetails) rowDetails.style.overflow = 'visible';
      } else {
        // Reset parent containers overflow
        var inputWrap = input.closest('.booking__input-wrap');
        var field = input.closest('.booking__field');
        var fieldsGroup = input.closest('.booking__fields-group');
        var rowDetails = input.closest('.booking__row--details');
        
        if (inputWrap) inputWrap.style.overflow = '';
        if (field) field.style.overflow = '';
        if (fieldsGroup) fieldsGroup.style.overflow = '';
        if (rowDetails) rowDetails.style.overflow = '';
      }
    };
    
    input.addEventListener('focus', updateLabelStyle);
    input.addEventListener('blur', updateLabelStyle);
  }
}; 
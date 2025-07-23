// Language switcher module (BEM) - IE11 compatible
var getBasePath = function() {
  var path = window.location.pathname;
  return path.replace(/^\/(en|ru)/, '');
};

var getCurrentLanguage = function() {
  var path = window.location.pathname;
  if (path.indexOf('/ru/') === 0) return 'ru';
  if (path.indexOf('/en/') === 0) return 'en';
  return 'en';
};

var updateLangCurrent = function(lang) {
  var current = document.querySelector('.header__lang-current');
  if (current) current.textContent = lang === 'ru' ? 'RU' : 'EN';
};

var navigateToLanguage = function(lang) {
  var basePath = getBasePath();
  var newPath;
  if (lang === 'en') {
    newPath = basePath || '/';
  } else {
    newPath = '/' + lang + basePath;
  }
  var currentPath = window.location.pathname;
  if (newPath !== currentPath) window.location.href = newPath;
};

var initLangSwitcher = function() {
  var currentLang = getCurrentLanguage();
  var langOptions = document.querySelectorAll('.header__lang-option');
  
  for (var i = 0; i < langOptions.length; i++) {
    var option = langOptions[i];
    option.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var lang = this.getAttribute('data-lang');
      navigateToLanguage(lang);
    });
  }
  
  var langSwitch = document.getElementById('lang-switch');
  var langList = document.getElementById('lang-list');
  var langIcon = langSwitch ? langSwitch.querySelector('.header__lang-icon svg') : null;
  var langArrow = langSwitch ? langSwitch.querySelector('.header__lang-arrow svg') : null;

  // Open/close dropdown
  var openDropdown = function() {
    langSwitch.classList.add('active');
    langList.classList.add('active');
    if (langIcon) {
      langIcon.style.color = '#F5B301';
      langIcon.style.stroke = '#F5B301';
    }
    if (langArrow) {
      langArrow.style.color = '#F5B301';
      langArrow.style.stroke = '#F5B301';
    }
  };
  
  var closeDropdown = function() {
    langSwitch.classList.remove('active');
    langList.classList.remove('active');
    if (langIcon) {
      langIcon.style.color = '#fff';
      langIcon.style.stroke = '#fff';
    }
    if (langArrow) {
      langArrow.style.color = '#fff';
      langArrow.style.stroke = '#fff';
    }
  };
  
  if (langSwitch && langList) {
    langSwitch.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!langSwitch.classList.contains('active')) {
        openDropdown();
      } else {
        closeDropdown();
      }
    };
    
    document.addEventListener('click', function(e) {
      if (!langList.contains(e.target) && e.target !== langSwitch) {
        closeDropdown();
      }
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeDropdown();
      }
    });
  }
  
  updateLangCurrent(currentLang);
  window.addEventListener('popstate', function() {
    var newLang = getCurrentLanguage();
    if (newLang !== currentLang) {
      currentLang = newLang;
      updateLangCurrent(newLang);
    }
  });
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  initLangSwitcher();
}); 
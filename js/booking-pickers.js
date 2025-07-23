/**
 * Custom Pickers Module for Booking Form
 * Handles passengers, luggage, and waiting time selection
 * 
 * Features:
 * - Security: XSS prevention, input sanitization
 * - Performance: Debouncing, throttling, efficient DOM manipulation
 * - Accessibility: ARIA labels, keyboard navigation
 * - Modern ES6+: Classes, arrow functions, template literals
 */

// ===================================================================
// 1. CONFIGURATION AND CONSTANTS
// ===================================================================
if (!window.selectedAddresses) {
  window.selectedAddresses = { from: null, to: null };
}

const PICKER_CONFIG = Object.freeze({
  MAX_PASSENGERS: 6, // 
  MAX_LUGGAGE: 7,
  MIN_VALUE: 1,
  DEBOUNCE_DELAY: 150,
  ANIMATION_DURATION: 300
});

const WAITING_TIME_OPTIONS = Object.freeze([
  { value: '30min', label: { en: '30 minutes', ru: '30 минут' } },
  { value: '1hour', label: { en: '1 hour', ru: '1 час' } },
  { value: '2hours', label: { en: '2 hours', ru: '2 часа' } },
  { value: '3hours', label: { en: '3 hours', ru: '3 часа' } },
  { value: '4hours', label: { en: '4 hours', ru: '4 часа' } },
  { value: '5hours+', label: { en: '5+ hours', ru: '5+ часов' } }
]);

// SVG Icons for pickers - using the same icons as in the fields with accent color
const PICKER_ICONS = Object.freeze({
  PASSENGER: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="20" height="20" fill="#d1a236">
    <path d="M62.242,47.758l0.014-0.014c-5.847-4.753-12.84-8.137-20.491-9.722C44.374,35.479,46,31.932,46,28 c1.657,0,3-1.343,3-3v-2c0-0.886-0.391-1.673-1-2.222V12c0-6.627-5.373-12-12-12h-8c-6.627,0-12,5.373-12,12v8.778 c-0.609,0.549-1,1.336-1,2.222v2c0,1.657,1.343,3,3,3c0,3.932,1.626,7.479,4.236,10.022c-7.652,1.586-14.646,4.969-20.492,9.722 l0.014,0.014C0.672,48.844,0,50.344,0,52v8c0,2.211,1.789,4,4,4h56c2.211,0,4-1.789,4-4v-8C64,50.344,63.328,48.844,62.242,47.758z M20,28v-1c0-0.553-0.447-1-1-1h-1c-0.553,0-1-0.447-1-1v-2c0-0.553,0.447-1,1-1h1c0.553,0,1-0.447,1-1v-1v-1c0-2.209,1.791-4,4-4 c2.088,0,3.926-1.068,5-2.687C30.074,13.932,31.912,15,34,15h6c2.209,0,4,1.791,4,4v1v1c0,0.553,0.447,1,1,1h1c0.553,0,1,0.447,1,1 v2c0,0.553-0.447,1-1,1h-1c-0.553,0-1,0.447-1,1v1c0,6.627-5.373,12-12,12S20,34.627,20,28z M24.285,39.678 C26.498,41.143,29.147,42,32,42s5.502-0.857,7.715-2.322c1.66,0.281,3.297,0.63,4.892,1.084C41.355,43.983,36.911,46,31.973,46 c-4.932,0-9.371-2.011-12.621-5.226C20.96,40.315,22.61,39.961,24.285,39.678z"/>
  </svg>`,
  
  SUITCASE: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1792 1792" width="20" height="20" fill="#d1a236">
    <path d="M640 384h512v-128h-512v128zM288 384v1280h-64q-92 0-158-66t-66-158v-832q0-92 66-158t158-66h64zM1408 384v1280h-1024v-1280h128v-160q0-40 28-68t68-28h576q40 0 68 28t28 68v160h128zM1792 608v832q0 92-66 158t-158 66h-64v-1280h64q92 0 158 66t66 158z"/>
  </svg>`,
  
  CLOCK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="20" height="20" fill="#d1a236">
    <path d="M36.169,34.754c-0.372,0.562-0.854,1.043-1.415,1.415l7.853,7.853c0.391,0.391,1.023,0.391,1.414-0.001 c0.391-0.391,0.391-1.023,0-1.414L36.169,34.754z"/>
    <path d="M33,27.101V14c0-0.553-0.447-1-1-1s-1,0.447-1,1v13.101C31.323,27.035,31.657,27,32,27 S32.677,27.035,33,27.101z"/>
    <path d="M32,29c-1.657,0-3,1.343-3,3s1.343,3,3,3s3-1.343,3-3S33.657,29,32,29z M32,33c-0.553,0-1-0.447-1-1 s0.447-1,1-1s1,0.447,1,1S32.553,33,32,33z"/>
    <path d="M54,32c0-0.553,0.447-1,1-1h2.975c-0.243-6.425-2.815-12.252-6.899-16.661l-2.105,2.104 c-0.391,0.391-1.023,0.391-1.414,0s-0.391-1.023,0-1.414l2.104-2.104C45.251,8.84,39.424,6.269,32.999,6.025V9c0,0.553-0.447,1-1,1 s-1-0.447-1-1V6.025c-6.425,0.243-12.252,2.815-16.661,6.9l2.104,2.104c0.391,0.391,0.391,1.022,0,1.414 c-0.391,0.391-1.023,0.391-1.414,0l-2.104-2.104C8.84,18.75,6.269,24.577,6.025,31.002h2.974c0.553,0,0.999,0.446,1,1 c0,0.552-0.447,0.999-1,1H6.025c0.244,6.425,2.816,12.251,6.9,16.66l2.104-2.104c0.391-0.391,1.021-0.391,1.414,0 c0.39,0.39,0.39,1.022,0,1.414l-2.104,2.104c4.409,4.084,10.235,6.655,16.66,6.898l0.001-2.974c0-0.553,0.446-0.999,1-1 c0.551,0,0.998,0.447,1,1l-0.001,2.974c6.425-0.243,12.251-2.815,16.66-6.9l-2.104-2.104c-0.391-0.392-0.391-1.023,0-1.415 c0.39-0.39,1.022-0.39,1.415,0l2.103,2.104c4.085-4.409,6.656-10.235,6.899-16.66H55C54.447,33,54,32.553,54,32z M45.435,45.435 c-1.172,1.172-3.07,1.173-4.242,0.001l-8.505-8.505C32.461,36.962,32.235,37,32,37c-2.762,0-5-2.238-5-5 c0-1.631,0.792-3.064,2-3.978V14c0-1.657,1.343-3,3-3s3,1.343,3,3v14.022c1.208,0.913,2,2.347,2,3.978 c0,0.236-0.038,0.461-0.069,0.688l8.504,8.504C46.606,42.364,46.606,44.263,45.435,45.435z"/>
    <path d="M32,0C14.327,0,0,14.327,0,32s14.327,32,32,32s32-14.327,32-32S49.673,0,32,0z M32,60 C16.536,60,4,47.464,4,32S16.536,4,32,4s28,12.536,28,28S47.464,60,32,60z"/>
  </svg>`,
  
  MINUS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M19 13H5v-2h14v2z"/>
  </svg>`,
  
  PLUS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>`
});

// SVG маркера (location marker) — как в input
const LOCATION_MARKER_SVG = `<svg fill="#d1a236" viewBox="-3 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true"><path d="m8.075 23.52c-6.811-9.878-8.075-10.891-8.075-14.52 0-4.971 4.029-9 9-9s9 4.029 9 9c0 3.629-1.264 4.64-8.075 14.516-.206.294-.543.484-.925.484s-.719-.19-.922-.48l-.002-.004zm.925-10.77c2.07 0 3.749-1.679 3.749-3.75s-1.679-3.75-3.75-3.75-3.75 1.679-3.75 3.75c0 2.071 1.679 3.75 3.75 3.75z"></path></svg>`;
// SVG календаря (calendar) — как в input
const CALENDAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="24" height="24" fill="#d1a236"><path d="M60,4h-7V3c0-1.657-1.343-3-3-3s-3,1.343-3,3v1H17V3c0-1.657-1.343-3-3-3s-3,1.343-3,3v1H4 C1.789,4,0,5.789,0,8v52c0,2.211,1.789,4,4,4h56c2.211,0,4-1.789,4-4V8C64,5.789,62.211,4,60,4z M18,53c0,0.553-0.447,1-1,1h-6 c-0.553,0-1-0.447-1-1v-5c0-0.553,0.447-1,1-1h6c0.553,0,1,0.447,1,1V53z M18,42c0,0.553-0.447,1-1,1h-6c-0.553,0-1-0.447-1-1v-5 c0-0.553,0.447-1,1-1h6c0.553,0,1,0.447,1,1V42z M18,31c0,0.553-0.447,1-1,1h-6c-0.553,0-1-0.447-1-1v-5c0-0.553,0.447-1,1-1h6 c0.553,0,1,0.447,1,1V31z M30,53c0,0.553-0.447,1-1,1h-6c-0.553,0-1-0.447-1-1v-5c0-0.553,0.447-1,1-1h6c0.553,0,1,0.447,1,1V53z M30,42c0,0.553-0.447,1-1,1h-6c-0.553,0-1-0.447-1-1v-5c0-0.553,0.447-1,1-1h6c0.553,0,1,0.447,1,1V42z M30,31 c0,0.553-0.447,1-1,1h-6c-0.553,0-1-0.447-1-1v-5c0-0.553,0.447-1,1-1h6c0.553,0,1,0.447,1,1V31z M42,53c0,0.553-0.447,1-1,1h-6 c-0.553,0-1-0.447-1-1v-5c0-0.553,0.447-1,1-1h6c0.553,0,1,0.447,1,1V53z M42,42c0,0.553-0.447,1-1,1h-6c-0.553,0-1-0.447-1-1v-5 c0-0.553,0.447-1,1-1h6c0.553,0,1,0.447,1,1V42z M42,31c0,0.553-0.447,1-1,1h-6c-0.553,0-1-0.447-1-1v-5c0-0.553,0.447-1,1-1h6 c0.553,0,1,0.447,1,1V31z M54,42c0,0.553-0.447,1-1,1h-6c-0.553,0-1-0.447-1-1v-5c0-0.553,0.447-1,1-1h6c0.553,0,1,0.447,1,1V42z M54,31c0,0.553-0.447,1-1,1h-6c-0.553,0-1-0.447-1-1v-5c0-0.553,0.447-1,1-1h6 c0.553,0,1,0.447,1,1V31z M62,15H2V8 c0-1.104,0.896-2,2-2h7v4c0,1.657,1.343,3,3,3s3-1.343,3-3V6h30v4c0,1.657,1.343,3,3,3s3-1.343,3-3V6h7c1.104,0,2,0.896,2,2V15z"/></svg>`;

// База данных автомобилей с характеристиками
const FLEET_DATA = {
  1: {
    id: 1,
    name: {
      en: 'Mercedes S-Class Extra Long',
      ru: 'Mercedes S-Class Extra Long'
    },
    subtitle: {
      en: 'Ultimate luxury sedan',
      ru: 'Ультимативный люксовый седан'
    },
    passengers: 3,
    luggage: 3,
    image: 'img/car1/1.jpg',
    modal: 'carModal1',
    wifi: true
  },
  2: {
    id: 2,
    name: {
      en: 'Mercedes V-Class 4x4 2.5D',
      ru: 'Mercedes V-Class 4x4 2.5D'
    },
    subtitle: {
      en: 'Luxury off-road minivan',
      ru: 'Люксовый внедорожный минивэн'
    },
    passengers: 6,
    luggage: 7,
    image: 'img/car2/1.jpg',
    modal: 'carModal2',
    wifi: true
  },
  3: {
    id: 3,
    name: {
      en: 'Lexus LS 500h 4x4 Extra Long',
      ru: 'Lexus LS 500h 4x4 Extra Long'
    },
    subtitle: {
      en: 'Hybrid luxury sedan',
      ru: 'Гибридный люксовый седан'
    },
    passengers: 3,
    luggage: 3,
    image: 'img/car3/1.jpg',
    modal: 'carModal3',
    wifi: true
  },
  4: {
    id: 4,
    name: {
      en: 'Lexus NX 300h',
      ru: 'Lexus NX 300h'
    },
    subtitle: {
      en: 'Hybrid luxury SUV',
      ru: 'Гибридный люксовый внедорожник'
    },
    passengers: 4,
    luggage: 4,
    image: 'img/car4/1.jpg',
    modal: 'carModal4',
    wifi: true
  },
  5: {
    id: 5,
    name: {
      en: 'Lexus ES 300h',
      ru: 'Lexus ES 300h'
    },
    subtitle: {
      en: 'Hybrid business sedan',
      ru: 'Гибридный бизнес-седан'
    },
    passengers: 4,
    luggage: 4,
    image: 'img/car5/1.jpg',
    modal: 'carModal5',
    wifi: true
  }
};

// Функция фильтрации автомобилей по пассажирам и багажу
const filterCarsByRequirements = (requiredPassengers, requiredLuggage) => {
  const suitableCars = [];
  
  for (const carId in FLEET_DATA) {
    const car = FLEET_DATA[carId];
    if (car.passengers >= requiredPassengers && car.luggage >= requiredLuggage) {
      suitableCars.push(car);
    }
  }
  
  // Сортируем по количеству пассажиров (от меньшего к большему)
  return suitableCars.sort((a, b) => a.passengers - b.passengers);
};

// Функция создания HTML для автомобиля
const createCarHTML = (car, isRu = false) => {
  const lang = isRu ? 'ru' : 'en';
  const carName = car.name[lang];
  const imagePath = isRu ? `../${car.image}` : car.image;
  const buttonText = isRu ? 'Подробнее' : 'Details';
  const selectedText = isRu ? 'Выбрано' : 'Selected';
  
  return `
    <div class="booking-fleet__item" data-car="${car.id}" tabindex="0" role="button" aria-label="${isRu ? 'Выбрать автомобиль' : 'Select car'} ${carName}">
      <div class="booking-fleet__item-selected-badge" style="display: none;">
        <span class="booking-fleet__item-selected-text">${selectedText}</span>
      </div>
      <div class="booking-fleet__item-image">
        <img src="${imagePath}" alt="${carName}" class="booking-fleet__item-img" loading="lazy">
      </div>
      <div class="booking-fleet__item-content">
        <h3 class="booking-fleet__item-title">${carName}</h3>
        <button class="booking-fleet__item-details-btn" data-car-id="${car.id}" aria-label="${isRu ? 'Открыть галерею' : 'Open gallery'} ${carName}">
          <span class="booking-fleet__item-details-text">${buttonText}</span>
        </button>
      </div>
    </div>
  `;
};

// Функция создания HTML для блока контактных данных
const createContactFormHTML = (isRu = false) => {
  const title = isRu ? 'Контактные данные' : 'Contact Information';
  const nameLabel = isRu ? 'Ваше имя' : 'Your Name';
  const emailLabel = isRu ? 'Email' : 'Email';
  const phoneLabel = isRu ? 'Номер телефона' : 'Phone Number';
  const submitText = isRu ? 'Оформить трансфер' : 'Book Transfer';
  const namePlaceholder = isRu ? 'Введите ваше имя' : 'Enter your name';
  const emailPlaceholder = isRu ? 'example@email.com' : 'example@email.com';
  const phonePlaceholder = isRu ? '+7 (999) 123-45-67' : '+1 (555) 123-4567';
  
  return `
    <div class="booking__contact-section">
      <h3 class="booking__contact-title">${title}</h3>
      <form class="booking__contact-form" novalidate>
        <div class="booking__contact-field">
          <input 
            type="text" 
            id="booking-name" 
            name="name" 
            class="booking__contact-input" 
            placeholder="${namePlaceholder}"
            required
            autocomplete="name"
            maxlength="50"
            pattern="[A-Za-zА-Яа-яЁё\\s\\-']{2,50}"
          >
          <label for="booking-name" class="booking__contact-label">${nameLabel}</label>
          <div class="booking__contact-error" id="name-error"></div>
        </div>
        
        <div class="booking__contact-field">
          <input 
            type="email" 
            id="booking-email" 
            name="email" 
            class="booking__contact-input" 
            placeholder="${emailPlaceholder}"
            required
            autocomplete="email"
            maxlength="100"
            pattern="[a-z0-9._%\\+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$"
          >
          <label for="booking-email" class="booking__contact-label">${emailLabel}</label>
          <div class="booking__contact-error" id="email-error"></div>
        </div>
        
        <div class="booking__contact-field">
          <input 
            type="tel" 
            id="booking-phone" 
            name="phone" 
            class="booking__contact-input" 
            placeholder="${phonePlaceholder}"
            required
            autocomplete="tel"
            maxlength="20"
            pattern="[+]?[0-9\\s\\-\\(\\)]{10,20}"
          >
          <label for="booking-phone" class="booking__contact-label">${phoneLabel}</label>
          <div class="booking__contact-error" id="phone-error"></div>
        </div>
        
        <button type="submit" class="booking__contact-submit">
          <span class="booking__contact-submit-text">${submitText}</span>
        </button>
      </form>
    </div>
  `;
};

// Функция обновления секции выбора автомобилей
const updateCarSelection = (requiredPassengers, requiredLuggage) => {
  const carsContainer = document.querySelector('.booking__result-car');
  if (!carsContainer) return;

  // Очищаем контейнер
  carsContainer.innerHTML = '';

  // Фильтруем подходящие автомобили
  const suitableCars = filterCarsByRequirements(requiredPassengers, requiredLuggage);
  const isRu = document.documentElement.lang === 'ru';

  if (suitableCars.length === 0) {
    const noCarsText = isRu ? 'Нет подходящих автомобилей для ваших требований' : 'No suitable cars for your requirements';
    carsContainer.innerHTML = `
      <div class="booking__no-cars">
        <p>${noCarsText}</p>
      </div>
    `;
    return;
  }

  // Создаем список автомобилей
  const fleetList = document.createElement('div');
  fleetList.className = 'booking__fleet-list';
  
  // Добавляем автомобили
  suitableCars.forEach(car => {
    fleetList.innerHTML += createCarHTML(car, isRu);
  });

  // Добавляем только список автомобилей в контейнер
  carsContainer.appendChild(fleetList);

  // Создаем отдельную секцию контактных данных
  const contactSection = document.createElement('div');
  contactSection.className = 'booking__contact-section';
  contactSection.innerHTML = createContactFormHTML(isRu);
  
  // Добавляем секцию контактных данных после секции автомобилей
  carsContainer.parentNode.insertBefore(contactSection, carsContainer.nextSibling);

  // Настраиваем события
  setupCarSelectionEvents();
  setupContactFormEvents();
};

// Настройка событий для выбора автомобилей
const setupCarSelectionEvents = () => {
  document.querySelectorAll('.booking__result-car .booking-fleet__item').forEach(item => {
    item.addEventListener('click', handleCarClick);
    item.addEventListener('keydown', handleCarKeydown);
  });
  
  // Добавляем обработчики для кнопок "Подробнее"
  document.querySelectorAll('.booking__result-car .booking-fleet__item-details-btn').forEach(btn => {
    btn.addEventListener('click', handleDetailsClick);
  });
};

// Обработчик клика по кнопке "Подробнее"
const handleDetailsClick = function(e) {
  e.preventDefault();
  e.stopPropagation();
  
  const carId = this.getAttribute('data-car-id');
  
  if (carId && FLEET_DATA[carId] && FLEET_DATA[carId].modal) {
    const modalId = FLEET_DATA[carId].modal;
    
    if (window.openCarModal) {
      window.openCarModal(modalId);
    }
  }
};

// Обработчик клика по автомобилю
const handleCarClick = function(e) {
  // Если клик был по кнопке "Подробнее", не обрабатываем выбор автомобиля
  if (e.target.closest('.booking-fleet__item-details-btn')) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  // Убираем выделение со всех автомобилей
  document.querySelectorAll('.booking__result-car .booking-fleet__item').forEach(item => {
    item.classList.remove('booking-fleet__item--selected');
    const badge = item.querySelector('.booking-fleet__item-selected-badge');
    if (badge) badge.style.display = 'none';
  });

  // Добавляем выделение к выбранному автомобилю
  this.classList.add('booking-fleet__item--selected');
  const badge = this.querySelector('.booking-fleet__item-selected-badge');
  if (badge) {
    badge.style.display = 'flex';
  }

  const carId = this.getAttribute('data-car');
  window.selectedCar = FLEET_DATA[carId];
  const isRu = document.documentElement.lang === 'ru';
  const lang = isRu ? 'ru' : 'en';
  const carName = FLEET_DATA[carId].name[lang];

  // Показываем зеленое уведомление
  showBookingFormNotification(
    isRu ? `Выбран автомобиль: ${carName}` : `Selected car: ${carName}`,
    'success'
  );
};

// Обработчик нажатия клавиш для автомобиля
const handleCarKeydown = function(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleCarClick.call(this, e);
  }
};

// ===================================================================
// 2. UTILITY FUNCTIONS
// ===================================================================

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizePickerInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>'"&]/g, '').trim().substring(0, 50);
};

/**
 * Debounce utility for picker interactions
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
const pickerDebounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Escape HTML for safe DOM insertion
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
const escapePickerHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Utility: sanitize output for XSS
const sanitizeOutput = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"&]/g, '').trim().substring(0, 100);
};

// Utility: get SVG by type
const getAddressIcon = (type) => {
  if (type === 'airport') return PICKER_ICONS.CLOCK; // пример, заменить на нужную SVG
  if (type === 'railway') return PICKER_ICONS.SUITCASE;
  return PICKER_ICONS.PASSENGER;
};

// Показывать уведомление над формой
function showBookingFormNotification(message, type = 'error') {
  let note = document.querySelector('.booking__form-notification');
  if (!note) {
    note = document.createElement('div');
    note.className = 'booking__form-notification';
    note.style.position = 'fixed';
    note.style.top = '80px'; // Чуть ниже хедера
    note.style.left = '50%';
    note.style.transform = 'translateX(-50%)';
    note.style.background = '#dc3545'; // Default error color
    note.style.color = '#fff';
    note.style.padding = '12px 20px';
    note.style.borderRadius = '8px';
    note.style.textAlign = 'center';
    note.style.fontWeight = '600';
    note.style.fontSize = '16px';
    note.style.zIndex = '10001';
    note.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)';
    note.style.opacity = '0';
    note.style.transition = 'opacity 0.3s';
    note.style.maxWidth = '90vw';
    note.style.width = 'auto';
    note.style.minWidth = '300px';
    document.body.appendChild(note);
  }
  
  note.textContent = message;
  note.style.background = type === 'success' ? '#28a745' : '#dc3545'; // Set success color
  note.style.opacity = '1';
  
  // Автоматически скрыть через 3 секунды
  setTimeout(() => { 
    note.style.opacity = '0'; 
    // Удалить элемент после анимации
    setTimeout(() => {
      if (note.parentNode) {
        note.parentNode.removeChild(note);
      }
    }, 300);
  }, 3000);
}

function highlightField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('booking__input--error');
  setTimeout(() => el.classList.remove('booking__input--error'), 2000);
}

// Main submit logic
function setupBookingSubmit() {
  const form = document.querySelector('.booking__form');
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"], .booking__submit');
  if (!submitBtn) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Сбор данных
    const from = sanitizeOutput(document.getElementById('booking_from')?.value || '');
    const to = sanitizeOutput(document.getElementById('booking_to')?.value || '');
    const date = sanitizeOutput(document.getElementById('booking_date')?.value || '');
    const passengers = sanitizeOutput(document.getElementById('booking_passengers')?.value || '');
    const luggage = sanitizeOutput(document.getElementById('booking_luggage')?.value || '');
    const wait = sanitizeOutput(document.getElementById('booking_wait')?.value || '');

    // Валидация всех полей
    let valid = true;
    if (!from) { highlightField('booking_from'); valid = false; }
    if (!to) { highlightField('booking_to'); valid = false; }
    if (!date) { highlightField('booking_date'); valid = false; }
    if (!passengers) { highlightField('booking_passengers'); valid = false; }
    if (!luggage) { highlightField('booking_luggage'); valid = false; }
    if (!wait) { highlightField('booking_wait'); valid = false; }
    if (!valid) {
      showBookingFormNotification('Пожалуйста, заполните все поля!');
      return;
    }

    // Типы адресов (для иконок)
    const fromType = window.selectedAddresses?.from?.type || 'city';
    const toType = window.selectedAddresses?.to?.type || 'city';

    // Скрыть форму
    form.style.display = 'none';

    // Создать блок с данными
    const resultWrap = document.createElement('div');
    resultWrap.className = 'booking__result-wrap';
    const isRu = document.documentElement.lang === 'ru' || window.location.pathname.includes('/ru/');
    const labelFrom = isRu ? 'Откуда' : 'From';
    const labelTo = isRu ? 'Куда' : 'To';
    const labelDate = isRu ? 'Дата поездки' : 'Travel date';
    const labelPassengers = isRu ? 'Пассажиры' : 'Passengers';
    const labelLuggage = isRu ? 'Багаж' : 'Luggage';
    const labelWait = isRu ? 'Время ожидания' : 'Waiting time';
    // --- СТРУКТУРА ПОСЛЕ ОТПРАВКИ ФОРМЫ ---
    resultWrap.innerHTML = `
      <div class="booking__result-row-wide">
        <div class="booking__result-data">
          <div class="booking__result-title">${isRu ? 'Ваши данные' : 'Your data'}</div>
          <div class="booking__result-data-content"></div>
        </div>
        <div class="booking__result-map-wrap">
          <div class="booking__result-title">${isRu ? 'Карта' : 'Map'}</div>
          <div class="booking__result-map"></div>
        </div>
      </div>
      <div class="booking__result-car-wrap">
        <div class="booking__result-title">${isRu ? 'Выберите автомобиль' : 'Select a car'}</div>
        <div class="booking__result-car"></div>
      </div>
    `;
    // Вставить в DOM
    const container = document.querySelector('.booking__form-container') || document.body;
    container.appendChild(resultWrap);
    // --- ВСТАВКА ДАННЫХ В ЛЕВЫЙ БЛОК ---
    const dataContent = resultWrap.querySelector('.booking__result-data-content');
    if (dataContent) {
      dataContent.innerHTML = `
        <div class="booking__result-row">
          <span class="booking__result-icon">${LOCATION_MARKER_SVG}</span>
          <span class="booking__result-labels">
            <span class="booking__result-label-title booking__result-label-title--big">${labelFrom}</span>
            <span class="booking__result-label">${from}</span>
          </span>
        </div>
        <div class="booking__result-row">
          <span class="booking__result-icon">${LOCATION_MARKER_SVG}</span>
          <span class="booking__result-labels">
            <span class="booking__result-label-title booking__result-label-title--big">${labelTo}</span>
            <span class="booking__result-label">${to}</span>
          </span>
        </div>
        <div class="booking__result-row">
          <span class="booking__result-icon">${CALENDAR_SVG}</span>
          <span class="booking__result-labels">
            <span class="booking__result-label-title booking__result-label-title--big">${labelDate}</span>
            <span class="booking__result-label">${date}</span>
          </span>
        </div>
        <div class="booking__result-row">
          <span class="booking__result-icon">${PICKER_ICONS.PASSENGER}</span>
          <span class="booking__result-labels">
            <span class="booking__result-label-title booking__result-label-title--big">${labelPassengers}</span>
            <span class="booking__result-label">${passengers}</span>
          </span>
        </div>
        <div class="booking__result-row">
          <span class="booking__result-icon">${PICKER_ICONS.SUITCASE}</span>
          <span class="booking__result-labels">
            <span class="booking__result-label-title booking__result-label-title--big">${labelLuggage}</span>
            <span class="booking__result-label">${luggage}</span>
          </span>
        </div>
        <div class="booking__result-row">
          <span class="booking__result-icon">${PICKER_ICONS.CLOCK}</span>
          <span class="booking__result-labels">
            <span class="booking__result-label-title booking__result-label-title--big">${labelWait}</span>
            <span class="booking__result-label">${wait}</span>
          </span>
        </div>
      `;
    }
    // --- ВСТАВКА КАРТЫ В ПРАВЫЙ БЛОК ---
    const mapContent = resultWrap.querySelector('.booking__result-map');
    if (mapContent) {
      mapContent.innerHTML = '<div id="bookingMap" class="booking__map"></div>';
    }
    // --- ДАЛЬНЕЙШАЯ ЛОГИКА (данные, карта, авто) будет добавляться в соответствующие блоки ---

    // --- КАРТА ---
    const mapBlock = resultWrap.querySelector('.booking__result-map');
    if (mapBlock) {

      mapBlock.innerHTML = '';
      
      // Временный отладочный блок с защитой
      if (!window.selectedAddresses) {
        mapBlock.innerHTML = '<div class="map-error" style="color:#fff;text-align:center;padding:40px 0;">selectedAddresses is undefined</div>';
        return;
      }
    }
    setTimeout(() => {
      try {
        if (!mapBlock) throw new Error('Map container not found');
        if (!window.L) throw new Error('Leaflet not loaded');
        let tries = 0;
        function getCoords(obj) {
          if (!obj) return null;
          if (obj.location && obj.location.lat && obj.location.lng) {
            const lat = parseFloat(obj.location.lat);
            const lng = parseFloat(obj.location.lng);
            if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
          }
          if (obj.coords && Array.isArray(obj.coords) && obj.coords.length === 2) {
            const lat = parseFloat(obj.coords[0]);
            const lng = parseFloat(obj.coords[1]);
            if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
          }
          if (obj.coords && obj.coords.lat && obj.coords.lng) {
            const lat = parseFloat(obj.coords.lat);
            const lng = parseFloat(obj.coords.lng);
            if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
          }
          return null;
        }
        function waitForAddresses(cb) {
          tries++;
          const from = window.selectedAddresses?.from;
          const to = window.selectedAddresses?.to;
          const fromCoords = getCoords(from);
          const toCoords = getCoords(to);
          if (fromCoords && toCoords) {
            cb(fromCoords, toCoords);
          } else if (tries < 10) {
            setTimeout(() => waitForAddresses(cb), 100);
          } else {
            mapBlock.innerHTML = `<div class="map-error" style="color:#fff;text-align:center;padding:40px 0;">${isRu ? 'Выберите оба адреса с координатами' : 'Select both addresses with coordinates'}</div>`;
          }
        }
        waitForAddresses((fromCoords, toCoords) => {
          // Убедиться, что контейнер карты есть
          let bookingMap = mapBlock.querySelector('#bookingMap');
          if (!bookingMap) {
            bookingMap = document.createElement('div');
            bookingMap.id = 'bookingMap';
            bookingMap.className = 'booking__map';
            mapBlock.appendChild(bookingMap);
          }
          
          // СКРЫТЬ карту до загрузки
          bookingMap.style.visibility = 'hidden';
          
          // --- только теперь инициализируем карту ---
          const map = L.map('bookingMap', {
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: false,
            dragging: true,
          }).setView(fromCoords, 8);
          
          // ОЧИСТИТЬ все существующие элементы loader'а
          const existingLoaders = document.querySelectorAll('.booking-map-loading');
          existingLoaders.forEach(loader => loader.remove());
          
          // СОЗДАТЬ НОВЫЙ loader
          const mapLoader = document.createElement('div');
          mapLoader.className = 'booking-map-loading';
          mapLoader.innerHTML = '<div class="booking-map-loading__spinner"></div><p class="booking-map-loading__text">'+(isRu?'Загрузка карты...':'Loading map...')+'</p>';
          
          // ДОБАВИТЬ loader в контейнер карты
          mapBlock.appendChild(mapLoader);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            minZoom: 3,
          }).addTo(map);
          const markerIcon = L.divIcon({
            className: 'booking-map-marker',
            html: `<svg fill=\"#d1a236\" viewBox=\"-3 0 24 24\" width=\"32\" height=\"32\"><path d=\"m8.075 23.52c-6.811-9.878-8.075-10.891-8.075-14.52 0-4.971 4.029-9 9-9s9 4.029 9 9c0 3.629-1.264 4.64-8.075 14.516-.206.294-.543.484-.925.484s-.719-.19-.922-.48l-.002-.004zm.925-10.77c2.07 0 3.749-1.679 3.749-3.75s-1.679-3.75-3.75-3.75-3.75 1.679-3.75 3.75c0 2.071 1.679 3.75 3.75 3.75z\"></path></svg>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          });
          L.marker(fromCoords, {icon: markerIcon}).addTo(map);
          L.marker(toCoords, {icon: markerIcon}).addTo(map);
          // Создаем AbortController для timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд timeout
          
          fetch(`https://router.project-osrm.org/route/v1/driving/${fromCoords[1]},${fromCoords[0]};${toCoords[1]},${toCoords[0]}?overview=full&geometries=geojson`, {
            signal: controller.signal
          })
            .then(res => {
              clearTimeout(timeoutId);
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }
              return res.json();
            })
            .then(data => {
              if (data.routes && data.routes.length) {
                const route = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                L.polyline(route, { color: '#d1a236', weight: 5, opacity: 0.85, lineCap: 'round' }).addTo(map);
                map.fitBounds(route, { padding: [40, 40] });
                // --- Красивый блок с данными ---
                const distKm = Math.round(data.routes[0].distance / 1000);
                const timeMin = Math.round(data.routes[0].duration / 60);
                // SVG для времени в пути (новый, часы)
                const NEW_TIME_SVG = `<svg fill=\"#d1a236\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 705.299 705.299\" width=\"24\" height=\"24\"><g><g><path d=\"M395.233,117.99V91.598l64.906,0.023v-5.55C460.151,38.549,421.636,0,374.08,0h-62.632 c-47.511,0-86.06,38.549-86.06,86.071v5.515l66.343,0.023v26.163C152.565,141.993,46.651,263.051,46.651,409.157 c0,163.594,132.571,296.142,296.107,296.142c163.537,0,296.107-132.548,296.107-296.142 C638.876,263.557,533.698,142.786,395.233,117.99z M342.758,637.52c-125.907,0-228.339-102.433-228.339-228.362 c0-125.896,102.433-228.305,228.339-228.305c125.895,0,228.339,102.41,228.339,228.305 C571.097,535.087,468.665,637.52,342.758,637.52z\"></path> <path d=\"M651.987,153.333l-48.017-48.028c-4.274-4.286-10.065-6.688-16.098-6.688s-11.823,2.401-16.097,6.665l-38.929,38.939 l80.246,80.2l38.894-38.917C660.869,176.612,660.869,162.227,651.987,153.333z\"></path> <path d=\"M341.724,195.237c-117.714,0.54-212.966,96.125-212.966,213.92c0,118.231,95.815,214.022,214.012,214.022 c118.185,0,213.989-95.769,214-214H341.724V195.237z\"></path> </g></g></svg>`;
                // SVG для расстояния (ваш SVG)
                const DIST_SVG = `<svg fill=\"#d1a236\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 480.543 480.543\" width=\"24\" height=\"24\"><g><g><path d=\"M225.278,278.426c0-48.641-39.572-88.213-88.214-88.213c-48.641,0-88.212,39.572-88.212,88.213 c0,14.254,3.401,27.727,9.431,39.654l78.781,162.463l78.795-162.488C221.88,306.133,225.278,292.669,225.278,278.426z M137.064,327.243c-26.917,0-48.817-21.9-48.817-48.817s21.9-48.817,48.817-48.817c26.918,0,48.817,21.9,48.817,48.817 S163.982,327.243,137.064,327.243z\"></path> <path d=\"M387.021,0c-24.63,0-44.669,20.038-44.669,44.668c0,7.218,1.723,14.04,4.776,20.081l39.893,82.267l39.899-82.28 c3.049-6.037,4.77-12.855,4.77-20.067C431.69,20.038,411.65,0,387.021,0z M387.021,69.388c-13.631,0-24.72-11.089-24.72-24.72 c0-13.63,11.089-24.72,24.72-24.72c13.629,0,24.719,11.09,24.719,24.72C411.74,58.299,400.65,69.388,387.021,69.388z\"></path> <path d=\"M348.116,289.787c-1.812-8.523-4.166-16.875-7.131-25.075c-3.974-10.987-8.74-21.724-12.391-32.836 c-6.823-20.771,4.948-38.105,7.16-41.256c3.876-5.517,8.408-10.58,13.19-15.322c9.207-9.128,19.361-17.288,29.984-24.803 c-1.316-2.039-2.591-4.1-3.805-6.199c-15.279,5.99-93.854,33.452-91.938,94.121c0.384,12.162,5.083,23.737,7.979,35.526 c1.395,5.681,2.605,11.412,3.345,17.218c0.319,2.614,0.515,5.243,0.729,7.87c0.006-0.02,0.004-0.034-0.008-0.045 c0.007,0.076,0.202,8.326-0.164,11.9c-1.147,11.189-2.799,22.494-7.516,32.758c-4.387,9.543-11.006,17.842-19.193,24.402 c-18.716,14.994-43.514,20.988-66.913,23.398c-1.114,0.117-2.228,0.217-3.342,0.314l-41.779,86.152 c20.614-1.281,41.175-4.102,61.235-9.039c23.607-5.811,46.613-14.588,67.227-27.598c20.596-12.996,38.308-30.578,50.099-51.984 c12.335-22.391,17.277-48.038,16.225-73.452C350.752,307.156,349.928,298.307,348.116,289.787z\"></path> </g></g></svg>`;

                // --- Блок с адресами, временем и расстоянием ---
                const infoBlock = document.createElement('div');
                infoBlock.className = 'booking__map-info-block';
                infoBlock.innerHTML = `
                  <div class="booking__map-info-row">
                    <span class="booking__map-info-item">${LOCATION_MARKER_SVG}<span>${escapePickerHtml(window.selectedAddresses.from?.name?.en || window.selectedAddresses.from?.name?.ru || '')}</span></span>
                    <span class="booking__map-info-arrow">→</span>
                    <span class="booking__map-info-item">${LOCATION_MARKER_SVG}<span>${escapePickerHtml(window.selectedAddresses.to?.name?.en || window.selectedAddresses.to?.name?.ru || '')}</span></span>
                  </div>
                  <div class="booking__map-info-row booking__map-info-row--bottom">
                    <span class="booking__map-info-item">${NEW_TIME_SVG}<span class="booking__map-info-label">${isRu ? 'Время в пути' : 'Travel time'}:</span> <span>${timeMin} мин</span></span>
                    <span class="booking__map-info-item">${DIST_SVG}<span class="booking__map-info-label">${isRu ? 'Расстояние' : 'Distance'}:</span> <span>${distKm} км</span></span>
                  </div>
                `;
                const mapWrap = mapBlock.closest('.booking__result-map-wrap');
                if (mapWrap) {
                  mapWrap.appendChild(infoBlock);
                }

                // ПОКАЗАТЬ карту и СКРЫТЬ loader после загрузки
                bookingMap.style.visibility = 'visible';
                
                // Найти и скрыть loader
                const mapLoader = mapBlock.querySelector('.booking-map-loading');
                if (mapLoader) {
                  mapLoader.style.opacity = '0';
                  mapLoader.style.transition = 'opacity 0.3s ease';
                  setTimeout(() => {
                    if (mapLoader && mapLoader.parentNode) {
                      mapLoader.remove();
                    }
                  }, 300);
                }
              }
            })
            .catch(error => {
              clearTimeout(timeoutId);
              console.warn('OSRM API error:', error);
              // Показать карту без маршрута в случае ошибки
              bookingMap.style.visibility = 'visible';
              
              // Найти и скрыть loader
              const mapLoader = mapBlock.querySelector('.booking-map-loading');
              if (mapLoader) {
                mapLoader.style.opacity = '0';
                mapLoader.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                  if (mapLoader && mapLoader.parentNode) {
                    mapLoader.remove();
                  }
                }, 300);
              }
            });
        });
      } catch (e) {
        mapBlock.innerHTML = `<div class="map-error" style="color:#fff;text-align:center;padding:40px 0;">${isRu ? 'Ошибка карты: ' : 'Map error: '} ${e.message}</div>`;
      }
    }, 0);
    
    // --- ОБНОВЛЕНИЕ СЕКЦИИ ВЫБОРА АВТОМОБИЛЕЙ ---
    // Извлекаем числовые значения из строк
    const passengersNum = parseInt(passengers.match(/\d+/)?.[0] || '0');
    const luggageNum = parseInt(luggage.match(/\d+/)?.[0] || '0');
    
    // Обновляем секцию выбора автомобилей
    updateCarSelection(passengersNum, luggageNum, isRu);
  });
}

// ===================================================================
// 3. BOOKING PICKERS CLASS
// ===================================================================

class BookingPickers {
  constructor() {
    // Language detection
    this.isRussian = document.documentElement?.lang === 'ru' || 
                     window.location.pathname.includes('/ru/');
    
    // Elements
    this.elements = {
      passengersInput: null,
      luggageInput: null,
      waitingInput: null
    };
    
    // State - no initial values
    this.state = {
      passengers: null,
      luggage: null,
      waiting: null
    };
    
    this.setupGlobalPickerClose();
  }

  setupGlobalPickerClose() {
    document.addEventListener('click', (e) => {
      const openPicker = document.querySelector('.booking__picker[style*="display: block"]');
      if (!openPicker) return;
      // Если клик по открытому пикеру или по input, не скрывать
      if (openPicker.contains(e.target)) return;
      const allInputs = document.querySelectorAll('.booking__input');
      for (const inp of allInputs) {
        if (inp === e.target) return;
      }
      openPicker.style.display = 'none';
    });
  }

  /**
   * Wait for DOM elements to be available
   */
  async waitForElements() {
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const passengersInput = document.getElementById('booking_passengers');
      const luggageInput = document.getElementById('booking_luggage');
      const waitingInput = document.getElementById('booking_wait');
      
      if (passengersInput && luggageInput && waitingInput) {
        this.elements.passengersInput = passengersInput;
        this.elements.luggageInput = luggageInput;
        this.elements.waitingInput = waitingInput;
        
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    throw new Error('BookingPickers elements not found after maximum attempts');
  }

  /**
   * Скрыть все открытые пикеры мгновенно
   */
  static closeAllPickers() {
    document.querySelectorAll('.booking__picker').forEach(picker => {
      picker.style.display = 'none';
    });
  }

  /**
   * Create list picker for passengers/luggage
   * @param {HTMLElement} input - Input element
   * @param {string} type - 'passengers' or 'luggage'
   * @param {number} maxValue - Maximum allowed value
   */
  createListPicker(input, type, maxValue) {
    const field = input.closest('.booking__field');
    if (!field) return;

    // Create picker container
    const picker = document.createElement('div');
    picker.className = `booking__picker booking__picker--${type}`;
    picker.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      min-width: 280px;
      background: #0e2339;
      border: 1px solid var(--color-border-light);
      border-top: none;
      border-radius: 0 0 12px 12px;
      z-index: 9999;
      display: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      box-sizing: border-box;
      max-height: 300px;
    `;

    // Create options list
    const icon = type === 'passengers' ? PICKER_ICONS.PASSENGER : PICKER_ICONS.SUITCASE;
    const optionsList = [];
    
    for (let i = PICKER_CONFIG.MIN_VALUE; i <= maxValue; i++) {
      const isSelected = this.state[type] === i;
      let label;
      
      if (type === 'passengers') {
        label = this.isRussian 
          ? (i === 1 ? '1 пассажир' : `${i} пассажира${i > 4 ? 'в' : ''}`)
          : (i === 1 ? '1 passenger' : `${i} passengers`);
      } else {
        label = this.isRussian 
          ? (i === 1 ? '1 багаж' : `${i} багажа${i > 4 ? 'й' : ''}`)
          : (i === 1 ? '1 luggage' : `${i} luggage`);
      }
      
      optionsList.push(`
        <div class="booking__picker-option" data-value="${i}"
             style="padding: 12px 16px; display: flex; align-items: center; cursor: pointer; transition: background-color 0.2s ease; border-bottom: 1px solid var(--color-border-dark); ${isSelected ? 'background: var(--color-accent-dark); color: var(--color-text-light);' : 'color: var(--color-text-light);'}"
             onmouseover="this.style.backgroundColor='var(--color-accent-dark)'"
             onmouseout="this.style.backgroundColor='${isSelected ? 'var(--color-accent-dark)' : 'transparent'}'">
          <span style="margin-right: 10px; display: flex; align-items: center;">${icon}</span>
          <span>${escapePickerHtml(label)}</span>
        </div>
      `);
    }

    picker.innerHTML = optionsList.join('');

    // Insert picker after input wrap
    const inputWrap = input.closest('.booking__input-wrap');
    if (inputWrap) {
      inputWrap.appendChild(picker);
    }

    // Setup event listeners
    this.setupListEvents(input, picker, type);
    
    // Скрывать все пикеры при фокусе и показывать нужный
    input.addEventListener('focus', () => {
      window.closeAllBookingPickers();
      picker.style.display = 'block';
    });

    // Удалено: document.addEventListener('mousedown', ...)

    return picker;
  }

  /**
   * Create dropdown picker for waiting time
   * @param {HTMLElement} input - Input element
   */
  createWaitingPicker(input) {
    const field = input.closest('.booking__field');
    if (!field) return;

    // Create picker container
    const picker = document.createElement('div');
    picker.className = 'booking__picker booking__picker--waiting';
    picker.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      min-width: 280px;
      background: #0e2339;
      border: 1px solid var(--color-border-light);
      border-top: none;
      border-radius: 0 0 12px 12px;
      z-index: 9999;
      display: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      box-sizing: border-box;
      max-height: 300px;
    `;

    // Create options list
    const optionsList = WAITING_TIME_OPTIONS.map(option => {
      const label = this.isRussian ? option.label.ru : option.label.en;
      const isSelected = this.state.waiting === option.value;
      return `
        <div class="booking__picker-option" data-value="${escapePickerHtml(option.value)}"
             style="padding: 12px 16px; display: flex; align-items: center; cursor: pointer; transition: background-color 0.2s ease; border-bottom: 1px solid var(--color-border-dark); ${isSelected ? 'background: var(--color-accent-dark); color: var(--color-text-light);' : 'color: var(--color-text-light);'}"
             onmouseover="this.style.backgroundColor='var(--color-accent-dark)'"
             onmouseout="this.style.backgroundColor='${isSelected ? 'var(--color-accent-dark)' : 'transparent'}'">
          <span style="margin-right: 10px; display: flex; align-items: center;">${PICKER_ICONS.CLOCK}</span>
          <span>${escapePickerHtml(label)}</span>
        </div>
      `;
    }).join('');

    picker.innerHTML = optionsList;

    // Insert picker after input wrap
    const inputWrap = input.closest('.booking__input-wrap');
    if (inputWrap) {
      inputWrap.appendChild(picker);
    }

    // Setup event listeners
    this.setupWaitingEvents(input, picker);
    
    // Скрывать все пикеры при фокусе и показывать нужный
    input.addEventListener('focus', () => {
      window.closeAllBookingPickers();
      picker.style.display = 'block';
    });

    // Удалено: document.addEventListener('mousedown', ...)

    return picker;
  }

  /**
   * Setup event listeners for list pickers (passengers/luggage)
   * @param {HTMLElement} input - Input element
   * @param {HTMLElement} picker - Picker element
   * @param {string} type - Type of picker
   */
  setupListEvents(input, picker, type) {
    // Option click handlers
    picker.addEventListener('click', (e) => {
      const option = e.target.closest('.booking__picker-option');
      if (!option) return;

      e.preventDefault();
      e.stopPropagation();

      const value = parseInt(sanitizePickerInput(option.dataset.value));
      if (isNaN(value)) return;
      
      this.state[type] = value;
      
      // Generate label
      let label;
      if (type === 'passengers') {
        label = this.isRussian 
          ? (value === 1 ? '1 пассажир' : `${value} пассажира${value > 4 ? 'в' : ''}`)
          : (value === 1 ? '1 passenger' : `${value} passengers`);
      } else {
        label = this.isRussian 
          ? (value === 1 ? '1 багаж' : `${value} багажа${value > 4 ? 'й' : ''}`)
          : (value === 1 ? '1 luggage' : `${value} luggage`);
      }
      
      input.value = label;
      
      // Update visual selection
      picker.querySelectorAll('.booking__picker-option').forEach(opt => {
        const isSelected = parseInt(opt.dataset.value) === value;
        opt.style.backgroundColor = isSelected ? 'var(--color-accent-dark)' : 'transparent';
      });
      
      BookingPickers.closeAllPickers(); // Мгновенно скрыть все пикеры
      
      // Dispatch change event
      input.dispatchEvent(new CustomEvent('picker:change', {
        detail: { type, value, label }
      }));
      
    });

    // Prevent input typing
    input.addEventListener('keydown', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Setup event listeners for waiting time picker
   * @param {HTMLElement} input - Input element
   * @param {HTMLElement} picker - Picker element
   */
  setupWaitingEvents(input, picker) {
    // Option click handlers
    picker.addEventListener('click', (e) => {
      const option = e.target.closest('.booking__picker-option');
      if (!option) return;

      e.preventDefault();
      e.stopPropagation();

      const value = sanitizePickerInput(option.dataset.value);
      const selectedOption = WAITING_TIME_OPTIONS.find(opt => opt.value === value);
      
      if (selectedOption) {
        this.state.waiting = value;
        const label = this.isRussian ? selectedOption.label.ru : selectedOption.label.en;
        input.value = label;
        
        // Update visual selection
        picker.querySelectorAll('.booking__picker-option').forEach(opt => {
          const isSelected = opt.dataset.value === value;
          opt.style.backgroundColor = isSelected ? 'var(--color-accent-dark)' : 'transparent';
        });
        
        BookingPickers.closeAllPickers(); // Мгновенно скрыть все пикеры
        
        // Dispatch change event
        input.dispatchEvent(new CustomEvent('picker:change', {
          detail: { type: 'waiting', value, label }
        }));
        
      }
    });

    // Prevent input typing
    input.addEventListener('keydown', (e) => {
      e.preventDefault();
    });
  }

  /**
   * Initialize all pickers
   */
  async init() {
    try {
      
      // Wait for elements
      await this.waitForElements();
      
      // No initial values - fields start empty
      this.elements.passengersInput.value = '';
      this.elements.luggageInput.value = '';
      this.elements.waitingInput.value = '';
      
      // Create pickers
      this.createListPicker(this.elements.passengersInput, 'passengers', PICKER_CONFIG.MAX_PASSENGERS);
      this.createListPicker(this.elements.luggageInput, 'luggage', PICKER_CONFIG.MAX_LUGGAGE);
      this.createWaitingPicker(this.elements.waitingInput);
      
      // Setup click outside to close
      // this.setupClickOutside(); // This method is no longer needed
      
      return true;
      
    } catch (error) {
      console.error('❌ BookingPickers initialization error:', error);
      return false;
    }
  }

  /**
   * Setup click outside to close pickers
   */
  setupClickOutside() {
    document.addEventListener('click', (e) => {
      // Close all pickers if clicked outside
      if (!e.target.closest('.booking__field') || e.target.closest('.booking__field--autocomplete')) {
        const pickers = document.querySelectorAll('.booking__picker');
        pickers.forEach(picker => {
          picker.style.display = 'none';
        });
      }
    });
  }
}

// ===================================================================
// 4. INITIALIZATION AND GLOBAL EXPOSURE
// ===================================================================

/**
 * Initialize booking pickers
 */
function initBookingPickers() {
  // Check if we're on a page with booking form
  const bookingForm = document.querySelector('.booking__form');
  if (!bookingForm) {
    // No booking form on this page, don't initialize
    return;
  }
  
  const pickers = new BookingPickers();
  pickers.init();
  window.bookingPickers = pickers;
}

/**
 * Try to initialize with retries
 */
function tryInitPickers() {
  // Check if we're on a page with booking form
  const bookingForm = document.querySelector('.booking__form');
  if (!bookingForm) {
    // No booking form on this page, don't initialize
    return;
  }
  
  let attempts = 0;
  const maxAttempts = 10;
  
  const attemptInit = () => {
    attempts++;
    
    if (document.readyState === 'loading') {
      setTimeout(attemptInit, 200);
      return;
    }
    
    try {
      initBookingPickers();
    } catch (error) {
      console.warn(`⚠️ Pickers init attempt ${attempts} failed:`, error);
      if (attempts < maxAttempts) {
        setTimeout(attemptInit, 300);
      }
    }
  };
  
  attemptInit();
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInitPickers);
} else {
  tryInitPickers();
} 

// Инициализация после загрузки
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupBookingSubmit);
} else {
  setupBookingSubmit();
} 

// Глобальная функция для закрытия всех списков (кастомные + автокомплит)
window.closeAllBookingPickers = function() {
  document.querySelectorAll('.booking__picker').forEach(picker => {
    picker.style.display = 'none';
  });
  document.querySelectorAll('.booking__dropdown').forEach(drop => {
    drop.style.display = 'none';
  });
}; 

const style = document.createElement('style');
style.innerHTML = `@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`;
document.head.appendChild(style); 

// Функции валидации и безопасности
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,20}$/;
  return phoneRegex.test(phone);
};

const validateName = (name) => {
  const nameRegex = /^[A-Za-zА-Яа-яЁё\s\-']{2,50}$/;
  return nameRegex.test(name);
};

// Настройка событий для контактной формы
const setupContactFormEvents = () => {
  const form = document.querySelector('.booking__contact-form');
  if (!form) return;

  const inputs = form.querySelectorAll('.booking__contact-input');
  const submitBtn = form.querySelector('.booking__contact-submit');

  // Обработчики для полей ввода
  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const value = sanitizeInput(e.target.value);
      e.target.value = value;
      validateField(input);
    });

    input.addEventListener('blur', (e) => {
      validateField(e.target);
    });

    input.addEventListener('focus', (e) => {
      clearFieldError(e.target);
    });
  });

  // Обработчик отправки формы
  form.addEventListener('submit', handleFormSubmit);
};

// Валидация отдельного поля
const validateField = (input) => {
  const fieldName = input.name;
  const value = input.value.trim();
  const errorElement = document.getElementById(`${fieldName}-error`);
  const isRu = document.documentElement.lang === 'ru';

  let isValid = true;
  let errorMessage = '';

  switch (fieldName) {
    case 'name':
      if (!value) {
        errorMessage = isRu ? 'Введите ваше имя' : 'Please enter your name';
        isValid = false;
      } else if (!validateName(value)) {
        errorMessage = isRu ? 'Имя должно содержать 2-50 символов' : 'Name must be 2-50 characters long';
        isValid = false;
      }
      break;

    case 'email':
      if (!value) {
        errorMessage = isRu ? 'Введите email' : 'Please enter your email';
        isValid = false;
      } else if (!validateEmail(value)) {
        errorMessage = isRu ? 'Введите корректный email' : 'Please enter a valid email';
        isValid = false;
      }
      break;

    case 'phone':
      if (!value) {
        errorMessage = isRu ? 'Введите номер телефона' : 'Please enter your phone number';
        isValid = false;
      } else if (!validatePhone(value)) {
        errorMessage = isRu ? 'Введите корректный номер телефона' : 'Please enter a valid phone number';
        isValid = false;
      }
      break;
  }

  if (!isValid) {
    showFieldError(input, errorMessage);
  } else {
    clearFieldError(input);
  }

  return isValid;
};

// Показать ошибку поля
const showFieldError = (input, message) => {
  const fieldName = input.name;
  const errorElement = document.getElementById(`${fieldName}-error`);
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  input.classList.add('booking__contact-input--error');
};

// Очистить ошибку поля
const clearFieldError = (input) => {
  const fieldName = input.name;
  const errorElement = document.getElementById(`${fieldName}-error`);
  
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  
  input.classList.remove('booking__contact-input--error');
};

// Обработка отправки формы
const handleFormSubmit = (e) => {
  e.preventDefault();
  
  const form = e.target;
  const inputs = form.querySelectorAll('.booking__contact-input');
  const isRu = document.documentElement.lang === 'ru';
  
  // Проверяем, выбран ли автомобиль
  if (!window.selectedCar) {
    const message = isRu ? 'Пожалуйста, выберите автомобиль' : 'Please select a car';
    showBookingFormNotification(message, 'error');
    return;
  }
  
  // Валидируем все поля
  let allValid = true;
  inputs.forEach(input => {
    if (!validateField(input)) {
      allValid = false;
    }
  });
  
  if (!allValid) {
    const message = isRu ? 'Пожалуйста, заполните все поля корректно' : 'Please fill all fields correctly';
    showBookingFormNotification(message, 'error');
    return;
  }
  
  // Собираем данные формы
  const formData = {
    name: sanitizeInput(inputs[0].value),
    email: sanitizeInput(inputs[1].value),
    phone: sanitizeInput(inputs[2].value),
    selectedCar: window.selectedCar,
    bookingData: {
      from: window.selectedAddresses?.from,
      to: window.selectedAddresses?.to,
      date: window.selectedDate,
      passengers: window.selectedPassengers,
      luggage: window.selectedLuggage,
      waitingTime: window.selectedWaitingTime
    }
  };
  
  // Здесь можно отправить данные на сервер
  console.log('Form data:', formData);
  
  // Показываем успешное сообщение
  const successMessage = isRu ? 'Заявка успешно отправлена!' : 'Booking request sent successfully!';
  showBookingFormNotification(successMessage, 'success');
  
  // Очищаем форму
  form.reset();
  inputs.forEach(input => {
    clearFieldError(input);
  });
};
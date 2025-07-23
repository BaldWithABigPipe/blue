// ===================================================================
// BOOKING AUTOCOMPLETE MODULE - ES2024 OPTIMIZED VERSION
// Modern, secure, high-performance autocomplete with ES2024 features
// 
// ES2024 Features Used:
// - Promise.withResolvers() (Chrome 119+, Firefox 121+)
// - String.prototype.isWellFormed() (Chrome 111+, Firefox 119+) 
// - Object.groupBy() (Chrome 117+, Firefox 119+)
// - Enhanced Unicode handling with fallbacks for older browsers
// ===================================================================

// ===================================================================
// 1. SECURITY & PERFORMANCE CONSTANTS
// ===================================================================

const AUTOCOMPLETE_CONFIG = Object.freeze({
  MAX_INPUT_LENGTH: 100,
  MAX_RESULTS: 50,
  DEBOUNCE_DELAY: 150,
  MIN_SEARCH_LENGTH: 2,
  ALLOWED_CHARS_REGEX: /^[a-zA-Zа-яА-Я0-9\s\-\.\,\(\)\'\"]+$/,
  TYPE_ORDER: Object.freeze({ airport: 0, railway: 1, city: 2 }),
  PRIORITY_WEIGHTS: Object.freeze({
    EXACT_START: 3,
    OTHER_START: 2,
    CONTAINS: 1
  })
});

/**
 * Input sanitization with ES2024 enhanced security
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  // ES2024: Check for well-formed Unicode strings
  if (input.isWellFormed && !input.isWellFormed()) {
    input = input.toWellFormed?.() || input;
  }
  
  return input
    .slice(0, AUTOCOMPLETE_CONFIG.MAX_INPUT_LENGTH)
    .replace(/[<>\"'&]/g, '')
    .replace(AUTOCOMPLETE_CONFIG.ALLOWED_CHARS_REGEX.source.includes('^') ? 
             new RegExp(`[^${AUTOCOMPLETE_CONFIG.ALLOWED_CHARS_REGEX.source.slice(2, -2)}]`, 'g') : 
             /[^a-zA-Zа-яА-Я0-9\s\-\.\,\(\)\'\"]/g, '')
    .trim();
};

/**
 * HTML escaping for XSS prevention
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
const escapeHtml = (() => {
  const div = document.createElement('div');
  return (text) => {
    div.textContent = text;
    return div.innerHTML;
  };
})();

/**
 * Debounce utility with modern implementation
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle utility for performance-critical operations
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Throttled function
 */
const throttle = (func, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(null, args);
    }
  };
};

// ===================================================================
// 2. SVG ICONS WITH SECURITY (IMMUTABLE)
// ===================================================================

const SVG_ICONS = Object.freeze({
  CITY: `<svg class="booking-autocomplete__icon" fill="currentColor" viewBox="0 0 50 50" width="18" height="18" aria-hidden="true"><path d="M9 4L9 21L18 21L18 27L23 27L23 4L9 4 z M 12.859375 8L14.900391 8L14.900391 10.015625L12.859375 10.015625L12.859375 8 z M 16.900391 8L18.859375 8L18.859375 10.015625L16.900391 10.015625L16.900391 8 z M 34 8L34 46L40.039062 46L40.039062 41.992188L42 41.992188L42 46L48 46L48 8L34 8 z M 12.859375 11.984375L14.900391 11.984375L14.900391 14L12.859375 14L12.859375 11.984375 z M 16.900391 11.984375L18.859375 11.984375L18.859375 14L16.900391 14L16.900391 11.984375 z M 42 11.992188L44 11.992188L44 14.007812L42 14.007812L42 11.992188 z M 38 12.007812L40 12.007812L40 14.021484L38 14.021484L38 12.007812 z M 37.960938 16L40 16L40 18.015625L37.960938 18.015625L37.960938 16 z M 42 16L44 16L44 18.015625L42 18.015625L42 16 z M 37.960938 19.984375L40 19.984375L40 22L37.960938 22L37.960938 19.984375 z M 42 19.984375L44 19.984375L44 22L42 22L42 19.984375 z M 2 22.992188L2 46L8 46L8 41.992188L10 42L10 46L16 46L16 22.992188L2 22.992188 z M 37.960938 23.992188L40 23.992188L40 26.007812L37.960938 26.007812L37.960938 23.992188 z M 42 23.992188L44 23.992188L44 26.007812L42 26.007812L42 23.992188 z M 6 25.992188L8.0390625 25.992188L8.0390625 28.007812L6 28.007812L6 25.992188 z M 10 25.992188L12 25.992188L12 28.007812L10 28.007812L10 25.992188 z M 37.960938 27.976562L40 27.976562L40 29.992188L37.960938 29.992188L37.960938 27.976562 z M 42 27.976562L44 27.976562L44 29.992188L42 29.992188L42 27.976562 z M 18 29L18 46L24 46L24.039062 41.992188L26 41.992188L26 46L32 46L32 29L18 29 z M 6 29.976562L8.0390625 29.976562L8.0390625 31.992188L6 31.992188L6 29.976562 z M 10 29.976562L12 29.976562L12 31.992188L10 31.992188L10 29.976562 z M 38 31.984375L40.039062 31.984375L40.039062 34L38 34L38 31.984375 z M 42 31.984375L44 31.984375L44 34L42 34L42 31.984375 z M 22 32L24 32L24 34.015625L22 34.015625L22 32 z M 26.039062 32.007812L28 32.007812L28 34.021484L26.039062 34.021484L26.039062 32.007812 z M 6 33.992188L8.0390625 33.992188L8.0390625 36.007812L6 36.007812L6 33.992188 z M 10 33.992188L12 33.992188L12 36.007812L10 36.007812L10 33.992188 z M 37.960938 35.984375L40 35.984375L40 38L37.960938 38L37.960938 35.984375 z M 42 35.984375L44 35.984375L44 38L42 38L42 35.984375 z M 26.039062 35.992188L28 35.992188L28 38.007812L26.039062 38.007812L26.039062 35.992188 z M 22 36L24 36L24 38.015625L22 38.015625L22 36 z"></path></svg>`,
  
  RAILWAY: `<svg class="booking-autocomplete__icon" fill="currentColor" viewBox="0 0 14 14" width="18" height="18" aria-hidden="true"><path d="m 3.9686322,0 -2.96878874,3 0,7 c -0.0365905,0.575273 0.47725624,1.000467 1.03126344,1 l 9.9688801,0 C 12.553994,10.999533 13,10.599243 13,10 L 13,3 9.9999609,0 z m 1.0625138,1 3.9688018,0 0,1 -3.9688018,0 z m -2.000026,2 7.968854,0 0,4 -7.968854,0 z m 0.7812601,5 c 0.01042,-1.63e-4 0.02083,-1.63e-4 0.031251,0 0.5728964,-0.09067 1.1633961,0.420024 1.156265,1 0,0.523599 -0.4764072,1 -1.000013,1 C 3.4762768,10 2.9998695,9.523599 2.9998695,9 2.9915694,8.533391 3.3539552,8.08743 3.8123801,8 z m 6.0313287,0 c 0.5728962,-0.09067 1.1633962,0.420024 1.1562652,1 0,0.523599 -0.476407,1 -1.0000131,1 C 9.476355,10 8.9999478,9.523599 8.9999478,9 8.9941477,8.524619 9.3741197,8.074248 9.8437088,8 z m -7.8438523,4 -1.00001304,2 3.00003914,0 1.000013,-2 z M 8.9999478,12 9.9999609,14 13,14 11.999987,12 z"/></svg>`,
  
  AIRPORT: `<svg class="booking-autocomplete__icon" fill="currentColor" viewBox="0 -3.43 122.88 122.88" width="18" height="18" aria-hidden="true"><path d="M38.14,115.91c0-10.58,5.81-15.56,13.46-21.3l0-27.68L1.37,89.25c0-19.32-6.57-17.9,9.05-27.72l0.15-0.09 V49.37h11.22v5.08l8.24-5.13V35.8h11.22v6.54l10.36-6.45V7.3c0-4.02,4.37-7.3,9.7-7.3l0,0c5.34,0,9.7,3.29,9.7,7.3v28.58 l10.47,6.52V35.8l11.22,0v13.59l8.24,5.13v-5.15l11.21,0v12.14c15.56,9.67,9.61,7.78,9.61,27.74L71.01,66.91v27.58 c8.14,5.43,13.46,9.6,13.46,21.43l-12.81,0.11c-2.93-2.3-4.96-4.05-6.52-5.26c-1.18,0.39-2.48,0.6-3.83,0.6h0 c-1.53,0-2.99-0.27-4.28-0.76c-1.68,1.22-3.9,3.04-7.21,5.42L38.14,115.91L38.14,115.91L38.14,115.91z"></path></svg>`
});

// Backward compatibility
const SVG_CITY = SVG_ICONS.CITY;
const SVG_RAILWAY = SVG_ICONS.RAILWAY;
const SVG_AIRPORT = SVG_ICONS.AIRPORT;

// ===================================================================
// 3. AUTOCOMPLETE DATA (KEEP EXISTING)
// ===================================================================

const bookingAutocompleteData = {
  from: [
    // Geneva
    { type: 'city', name: { en: 'Geneva', ru: 'Женева' }, location: { lat: 46.2044, lng: 6.1432 } },
    { type: 'airport', name: { en: 'Geneva Airport Switzerland', ru: 'Аэропорт Женева' }, location: { lat: 46.2381, lng: 6.1089 } },
    { type: 'railway', name: { en: 'Geneve Bahnhof', ru: 'Женева вокзал' }, location: { lat: 46.2102, lng: 6.1423 } },
    { type: 'city', name: { en: 'Annecy', ru: 'Анси' }, location: { lat: 45.8992, lng: 6.1296 } },
    { type: 'city', name: { en: 'Annemasse', ru: 'Аннемасс' }, location: { lat: 46.1944, lng: 6.2361 } },
    { type: 'city', name: { en: 'Bellegarde-sur Valserine', ru: 'Бельгард-сюр-Вальсерин' }, location: { lat: 46.1122, lng: 5.8228 } },
    { type: 'city', name: { en: 'Divonne Les Bains', ru: 'Дивон-ле-Бен' }, location: { lat: 46.3566, lng: 6.1406 } },
    { type: 'city', name: { en: 'Basel', ru: 'Базель' }, location: { lat: 47.5596, lng: 7.5886 } },
    { type: 'city', name: { en: 'Bern', ru: 'Берн' }, location: { lat: 46.948, lng: 7.4474 } },
    { type: 'city', name: { en: 'Crans-Montana', ru: 'Кран-Монтана' }, location: { lat: 46.3167, lng: 7.5167 } },
    { type: 'city', name: { en: 'Gland', ru: 'Глан' }, location: { lat: 46.4206, lng: 6.2694 } },
    { type: 'city', name: { en: 'Gstaad', ru: 'Гштаад' }, location: { lat: 46.4725, lng: 7.2866 } },
    { type: 'city', name: { en: 'Lausanne', ru: 'Лозанна' }, location: { lat: 46.5197, lng: 6.6323 } },
    { type: 'city', name: { en: 'Lugano', ru: 'Лугано' }, location: { lat: 46.0037, lng: 8.9511 } },
    { type: 'city', name: { en: 'Montreux', ru: 'Монтрё' }, location: { lat: 46.4333, lng: 6.9167 } },
    { type: 'city', name: { en: 'Nyon', ru: 'Ньон' }, location: { lat: 46.383, lng: 6.233 } },
    { type: 'city', name: { en: 'Rolle', ru: 'Ролле' }, location: { lat: 46.4581, lng: 6.3397 } },
    { type: 'city', name: { en: 'Sion', ru: 'Сьон' }, location: { lat: 46.2331, lng: 7.3606 } },
    { type: 'railway', name: { en: 'Zermatt Bahnhof', ru: 'Церматт вокзал' }, location: { lat: 46.0207, lng: 7.7491 } },
    { type: 'city', name: { en: 'Zurich', ru: 'Цюрих' }, location: { lat: 47.3769, lng: 8.5417 } }
  ],
  to: [
    // COMPLETE data from data.txt in exact order (first 100 of 1099 entries)
    { type: 'city', name: { en: 'Alta Badia', ru: 'Альта Бадия' }, location: { lat: 46.567, lng: 11.900 } },
    { type: 'city', name: { en: 'Alta Valtellina', ru: 'Альта Вальтеллина' }, location: { lat: 46.500, lng: 10.350 } },
    { type: 'city', name: { en: 'Altdorf', ru: 'Альтдорф' }, location: { lat: 46.8806, lng: 8.6440 } },
    { type: 'city', name: { en: 'Altenrhein', ru: 'Альтенрайн' }, location: { lat: 47.467, lng: 9.567 } },
    { type: 'city', name: { en: 'Amboise', ru: 'Амбуаз' }, location: { lat: 47.4136, lng: 0.9828 } },
    { type: 'city', name: { en: 'Amiens', ru: 'Амьен' }, location: { lat: 49.894, lng: 2.296 } },
    { type: 'city', name: { en: 'Amneville', ru: 'Амневиль' }, location: { lat: 49.257, lng: 6.142 } },
    { type: 'city', name: { en: 'Ancelle', ru: 'Ансель' }, location: { lat: 44.633, lng: 6.183 } },
    { type: 'city', name: { en: 'Andalo', ru: 'Андало' }, location: { lat: 46.167, lng: 11.004 } },
    { type: 'city', name: { en: 'Andelsbuch', ru: 'Андельсбух' }, location: { lat: 47.401, lng: 9.905 } },
    { type: 'city', name: { en: 'Andermatt', ru: 'Андерматт' }, location: { lat: 46.635, lng: 8.594 } },
    { type: 'city', name: { en: 'Angers', ru: 'Анже' }, location: { lat: 47.474, lng: -0.554 } },
    { type: 'city', name: { en: 'Angouleme', ru: 'Ангулем' }, location: { lat: 45.649, lng: 0.157 } },
    { type: 'city', name: { en: 'Annecy', ru: 'Анси' }, location: { lat: 45.899, lng: 6.130 } },
    { type: 'airport', name: { en: 'Annecy Airport', ru: 'Аэропорт Анси' }, location: { lat: 45.929, lng: 6.102 } },
    { type: 'city', name: { en: 'Annemasse', ru: 'Аннемасс' }, location: { lat: 46.194, lng: 6.236 } },
    { type: 'city', name: { en: 'Antagnod', ru: 'Антаньод' }, location: { lat: 45.817, lng: 7.617 } },
    { type: 'city', name: { en: 'Anzere', ru: 'Анзер' }, location: { lat: 46.300, lng: 7.400 } },
    { type: 'city', name: { en: 'Aosta', ru: 'Аоста' }, location: { lat: 45.737, lng: 7.321 } },
    { type: 'city', name: { en: 'Aosta Valley', ru: 'Валле д\'Аоста' }, location: { lat: 45.737, lng: 7.321 } },
    { type: 'city', name: { en: 'Appenzell', ru: 'Аппенцелль' }, location: { lat: 47.333, lng: 9.417 } },
    { type: 'city', name: { en: 'Aprica', ru: 'Априка' }, location: { lat: 46.150, lng: 10.150 } },
    { type: 'city', name: { en: 'Arabba', ru: 'Арабба' }, location: { lat: 46.500, lng: 11.883 } },
    { type: 'city', name: { en: 'Arachesla Frasse', ru: 'Араш-ла-Фрасс' }, location: { lat: 45.900, lng: 6.650 } },
    { type: 'city', name: { en: 'Ardeche Saint-Pierreville', ru: 'Ардеш Сен-Пьервиль' }, location: { lat: 44.817, lng: 4.533 } },
    { type: 'city', name: { en: 'Areches Beaufort', ru: 'Ареш Бофор' }, location: { lat: 45.667, lng: 6.567 } },
    { type: 'city', name: { en: 'Argenteuil', ru: 'Аржантёй' }, location: { lat: 48.950, lng: 2.250 } },
    { type: 'city', name: { en: 'Argentiere', ru: 'Аржантьер' }, location: { lat: 45.967, lng: 6.933 } },
    { type: 'city', name: { en: 'Arolla', ru: 'Аролла' }, location: { lat: 46.033, lng: 7.483 } },
    { type: 'city', name: { en: 'Arosa', ru: 'Ароза' }, location: { lat: 46.783, lng: 9.683 } },
    { type: 'city', name: { en: 'Arras', ru: 'Аррас' }, location: { lat: 50.292, lng: 2.777 } },
    { type: 'city', name: { en: 'Artesina', ru: 'Артезина' }, location: { lat: 44.317, lng: 7.883 } },
    { type: 'city', name: { en: 'Ascona', ru: 'Аскона' }, location: { lat: 46.154, lng: 8.771 } },
    { type: 'city', name: { en: 'Asiago', ru: 'Азьяго' }, location: { lat: 45.867, lng: 11.517 } },
    { type: 'city', name: { en: 'Assevillers', ru: 'Ассевилер' }, location: { lat: 49.917, lng: 2.833 } },
    { type: 'city', name: { en: 'Au', ru: 'Ау' }, location: { lat: 47.317, lng: 9.917 } },
    { type: 'city', name: { en: 'Aubervilliers', ru: 'Обервилье' }, location: { lat: 48.917, lng: 2.383 } },
    { type: 'city', name: { en: 'Auffach Wildschonau', ru: 'Ауффах Вильдшёнау' }, location: { lat: 47.433, lng: 12.133 } },
    { type: 'city', name: { en: 'Aurach Kitzbuheler', ru: 'Аурах Кицбюлер' }, location: { lat: 47.433, lng: 12.217 } },
    { type: 'city', name: { en: 'Auray', ru: 'Орэ' }, location: { lat: 47.667, lng: -2.983 } },
    { type: 'city', name: { en: 'Auris', ru: 'Орис' }, location: { lat: 45.067, lng: 6.083 } },
    { type: 'city', name: { en: 'Aussois', ru: 'Осуа' }, location: { lat: 45.233, lng: 6.733 } },
    { type: 'city', name: { en: 'Autun', ru: 'Отён' }, location: { lat: 46.950, lng: 4.300 } },
    { type: 'city', name: { en: 'Auw', ru: 'Ау' }, location: { lat: 47.283, lng: 8.267 } },
    { type: 'city', name: { en: 'Auxerre', ru: 'Осер' }, location: { lat: 47.800, lng: 3.567 } },
    { type: 'city', name: { en: 'Avignon', ru: 'Авиньон' }, location: { lat: 43.950, lng: 4.800 } },
    { type: 'city', name: { en: 'Avoriaz', ru: 'Авориаз' }, location: { lat: 46.183, lng: 6.767 } },
    { type: 'city', name: { en: 'Axamer Lizum', ru: 'Аксамер Лизум' }, location: { lat: 47.217, lng: 11.300 } },
    { type: 'city', name: { en: 'Baar', ru: 'Баар' }, location: { lat: 47.200, lng: 8.533 } },
    { type: 'city', name: { en: 'Baccarat', ru: 'Баккара' }, location: { lat: 48.450, lng: 6.733 } },
    { type: 'city', name: { en: 'Bad Bellingen', ru: 'Бад Беллинген' }, location: { lat: 47.733, lng: 7.550 } },
    { type: 'city', name: { en: 'Bad Gastein', ru: 'Бад Гастайн' }, location: { lat: 47.117, lng: 13.133 } },
    { type: 'city', name: { en: 'Bad Hofgastein', ru: 'Бад Хофгастайн' }, location: { lat: 47.167, lng: 13.100 } },
    { type: 'city', name: { en: 'Bad Kleinkirchheim', ru: 'Бад Кляйнкирххайм' }, location: { lat: 46.817, lng: 13.783 } },
    { type: 'city', name: { en: 'Bad Mitterndorf', ru: 'Бад Миттерндорф' }, location: { lat: 47.567, lng: 13.933 } },
    { type: 'city', name: { en: 'Baden', ru: 'Баден' }, location: { lat: 47.483, lng: 8.300 } },
    { type: 'city', name: { en: 'Baden-Baden', ru: 'Баден-Баден' }, location: { lat: 48.767, lng: 8.233 } },
    { type: 'city', name: { en: 'Bad-Ragaz', ru: 'Бад-Рагац' }, location: { lat: 47.000, lng: 9.500 } },
    { type: 'city', name: { en: 'Bagnes', ru: 'Банье' }, location: { lat: 46.083, lng: 7.283 } },
    { type: 'city', name: { en: 'Bagnolet', ru: 'Баньоле' }, location: { lat: 48.867, lng: 2.417 } },
    { type: 'city', name: { en: 'Bagnols', ru: 'Баньоль' }, location: { lat: 45.917, lng: 4.617 } },
    { type: 'railway', name: { en: 'Bahnhof Basel', ru: 'Вокзал Базель' }, location: { lat: 47.548, lng: 7.590 } },
    { type: 'city', name: { en: 'Baldersheim', ru: 'Бальдерсхайм' }, location: { lat: 47.800, lng: 7.367 } },
    { type: 'city', name: { en: 'Bar', ru: 'Бар' }, location: { lat: 49.167, lng: 5.167 } },
    { type: 'city', name: { en: 'Bardonecchia', ru: 'Бардонеккья' }, location: { lat: 45.083, lng: 6.700 } },
    { type: 'city', name: { en: 'Barentin', ru: 'Барантен' }, location: { lat: 49.550, lng: 0.950 } },
    { type: 'city', name: { en: 'Bartholomaberg', ru: 'Бартоломаберг' }, location: { lat: 47.100, lng: 9.917 } },
    { type: 'airport', name: { en: 'Basel Airport', ru: 'Аэропорт Базель' }, location: { lat: 47.590, lng: 7.529 } },
    { type: 'city', name: { en: 'Basel City', ru: 'Город Базель' }, location: { lat: 47.560, lng: 7.589 } },
    { type: 'city', name: { en: 'Basel Port', ru: 'Порт Базель' }, location: { lat: 47.567, lng: 7.600 } },
    { type: 'city', name: { en: 'Baselgadi Pine', ru: 'Базельгади Пине' }, location: { lat: 46.233, lng: 11.467 } },
    { type: 'city', name: { en: 'Bayeux', ru: 'Байё' }, location: { lat: 49.283, lng: -0.700 } },
    { type: 'city', name: { en: 'Beatenberg', ru: 'Беатенберг' }, location: { lat: 46.683, lng: 7.767 } },
    { type: 'city', name: { en: 'Beaune', ru: 'Бон' }, location: { lat: 47.017, lng: 4.833 } },
    { type: 'airport', name: { en: 'Beauvais Tille Airport', ru: 'Аэропорт Бове-Тилле' }, location: { lat: 49.454, lng: 2.113 } },
    { type: 'city', name: { en: 'Belfort', ru: 'Бельфор' }, location: { lat: 47.633, lng: 6.867 } },
    { type: 'city', name: { en: 'Bellamonte', ru: 'Белламонте' }, location: { lat: 46.283, lng: 11.517 } },
    { type: 'city', name: { en: 'Belle Plagne', ru: 'Бель Плань' }, location: { lat: 45.517, lng: 6.700 } },
    { type: 'city', name: { en: 'Bellegarde-sur Valserine', ru: 'Бельгард-сюр-Вальсерин' }, location: { lat: 46.108, lng: 5.825 } },
    { type: 'city', name: { en: 'Bellentre', ru: 'Белантр' }, location: { lat: 45.550, lng: 6.783 } },
    { type: 'city', name: { en: 'Bellerive-sur-Allier', ru: 'Беллерив-сюр-Алье' }, location: { lat: 46.117, lng: 3.400 } },
    { type: 'city', name: { en: 'Bellevaux', ru: 'Беллево' }, location: { lat: 46.250, lng: 6.517 } },
    { type: 'city', name: { en: 'Bellinzona', ru: 'Беллинцона' }, location: { lat: 46.193, lng: 9.021 } },
    { type: 'city', name: { en: 'Bellwald', ru: 'Бельвальд' }, location: { lat: 46.417, lng: 8.167 } },
    { type: 'city', name: { en: 'Berck', ru: 'Берк' }, location: { lat: 50.417, lng: 1.567 } },
    { type: 'city', name: { en: 'Bergamo', ru: 'Бергамо' }, location: { lat: 45.698, lng: 9.677 } },
    { type: 'city', name: { en: 'Bern', ru: 'Берн' }, location: { lat: 46.948, lng: 7.447 } },
    { type: 'airport', name: { en: 'Bern Airport BRN', ru: 'Аэропорт Берн' }, location: { lat: 46.914, lng: 7.497 } },
    { type: 'railway', name: { en: 'Bern Train Station', ru: 'Вокзал Берн' }, location: { lat: 46.949, lng: 7.439 } },
    { type: 'city', name: { en: 'Bernau', ru: 'Бернау' }, location: { lat: 49.783, lng: 11.350 } },
    { type: 'city', name: { en: 'Bernau near Schwarzwald', ru: 'Бернау близ Шварцвальда' }, location: { lat: 47.800, lng: 8.017 } },
    { type: 'city', name: { en: 'Bernex', ru: 'Бернекс' }, location: { lat: 46.183, lng: 6.083 } },
    { type: 'city', name: { en: 'Besancon', ru: 'Безансон' }, location: { lat: 47.250, lng: 6.017 } },
    { type: 'city', name: { en: 'Bessans', ru: 'Бессан' }, location: { lat: 45.317, lng: 6.983 } },
    { type: 'city', name: { en: 'Besse', ru: 'Бесс' }, location: { lat: 45.083, lng: 6.067 } },
    { type: 'city', name: { en: 'Bezau', ru: 'Безау' }, location: { lat: 47.383, lng: 9.900 } },
    { type: 'city', name: { en: 'Biel', ru: 'Биль' }, location: { lat: 47.133, lng: 7.250 } },
    { type: 'city', name: { en: 'Bizau', ru: 'Бизау' }, location: { lat: 47.367, lng: 9.917 } },
    { type: 'city', name: { en: 'Blitzingen', ru: 'Блицинген' }, location: { lat: 46.400, lng: 8.217 } },
    { type: 'city', name: { en: 'Blois', ru: 'Блуа' }, location: { lat: 47.600, lng: 1.333 } },
    { type: 'city', name: { en: 'Blonay', ru: 'Блоне' }, location: { lat: 46.467, lng: 6.900 } },
    { type: 'city', name: { en: 'Blotzheim', ru: 'Блоцхайм' }, location: { lat: 47.617, lng: 7.500 } },
    { type: 'city', name: { en: 'Bludenz', ru: 'Блуденц' }, location: { lat: 47.150, lng: 9.817 } },
    { type: 'city', name: { en: 'Bobigny', ru: 'Бобиньи' }, location: { lat: 48.917, lng: 2.450 } },
    { type: 'city', name: { en: 'Boetzingen', ru: 'Бётцинген' }, location: { lat: 48.083, lng: 7.683 } },
    { type: 'city', name: { en: 'Bologna', ru: 'Болонья' }, location: { lat: 44.495, lng: 11.343 } },
    // Continuing with next 100 entries from data.txt (101-200)
    { type: 'city', name: { en: 'Bonneval-sur-Arc', ru: 'Бонваль-сюр-Арк' }, location: { lat: 45.367, lng: 7.033 } },
    { type: 'city', name: { en: 'Boudry', ru: 'Будри' }, location: { lat: 46.950, lng: 6.833 } },
    { type: 'city', name: { en: 'Boulogne', ru: 'Булонь' }, location: { lat: 50.733, lng: 1.617 } },
    { type: 'city', name: { en: 'Boulogne-Billancourt', ru: 'Булонь-Бийанкур' }, location: { lat: 48.833, lng: 2.250 } },
    { type: 'city', name: { en: 'Bourbon', ru: 'Бурбон' }, location: { lat: 46.617, lng: 4.267 } },
    { type: 'city', name: { en: 'Bourg St Maurice', ru: 'Бур-Сен-Морис' }, location: { lat: 45.617, lng: 6.767 } },
    { type: 'city', name: { en: 'Bourg-en-Bresse', ru: 'Бур-ан-Брес' }, location: { lat: 46.200, lng: 5.233 } },
    { type: 'city', name: { en: 'Bourges', ru: 'Бурж' }, location: { lat: 47.083, lng: 2.400 } },
    { type: 'city', name: { en: 'Boves', ru: 'Бов' }, location: { lat: 49.850, lng: 2.383 } },
    { type: 'city', name: { en: 'Bozel', ru: 'Бозель' }, location: { lat: 45.450, lng: 6.650 } },
    { type: 'city', name: { en: 'Bramans', ru: 'Браман' }, location: { lat: 45.233, lng: 6.717 } },
    { type: 'city', name: { en: 'Brand-Brandnertal-Vorarlberg', ru: 'Бранд-Брандертал-Форарльберг' }, location: { lat: 47.100, lng: 9.733 } },
    { type: 'city', name: { en: 'Brand-Nagelberg', ru: 'Бранд-Нагельберг' }, location: { lat: 48.683, lng: 15.033 } },
    { type: 'city', name: { en: 'Bregenz', ru: 'Брегенц' }, location: { lat: 47.500, lng: 9.750 } },
    { type: 'city', name: { en: 'Breisach', ru: 'Брайзах' }, location: { lat: 48.033, lng: 7.583 } },
    { type: 'city', name: { en: 'Brest', ru: 'Брест' }, location: { lat: 48.400, lng: -4.483 } },
    { type: 'city', name: { en: 'Bretteville-sur-Odon', ru: 'Бретвиль-сюр-Одон' }, location: { lat: 49.167, lng: -0.417 } },
    { type: 'city', name: { en: 'Breuil-Cervinia', ru: 'Брёй-Червиния' }, location: { lat: 45.933, lng: 7.633 } },
    { type: 'city', name: { en: 'Briancon', ru: 'Бриансон' }, location: { lat: 44.900, lng: 6.633 } },
    { type: 'city', name: { en: 'Brides Les Bains', ru: 'Брид-ле-Бен' }, location: { lat: 45.450, lng: 6.567 } },
    { type: 'city', name: { en: 'Brienz', ru: 'Бриенц' }, location: { lat: 46.750, lng: 8.033 } },
    { type: 'city', name: { en: 'Brig', ru: 'Бриг' }, location: { lat: 46.317, lng: 7.983 } },
    { type: 'city', name: { en: 'Brixenim Thale', ru: 'Бриксен-им-Тале' }, location: { lat: 47.283, lng: 11.867 } },
    { type: 'city', name: { en: 'Bruay-la-Buissiere', ru: 'Брюэ-ла-Бюисьер' }, location: { lat: 50.483, lng: 2.550 } },
    { type: 'city', name: { en: 'Bruck', ru: 'Брук' }, location: { lat: 47.283, lng: 12.817 } },
    { type: 'city', name: { en: 'Bruckander Grossglocknerstrasse', ru: 'Брукандер Гроссглокнерштрассе' }, location: { lat: 47.283, lng: 12.817 } },
    { type: 'city', name: { en: 'Brugg', ru: 'Брюгг' }, location: { lat: 47.483, lng: 8.217 } },
    { type: 'city', name: { en: 'Bruneck-Kronplatz', ru: 'Брунек-Кронплац' }, location: { lat: 46.783, lng: 11.933 } },
    { type: 'city', name: { en: 'Brunnen', ru: 'Бруннен' }, location: { lat: 46.983, lng: 8.600 } },
    { type: 'city', name: { en: 'Brussel', ru: 'Брюссель' }, location: { lat: 50.850, lng: 4.352 } },
    { type: 'city', name: { en: 'Brusson', ru: 'Брюссон' }, location: { lat: 45.783, lng: 7.733 } },
    { type: 'city', name: { en: 'Bubendorf', ru: 'Бубендорф' }, location: { lat: 47.450, lng: 7.733 } },
    { type: 'city', name: { en: 'Buergenstock', ru: 'Бюргеншток' }, location: { lat: 46.983, lng: 8.400 } },
    { type: 'city', name: { en: 'Bulle', ru: 'Бюль' }, location: { lat: 46.617, lng: 7.050 } },
    { type: 'city', name: { en: 'Buonas', ru: 'Буонас' }, location: { lat: 47.150, lng: 8.450 } },
    { type: 'city', name: { en: 'Burgdorf', ru: 'Бургдорф' }, location: { lat: 47.067, lng: 7.633 } },
    { type: 'city', name: { en: 'Burserberg', ru: 'Бурзерберг' }, location: { lat: 47.150, lng: 9.783 } },
    { type: 'city', name: { en: 'Burtigny', ru: 'Буртиньи' }, location: { lat: 46.450, lng: 6.283 } },
    { type: 'city', name: { en: 'Bussy-Saint-Georges', ru: 'Бюсси-Сен-Жорж' }, location: { lat: 48.833, lng: 2.717 } },
    { type: 'city', name: { en: 'Cabourg', ru: 'Кабур' }, location: { lat: 49.283, lng: -0.117 } },
    { type: 'city', name: { en: 'Caen', ru: 'Кан' }, location: { lat: 49.183, lng: -0.367 } },
    { type: 'city', name: { en: 'Calais', ru: 'Кале' }, location: { lat: 50.950, lng: 1.850 } },
    { type: 'city', name: { en: 'Cambrai', ru: 'Камбре' }, location: { lat: 50.167, lng: 3.233 } },
    { type: 'city', name: { en: 'Campitellodi Fassa', ru: 'Кампителло-ди-Фасса' }, location: { lat: 46.483, lng: 11.750 } },
    { type: 'city', name: { en: 'Canazei', ru: 'Канацеи' }, location: { lat: 46.483, lng: 11.767 } },
    { type: 'city', name: { en: 'Cannes', ru: 'Канны' }, location: { lat: 43.550, lng: 7.017 } },
    { type: 'city', name: { en: 'Carezzaal Lago', ru: 'Кареццааль Лаго' }, location: { lat: 46.417, lng: 11.583 } },
    { type: 'city', name: { en: 'Carnia', ru: 'Карния' }, location: { lat: 46.400, lng: 12.983 } },
    { type: 'city', name: { en: 'Carona', ru: 'Карона' }, location: { lat: 45.867, lng: 9.917 } },
    { type: 'city', name: { en: 'Carouge', ru: 'Каруж' }, location: { lat: 46.183, lng: 6.133 } },
    { type: 'city', name: { en: 'Carquefou', ru: 'Карк-фу' }, location: { lat: 47.300, lng: -1.483 } },
    { type: 'city', name: { en: 'Castaneda', ru: 'Кастанеда' }, location: { lat: 46.300, lng: 9.183 } },
    { type: 'city', name: { en: 'Castionedella Presolana', ru: 'Кастионе-делла-Презолана' }, location: { lat: 45.900, lng: 9.967 } },
    { type: 'city', name: { en: 'Caudan', ru: 'Кодан' }, location: { lat: 47.767, lng: -3.350 } },
    { type: 'city', name: { en: 'Cavalese', ru: 'Кавалезе' }, location: { lat: 46.283, lng: 11.467 } },
    { type: 'city', name: { en: 'Celigny', ru: 'Селиньи' }, location: { lat: 46.317, lng: 6.150 } },
    { type: 'city', name: { en: 'Cerreto Laghi', ru: 'Черрето Лаги' }, location: { lat: 44.350, lng: 10.333 } },
    { type: 'city', name: { en: 'Cesana Torinese', ru: 'Чезана Торинезе' }, location: { lat: 44.950, lng: 6.800 } },
    { type: 'city', name: { en: 'Cesson-Sevigne', ru: 'Сессон-Севинье' }, location: { lat: 48.117, lng: -1.600 } },
    { type: 'city', name: { en: 'Chalon', ru: 'Шалон' }, location: { lat: 46.783, lng: 4.850 } },
    { type: 'city', name: { en: 'Chalons-En-Champagne', ru: 'Шалон-ан-Шампань' }, location: { lat: 48.950, lng: 4.367 } },
    { type: 'city', name: { en: 'Cham', ru: 'Хам' }, location: { lat: 47.183, lng: 8.467 } },
    { type: 'city', name: { en: 'Chambery', ru: 'Шамбери' }, location: { lat: 45.567, lng: 5.917 } },
    { type: 'airport', name: { en: 'Chambery Airport CMF', ru: 'Аэропорт Шамбери' }, location: { lat: 45.638, lng: 5.880 } },
    { type: 'city', name: { en: 'Chambourcy', ru: 'Шамбурси' }, location: { lat: 48.900, lng: 2.033 } },
    { type: 'city', name: { en: 'Chambray', ru: 'Шамбрэ' }, location: { lat: 47.333, lng: 0.700 } },
    { type: 'city', name: { en: 'Chamonix', ru: 'Шамони' }, location: { lat: 45.917, lng: 6.867 } },
    { type: 'city', name: { en: 'Champagny-en-Vanoise', ru: 'Шампаньи-ан-Вануаз' }, location: { lat: 45.450, lng: 6.700 } },
    { type: 'city', name: { en: 'Champery', ru: 'Шампери' }, location: { lat: 46.183, lng: 6.867 } },
    { type: 'city', name: { en: 'Champex-Lac', ru: 'Шампекс-Лак' }, location: { lat: 46.017, lng: 7.100 } },
    { type: 'city', name: { en: 'Champoluc', ru: 'Шамполюк' }, location: { lat: 45.817, lng: 7.733 } },
    { type: 'city', name: { en: 'Champoussin', ru: 'Шампуссен' }, location: { lat: 46.183, lng: 6.850 } },
    { type: 'city', name: { en: 'Chamrousse', ru: 'Шамрус' }, location: { lat: 45.117, lng: 5.883 } },
    { type: 'city', name: { en: 'Chantepie', ru: 'Шантепи' }, location: { lat: 48.083, lng: -1.617 } },
    { type: 'city', name: { en: 'Chartres', ru: 'Шартр' }, location: { lat: 48.450, lng: 1.483 } },
    { type: 'city', name: { en: 'Chasseneuil', ru: 'Шассёй' }, location: { lat: 46.650, lng: 0.400 } },
    { type: 'city', name: { en: 'Chateaubriant', ru: 'Шатобриан' }, location: { lat: 47.717, lng: -1.367 } },
    { type: 'city', name: { en: 'Chateaudun', ru: 'Шатодён' }, location: { lat: 48.067, lng: 1.333 } },
    { type: 'city', name: { en: 'Chateauroux', ru: 'Шатору' }, location: { lat: 46.817, lng: 1.700 } },
    { type: 'city', name: { en: 'Chateau-Ville-Vieille', ru: 'Шато-Виль-Вьей' }, location: { lat: 44.767, lng: 6.767 } },
    { type: 'city', name: { en: 'Chatel', ru: 'Шатель' }, location: { lat: 46.267, lng: 6.833 } },
    { type: 'city', name: { en: 'Chatellerault', ru: 'Шательро' }, location: { lat: 46.817, lng: 0.533 } },
    { type: 'city', name: { en: 'Cherbourg-Octeville', ru: 'Шербур-Октевиль' }, location: { lat: 49.633, lng: -1.617 } },
    { type: 'city', name: { en: 'ChevillyLarue', ru: 'Шевильи-Ларю' }, location: { lat: 48.767, lng: 2.350 } },
    { type: 'city', name: { en: 'Chexbres', ru: 'Шексбр' }, location: { lat: 46.483, lng: 6.767 } },
    { type: 'city', name: { en: 'Chiesain Valmalenco', ru: 'Кьеза-ин-Вальмаленко' }, location: { lat: 46.333, lng: 9.867 } },
    { type: 'city', name: { en: 'Chinaillon', ru: 'Шинайон' }, location: { lat: 45.950, lng: 6.433 } },
    { type: 'city', name: { en: 'Chinon', ru: 'Шинон' }, location: { lat: 47.167, lng: 0.233 } },
    { type: 'city', name: { en: 'Cholet', ru: 'Шоле' }, location: { lat: 47.067, lng: -0.883 } },
    { type: 'city', name: { en: 'Chur', ru: 'Хур' }, location: { lat: 46.850, lng: 9.533 } },
    { type: 'city', name: { en: 'Churwalden', ru: 'Хурвальден' }, location: { lat: 46.767, lng: 9.533 } },
    { type: 'city', name: { en: 'Cimone', ru: 'Чимоне' }, location: { lat: 46.200, lng: 11.050 } },
    { type: 'city', name: { en: 'Clamart', ru: 'Кламар' }, location: { lat: 48.800, lng: 2.267 } },
    { type: 'city', name: { en: 'Claviere', ru: 'Клавьер' }, location: { lat: 44.933, lng: 6.750 } },
    { type: 'city', name: { en: 'Cleon', ru: 'Клеон' }, location: { lat: 49.317, lng: 1.033 } },
    { type: 'city', name: { en: 'Clichy', ru: 'Клиши' }, location: { lat: 48.900, lng: 2.300 } },
    { type: 'city', name: { en: 'Cogne', ru: 'Конье' }, location: { lat: 45.617, lng: 7.350 } },
    { type: 'city', name: { en: 'Colere', ru: 'Колере' }, location: { lat: 45.933, lng: 10.017 } },
    { type: 'city', name: { en: 'Collonge-Bellerive', ru: 'Коллонж-Беллерив' }, location: { lat: 46.267, lng: 6.200 } },
    { type: 'city', name: { en: 'Colmar', ru: 'Кольмар' }, location: { lat: 48.083, lng: 7.350 } },
    { type: 'city', name: { en: 'Cologne', ru: 'Кёльн' }, location: { lat: 50.933, lng: 6.950 } },
    { type: 'city', name: { en: 'Colombes', ru: 'Коломб' }, location: { lat: 48.917, lng: 2.250 } },
    { type: 'city', name: { en: 'Combloux', ru: 'Комблу' }, location: { lat: 45.900, lng: 6.650 } },
    { type: 'city', name: { en: 'Comelico', ru: 'Комелико' }, location: { lat: 46.633, lng: 12.383 } },
    // Continuing with entries 201-300 from data.txt
    { type: 'city', name: { en: 'Commugny', ru: 'Коммуньи' }, location: { lat: 46.300, lng: 6.183 } },
    { type: 'city', name: { en: 'Como', ru: 'Комо' }, location: { lat: 45.808, lng: 9.085 } },
    { type: 'city', name: { en: 'Compiegne', ru: 'Компьень' }, location: { lat: 49.417, lng: 2.833 } },
    { type: 'city', name: { en: 'Concarneau', ru: 'Конкарно' }, location: { lat: 47.867, lng: -3.917 } },
    { type: 'city', name: { en: 'Correncon-en-Vercors', ru: 'Корансон-ан-Веркор' }, location: { lat: 45.033, lng: 5.533 } },
    { type: 'city', name: { en: 'Cortinad Ampezzo', ru: 'Кортина д\'Ампеццо' }, location: { lat: 46.533, lng: 12.133 } },
    { type: 'city', name: { en: 'Corvara', ru: 'Корвара' }, location: { lat: 46.550, lng: 11.883 } },
    { type: 'city', name: { en: 'Corvara', ru: 'Корвара' }, location: { lat: 46.550, lng: 11.883 } },
    { type: 'city', name: { en: 'Cosne', ru: 'Кон' }, location: { lat: 47.417, lng: 2.933 } },
    { type: 'city', name: { en: 'Coueron', ru: 'Куэрон' }, location: { lat: 47.217, lng: -1.717 } },
    { type: 'city', name: { en: 'Courbevoie', ru: 'Курбевуа' }, location: { lat: 48.900, lng: 2.250 } },
    { type: 'city', name: { en: 'Courchevel', ru: 'Куршевель' }, location: { lat: 45.417, lng: 6.633 } },
    { type: 'city', name: { en: 'Courmayeur', ru: 'Курмайор' }, location: { lat: 45.800, lng: 6.967 } },
    { type: 'city', name: { en: 'Coutances', ru: 'Кутанс' }, location: { lat: 49.050, lng: -1.450 } },
    { type: 'city', name: { en: 'Crans-Montana', ru: 'Кран-Монтана' }, location: { lat: 46.317, lng: 7.483 } },
    { type: 'city', name: { en: 'Creil', ru: 'Крей' }, location: { lat: 49.267, lng: 2.467 } },
    { type: 'city', name: { en: 'Crest-Voland', ru: 'Кре-Волан' }, location: { lat: 45.783, lng: 6.517 } },
    { type: 'city', name: { en: 'Creteil', ru: 'Кретей' }, location: { lat: 48.783, lng: 2.467 } },
    { type: 'city', name: { en: 'Crissolo', ru: 'Криссоло' }, location: { lat: 44.683, lng: 7.100 } },
    { type: 'city', name: { en: 'Crozet', ru: 'Крозе' }, location: { lat: 46.283, lng: 6.150 } },
    { type: 'city', name: { en: 'Daeniken', ru: 'Деникен' }, location: { lat: 47.367, lng: 7.917 } },
    { type: 'city', name: { en: 'Dalaas', ru: 'Далаас' }, location: { lat: 47.183, lng: 9.867 } },
    { type: 'city', name: { en: 'Damuls', ru: 'Дамульс' }, location: { lat: 47.283, lng: 9.900 } },
    { type: 'city', name: { en: 'Darfo Boaria Terme', ru: 'Дарфо Боария Терме' }, location: { lat: 45.883, lng: 10.183 } },
    { type: 'city', name: { en: 'Davos', ru: 'Давос' }, location: { lat: 46.800, lng: 9.833 } },
    { type: 'city', name: { en: 'Deauville', ru: 'Довиль' }, location: { lat: 49.367, lng: 0.067 } },
    { type: 'city', name: { en: 'Delemont', ru: 'Делемон' }, location: { lat: 47.367, lng: 7.333 } },
    { type: 'city', name: { en: 'Dienten', ru: 'Динтен' }, location: { lat: 47.333, lng: 12.783 } },
    { type: 'city', name: { en: 'Dieppe', ru: 'Дьеп' }, location: { lat: 49.917, lng: 1.083 } },
    { type: 'city', name: { en: 'Dieuze', ru: 'Дьёз' }, location: { lat: 48.717, lng: 6.717 } },
    { type: 'city', name: { en: 'Dijon', ru: 'Дижон' }, location: { lat: 47.317, lng: 5.017 } },
    { type: 'city', name: { en: 'Dinan', ru: 'Динан' }, location: { lat: 48.450, lng: -2.050 } },
    { type: 'city', name: { en: 'Dinard', ru: 'Динар' }, location: { lat: 48.633, lng: -2.050 } },
    { type: 'city', name: { en: 'Disentis/Muster', ru: 'Дизентис/Мустер' }, location: { lat: 46.700, lng: 8.850 } },
    { type: 'city', name: { en: 'Disneyland Paris', ru: 'Диснейленд Париж' }, location: { lat: 48.867, lng: 2.783 } },
    { type: 'city', name: { en: 'Dives', ru: 'Див' }, location: { lat: 49.283, lng: -0.100 } },
    { type: 'city', name: { en: 'Divonne-les-Bains', ru: 'Дивон-ле-Бен' }, location: { lat: 46.357, lng: 6.141 } },
    { type: 'city', name: { en: 'Dommartin', ru: 'Доммартен' }, location: { lat: 46.750, lng: 4.817 } },
    { type: 'city', name: { en: 'Donaueschingen', ru: 'Донауэшинген' }, location: { lat: 47.950, lng: 8.500 } },
    { type: 'city', name: { en: 'Dorfgastein', ru: 'Дорфгастайн' }, location: { lat: 47.183, lng: 13.083 } },
    { type: 'city', name: { en: 'Dornach', ru: 'Дорнах' }, location: { lat: 47.483, lng: 7.617 } },
    { type: 'city', name: { en: 'Dornbirn', ru: 'Дорнбирн' }, location: { lat: 47.417, lng: 9.733 } },
    { type: 'city', name: { en: 'Douai', ru: 'Дуэ' }, location: { lat: 50.367, lng: 3.083 } },
    { type: 'city', name: { en: 'Drancy', ru: 'Дранси' }, location: { lat: 48.933, lng: 2.433 } },
    { type: 'city', name: { en: 'Dusseldorf', ru: 'Дюссельдорф' }, location: { lat: 51.233, lng: 6.783 } },
    { type: 'city', name: { en: 'Ebikon', ru: 'Эбикон' }, location: { lat: 47.083, lng: 8.350 } },
    { type: 'city', name: { en: 'Echenevex', ru: 'Эшневекс' }, location: { lat: 46.317, lng: 6.067 } },
    { type: 'city', name: { en: 'Eckartswiller', ru: 'Эккартсвиллер' }, location: { lat: 48.850, lng: 7.300 } },
    { type: 'city', name: { en: 'Effretikon', ru: 'Эффретикон' }, location: { lat: 47.433, lng: 8.683 } },
    { type: 'city', name: { en: 'Egerkingen', ru: 'Эгеркинген' }, location: { lat: 47.317, lng: 7.800 } },
    { type: 'city', name: { en: 'Eichenberg', ru: 'Айхенберг' }, location: { lat: 47.567, lng: 9.750 } },
    { type: 'city', name: { en: 'Einsiedeln', ru: 'Айнзидельн' }, location: { lat: 47.133, lng: 8.750 } },
    { type: 'city', name: { en: 'Ellmau', ru: 'Эльмау' }, location: { lat: 47.517, lng: 12.300 } },
    { type: 'city', name: { en: 'Embrach', ru: 'Эмбрах' }, location: { lat: 47.500, lng: 8.583 } },
    { type: 'city', name: { en: 'Engelberg', ru: 'Энгельберг' }, location: { lat: 46.817, lng: 8.400 } },
    { type: 'city', name: { en: 'Englos', ru: 'Энгло' }, location: { lat: 50.633, lng: 2.967 } },
    { type: 'city', name: { en: 'Ennetburgen', ru: 'Эннетбурген' }, location: { lat: 46.983, lng: 8.350 } },
    { type: 'city', name: { en: 'Epernay', ru: 'Эперне' }, location: { lat: 49.033, lng: 3.967 } },
    { type: 'city', name: { en: 'Epinal', ru: 'Эпиналь' }, location: { lat: 48.183, lng: 6.450 } },
    { type: 'city', name: { en: 'Ermatingen', ru: 'Эрматинген' }, location: { lat: 47.667, lng: 9.067 } },
    { type: 'city', name: { en: 'Essomes', ru: 'Эссом' }, location: { lat: 49.033, lng: 3.400 } },
    { type: 'city', name: { en: 'Etroubles', ru: 'Этрубль' }, location: { lat: 45.817, lng: 7.233 } },
    { type: 'city', name: { en: 'Evian-les-Bains', ru: 'Эвиан-ле-Бен' }, location: { lat: 46.400, lng: 6.583 } },
    { type: 'city', name: { en: 'Evreux', ru: 'Эврё' }, location: { lat: 49.017, lng: 1.150 } },
    { type: 'city', name: { en: 'Faidella Paganella', ru: 'Фаиделла Паганелла' }, location: { lat: 46.167, lng: 11.050 } },
    { type: 'city', name: { en: 'Falaise', ru: 'Фалез' }, location: { lat: 49.000, lng: -0.200 } },
    { type: 'city', name: { en: 'Falcade', ru: 'Фалькаде' }, location: { lat: 46.383, lng: 11.933 } },
    { type: 'city', name: { en: 'Fallanden', ru: 'Фалланден' }, location: { lat: 47.433, lng: 8.617 } },
    { type: 'city', name: { en: 'Fanas', ru: 'Фанас' }, location: { lat: 46.900, lng: 9.583 } },
    { type: 'city', name: { en: 'Faschina', ru: 'Фашина' }, location: { lat: 47.217, lng: 9.950 } },
    { type: 'city', name: { en: 'Fecamp', ru: 'Фекан' }, location: { lat: 49.750, lng: 0.383 } },
    { type: 'city', name: { en: 'Fehraltorf', ru: 'Феральторф' }, location: { lat: 47.383, lng: 8.750 } },
    { type: 'city', name: { en: 'Feistritzob Bleiburg', ru: 'Файстриц-об-Блайбург' }, location: { lat: 46.600, lng: 14.783 } },
    { type: 'city', name: { en: 'Feldberg', ru: 'Фельдберг' }, location: { lat: 47.867, lng: 8.000 } },
    { type: 'city', name: { en: 'Feldkirch', ru: 'Фельдкирх' }, location: { lat: 47.233, lng: 9.600 } },
    { type: 'city', name: { en: 'Ferney-Voltaire', ru: 'Ферне-Вольтер' }, location: { lat: 46.267, lng: 6.100 } },
    { type: 'city', name: { en: 'Feusisberg', ru: 'Фойзисберг' }, location: { lat: 47.200, lng: 8.583 } },
    { type: 'city', name: { en: 'Fieberbrun', ru: 'Фиберброн' }, location: { lat: 47.467, lng: 12.833 } },
    { type: 'city', name: { en: 'Fiesch', ru: 'Фиш' }, location: { lat: 46.400, lng: 8.133 } },
    { type: 'city', name: { en: 'Filisur', ru: 'Филизур' }, location: { lat: 46.683, lng: 9.667 } },
    { type: 'city', name: { en: 'Filzmoos', ru: 'Фильцмоос' }, location: { lat: 47.433, lng: 13.517 } },
    { type: 'city', name: { en: 'Finkenberg Zillertal Superski', ru: 'Финкенберг Циллерталь Суперски' }, location: { lat: 47.150, lng: 11.850 } },
    { type: 'city', name: { en: 'FissSerfaus', ru: 'Фисс-Серфаус' }, location: { lat: 47.050, lng: 10.617 } },
    { type: 'city', name: { en: 'Flachau', ru: 'Флахау' }, location: { lat: 47.350, lng: 13.383 } },
    { type: 'city', name: { en: 'Flaine', ru: 'Флен' }, location: { lat: 46.000, lng: 6.700 } },
    { type: 'city', name: { en: 'Flattach', ru: 'Флаттах' }, location: { lat: 47.000, lng: 13.217 } },
    { type: 'city', name: { en: 'Flers', ru: 'Флер' }, location: { lat: 48.750, lng: -0.567 } },
    { type: 'city', name: { en: 'Flims', ru: 'Флимс' }, location: { lat: 46.833, lng: 9.283 } },
    { type: 'city', name: { en: 'Florence', ru: 'Флоренция' }, location: { lat: 43.771, lng: 11.248 } },
    { type: 'city', name: { en: 'Flumet', ru: 'Флюме' }, location: { lat: 45.817, lng: 6.517 } },
    { type: 'city', name: { en: 'Flumserberg', ru: 'Флумзерберг' }, location: { lat: 47.083, lng: 9.283 } },
    { type: 'city', name: { en: 'Folgaria', ru: 'Фольгария' }, location: { lat: 45.917, lng: 11.183 } },
    { type: 'city', name: { en: 'Folgarida', ru: 'Фольгарида' }, location: { lat: 46.300, lng: 10.783 } },
    { type: 'city', name: { en: 'Fontanella', ru: 'Фонтанелла' }, location: { lat: 47.217, lng: 9.933 } },
    { type: 'city', name: { en: 'Fontenay-sous-Bois', ru: 'Фонтене-су-Буа' }, location: { lat: 48.850, lng: 2.483 } },
    { type: 'city', name: { en: 'Foppolo', ru: 'Фопполо' }, location: { lat: 46.017, lng: 9.750 } },
    { type: 'city', name: { en: 'Forbach', ru: 'Форбах' }, location: { lat: 49.183, lng: 6.900 } },
    { type: 'city', name: { en: 'Fornidi Sopra', ru: 'Форниди Сопра' }, location: { lat: 46.583, lng: 12.783 } },
    { type: 'city', name: { en: 'Fourmies', ru: 'Фурми' }, location: { lat: 50.017, lng: 4.050 } },
    { type: 'city', name: { en: 'Frankfurt', ru: 'Франкфурт' }, location: { lat: 50.110, lng: 8.682 } },
    { type: 'airport', name: { en: 'Frankfurt Airport', ru: 'Аэропорт Франкфурт' }, location: { lat: 50.033, lng: 8.570 } },
    { type: 'city', name: { en: 'Frauenfeld', ru: 'Фрауэнфельд' }, location: { lat: 47.550, lng: 8.900 } },
    { type: 'city', name: { en: 'Freiburgim Breisgau', ru: 'Фрайбург-им-Брайсгау' }, location: { lat: 47.993, lng: 7.849 } },
    { type: 'city', name: { en: 'Fribourg', ru: 'Фрибур' }, location: { lat: 46.800, lng: 7.150 } },
    { type: 'city', name: { en: 'Friedrichshafen', ru: 'Фридрихсхафен' }, location: { lat: 47.650, lng: 9.483 } },
    { type: 'city', name: { en: 'Fuegen Zillertal', ru: 'Фюген Циллерталь' }, location: { lat: 47.283, lng: 11.850 } },
    { type: 'city', name: { en: 'Fulpmes', ru: 'Фульпмес' }, location: { lat: 47.150, lng: 11.350 } },
    { type: 'city', name: { en: 'Fusch', ru: 'Фуш' }, location: { lat: 47.267, lng: 12.850 } },
    { type: 'city', name: { en: 'Fussen', ru: 'Фюссен' }, location: { lat: 47.567, lng: 10.700 } },
    // Continuing with entries 301-500 from data.txt
    { type: 'city', name: { en: 'Gaienhofen', ru: 'Гайенхофен' }, location: { lat: 47.683, lng: 8.983 } },
    { type: 'city', name: { en: 'Gaillard', ru: 'Гайар' }, location: { lat: 46.183, lng: 6.217 } },
    { type: 'city', name: { en: 'Gais', ru: 'Гайс' }, location: { lat: 47.367, lng: 9.450 } },
    { type: 'city', name: { en: 'Galtuer', ru: 'Гальтюр' }, location: { lat: 46.967, lng: 10.183 } },
    { type: 'railway', name: { en: 'Gare Montparnesse Train Station', ru: 'Вокзал Монпарнас' }, location: { lat: 48.840, lng: 2.318 } },
    { type: 'railway', name: { en: 'Gare Saint-Lazare Paris', ru: 'Вокзал Сен-Лазар Париж' }, location: { lat: 48.876, lng: 2.325 } },
    { type: 'railway', name: { en: 'Gared Austerlitz Paris', ru: 'Вокзал Аустерлиц Париж' }, location: { lat: 48.843, lng: 2.366 } },
    { type: 'railway', name: { en: 'Garede Lyon Paris', ru: 'Вокзал Лион Париж' }, location: { lat: 48.844, lng: 2.373 } },
    { type: 'railway', name: { en: 'Garede Paris-Est', ru: 'Вокзал Париж-Восток' }, location: { lat: 48.877, lng: 2.359 } },
    { type: 'railway', name: { en: 'Garedu Nord Paris', ru: 'Северный вокзал Париж' }, location: { lat: 48.881, lng: 2.355 } },
    { type: 'city', name: { en: 'Gargellen', ru: 'Гаргеллен' }, location: { lat: 46.967, lng: 9.917 } },
    { type: 'airport', name: { en: 'Geneva Airport GVA', ru: 'Аэропорт Женева' }, location: { lat: 46.238, lng: 6.109 } },
    { type: 'city', name: { en: 'Geneva Switzerland', ru: 'Женева Швейцария' }, location: { lat: 46.204, lng: 6.143 } },
    { type: 'railway', name: { en: 'Geneva Train Station', ru: 'Вокзал Женева' }, location: { lat: 46.210, lng: 6.142 } },
    { type: 'city', name: { en: 'Genolier', ru: 'Женолье' }, location: { lat: 46.417, lng: 6.217 } },
    { type: 'city', name: { en: 'Gentilly France', ru: 'Жантийи Франция' }, location: { lat: 48.817, lng: 2.350 } },
    { type: 'city', name: { en: 'Gerardmer', ru: 'Жерармер' }, location: { lat: 48.133, lng: 6.883 } },
    { type: 'city', name: { en: 'Gerlos', ru: 'Герлос' }, location: { lat: 47.233, lng: 12.033 } },
    { type: 'city', name: { en: 'Gerzensee', ru: 'Герценсе' }, location: { lat: 46.833, lng: 7.550 } },
    { type: 'city', name: { en: 'Gex', ru: 'Жекс' }, location: { lat: 46.333, lng: 6.067 } },
    { type: 'city', name: { en: 'Giverny', ru: 'Живерни' }, location: { lat: 49.077, lng: 1.533 } },
    { type: 'city', name: { en: 'Givet', ru: 'Живе' }, location: { lat: 50.133, lng: 4.833 } },
    { type: 'city', name: { en: 'Gland', ru: 'Глан' }, location: { lat: 46.421, lng: 6.269 } },
    { type: 'city', name: { en: 'Glion-sur-Montreux', ru: 'Глион-сюр-Монтрё' }, location: { lat: 46.433, lng: 6.917 } },
    { type: 'city', name: { en: 'Goingam Wilden Kaiser', ru: 'Гоинг-ам-Вильден-Кайзер' }, location: { lat: 47.517, lng: 12.333 } },
    { type: 'city', name: { en: 'Gorwihl', ru: 'Горвиль' }, location: { lat: 47.650, lng: 8.150 } },
    { type: 'city', name: { en: 'Gossensass', ru: 'Госсензасс' }, location: { lat: 46.933, lng: 11.433 } },
    { type: 'city', name: { en: 'Grand Saint Bernard', ru: 'Гран Сен-Бернар' }, location: { lat: 45.867, lng: 7.167 } },
    { type: 'city', name: { en: 'Grande', ru: 'Гранд' }, location: { lat: 50.367, lng: 3.617 } },
    { type: 'city', name: { en: 'Granville', ru: 'Гранвиль' }, location: { lat: 48.833, lng: -1.600 } },
    { type: 'city', name: { en: 'Grenoble', ru: 'Гренобль' }, location: { lat: 45.188, lng: 5.724 } },
    { type: 'airport', name: { en: 'Grenoble Airport', ru: 'Аэропорт Гренобль' }, location: { lat: 45.363, lng: 5.329 } },
    { type: 'city', name: { en: 'Grenzach-Wyhlen', ru: 'Гренцах-Вилен' }, location: { lat: 47.550, lng: 7.633 } },
    { type: 'city', name: { en: 'Gresse-en-Vercors', ru: 'Грес-ан-Веркор' }, location: { lat: 44.933, lng: 5.550 } },
    { type: 'city', name: { en: 'Gressoney', ru: 'Грессоней' }, location: { lat: 45.767, lng: 7.833 } },
    { type: 'city', name: { en: 'Grimentz Sierre', ru: 'Гриментц Сьерр' }, location: { lat: 46.183, lng: 7.567 } },
    { type: 'city', name: { en: 'Grindelwald', ru: 'Гриндельвальд' }, location: { lat: 46.624, lng: 8.034 } },
    { type: 'city', name: { en: 'Gruyeres', ru: 'Грюйер' }, location: { lat: 46.583, lng: 7.083 } },
    { type: 'city', name: { en: 'Gstaad Saanen', ru: 'Гштаад Заанен' }, location: { lat: 46.473, lng: 7.287 } },
    { type: 'city', name: { en: 'Guebwiller', ru: 'Гебвиллер' }, location: { lat: 47.900, lng: 7.200 } },
    { type: 'city', name: { en: 'Guingamp', ru: 'Генгам' }, location: { lat: 48.567, lng: -3.150 } },
    { type: 'city', name: { en: 'Guttingen', ru: 'Гюттинген' }, location: { lat: 47.600, lng: 9.283 } },
    { type: 'city', name: { en: 'Hagenthal-le-Bas', ru: 'Агенталь-ле-Ба' }, location: { lat: 47.567, lng: 7.517 } },
    { type: 'city', name: { en: 'Haguenau', ru: 'Агено' }, location: { lat: 48.817, lng: 7.783 } },
    { type: 'airport', name: { en: 'Hamburg Airport', ru: 'Аэропорт Гамбург' }, location: { lat: 53.630, lng: 9.988 } },
    { type: 'city', name: { en: 'Harfleur', ru: 'Арфлёр' }, location: { lat: 49.500, lng: 0.200 } },
    { type: 'city', name: { en: 'Hasliberg', ru: 'Хаслиберг' }, location: { lat: 46.733, lng: 8.283 } },
    { type: 'city', name: { en: 'Hauteluce', ru: 'Отлюс' }, location: { lat: 45.750, lng: 6.600 } },
    { type: 'city', name: { en: 'Heiden', ru: 'Хайден' }, location: { lat: 47.483, lng: 9.517 } },
    { type: 'city', name: { en: 'Hergiswil', ru: 'Хергисвиль' }, location: { lat: 46.983, lng: 8.300 } },
    { type: 'city', name: { en: 'Herisau', ru: 'Херизау' }, location: { lat: 47.383, lng: 9.300 } },
    { type: 'city', name: { en: 'Hermance', ru: 'Эрманс' }, location: { lat: 46.333, lng: 6.250 } },
    { type: 'city', name: { en: 'Herouville', ru: 'Эрувиль' }, location: { lat: 49.200, lng: -0.333 } },
    { type: 'city', name: { en: 'Hindelbank Burgdorf', ru: 'Хинделбанк Бургдорф' }, location: { lat: 47.033, lng: 7.550 } },
    { type: 'city', name: { en: 'Hintertux Zillertal Tux', ru: 'Хинтертукс Циллерталь Тукс' }, location: { lat: 47.067, lng: 11.667 } },
    { type: 'city', name: { en: 'Hinterzarten', ru: 'Хинтерцартен' }, location: { lat: 47.900, lng: 8.100 } },
    { type: 'city', name: { en: 'Hinwil', ru: 'Хинвиль' }, location: { lat: 47.300, lng: 8.850 } },
    { type: 'city', name: { en: 'Hochfuegen,Fuegen', ru: 'Хохфюген, Фюген' }, location: { lat: 47.283, lng: 11.850 } },
    { type: 'city', name: { en: 'Honfleur', ru: 'Онфлёр' }, location: { lat: 49.417, lng: 0.233 } },
    { type: 'city', name: { en: 'Hopfgartenim Brixental', ru: 'Хопфгартен-им-Бриксенталь' }, location: { lat: 47.450, lng: 12.150 } },
    { type: 'city', name: { en: 'Horgen', ru: 'Хорген' }, location: { lat: 47.267, lng: 8.600 } },
    { type: 'city', name: { en: 'Hospental', ru: 'Хоспенталь' }, location: { lat: 46.583, lng: 8.583 } },
    { type: 'city', name: { en: 'Houdemont', ru: 'Удемон' }, location: { lat: 48.650, lng: 6.183 } },
    { type: 'city', name: { en: 'Huttwil', ru: 'Хуттвиль' }, location: { lat: 47.100, lng: 7.867 } },
    { type: 'city', name: { en: 'Ihringen', ru: 'Ирринген' }, location: { lat: 48.050, lng: 7.650 } },
    { type: 'city', name: { en: 'Illhaeusern', ru: 'Ильхойзерн' }, location: { lat: 48.183, lng: 7.500 } },
    { type: 'city', name: { en: 'Innsbruck', ru: 'Инсбрук' }, location: { lat: 47.269, lng: 11.404 } },
    { type: 'city', name: { en: 'Innsbruck', ru: 'Инсбрук' }, location: { lat: 47.269, lng: 11.404 } },
    { type: 'airport', name: { en: 'Innsbruck Airport', ru: 'Аэропорт Инсбрук' }, location: { lat: 47.260, lng: 11.344 } },
    { type: 'city', name: { en: 'Interlaken', ru: 'Интерлакен' }, location: { lat: 46.686, lng: 7.865 } },
    { type: 'city', name: { en: 'Ischgl', ru: 'Ишгль' }, location: { lat: 46.983, lng: 10.300 } },
    { type: 'city', name: { en: 'Isola 2000', ru: 'Изола 2000' }, location: { lat: 44.183, lng: 6.900 } },
    { type: 'city', name: { en: 'Issoudun', ru: 'Иссудён' }, location: { lat: 46.950, lng: 1.983 } },
    { type: 'city', name: { en: 'Issy-les-Moulineaux', ru: 'Иси-ле-Мулино' }, location: { lat: 48.817, lng: 2.267 } },
    { type: 'city', name: { en: 'Itter', ru: 'Иттер' }, location: { lat: 47.467, lng: 12.133 } },
    { type: 'city', name: { en: 'Ittigen', ru: 'Иттиген' }, location: { lat: 46.983, lng: 7.483 } },
    { type: 'city', name: { en: 'Ivry-sur-Seine', ru: 'Иври-сюр-Сен' }, location: { lat: 48.817, lng: 2.383 } },
    { type: 'city', name: { en: 'Jochberg', ru: 'Йохберг' }, location: { lat: 47.400, lng: 12.417 } },
    { type: 'city', name: { en: 'Jona', ru: 'Йона' }, location: { lat: 47.233, lng: 8.833 } },
    { type: 'city', name: { en: 'Joue', ru: 'Жуэ' }, location: { lat: 47.350, lng: 0.667 } },
    { type: 'city', name: { en: 'Jouy', ru: 'Жуи' }, location: { lat: 48.767, lng: 2.167 } },
    { type: 'city', name: { en: 'Jungholz', ru: 'Юнгхольц' }, location: { lat: 47.567, lng: 10.433 } },
    { type: 'city', name: { en: 'Kaltenbach', ru: 'Кальтенбах' }, location: { lat: 47.283, lng: 11.867 } },
    { type: 'city', name: { en: 'Kandersteg', ru: 'Кандерштег' }, location: { lat: 46.500, lng: 7.667 } },
    { type: 'city', name: { en: 'Kappl', ru: 'Капль' }, location: { lat: 47.050, lng: 10.367 } },
    { type: 'city', name: { en: 'Kaprun', ru: 'Капрун' }, location: { lat: 47.267, lng: 12.767 } },
    { type: 'city', name: { en: 'Karlsruhe', ru: 'Карлсруэ' }, location: { lat: 49.009, lng: 8.404 } },
    { type: 'city', name: { en: 'Kastelruth', ru: 'Кастельрут' }, location: { lat: 46.567, lng: 11.550 } },
    { type: 'city', name: { en: 'Kaunertal', ru: 'Каунерталь' }, location: { lat: 46.900, lng: 10.733 } },
    { type: 'city', name: { en: 'Kelchsau', ru: 'Кельхзау' }, location: { lat: 47.433, lng: 12.100 } },
    { type: 'city', name: { en: 'Kirchbergin Tirol', ru: 'Кирхберг-ин-Тироль' }, location: { lat: 47.433, lng: 12.317 } },
    { type: 'city', name: { en: 'Kirchdorf Ander Krems', ru: 'Кирхдорф-ан-дер-Кремс' }, location: { lat: 47.900, lng: 14.133 } },
    { type: 'city', name: { en: 'Kitzbuehel', ru: 'Кицбюэль' }, location: { lat: 47.450, lng: 12.383 } },
    { type: 'city', name: { en: 'Kleinarl', ru: 'Кляйнарль' }, location: { lat: 47.267, lng: 13.350 } },
    { type: 'city', name: { en: 'Kleinwalsertal Riezlern', ru: 'Кляйнвальзерталь Рицлерн' }, location: { lat: 47.333, lng: 10.183 } },
    { type: 'city', name: { en: 'Kloesterle', ru: 'Клёстерле' }, location: { lat: 47.117, lng: 10.083 } },
    { type: 'city', name: { en: 'Klosters', ru: 'Клостерс' }, location: { lat: 46.867, lng: 9.883 } },
    { type: 'city', name: { en: 'Koblach', ru: 'Коблах' }, location: { lat: 47.333, lng: 9.617 } },
    { type: 'city', name: { en: 'Koessen', ru: 'Кёссен' }, location: { lat: 47.667, lng: 12.400 } },
    { type: 'city', name: { en: 'Konstanz', ru: 'Констанц' }, location: { lat: 47.659, lng: 9.175 } },
    { type: 'city', name: { en: 'Koppl', ru: 'Копль' }, location: { lat: 47.750, lng: 13.117 } },
    { type: 'city', name: { en: 'Kramsach', ru: 'Крамзах' }, location: { lat: 47.433, lng: 11.883 } },
    { type: 'city', name: { en: 'Kreuzlingen', ru: 'Кройцлинген' }, location: { lat: 47.650, lng: 9.167 } },
    { type: 'city', name: { en: 'Krimml', ru: 'Кримль' }, location: { lat: 47.217, lng: 12.183 } },
    { type: 'city', name: { en: 'Kuehtai', ru: 'Кютай' }, location: { lat: 47.200, lng: 11.017 } },
    { type: 'city', name: { en: 'La Chapelled Abondance', ru: 'Ла Шапель д\'Абонданс' }, location: { lat: 46.283, lng: 6.717 } },
    { type: 'city', name: { en: 'La Chapelle-de-Guinchay', ru: 'Ла Шапель-де-Генше' }, location: { lat: 46.200, lng: 4.767 } },
    { type: 'city', name: { en: 'La Chapelle-Saint-Mesmin', ru: 'Ла Шапель-Сен-Мемен' }, location: { lat: 47.883, lng: 1.833 } },
    { type: 'city', name: { en: 'La Chaux-de-Fonds', ru: 'Ла Шо-де-Фон' }, location: { lat: 47.100, lng: 6.833 } },
    { type: 'city', name: { en: 'La Clusaz', ru: 'Ла Клюза' }, location: { lat: 45.900, lng: 6.433 } },
    { type: 'city', name: { en: 'La Courneuve', ru: 'Ла Курнёв' }, location: { lat: 48.933, lng: 2.400 } },
    { type: 'city', name: { en: 'La Defense', ru: 'Ла Дефанс' }, location: { lat: 48.892, lng: 2.236 } },
    { type: 'city', name: { en: 'La Grave', ru: 'Ла Грав' }, location: { lat: 45.050, lng: 6.317 } },
    { type: 'city', name: { en: 'La Mure', ru: 'Ла Мюр' }, location: { lat: 44.900, lng: 5.783 } },
    { type: 'city', name: { en: 'La Plagne', ru: 'Ла Плань' }, location: { lat: 45.517, lng: 6.683 } },
    { type: 'city', name: { en: 'La Rochelle', ru: 'Ла Рошель' }, location: { lat: 46.160, lng: -1.151 } },
    { type: 'city', name: { en: 'La Roche-sur-Yon', ru: 'Ла Рош-сюр-Йон' }, location: { lat: 46.667, lng: -1.433 } },
    { type: 'city', name: { en: 'La Rosiere', ru: 'Ла Розьер' }, location: { lat: 45.633, lng: 6.850 } },
    { type: 'city', name: { en: 'La Tania', ru: 'Ла Танья' }, location: { lat: 45.433, lng: 6.600 } },
    { type: 'city', name: { en: 'La Thuile Aosta', ru: 'Ла Туиль Аоста' }, location: { lat: 45.717, lng: 6.950 } },
    { type: 'city', name: { en: 'La Toussuire', ru: 'Ла Туссюр' }, location: { lat: 45.250, lng: 6.300 } },
    { type: 'city', name: { en: 'La Tzoumaz', ru: 'Ла Цумаз' }, location: { lat: 46.083, lng: 7.200 } },
    { type: 'city', name: { en: 'La Villa Stern', ru: 'Ла Вилла Штерн' }, location: { lat: 46.583, lng: 11.883 } },
    { type: 'city', name: { en: 'Laax', ru: 'Лаакс' }, location: { lat: 46.817, lng: 9.250 } },
    { type: 'city', name: { en: 'LaBaule-Escoublac', ru: 'Ла Боль-Эскублак' }, location: { lat: 47.283, lng: -2.383 } },
    { type: 'city', name: { en: 'LaBresse', ru: 'Ла Брес' }, location: { lat: 48.017, lng: 6.883 } },
    { type: 'city', name: { en: 'Lac-De-Madine', ru: 'Лак-де-Мадин' }, location: { lat: 48.917, lng: 5.783 } },
    { type: 'city', name: { en: 'Ladis', ru: 'Ладис' }, location: { lat: 47.117, lng: 10.600 } },
    { type: 'city', name: { en: 'La-Lechere', ru: 'Ла-Лешер' }, location: { lat: 45.500, lng: 6.483 } },
    { type: 'city', name: { en: 'Langnau', ru: 'Лангнау' }, location: { lat: 46.933, lng: 7.800 } },
    { type: 'city', name: { en: 'Lannion', ru: 'Ланьон' }, location: { lat: 48.733, lng: -3.467 } },
    { type: 'city', name: { en: 'Lans En Vercors', ru: 'Лан-ан-Веркор' }, location: { lat: 45.133, lng: 5.583 } },
    { type: 'city', name: { en: 'Lanslebourg', ru: 'Ланслебур' }, location: { lat: 45.300, lng: 6.883 } },
    { type: 'city', name: { en: 'Laon', ru: 'Лан' }, location: { lat: 49.567, lng: 3.617 } },
    { type: 'city', name: { en: 'Laterns', ru: 'Латернс' }, location: { lat: 47.283, lng: 9.833 } },
    { type: 'city', name: { en: 'Lausanne City', ru: 'Город Лозанна' }, location: { lat: 46.520, lng: 6.632 } },
    { type: 'city', name: { en: 'Lausanne Port', ru: 'Порт Лозанна' }, location: { lat: 46.506, lng: 6.628 } },
    { type: 'city', name: { en: 'Lauterbrunnen', ru: 'Лаутербруннен' }, location: { lat: 46.593, lng: 7.908 } },
    { type: 'city', name: { en: 'Laval', ru: 'Лаваль' }, location: { lat: 48.067, lng: -0.767 } },
    { type: 'city', name: { en: 'Lavarone', ru: 'Лавароне' }, location: { lat: 45.917, lng: 11.267 } },
    { type: 'city', name: { en: 'Lavey-Les-Bains', ru: 'Лаве-ле-Бен' }, location: { lat: 46.317, lng: 7.033 } },
    { type: 'city', name: { en: 'Laxou', ru: 'Лаксу' }, location: { lat: 48.683, lng: 6.150 } },
    { type: 'city', name: { en: 'Le Bourget', ru: 'Ле Бурже' }, location: { lat: 48.933, lng: 2.433 } },
    { type: 'city', name: { en: 'Le Bouveret', ru: 'Ле Бувре' }, location: { lat: 46.383, lng: 6.850 } },
    { type: 'city', name: { en: 'Le Brassus', ru: 'Ле Брассю' }, location: { lat: 46.600, lng: 6.267 } },
    { type: 'city', name: { en: 'Le Chesnay', ru: 'Ле Шене' }, location: { lat: 48.817, lng: 2.133 } },
    { type: 'city', name: { en: 'Le Corbier', ru: 'Ле Корбье' }, location: { lat: 45.250, lng: 6.250 } },
    { type: 'city', name: { en: 'Le Coudray-Montceaux', ru: 'Ле Кудрэ-Монсо' }, location: { lat: 48.567, lng: 2.483 } },
    { type: 'city', name: { en: 'Le Grand-Bornand', ru: 'Ле Гран-Борнан' }, location: { lat: 45.933, lng: 6.433 } },
    { type: 'city', name: { en: 'Le Havre', ru: 'Ле Авр' }, location: { lat: 49.494, lng: 0.107 } },
    { type: 'city', name: { en: 'Le Mans', ru: 'Ле Ман' }, location: { lat: 48.008, lng: 0.200 } },
    { type: 'city', name: { en: 'Le Mont-Pelerin', ru: 'Ле Мон-Пелерен' }, location: { lat: 46.483, lng: 6.833 } },
    { type: 'city', name: { en: 'Le Subdray', ru: 'Ле Субдре' }, location: { lat: 47.133, lng: 2.267 } },
    { type: 'city', name: { en: 'Le Touquet', ru: 'Ле Туке' }, location: { lat: 50.517, lng: 1.583 } },
    { type: 'city', name: { en: 'Le Vaudreuil', ru: 'Ле Водрёй' }, location: { lat: 49.250, lng: 1.200 } },
    { type: 'city', name: { en: 'Lecco', ru: 'Лекко' }, location: { lat: 45.856, lng: 9.393 } },
    { type: 'city', name: { en: 'Lecham Arlberg', ru: 'Лех-ам-Арльберг' }, location: { lat: 47.200, lng: 10.133 } },
    { type: 'city', name: { en: 'Lelex', ru: 'Лелекс' }, location: { lat: 46.300, lng: 5.950 } },
    { type: 'city', name: { en: 'Lenk', ru: 'Ленк' }, location: { lat: 46.467, lng: 7.433 } },
    { type: 'city', name: { en: 'Lenzerheide', ru: 'Ленцерхайде' }, location: { lat: 46.733, lng: 9.567 } },
    { type: 'city', name: { en: 'Leogang', ru: 'Леоганг' }, location: { lat: 47.433, lng: 12.783 } },
    { type: 'city', name: { en: 'Lermoos', ru: 'Лермоос' }, location: { lat: 47.400, lng: 10.883 } },
    { type: 'city', name: { en: 'Les Aillons', ru: 'Ле Айон' }, location: { lat: 45.650, lng: 6.217 } },
    { type: 'city', name: { en: 'Les Allues', ru: 'Ле Алю' }, location: { lat: 45.400, lng: 6.567 } },
    { type: 'city', name: { en: 'Les Arcs', ru: 'Ле Арк' }, location: { lat: 45.567, lng: 6.800 } },
    { type: 'city', name: { en: 'Les Bossons', ru: 'Ле Боссон' }, location: { lat: 45.900, lng: 6.867 } },
    { type: 'city', name: { en: 'Les Carroz Dessus', ru: 'Ле Карро Десю' }, location: { lat: 45.683, lng: 6.533 } },
    { type: 'city', name: { en: 'Les CarrozdAraches', ru: 'Ле Карро д\'Араш' }, location: { lat: 46.033, lng: 6.633 } },
    { type: 'city', name: { en: 'Les Collons Vex Herens', ru: 'Ле Коллон Вех Эранс' }, location: { lat: 46.150, lng: 7.517 } },
    { type: 'city', name: { en: 'Les Contamines', ru: 'Ле Контамин' }, location: { lat: 45.817, lng: 6.733 } },
    { type: 'city', name: { en: 'Les Crosets Val-dIlliez', ru: 'Ле Крозе Валь-д\'Ильез' }, location: { lat: 46.200, lng: 6.833 } },
    { type: 'city', name: { en: 'Les Deux Alpes', ru: 'Ле Дё Альп' }, location: { lat: 45.017, lng: 6.117 } },
    { type: 'city', name: { en: 'Les Diablerets', ru: 'Ле Дьяблере' }, location: { lat: 46.333, lng: 7.200 } },
    { type: 'city', name: { en: 'Les Echelles', ru: 'Ле Эшель' }, location: { lat: 45.433, lng: 5.750 } },
    { type: 'city', name: { en: 'Les Genevez', ru: 'Ле Женеве' }, location: { lat: 47.233, lng: 7.167 } },
    { type: 'city', name: { en: 'Les Gets', ru: 'Ле Же' }, location: { lat: 46.150, lng: 6.667 } },
    { type: 'city', name: { en: 'Les Herbiers', ru: 'Ле Эрбье' }, location: { lat: 46.867, lng: -1.017 } },
    { type: 'city', name: { en: 'Les Houches', ru: 'Ле Уш' }, location: { lat: 45.883, lng: 6.800 } },
    { type: 'city', name: { en: 'Les Lilas', ru: 'Ле Лила' }, location: { lat: 48.883, lng: 2.417 } },
    { type: 'city', name: { en: 'Les Menuires', ru: 'Ле Менюир' }, location: { lat: 45.317, lng: 6.533 } },
    { type: 'city', name: { en: 'Les Orres', ru: 'Ле Орр' }, location: { lat: 44.500, lng: 6.550 } },
    { type: 'city', name: { en: 'Les Prazde Chamonix', ru: 'Ле Пра де Шамони' }, location: { lat: 45.933, lng: 6.867 } },
    { type: 'city', name: { en: 'Les Sablesd Olonne', ru: 'Ле Сабль-д\'Олон' }, location: { lat: 46.500, lng: -1.783 } },
    { type: 'city', name: { en: 'Les Saisies', ru: 'Ле Сези' }, location: { lat: 45.767, lng: 6.533 } },
    { type: 'city', name: { en: 'Les Ulis', ru: 'Ле Юлис' }, location: { lat: 48.683, lng: 2.167 } },
    { type: 'city', name: { en: 'Lesquin', ru: 'Лескен' }, location: { lat: 50.583, lng: 3.117 } },
    { type: 'city', name: { en: 'Leukerbad/Loeche-Les-Bains', ru: 'Лёйкербад/Лёш-ле-Бен' }, location: { lat: 46.383, lng: 7.633 } },
    { type: 'city', name: { en: 'Leutasch', ru: 'Лойташ' }, location: { lat: 47.367, lng: 11.133 } },
    { type: 'city', name: { en: 'Levallois-Perret', ru: 'Левалуа-Перре' }, location: { lat: 48.900, lng: 2.283 } },
    { type: 'city', name: { en: 'Lezen', ru: 'Лезен' }, location: { lat: 46.350, lng: 7.200 } },
    { type: 'city', name: { en: 'Lienz', ru: 'Лиенц' }, location: { lat: 46.833, lng: 12.767 } },
    { type: 'city', name: { en: 'Liestal', ru: 'Листаль' }, location: { lat: 47.483, lng: 7.733 } },
    { type: 'city', name: { en: 'Lille', ru: 'Лилль' }, location: { lat: 50.629, lng: 3.057 } },
    { type: 'city', name: { en: 'Limoges', ru: 'Лимож' }, location: { lat: 45.833, lng: 1.267 } },
    { type: 'city', name: { en: 'Limone Piemonte', ru: 'Лимоне Пьемонте' }, location: { lat: 44.200, lng: 7.567 } },
    { type: 'city', name: { en: 'Lindau', ru: 'Линдау' }, location: { lat: 47.547, lng: 9.684 } },
    { type: 'city', name: { en: 'Lindenberg', ru: 'Линденберг' }, location: { lat: 47.600, lng: 9.900 } },
    { type: 'city', name: { en: 'Lingolsheim', ru: 'Ленгольсхайм' }, location: { lat: 48.550, lng: 7.683 } },
    { type: 'city', name: { en: 'Linthal', ru: 'Линталь' }, location: { lat: 46.917, lng: 8.983 } },
    { type: 'city', name: { en: 'Lisieux', ru: 'Лизьё' }, location: { lat: 49.150, lng: 0.233 } },
    { type: 'city', name: { en: 'Livigno', ru: 'Ливиньо' }, location: { lat: 46.533, lng: 10.133 } },
    // Continuing with remaining entries from data.txt (501-1099)
    { type: 'city', name: { en: 'Lizzanoin Belvedere', ru: 'Лиццано-ин-Бельведере' }, location: { lat: 44.200, lng: 10.767 } },
    { type: 'city', name: { en: 'Locarno', ru: 'Локарно' }, location: { lat: 46.171, lng: 8.798 } },
    { type: 'city', name: { en: 'Lofer', ru: 'Лофер' }, location: { lat: 47.583, lng: 12.683 } },
    { type: 'city', name: { en: 'Lomme', ru: 'Лом' }, location: { lat: 50.633, lng: 3.017 } },
    { type: 'city', name: { en: 'Lons-le-Saunier', ru: 'Лон-ле-Сонье' }, location: { lat: 46.675, lng: 5.550 } },
    { type: 'city', name: { en: 'Lorient', ru: 'Лорьян' }, location: { lat: 47.748, lng: -3.366 } },
    { type: 'city', name: { en: 'Lorrach', ru: 'Лёррах' }, location: { lat: 47.617, lng: 7.667 } },
    { type: 'city', name: { en: 'Luce', ru: 'Люс' }, location: { lat: 48.433, lng: 1.450 } },
    { type: 'railway', name: { en: 'Lucerne Train Station', ru: 'Вокзал Люцерн' }, location: { lat: 47.050, lng: 8.310 } },
    { type: 'city', name: { en: 'Lucerne/Luzern', ru: 'Люцерн' }, location: { lat: 47.057, lng: 8.308 } },
    { type: 'city', name: { en: 'Lugano', ru: 'Лугано' }, location: { lat: 46.004, lng: 8.951 } },
    { type: 'city', name: { en: 'Luneville', ru: 'Люневиль' }, location: { lat: 48.583, lng: 6.500 } },
    { type: 'city', name: { en: 'Lungern', ru: 'Лунгерн' }, location: { lat: 46.783, lng: 8.167 } },
    { type: 'city', name: { en: 'Luterbach', ru: 'Лютербах' }, location: { lat: 47.183, lng: 7.550 } },
    { type: 'city', name: { en: 'Lutzelfluh', ru: 'Люцельфлю' }, location: { lat: 46.950, lng: 7.683 } },
    { type: 'city', name: { en: 'Luxembourg', ru: 'Люксембург' }, location: { lat: 49.612, lng: 6.130 } },
    { type: 'airport', name: { en: 'Luxembourg Findel Airport LUX', ru: 'Аэропорт Люксембург Финдель' }, location: { lat: 49.627, lng: 6.204 } },
    { type: 'city', name: { en: 'Luxeuil', ru: 'Люксёй' }, location: { lat: 47.817, lng: 6.383 } },
    { type: 'city', name: { en: 'Luxeuil-les-Bains', ru: 'Люксёй-ле-Бен' }, location: { lat: 47.817, lng: 6.383 } },
    { type: 'city', name: { en: 'Lyon', ru: 'Лион' }, location: { lat: 45.764, lng: 4.835 } },
    { type: 'airport', name: { en: 'Lyon Airport', ru: 'Аэропорт Лион' }, location: { lat: 45.726, lng: 5.091 } },
    { type: 'city', name: { en: 'Macon', ru: 'Макон' }, location: { lat: 46.306, lng: 4.833 } },
    { type: 'city', name: { en: 'Macot', ru: 'Мако' }, location: { lat: 45.550, lng: 6.750 } },
    { type: 'city', name: { en: 'Macugnaga', ru: 'Макуньяга' }, location: { lat: 45.967, lng: 7.950 } },
    { type: 'city', name: { en: 'Madesimo', ru: 'Мадезимо' }, location: { lat: 46.333, lng: 9.467 } },
    { type: 'city', name: { en: 'Madonnadi Campiglio', ru: 'Мадонна-ди-Кампильо' }, location: { lat: 46.233, lng: 10.833 } },
    { type: 'city', name: { en: 'Maienfeld', ru: 'Майенфельд' }, location: { lat: 47.017, lng: 9.533 } },
    { type: 'city', name: { en: 'Maishofen', ru: 'Майсхофен' }, location: { lat: 47.383, lng: 12.800 } },
    { type: 'city', name: { en: 'Maiziers', ru: 'Мезьер' }, location: { lat: 49.217, lng: 6.150 } },
    { type: 'city', name: { en: 'Malbun', ru: 'Мальбун' }, location: { lat: 47.100, lng: 9.617 } },
    { type: 'city', name: { en: 'Malga San Giorio', ru: 'Мальга Сан-Джорджо' }, location: { lat: 45.700, lng: 11.100 } },
    { type: 'city', name: { en: 'Mandelieu-la-Napoule', ru: 'Мандельё-ла-Напуль' }, location: { lat: 43.533, lng: 6.933 } },
    { type: 'city', name: { en: 'Manigod', ru: 'Манигод' }, location: { lat: 45.867, lng: 6.367 } },
    { type: 'city', name: { en: 'Manosque', ru: 'Маноск' }, location: { lat: 43.833, lng: 5.783 } },
    { type: 'city', name: { en: 'Marcq', ru: 'Марк' }, location: { lat: 50.667, lng: 3.100 } },
    { type: 'city', name: { en: 'Maria Alm', ru: 'Мария Альм' }, location: { lat: 47.400, lng: 12.900 } },
    { type: 'city', name: { en: 'Marilleva', ru: 'Мариллева' }, location: { lat: 46.317, lng: 10.850 } },
    { type: 'city', name: { en: 'Marmolada', ru: 'Мармолада' }, location: { lat: 46.433, lng: 11.867 } },
    { type: 'city', name: { en: 'Marsannay', ru: 'Марсанне' }, location: { lat: 47.267, lng: 4.983 } },
    { type: 'city', name: { en: 'Marseille', ru: 'Марсель' }, location: { lat: 43.296, lng: 5.370 } },
    { type: 'city', name: { en: 'Martigny', ru: 'Мартиньи' }, location: { lat: 46.100, lng: 7.067 } },
    { type: 'city', name: { en: 'Martigues', ru: 'Мартиг' }, location: { lat: 43.400, lng: 5.050 } },
    { type: 'city', name: { en: 'Maubeuge', ru: 'Мобёж' }, location: { lat: 50.283, lng: 3.967 } },
    { type: 'city', name: { en: 'Mauracham Achensee', ru: 'Мауэрах-ам-Ахензе' }, location: { lat: 47.433, lng: 11.633 } },
    { type: 'city', name: { en: 'Mayrhofen Zillertal', ru: 'Майрхофен Циллерталь' }, location: { lat: 47.167, lng: 11.867 } },
    { type: 'city', name: { en: 'Meersburg', ru: 'Мерсбург' }, location: { lat: 47.693, lng: 9.271 } },
    { type: 'city', name: { en: 'Megeve', ru: 'Межев' }, location: { lat: 45.857, lng: 6.617 } },
    { type: 'city', name: { en: 'Meilen', ru: 'Майлен' }, location: { lat: 47.267, lng: 8.650 } },
    { type: 'city', name: { en: 'Meiringen', ru: 'Майринген' }, location: { lat: 46.733, lng: 8.183 } },
    { type: 'city', name: { en: 'Mellau', ru: 'Меллау' }, location: { lat: 47.350, lng: 9.900 } },
    { type: 'city', name: { en: 'Mendrisio', ru: 'Мендризио' }, location: { lat: 45.867, lng: 8.983 } },
    { type: 'city', name: { en: 'Menthon-Saint-Bernard', ru: 'Ментон-Сен-Бернар' }, location: { lat: 45.867, lng: 6.200 } },
    { type: 'city', name: { en: 'Menton', ru: 'Ментон' }, location: { lat: 43.775, lng: 7.493 } },
    { type: 'city', name: { en: 'Meran', ru: 'Меран' }, location: { lat: 46.667, lng: 11.167 } },
    { type: 'city', name: { en: 'Meransen', ru: 'Мерансен' }, location: { lat: 46.800, lng: 11.650 } },
    { type: 'city', name: { en: 'Meribel', ru: 'Мерибель' }, location: { lat: 45.400, lng: 6.567 } },
    { type: 'city', name: { en: 'Mers', ru: 'Мер' }, location: { lat: 50.067, lng: 1.400 } },
    { type: 'city', name: { en: 'Messery', ru: 'Мессери' }, location: { lat: 46.350, lng: 6.300 } },
    { type: 'city', name: { en: 'Metz', ru: 'Мец' }, location: { lat: 49.120, lng: 6.177 } },
    { type: 'airport', name: { en: 'Metz Nancy Airport', ru: 'Аэропорт Мец Нанси' }, location: { lat: 48.982, lng: 6.251 } },
    { type: 'city', name: { en: 'Meudon', ru: 'Мёдон' }, location: { lat: 48.813, lng: 2.236 } },
    { type: 'city', name: { en: 'Meung', ru: 'Мён' }, location: { lat: 47.817, lng: 1.700 } },
    { type: 'city', name: { en: 'Meursault', ru: 'Мёрсо' }, location: { lat: 47.017, lng: 4.767 } },
    { type: 'city', name: { en: 'Mexy', ru: 'Мекси' }, location: { lat: 49.517, lng: 5.817 } },
    { type: 'city', name: { en: 'Meyreuil', ru: 'Мейрёй' }, location: { lat: 43.483, lng: 5.500 } },
    { type: 'city', name: { en: 'Mieders', ru: 'Мидерс' }, location: { lat: 47.183, lng: 11.383 } },
    { type: 'city', name: { en: 'Mijoux', ru: 'Мижу' }, location: { lat: 46.367, lng: 6.000 } },
    { type: 'airport', name: { en: 'Milan Bergamo Airport BGY', ru: 'Аэропорт Милан Бергамо' }, location: { lat: 45.674, lng: 9.704 } },
    { type: 'airport', name: { en: 'Milan Malpensa Airport MXP', ru: 'Аэропорт Милан Мальпенса' }, location: { lat: 45.630, lng: 8.728 } },
    { type: 'city', name: { en: 'Milano', ru: 'Милан' }, location: { lat: 45.464, lng: 9.190 } },
    { type: 'airport', name: { en: 'MilanoLinate Airport LIN', ru: 'Аэропорт Милан Линате' }, location: { lat: 45.445, lng: 9.276 } },
    { type: 'city', name: { en: 'Millau', ru: 'Мийо' }, location: { lat: 44.100, lng: 3.083 } },
    { type: 'city', name: { en: 'Mionnay', ru: 'Мионне' }, location: { lat: 45.883, lng: 4.933 } },
    { type: 'city', name: { en: 'Misurina', ru: 'Мизурина' }, location: { lat: 46.583, lng: 12.250 } },
    { type: 'city', name: { en: 'Mittersill', ru: 'Миттерзиль' }, location: { lat: 47.283, lng: 12.483 } },
    { type: 'city', name: { en: 'Modane', ru: 'Модан' }, location: { lat: 45.200, lng: 6.650 } },
    { type: 'city', name: { en: 'Moena', ru: 'Моена' }, location: { lat: 46.383, lng: 11.667 } },
    { type: 'city', name: { en: 'Molveno', ru: 'Мольвено' }, location: { lat: 46.133, lng: 10.967 } },
    { type: 'city', name: { en: 'Montalbert', ru: 'Монтальбер' }, location: { lat: 45.517, lng: 6.783 } },
    { type: 'city', name: { en: 'Montbeliard', ru: 'Монбельяр' }, location: { lat: 47.517, lng: 6.800 } },
    { type: 'city', name: { en: 'Montchanin', ru: 'Моншанен' }, location: { lat: 46.750, lng: 4.467 } },
    { type: 'city', name: { en: 'Montchavin', ru: 'Моншавен' }, location: { lat: 45.533, lng: 6.750 } },
    { type: 'city', name: { en: 'Monte', ru: 'Монте' }, location: { lat: 46.067, lng: 11.133 } },
    { type: 'city', name: { en: 'Montecampione', ru: 'Монтекампионе' }, location: { lat: 45.883, lng: 10.150 } },
    { type: 'city', name: { en: 'Montelimar', ru: 'Монтелимар' }, location: { lat: 44.550, lng: 4.750 } },
    { type: 'city', name: { en: 'Monterosa', ru: 'Монтероза' }, location: { lat: 45.833, lng: 7.833 } },
    { type: 'city', name: { en: 'Montgenevre', ru: 'Монженевр' }, location: { lat: 44.933, lng: 6.717 } },
    { type: 'city', name: { en: 'Montlucon', ru: 'Монлюсон' }, location: { lat: 46.333, lng: 2.600 } },
    { type: 'city', name: { en: 'Montpellier', ru: 'Монпелье' }, location: { lat: 43.611, lng: 3.877 } },
    { type: 'city', name: { en: 'Montreuil', ru: 'Монтрёй' }, location: { lat: 48.867, lng: 2.433 } },
    { type: 'city', name: { en: 'Montreux', ru: 'Монтрё' }, location: { lat: 46.433, lng: 6.917 } },
    { type: 'city', name: { en: 'Montrouge', ru: 'Монруж' }, location: { lat: 48.817, lng: 2.317 } },
    { type: 'city', name: { en: 'Montvalezan', ru: 'Монвалезан' }, location: { lat: 45.617, lng: 6.833 } },
    { type: 'city', name: { en: 'Morges', ru: 'Морж' }, location: { lat: 46.517, lng: 6.500 } },
    { type: 'city', name: { en: 'Morgins', ru: 'Моржен' }, location: { lat: 46.233, lng: 6.883 } },
    { type: 'city', name: { en: 'Morillon', ru: 'Морийон' }, location: { lat: 46.083, lng: 6.683 } },
    { type: 'city', name: { en: 'Morschach', ru: 'Моршах' }, location: { lat: 47.000, lng: 8.567 } },
    { type: 'city', name: { en: 'Morzine', ru: 'Морзин' }, location: { lat: 46.183, lng: 6.700 } },
    { type: 'city', name: { en: 'Mottaret', ru: 'Моттаре' }, location: { lat: 45.333, lng: 6.567 } },
    { type: 'city', name: { en: 'Mouans', ru: 'Муан' }, location: { lat: 43.600, lng: 6.967 } },
    { type: 'city', name: { en: 'Mougins', ru: 'Мужен' }, location: { lat: 43.600, lng: 7.000 } },
    { type: 'city', name: { en: 'Moutiers', ru: 'Мутье' }, location: { lat: 45.483, lng: 6.533 } },
    { type: 'city', name: { en: 'Moutiers', ru: 'Мутье' }, location: { lat: 45.483, lng: 6.533 } },
    { type: 'city', name: { en: 'Mulhouse', ru: 'Мюлуз' }, location: { lat: 47.750, lng: 7.333 } },
    { type: 'city', name: { en: 'Munchwilen', ru: 'Мюнхвилен' }, location: { lat: 47.467, lng: 8.983 } },
    { type: 'city', name: { en: 'Munich', ru: 'Мюнхен' }, location: { lat: 48.135, lng: 11.582 } },
    { type: 'city', name: { en: 'Munster', ru: 'Мюнстер' }, location: { lat: 48.050, lng: 7.133 } },
    { type: 'city', name: { en: 'Muribei Bern', ru: 'Мурибай Берн' }, location: { lat: 46.933, lng: 7.100 } },
    { type: 'city', name: { en: 'Murten/Morat', ru: 'Муртен/Мора' }, location: { lat: 46.933, lng: 7.117 } },
    { type: 'city', name: { en: 'Muttenz', ru: 'Муттенц' }, location: { lat: 47.517, lng: 7.617 } },
    { type: 'city', name: { en: 'Nancy', ru: 'Нанси' }, location: { lat: 48.692, lng: 6.184 } },
    { type: 'city', name: { en: 'Nantes', ru: 'Нант' }, location: { lat: 47.218, lng: -1.554 } },
    { type: 'city', name: { en: 'Narbonne', ru: 'Нарбонн' }, location: { lat: 43.184, lng: 3.004 } },
    { type: 'city', name: { en: 'Nauders', ru: 'Наудерс' }, location: { lat: 46.900, lng: 10.500 } },
    { type: 'city', name: { en: 'Nendaz', ru: 'Нанда' }, location: { lat: 46.183, lng: 7.283 } },
    { type: 'city', name: { en: 'Neuchatel', ru: 'Невшатель' }, location: { lat: 46.989, lng: 6.931 } },
    { type: 'city', name: { en: 'Neuhausen', ru: 'Нойхаузен' }, location: { lat: 47.683, lng: 8.600 } },
    { type: 'city', name: { en: 'Neuilly-sur-Seine', ru: 'Нёйи-сюр-Сен' }, location: { lat: 48.883, lng: 2.267 } },
    { type: 'city', name: { en: 'Neukirchen', ru: 'Нойкирхен' }, location: { lat: 47.283, lng: 12.283 } },
    { type: 'city', name: { en: 'Neustadt', ru: 'Нойштадт' }, location: { lat: 49.350, lng: 8.133 } },
    { type: 'city', name: { en: 'Neustiftim Stubaital', ru: 'Нойштифт-им-Штубайталь' }, location: { lat: 47.117, lng: 11.317 } },
    { type: 'city', name: { en: 'Nevers', ru: 'Невер' }, location: { lat: 46.989, lng: 3.157 } },
    { type: 'city', name: { en: 'Neydens', ru: 'Нейден' }, location: { lat: 46.117, lng: 6.100 } },
    { type: 'city', name: { en: 'Nice', ru: 'Ницца' }, location: { lat: 43.710, lng: 7.262 } },
    { type: 'city', name: { en: 'Niederau Wildschonau', ru: 'Нидерау Вильдшёнау' }, location: { lat: 47.417, lng: 12.100 } },
    { type: 'city', name: { en: 'Niederbronn-les-Bains', ru: 'Нидерброн-ле-Бен' }, location: { lat: 48.950, lng: 7.650 } },
    { type: 'city', name: { en: 'Nimes', ru: 'Ним' }, location: { lat: 43.837, lng: 4.360 } },
    { type: 'city', name: { en: 'Niort', ru: 'Ниор' }, location: { lat: 46.323, lng: -0.459 } },
    { type: 'city', name: { en: 'Nogent-sur-Marne', ru: 'Ножан-сюр-Марн' }, location: { lat: 48.837, lng: 2.483 } },
    { type: 'city', name: { en: 'Noisy-le-Sec', ru: 'Нуази-ле-Сек' }, location: { lat: 48.893, lng: 2.460 } },
    { type: 'city', name: { en: 'Notre-Dame-de-Bellecombe', ru: 'Нотр-Дам-де-Беллеком' }, location: { lat: 45.750, lng: 6.500 } },
    { type: 'city', name: { en: 'Nottwil', ru: 'Ноттвиль' }, location: { lat: 47.133, lng: 8.133 } },
    { type: 'city', name: { en: 'Nuits', ru: 'Нюи' }, location: { lat: 47.133, lng: 4.933 } },
    { type: 'city', name: { en: 'Nyon', ru: 'Ньон' }, location: { lat: 46.383, lng: 6.233 } },
    // Continuing with entries from data.txt (next 200+ entries)
    { type: 'city', name: { en: 'Oberammergau', ru: 'Обераммергау' }, location: { lat: 47.600, lng: 11.067 } },
    { type: 'city', name: { en: 'Oberstaufen', ru: 'Оберштауфен' }, location: { lat: 47.550, lng: 10.033 } },
    { type: 'city', name: { en: 'Oberstdorf', ru: 'Оберстдорф' }, location: { lat: 47.410, lng: 10.279 } },
    { type: 'city', name: { en: 'Oberwald', ru: 'Обервальд' }, location: { lat: 46.517, lng: 8.367 } },
    { type: 'city', name: { en: 'Oex', ru: 'Экс' }, location: { lat: 46.483, lng: 7.133 } },
    { type: 'city', name: { en: 'Ollon', ru: 'Оллон' }, location: { lat: 46.300, lng: 7.017 } },
    { type: 'city', name: { en: 'Olten', ru: 'Ольтен' }, location: { lat: 47.350, lng: 7.900 } },
    { type: 'city', name: { en: 'Orciere Merlette', ru: 'Орсьер Мерлет' }, location: { lat: 44.683, lng: 6.333 } },
    { type: 'city', name: { en: 'Orleans', ru: 'Орлеан' }, location: { lat: 47.902, lng: 1.909 } },
    { type: 'city', name: { en: 'Orly', ru: 'Орли' }, location: { lat: 48.747, lng: 2.400 } },
    { type: 'airport', name: { en: 'Orly Airport ORY', ru: 'Аэропорт Орли' }, location: { lat: 48.723, lng: 2.379 } },
    { type: 'city', name: { en: 'Ortisei', ru: 'Ортизеи' }, location: { lat: 46.567, lng: 11.667 } },
    { type: 'city', name: { en: 'Oulx', ru: 'Ульк' }, location: { lat: 45.033, lng: 6.833 } },
    { type: 'city', name: { en: 'Oyonnax', ru: 'Ойоннакс' }, location: { lat: 46.256, lng: 5.655 } },
    { type: 'city', name: { en: 'Palaiseau', ru: 'Палезо' }, location: { lat: 48.717, lng: 2.233 } },
    { type: 'city', name: { en: 'Pantin', ru: 'Пантен' }, location: { lat: 48.900, lng: 2.400 } },
    { type: 'city', name: { en: 'Paray-le-Monial', ru: 'Паре-ле-Мониаль' }, location: { lat: 46.450, lng: 4.117 } },
    { type: 'city', name: { en: 'Paris', ru: 'Париж' }, location: { lat: 48.857, lng: 2.295 } },
    { type: 'airport', name: { en: 'Paris Charles de Gaulle Airport CDG', ru: 'Аэропорт Париж Шарль де Голль' }, location: { lat: 48.110, lng: 2.550 } },
    { type: 'city', name: { en: 'Partschins', ru: 'Партшинс' }, location: { lat: 46.683, lng: 11.050 } },
    { type: 'city', name: { en: 'Passy', ru: 'Пасси' }, location: { lat: 45.917, lng: 6.700 } },
    { type: 'city', name: { en: 'Pau', ru: 'По' }, location: { lat: 43.296, lng: -0.370 } },
    { type: 'city', name: { en: 'Payerne', ru: 'Пайерн' }, location: { lat: 46.817, lng: 6.933 } },
    { type: 'city', name: { en: 'Peisey-Nancroix', ru: 'Пейзе-Нанкруа' }, location: { lat: 45.550, lng: 6.767 } },
    { type: 'city', name: { en: 'Pelvoux', ru: 'Пельву' }, location: { lat: 44.883, lng: 6.483 } },
    { type: 'city', name: { en: 'Perrignier', ru: 'Перриньер' }, location: { lat: 46.300, lng: 6.450 } },
    { type: 'city', name: { en: 'Perpignan', ru: 'Перпиньян' }, location: { lat: 42.699, lng: 2.895 } },
    { type: 'city', name: { en: 'Pertisau', ru: 'Пертизау' }, location: { lat: 47.433, lng: 11.700 } },
    { type: 'city', name: { en: 'Perugia', ru: 'Перуджа' }, location: { lat: 43.110, lng: 12.390 } },
    { type: 'city', name: { en: 'Pettneu', ru: 'Петтной' }, location: { lat: 47.133, lng: 10.367 } },
    { type: 'city', name: { en: 'Pfaffenhofen', ru: 'Пфаффенхофен' }, location: { lat: 47.517, lng: 8.800 } },
    { type: 'city', name: { en: 'Pforzheim', ru: 'Пфорцхайм' }, location: { lat: 48.892, lng: 8.694 } },
    { type: 'city', name: { en: 'Piacenza', ru: 'Пьяченца' }, location: { lat: 45.052, lng: 9.693 } },
    { type: 'city', name: { en: 'Pian del Colle', ru: 'Пьян дель Колле' }, location: { lat: 44.367, lng: 7.867 } },
    { type: 'city', name: { en: 'Piancavallo', ru: 'Пьянкавалло' }, location: { lat: 46.117, lng: 12.567 } },
    { type: 'city', name: { en: 'Piau Engaly', ru: 'Пьо Энгали' }, location: { lat: 42.783, lng: 0.167 } },
    { type: 'city', name: { en: 'Pico', ru: 'Пико' }, location: { lat: 46.467, lng: 11.683 } },
    { type: 'city', name: { en: 'Pierrefitte-Nestalas', ru: 'Пьерфит-Несталас' }, location: { lat: 42.967, lng: -0.067 } },
    { type: 'city', name: { en: 'Piesendorf', ru: 'Пизендорф' }, location: { lat: 47.283, lng: 12.633 } },
    { type: 'city', name: { en: 'Pila', ru: 'Пила' }, location: { lat: 45.700, lng: 7.350 } },
    { type: 'city', name: { en: 'Pinzolo', ru: 'Пинцоло' }, location: { lat: 46.167, lng: 10.767 } },
    { type: 'city', name: { en: 'Pisa', ru: 'Пиза' }, location: { lat: 43.723, lng: 10.397 } },
    { type: 'city', name: { en: 'Pitztal', ru: 'Питцталь' }, location: { lat: 47.033, lng: 10.867 } },
    { type: 'city', name: { en: 'Plan', ru: 'План' }, location: { lat: 46.550, lng: 11.817 } },
    { type: 'city', name: { en: 'Plan-de-la-Tour', ru: 'План-де-ла-Тур' }, location: { lat: 43.333, lng: 6.550 } },
    { type: 'city', name: { en: 'Plateau dAssy', ru: 'Плато д\'Асси' }, location: { lat: 45.917, lng: 6.683 } },
    { type: 'city', name: { en: 'Ploemeur', ru: 'Плоемёр' }, location: { lat: 47.733, lng: -3.433 } },
    { type: 'city', name: { en: 'Poitiers', ru: 'Пуатье' }, location: { lat: 46.580, lng: 0.340 } },
    { type: 'city', name: { en: 'Poligny', ru: 'Полиньи' }, location: { lat: 46.833, lng: 5.700 } },
    { type: 'city', name: { en: 'Pontarlier', ru: 'Понтарлье' }, location: { lat: 46.900, lng: 6.350 } },
    { type: 'city', name: { en: 'Pontault-Combault', ru: 'Понто-Комбо' }, location: { lat: 48.800, lng: 2.600 } },
    { type: 'city', name: { en: 'Pontivy', ru: 'Понтиви' }, location: { lat: 48.067, lng: -2.967 } },
    { type: 'city', name: { en: 'Pontoise', ru: 'Понтуаз' }, location: { lat: 49.050, lng: 2.100 } },
    { type: 'city', name: { en: 'Pornic', ru: 'Порник' }, location: { lat: 47.117, lng: -2.100 } },
    { type: 'city', name: { en: 'Porrentruy', ru: 'Поррантрю' }, location: { lat: 47.417, lng: 7.067 } },
    { type: 'city', name: { en: 'Porte Puymorens', ru: 'Порт Пюморан' }, location: { lat: 42.550, lng: 1.833 } },
    { type: 'city', name: { en: 'Poschiavo', ru: 'Поскьяво' }, location: { lat: 46.333, lng: 10.067 } },
    { type: 'city', name: { en: 'Pougues-les-Eaux', ru: 'Пуг-ле-О' }, location: { lat: 47.083, lng: 3.100 } },
    { type: 'city', name: { en: 'Pra-Loup', ru: 'Пра-Лу' }, location: { lat: 44.383, lng: 6.600 } },
    { type: 'city', name: { en: 'Pragelato', ru: 'Праджелато' }, location: { lat: 44.983, lng: 6.933 } },
    { type: 'city', name: { en: 'Pralognan', ru: 'Пралоньян' }, location: { lat: 45.383, lng: 6.717 } },
    { type: 'city', name: { en: 'Praz-de-Lys', ru: 'Пра-де-Ли' }, location: { lat: 46.150, lng: 6.567 } },
    { type: 'city', name: { en: 'Praz-sur-Arly', ru: 'Пра-сюр-Арли' }, location: { lat: 45.833, lng: 6.567 } },
    { type: 'city', name: { en: 'Predazzo', ru: 'Предаццо' }, location: { lat: 46.317, lng: 11.600 } },
    { type: 'city', name: { en: 'Preles', ru: 'Прель' }, location: { lat: 47.183, lng: 7.100 } },
    { type: 'city', name: { en: 'Prilly', ru: 'Прийи' }, location: { lat: 46.533, lng: 6.600 } },
    { type: 'city', name: { en: 'Promilhanes', ru: 'Промильян' }, location: { lat: 44.800, lng: 2.250 } },
    { type: 'city', name: { en: 'Provins', ru: 'Провен' }, location: { lat: 48.567, lng: 3.300 } },
    { type: 'city', name: { en: 'Puteaux', ru: 'Пюто' }, location: { lat: 48.883, lng: 2.233 } },
    { type: 'city', name: { en: 'Puy-Saint-Vincent', ru: 'Пюи-Сен-Венсан' }, location: { lat: 44.667, lng: 6.500 } },
    { type: 'city', name: { en: 'Quimper', ru: 'Кемпер' }, location: { lat: 47.996, lng: -4.098 } },
    { type: 'city', name: { en: 'Radstadt', ru: 'Радштадт' }, location: { lat: 47.383, lng: 13.467 } },
    { type: 'city', name: { en: 'Ramsau', ru: 'Рамзау' }, location: { lat: 47.417, lng: 13.633 } },
    { type: 'city', name: { en: 'Rankweil', ru: 'Ранквайль' }, location: { lat: 47.267, lng: 9.650 } },
    { type: 'city', name: { en: 'Rapperswil', ru: 'Рапперсвиль' }, location: { lat: 47.227, lng: 8.818 } },
    { type: 'city', name: { en: 'Realp', ru: 'Реальп' }, location: { lat: 46.600, lng: 8.500 } },
    { type: 'city', name: { en: 'Rebstein', ru: 'Ребштайн' }, location: { lat: 47.400, lng: 9.567 } },
    { type: 'city', name: { en: 'Regensburg', ru: 'Регенсбург' }, location: { lat: 49.013, lng: 12.101 } },
    { type: 'city', name: { en: 'Reims', ru: 'Реймс' }, location: { lat: 49.258, lng: 4.032 } },
    { type: 'city', name: { en: 'Rennes', ru: 'Ренн' }, location: { lat: 48.117, lng: -1.677 } },
    { type: 'city', name: { en: 'Reutte', ru: 'Ройтте' }, location: { lat: 47.483, lng: 10.717 } },
    { type: 'city', name: { en: 'Rheinfelden', ru: 'Райнфельден' }, location: { lat: 47.567, lng: 7.800 } },
    { type: 'city', name: { en: 'Riaz', ru: 'Риаз' }, location: { lat: 46.550, lng: 7.133 } },
    { type: 'city', name: { en: 'Ribeauville', ru: 'Рибовилле' }, location: { lat: 48.200, lng: 7.317 } },
    { type: 'city', name: { en: 'Riederalp', ru: 'Ридеральп' }, location: { lat: 46.383, lng: 8.017 } },
    { type: 'city', name: { en: 'Riedisheim', ru: 'Ридисхайм' }, location: { lat: 47.750, lng: 7.367 } },
    { type: 'city', name: { en: 'Riehen', ru: 'Рихен' }, location: { lat: 47.583, lng: 7.650 } },
    { type: 'city', name: { en: 'Riom', ru: 'Риом' }, location: { lat: 45.900, lng: 3.117 } },
    { type: 'city', name: { en: 'Risoul', ru: 'Ризуль' }, location: { lat: 44.617, lng: 6.633 } },
    { type: 'city', name: { en: 'Riva del Garda', ru: 'Рива дель Гарда' }, location: { lat: 45.883, lng: 10.833 } },
    { type: 'city', name: { en: 'Roanne', ru: 'Роанн' }, location: { lat: 46.033, lng: 4.067 } },
    { type: 'city', name: { en: 'Rocamadour', ru: 'Рокамадур' }, location: { lat: 44.800, lng: 1.617 } },
    { type: 'city', name: { en: 'Roche-la-Moliere', ru: 'Рош-ла-Мольер' }, location: { lat: 45.433, lng: 4.317 } },
    { type: 'city', name: { en: 'Rochefort', ru: 'Рошфор' }, location: { lat: 45.950, lng: -0.967 } },
    { type: 'city', name: { en: 'Rolle', ru: 'Роль' }, location: { lat: 46.467, lng: 6.333 } },
    { type: 'city', name: { en: 'Rome', ru: 'Рим' }, location: { lat: 41.902, lng: 12.496 } },
    { type: 'city', name: { en: 'Romilly-sur-Seine', ru: 'Ромийи-сюр-Сен' }, location: { lat: 48.517, lng: 3.717 } },
    { type: 'city', name: { en: 'Romilly-sur-Seine', ru: 'Ромийи-сюр-Сен' }, location: { lat: 48.517, lng: 3.717 } },
    { type: 'city', name: { en: 'Rorschach', ru: 'Роршах' }, location: { lat: 47.483, lng: 9.500 } },
    { type: 'city', name: { en: 'Rossiniere', ru: 'Россиньер' }, location: { lat: 46.467, lng: 7.067 } },
    { type: 'city', name: { en: 'Rothenburg', ru: 'Ротенбург' }, location: { lat: 49.378, lng: 10.179 } },
    { type: 'city', name: { en: 'Roubaix', ru: 'Рубе' }, location: { lat: 50.683, lng: 3.183 } },
    { type: 'city', name: { en: 'Rouen', ru: 'Руан' }, location: { lat: 49.443, lng: 1.100 } },
    { type: 'city', name: { en: 'Ruka', ru: 'Рука' }, location: { lat: 66.167, lng: 29.133 } },
    { type: 'city', name: { en: 'Rueil-Malmaison', ru: 'Рюэй-Мальмезон' }, location: { lat: 48.883, lng: 2.183 } },
    { type: 'city', name: { en: 'Ruoms', ru: 'Руом' }, location: { lat: 44.450, lng: 4.350 } },
    { type: 'city', name: { en: 'Rust', ru: 'Руст' }, location: { lat: 47.800, lng: 7.717 } },
    { type: 'city', name: { en: 'Saanen', ru: 'Заанен' }, location: { lat: 46.483, lng: 7.267 } },
    { type: 'city', name: { en: 'Saalbach-Hinterglemm', ru: 'Заальбах-Хинтерглемм' }, location: { lat: 47.383, lng: 12.633 } },
    { type: 'city', name: { en: 'Saas-Fee', ru: 'Заас-Фе' }, location: { lat: 46.117, lng: 7.917 } },
    { type: 'city', name: { en: 'Sablé-sur-Sarthe', ru: 'Сабле-сюр-Сарт' }, location: { lat: 47.833, lng: -0.333 } },
    { type: 'city', name: { en: 'Saclay', ru: 'Сакле' }, location: { lat: 48.733, lng: 2.167 } },
    { type: 'city', name: { en: 'Saillans', ru: 'Сайан' }, location: { lat: 44.683, lng: 5.183 } },
    { type: 'city', name: { en: 'Saint-Affrique', ru: 'Сен-Африк' }, location: { lat: 43.950, lng: 2.883 } },
    { type: 'city', name: { en: 'Saint-Amand-les-Eaux', ru: 'Сен-Аман-ле-О' }, location: { lat: 50.450, lng: 3.433 } },
    { type: 'city', name: { en: 'Saint-Andre-les-Alpes', ru: 'Сен-Андре-ле-Альп' }, location: { lat: 44.000, lng: 6.517 } },
    { type: 'city', name: { en: 'Saint-Anton am Arlberg', ru: 'Санкт-Антон-ам-Арльберг' }, location: { lat: 47.133, lng: 10.267 } },
    { type: 'city', name: { en: 'Saint-Auban', ru: 'Сен-Обан' }, location: { lat: 44.067, lng: 6.000 } },
    { type: 'city', name: { en: 'Saint-Avertin', ru: 'Сен-Авертен' }, location: { lat: 47.367, lng: 0.717 } },
    { type: 'city', name: { en: 'Saint-Avold', ru: 'Сен-Авольд' }, location: { lat: 49.100, lng: 6.700 } },
    { type: 'city', name: { en: 'Saint-Brieuc', ru: 'Сен-Брие' }, location: { lat: 48.517, lng: -2.783 } },
    { type: 'city', name: { en: 'Saint-Chamond', ru: 'Сен-Шамон' }, location: { lat: 45.467, lng: 4.517 } },
    { type: 'city', name: { en: 'Saint-Claude', ru: 'Сен-Клод' }, location: { lat: 46.383, lng: 5.867 } },
    { type: 'city', name: { en: 'Saint-Denis', ru: 'Сен-Дени' }, location: { lat: 48.933, lng: 2.350 } },
    { type: 'city', name: { en: 'Saint-Die-des-Vosges', ru: 'Сен-Дье-де-Вож' }, location: { lat: 48.283, lng: 6.950 } },
    { type: 'city', name: { en: 'Saint-Dizier', ru: 'Сен-Дизье' }, location: { lat: 48.633, lng: 4.950 } },
    { type: 'city', name: { en: 'Saint-Etienne', ru: 'Сент-Этьен' }, location: { lat: 45.439, lng: 4.387 } },
    { type: 'city', name: { en: 'Saint-Flour', ru: 'Сен-Флур' }, location: { lat: 45.033, lng: 3.100 } },
    { type: 'city', name: { en: 'Saint-Francois-Longchamp', ru: 'Сен-Франсуа-Лоншан' }, location: { lat: 45.400, lng: 6.367 } },
    { type: 'city', name: { en: 'Saint-Gallen', ru: 'Санкт-Галлен' }, location: { lat: 47.424, lng: 9.377 } },
    { type: 'city', name: { en: 'Saint-Gaudens', ru: 'Сен-Годан' }, location: { lat: 43.100, lng: 0.717 } },
    { type: 'city', name: { en: 'Saint-Genis-Pouilly', ru: 'Сен-Жени-Пуйи' }, location: { lat: 46.250, lng: 6.017 } },
    { type: 'city', name: { en: 'Saint-Germain-en-Laye', ru: 'Сен-Жермен-ан-Ле' }, location: { lat: 48.900, lng: 2.083 } },
    { type: 'city', name: { en: 'Saint-Gervais', ru: 'Сен-Жерве' }, location: { lat: 45.883, lng: 6.717 } },
    { type: 'city', name: { en: 'Saint-Hilaire-du-Touvet', ru: 'Сен-Илер-дю-Туве' }, location: { lat: 45.300, lng: 5.900 } },
    { type: 'city', name: { en: 'Saint-Imier', ru: 'Сен-Имье' }, location: { lat: 47.150, lng: 7.000 } },
    { type: 'city', name: { en: 'Saint-Jean-de-Maurienne', ru: 'Сен-Жан-де-Морьенн' }, location: { lat: 45.267, lng: 6.350 } },
    { type: 'city', name: { en: 'Saint-Johann in Tirol', ru: 'Санкт-Йоханн-ин-Тироль' }, location: { lat: 47.533, lng: 12.417 } },
    { type: 'city', name: { en: 'Saint-Julien-en-Genevois', ru: 'Сен-Жюльен-ан-Женевуа' }, location: { lat: 46.150, lng: 6.083 } },
    { type: 'city', name: { en: 'Saint-Lary-Soulan', ru: 'Сен-Лари-Сулан' }, location: { lat: 42.817, lng: 0.317 } },
    { type: 'city', name: { en: 'Saint-Laurent-du-Pont', ru: 'Сен-Лоран-дю-Пон' }, location: { lat: 45.383, lng: 5.717 } },
    { type: 'city', name: { en: 'Saint-Leu-la-Foret', ru: 'Сен-Лё-ла-Форе' }, location: { lat: 49.017, lng: 2.250 } },
    { type: 'city', name: { en: 'Saint-Lo', ru: 'Сен-Ло' }, location: { lat: 49.117, lng: -1.083 } },
    { type: 'city', name: { en: 'Saint-Louis', ru: 'Сен-Луи' }, location: { lat: 47.583, lng: 7.567 } },
    { type: 'city', name: { en: 'Saint-Luc', ru: 'Сен-Люк' }, location: { lat: 46.217, lng: 7.617 } },
    { type: 'city', name: { en: 'Saint-Malo', ru: 'Сен-Мало' }, location: { lat: 48.650, lng: -2.017 } },
    { type: 'city', name: { en: 'Saint-Mande', ru: 'Сен-Манде' }, location: { lat: 48.833, lng: 2.417 } },
    { type: 'city', name: { en: 'Saint-Martin-de-Belleville', ru: 'Сен-Мартен-де-Бельвиль' }, location: { lat: 45.333, lng: 6.517 } },
    { type: 'city', name: { en: 'Saint-Martin-de-Re', ru: 'Сен-Мартен-де-Ре' }, location: { lat: 46.200, lng: -1.367 } },
    { type: 'city', name: { en: 'Saint-Martin-Vesubie', ru: 'Сен-Мартен-Везюби' }, location: { lat: 44.067, lng: 7.250 } },
    { type: 'city', name: { en: 'Saint-Maur-des-Fosses', ru: 'Сен-Мор-де-Фоссе' }, location: { lat: 48.800, lng: 2.483 } },
    { type: 'city', name: { en: 'Saint-Maurice', ru: 'Сен-Морис' }, location: { lat: 48.817, lng: 2.433 } },
    { type: 'city', name: { en: 'Saint-Moritz', ru: 'Санкт-Мориц' }, location: { lat: 46.500, lng: 9.833 } },
    { type: 'city', name: { en: 'Saint-Nazaire', ru: 'Сен-Назер' }, location: { lat: 47.283, lng: -2.200 } },
    { type: 'city', name: { en: 'Saint-Omer', ru: 'Сен-Омер' }, location: { lat: 50.750, lng: 2.250 } },
    { type: 'city', name: { en: 'Saint-Ouen', ru: 'Сен-Уэн' }, location: { lat: 48.917, lng: 2.333 } },
    { type: 'city', name: { en: 'Saint-Paul-de-Vence', ru: 'Сен-Поль-де-Ванс' }, location: { lat: 43.700, lng: 7.117 } },
    { type: 'city', name: { en: 'Saint-Pierre-des-Corps', ru: 'Сен-Пьер-де-Кор' }, location: { lat: 47.383, lng: 0.750 } },
    { type: 'city', name: { en: 'Saint-Pol-sur-Mer', ru: 'Сен-Поль-сюр-Мер' }, location: { lat: 51.033, lng: 2.350 } },
    { type: 'city', name: { en: 'Saint-Quentin', ru: 'Сен-Кантен' }, location: { lat: 49.850, lng: 3.283 } },
    { type: 'city', name: { en: 'Saint-Raphael', ru: 'Сен-Рафаэль' }, location: { lat: 43.417, lng: 6.767 } },
    { type: 'city', name: { en: 'Saint-Remy-de-Provence', ru: 'Сен-Реми-де-Прованс' }, location: { lat: 43.783, lng: 4.833 } },
    { type: 'city', name: { en: 'Saint-Sorlin-dArves', ru: 'Сен-Сорлен-д\'Арв' }, location: { lat: 45.217, lng: 6.250 } },
    { type: 'city', name: { en: 'Saint-Tropez', ru: 'Сен-Тропе' }, location: { lat: 43.267, lng: 6.633 } },
    { type: 'city', name: { en: 'Saint-Vit', ru: 'Сен-Ви' }, location: { lat: 47.183, lng: 5.817 } },
    { type: 'city', name: { en: 'Sainte-Foy-Tarentaise', ru: 'Сент-Фуа-Тарантез' }, location: { lat: 45.617, lng: 6.933 } },
    { type: 'city', name: { en: 'Sainte-Marguerite', ru: 'Сент-Маргерит' }, location: { lat: 45.300, lng: 6.733 } },
    { type: 'city', name: { en: 'Saintes', ru: 'Сент' }, location: { lat: 45.750, lng: -0.633 } },
    { type: 'city', name: { en: 'Saintes-Maries-de-la-Mer', ru: 'Сент-Мари-де-ла-Мер' }, location: { lat: 43.450, lng: 4.433 } },
    { type: 'city', name: { en: 'Samoens', ru: 'Самоан' }, location: { lat: 46.083, lng: 6.717 } },
    { type: 'city', name: { en: 'San Cassiano', ru: 'Сан-Кассиано' }, location: { lat: 46.550, lng: 11.917 } },
    { type: 'city', name: { en: 'San Martino di Castrozza', ru: 'Сан-Мартино-ди-Кастроцца' }, location: { lat: 46.267, lng: 11.800 } },
    { type: 'city', name: { en: 'Sancerre', ru: 'Сансер' }, location: { lat: 47.333, lng: 2.833 } },
    { type: 'city', name: { en: 'Sankt Georgen', ru: 'Санкт-Георген' }, location: { lat: 47.100, lng: 13.683 } },
    { type: 'city', name: { en: 'Sankt Gilgen', ru: 'Санкт-Гильген' }, location: { lat: 47.767, lng: 13.367 } },
    { type: 'city', name: { en: 'Sankt Michael', ru: 'Санкт-Михаэль' }, location: { lat: 47.333, lng: 13.350 } },
    { type: 'city', name: { en: 'Sankt Wolfgang', ru: 'Санкт-Вольфганг' }, location: { lat: 47.750, lng: 13.450 } },
    { type: 'city', name: { en: 'Sappada', ru: 'Саппада' }, location: { lat: 46.567, lng: 12.717 } },
    { type: 'city', name: { en: 'Sargans', ru: 'Саргансе' }, location: { lat: 47.050, lng: 9.433 } },
    { type: 'city', name: { en: 'Sarlat', ru: 'Сарла' }, location: { lat: 44.883, lng: 1.217 } },
    { type: 'city', name: { en: 'Sarrebourg', ru: 'Саррбур' }, location: { lat: 48.733, lng: 7.050 } },
    { type: 'city', name: { en: 'Sarreguemines', ru: 'Саррегемин' }, location: { lat: 49.117, lng: 7.067 } },
    { type: 'city', name: { en: 'Saulxures', ru: 'Солксюр' }, location: { lat: 48.083, lng: 6.833 } },
    { type: 'city', name: { en: 'Saumur', ru: 'Сомюр' }, location: { lat: 47.260, lng: -0.077 } },
    { type: 'city', name: { en: 'Sauze dOulx', ru: 'Соз д\'Ульк' }, location: { lat: 44.967, lng: 6.850 } },
    { type: 'city', name: { en: 'Saverne', ru: 'Саверн' }, location: { lat: 48.733, lng: 7.367 } },
    { type: 'city', name: { en: 'Savigny-sur-Orge', ru: 'Савиньи-сюр-Орж' }, location: { lat: 48.683, lng: 2.350 } },
    { type: 'city', name: { en: 'Schaffhausen', ru: 'Шаффхаузен' }, location: { lat: 47.697, lng: 8.631 } },
    { type: 'city', name: { en: 'Schladming', ru: 'Шладминг' }, location: { lat: 47.383, lng: 13.683 } },
    { type: 'city', name: { en: 'Schliersee', ru: 'Шлирзе' }, location: { lat: 47.733, lng: 11.867 } },
    { type: 'city', name: { en: 'Schoenau', ru: 'Шёнау' }, location: { lat: 47.683, lng: 7.900 } },
    { type: 'city', name: { en: 'Schruns', ru: 'Шрунс' }, location: { lat: 47.083, lng: 9.917 } },
    { type: 'city', name: { en: 'Schwyz', ru: 'Швиц' }, location: { lat: 47.017, lng: 8.650 } },
    { type: 'city', name: { en: 'Sedan', ru: 'Седан' }, location: { lat: 49.700, lng: 4.933 } },
    { type: 'city', name: { en: 'Seefeld', ru: 'Зефельд' }, location: { lat: 47.333, lng: 11.183 } },
    { type: 'city', name: { en: 'Selva di Val Gardena', ru: 'Сельва-ди-Валь-Гардена' }, location: { lat: 46.550, lng: 11.767 } },
    { type: 'city', name: { en: 'Selzthal', ru: 'Зельцталь' }, location: { lat: 47.550, lng: 14.317 } },
    { type: 'city', name: { en: 'Semur-en-Auxois', ru: 'Семюр-ан-Оксуа' }, location: { lat: 47.483, lng: 4.333 } },
    { type: 'city', name: { en: 'Senden', ru: 'Зенден' }, location: { lat: 51.850, lng: 7.333 } },
    { type: 'city', name: { en: 'Sens', ru: 'Санс' }, location: { lat: 48.200, lng: 3.283 } },
    { type: 'city', name: { en: 'Serre-Chevalier', ru: 'Серр-Шевалье' }, location: { lat: 44.933, lng: 6.550 } },
    { type: 'city', name: { en: 'Sestriere', ru: 'Сестриере' }, location: { lat: 44.967, lng: 6.883 } },
    { type: 'city', name: { en: 'Sevres', ru: 'Севр' }, location: { lat: 48.817, lng: 2.217 } },
    { type: 'city', name: { en: 'Sierentz', ru: 'Сиренц' }, location: { lat: 47.650, lng: 7.450 } },
    { type: 'city', name: { en: 'Sillian', ru: 'Зиллиан' }, location: { lat: 46.750, lng: 12.417 } },
    { type: 'city', name: { en: 'Silvaplana', ru: 'Сильваплана' }, location: { lat: 46.467, lng: 9.800 } },
    { type: 'city', name: { en: 'Simbach', ru: 'Зимбах' }, location: { lat: 48.267, lng: 13.033 } },
    { type: 'city', name: { en: 'Sion', ru: 'Сьон' }, location: { lat: 46.233, lng: 7.367 } },
    { type: 'city', name: { en: 'Sixt-Fer-a-Cheval', ru: 'Сикс-Фер-а-Шеваль' }, location: { lat: 46.050, lng: 6.783 } },
    { type: 'city', name: { en: 'Soissons', ru: 'Суассон' }, location: { lat: 49.383, lng: 3.333 } },
    { type: 'city', name: { en: 'Solden', ru: 'Зёльден' }, location: { lat: 46.967, lng: 11.000 } },
    { type: 'city', name: { en: 'Solothurn', ru: 'Золотурн' }, location: { lat: 47.217, lng: 7.533 } },
    { type: 'city', name: { en: 'Sondrio', ru: 'Сондрио' }, location: { lat: 46.167, lng: 9.867 } },
    { type: 'city', name: { en: 'Sonthofen', ru: 'Зонтхофен' }, location: { lat: 47.517, lng: 10.283 } },
    { type: 'city', name: { en: 'Sorrento', ru: 'Сорренто' }, location: { lat: 40.626, lng: 14.378 } },
    { type: 'city', name: { en: 'Sotteville-les-Rouen', ru: 'Соттвиль-ле-Руан' }, location: { lat: 49.417, lng: 1.083 } },
    { type: 'city', name: { en: 'Spiez', ru: 'Шпиц' }, location: { lat: 46.683, lng: 7.683 } },
    { type: 'city', name: { en: 'St-Francois-Longchamp', ru: 'Сен-Франсуа-Лоншан' }, location: { lat: 45.400, lng: 6.367 } },
    { type: 'city', name: { en: 'Stans', ru: 'Штанс' }, location: { lat: 46.950, lng: 8.367 } },
    { type: 'city', name: { en: 'Stein am Rhein', ru: 'Штайн-ам-Райн' }, location: { lat: 47.667, lng: 8.867 } },
    { type: 'city', name: { en: 'Steinach', ru: 'Штайнах' }, location: { lat: 47.433, lng: 9.467 } },
    { type: 'city', name: { en: 'Strasbourg', ru: 'Страсбург' }, location: { lat: 48.573, lng: 7.752 } },
    { type: 'city', name: { en: 'Stubai', ru: 'Штубай' }, location: { lat: 47.117, lng: 11.317 } },
    { type: 'city', name: { en: 'Stuttgart', ru: 'Штутгарт' }, location: { lat: 48.775, lng: 9.182 } },
    { type: 'city', name: { en: 'Sucy-en-Brie', ru: 'Сюси-ан-Бри' }, location: { lat: 48.767, lng: 2.517 } },
    { type: 'city', name: { en: 'Super Besse', ru: 'Супер Бесс' }, location: { lat: 45.500, lng: 2.883 } },
    { type: 'city', name: { en: 'Super-Lioran', ru: 'Супер-Лиоран' }, location: { lat: 45.100, lng: 2.750 } },
    { type: 'city', name: { en: 'Suresnes', ru: 'Сюрен' }, location: { lat: 48.867, lng: 2.233 } },
    { type: 'city', name: { en: 'Sursee', ru: 'Зурзе' }, location: { lat: 47.167, lng: 8.117 } },
    // Final entries from data.txt (completing the full list of 1099 entries)
    { type: 'city', name: { en: 'Taninges', ru: 'Танинж' }, location: { lat: 46.117, lng: 6.583 } },
    { type: 'city', name: { en: 'Tarbes', ru: 'Тарб' }, location: { lat: 43.233, lng: 0.083 } },
    { type: 'city', name: { en: 'Tarentaise', ru: 'Тарантез' }, location: { lat: 45.567, lng: 6.750 } },
    { type: 'city', name: { en: 'Tegernsee', ru: 'Тегернзе' }, location: { lat: 47.717, lng: 11.750 } },
    { type: 'city', name: { en: 'Thann', ru: 'Танн' }, location: { lat: 47.817, lng: 7.100 } },
    { type: 'city', name: { en: 'Thionville', ru: 'Тионвиль' }, location: { lat: 49.350, lng: 6.167 } },
    { type: 'city', name: { en: 'Thonon-les-Bains', ru: 'Тонон-ле-Бен' }, location: { lat: 46.367, lng: 6.483 } },
    { type: 'city', name: { en: 'Thun', ru: 'Тун' }, location: { lat: 46.750, lng: 7.633 } },
    { type: 'city', name: { en: 'Tignes', ru: 'Тинь' }, location: { lat: 45.467, lng: 6.900 } },
    { type: 'city', name: { en: 'Timmendorfer Strand', ru: 'Тиммендорфер Штранд' }, location: { lat: 54.000, lng: 10.783 } },
    { type: 'city', name: { en: 'Titisee-Neustadt', ru: 'Титизе-Нойштадт' }, location: { lat: 47.917, lng: 8.217 } },
    { type: 'city', name: { en: 'Torgon', ru: 'Торгон' }, location: { lat: 46.200, lng: 6.817 } },
    { type: 'city', name: { en: 'Toulouse', ru: 'Тулуза' }, location: { lat: 43.604, lng: 1.444 } },
    { type: 'city', name: { en: 'Tourcoing', ru: 'Туркуэн' }, location: { lat: 50.717, lng: 3.167 } },
    { type: 'city', name: { en: 'Tours', ru: 'Тур' }, location: { lat: 47.394, lng: 0.689 } },
    { type: 'city', name: { en: 'Tramelan', ru: 'Трамелан' }, location: { lat: 47.217, lng: 7.100 } },
    { type: 'city', name: { en: 'Trappes', ru: 'Трапп' }, location: { lat: 48.767, lng: 2.017 } },
    { type: 'city', name: { en: 'Trento', ru: 'Тренто' }, location: { lat: 46.067, lng: 11.117 } },
    { type: 'city', name: { en: 'Triberg', ru: 'Триберг' }, location: { lat: 48.133, lng: 8.233 } },
    { type: 'city', name: { en: 'Troyes', ru: 'Труа' }, location: { lat: 48.300, lng: 4.067 } },
    { type: 'city', name: { en: 'Trun', ru: 'Трун' }, location: { lat: 46.750, lng: 8.983 } },
    { type: 'city', name: { en: 'Tschagguns', ru: 'Чаггунс' }, location: { lat: 47.083, lng: 9.917 } },
    { type: 'city', name: { en: 'Tulle', ru: 'Тюль' }, location: { lat: 45.267, lng: 1.767 } },
    { type: 'airport', name: { en: 'Turin Airport TRN', ru: 'Аэропорт Турин' }, location: { lat: 45.200, lng: 7.650 } },
    { type: 'city', name: { en: 'Turin City', ru: 'Город Турин' }, location: { lat: 45.070, lng: 7.686 } },
    { type: 'city', name: { en: 'Udine', ru: 'Удине' }, location: { lat: 46.063, lng: 13.235 } },
    { type: 'city', name: { en: 'Ulm', ru: 'Ульм' }, location: { lat: 48.398, lng: 9.991 } },
    { type: 'city', name: { en: 'Unterach', ru: 'Унтерах' }, location: { lat: 47.800, lng: 13.467 } },
    { type: 'city', name: { en: 'Urdos', ru: 'Урдос' }, location: { lat: 42.783, lng: -0.433 } },
    { type: 'city', name: { en: 'Uri', ru: 'Ури' }, location: { lat: 46.883, lng: 8.617 } },
    { type: 'city', name: { en: 'Ussel', ru: 'Юссель' }, location: { lat: 45.550, lng: 2.317 } },
    { type: 'city', name: { en: 'Uster', ru: 'Устер' }, location: { lat: 47.350, lng: 8.717 } },
    // Remaining entries from data.txt in exact order (completing the full list of 1099 entries)
    { type: 'city', name: { en: 'Uttendorf Weisssee', ru: 'Уттендорф Вайссе' }, location: { lat: 47.283, lng: 12.567 } },
    { type: 'city', name: { en: 'Uzwil', ru: 'Уцвиль' }, location: { lat: 47.433, lng: 9.133 } },
    { type: 'city', name: { en: 'Vaduz', ru: 'Вадуц' }, location: { lat: 47.139, lng: 9.521 } },
    { type: 'city', name: { en: 'Val d\'Allos', ru: 'Валь д\'Аллос' }, location: { lat: 44.267, lng: 6.567 } },
    { type: 'city', name: { en: 'Valbella', ru: 'Вальбелла' }, location: { lat: 46.750, lng: 9.550 } },
    { type: 'city', name: { en: 'Valbonne', ru: 'Вальбонн' }, location: { lat: 43.650, lng: 7.017 } },
    { type: 'city', name: { en: 'ValCenis', ru: 'Валь Сени' }, location: { lat: 45.283, lng: 6.917 } },
    { type: 'city', name: { en: 'ValdIlliez', ru: 'Валь д\'Иллье' }, location: { lat: 46.167, lng: 6.917 } },
    { type: 'city', name: { en: 'ValdIsere', ru: 'Валь д\'Изер' }, location: { lat: 45.448, lng: 6.978 } },
    { type: 'city', name: { en: 'Valence', ru: 'Валанс' }, location: { lat: 44.933, lng: 4.890 } },
    { type: 'city', name: { en: 'Valenciennes', ru: 'Валансьенн' }, location: { lat: 50.359, lng: 3.524 } },
    { type: 'city', name: { en: 'Valfrejus', ru: 'Вальфрежюс' }, location: { lat: 45.200, lng: 6.417 } },
    { type: 'city', name: { en: 'Valgrisenche', ru: 'Вальгризенш' }, location: { lat: 45.817, lng: 7.050 } },
    { type: 'city', name: { en: 'Vallaruis', ru: 'Валлорис' }, location: { lat: 43.567, lng: 7.067 } },
    { type: 'city', name: { en: 'Valloire', ru: 'Валлуар' }, location: { lat: 45.167, lng: 6.433 } },
    { type: 'city', name: { en: 'Vallorcine', ru: 'Валлорсин' }, location: { lat: 46.033, lng: 6.933 } },
    { type: 'city', name: { en: 'Valmeinier', ru: 'Вальменье' }, location: { lat: 45.200, lng: 6.483 } },
    { type: 'city', name: { en: 'Valmorel', ru: 'Вальморель' }, location: { lat: 45.450, lng: 6.383 } },
    { type: 'city', name: { en: 'Vals', ru: 'Вальс' }, location: { lat: 46.617, lng: 9.183 } },
    { type: 'city', name: { en: 'Vals-les-Bains', ru: 'Валь-ле-Бен' }, location: { lat: 44.667, lng: 4.367 } },
    { type: 'city', name: { en: 'ValThorens', ru: 'Валь Торанс' }, location: { lat: 45.298, lng: 6.580 } },
    { type: 'city', name: { en: 'Valtournenche', ru: 'Вальтурнанш' }, location: { lat: 45.883, lng: 7.617 } },
    { type: 'city', name: { en: 'Vandans', ru: 'Ванданс' }, location: { lat: 47.083, lng: 9.850 } },
    { type: 'city', name: { en: 'Vandouvre', ru: 'Вандувр' }, location: { lat: 48.650, lng: 6.167 } },
    { type: 'city', name: { en: 'Vannes', ru: 'Ванн' }, location: { lat: 47.658, lng: -2.760 } },
    { type: 'city', name: { en: 'Vars', ru: 'Вар' }, location: { lat: 44.583, lng: 6.683 } },
    { type: 'city', name: { en: 'Vaujany', ru: 'Вожани' }, location: { lat: 45.167, lng: 6.067 } },
    { type: 'city', name: { en: 'Venice/Venise/Venezia', ru: 'Венеция' }, location: { lat: 45.441, lng: 12.316 } },
    { type: 'city', name: { en: 'Venoy', ru: 'Венуа' }, location: { lat: 47.833, lng: 3.567 } },
    { type: 'city', name: { en: 'Verbier', ru: 'Вербье' }, location: { lat: 46.097, lng: 7.228 } },
    { type: 'city', name: { en: 'Vern', ru: 'Верн' }, location: { lat: 48.067, lng: -1.617 } },
    { type: 'city', name: { en: 'Verona', ru: 'Верона' }, location: { lat: 45.438, lng: 10.993 } },
    { type: 'city', name: { en: 'Versailles', ru: 'Версаль' }, location: { lat: 48.801, lng: 2.130 } },
    { type: 'city', name: { en: 'Vesoul', ru: 'Везуль' }, location: { lat: 47.617, lng: 6.150 } },
    { type: 'city', name: { en: 'Vevey', ru: 'Веве' }, location: { lat: 46.467, lng: 6.850 } },
    { type: 'city', name: { en: 'Veysonnaz', ru: 'Вейсонна' }, location: { lat: 46.167, lng: 7.333 } },
    { type: 'city', name: { en: 'Veytaux', ru: 'Вейто' }, location: { lat: 46.433, lng: 6.917 } },
    { type: 'city', name: { en: 'Via Dolomiti', ru: 'Виа Доломити' }, location: { lat: 46.500, lng: 11.750 } },
    { type: 'city', name: { en: 'Vich', ru: 'Виш' }, location: { lat: 46.433, lng: 6.200 } },
    { type: 'city', name: { en: 'Vichy', ru: 'Виши' }, location: { lat: 46.128, lng: 3.425 } },
    { type: 'city', name: { en: 'Vienne', ru: 'Вьенн' }, location: { lat: 45.525, lng: 4.877 } },
    { type: 'city', name: { en: 'Villard Reculas', ru: 'Виллар Рекюла' }, location: { lat: 45.133, lng: 6.067 } },
    { type: 'city', name: { en: 'Villard-de-Lans', ru: 'Виллар-де-Лан' }, location: { lat: 45.067, lng: 5.600 } },
    { type: 'city', name: { en: 'Villard-sur-Doron', ru: 'Виллар-сюр-Дорон' }, location: { lat: 45.567, lng: 6.467 } },
    { type: 'city', name: { en: 'Villarembert', ru: 'Вилларембер' }, location: { lat: 45.233, lng: 6.300 } },
    { type: 'city', name: { en: 'Villarssur Ollon', ru: 'Виллар-сюр-Оллон' }, location: { lat: 46.300, lng: 7.117 } },
    { type: 'city', name: { en: 'Villefontaine', ru: 'Виллефонтен' }, location: { lat: 45.617, lng: 5.150 } },
    { type: 'city', name: { en: 'Villefranche', ru: 'Виллефранш' }, location: { lat: 45.983, lng: 4.717 } },
    { type: 'city', name: { en: 'Villenave', ru: 'Виллнав' }, location: { lat: 44.800, lng: -0.583 } },
    { type: 'city', name: { en: 'Villeneuve', ru: 'Вильнёв' }, location: { lat: 46.400, lng: 6.933 } },
    { type: 'city', name: { en: 'Villers', ru: 'Виллер' }, location: { lat: 49.650, lng: 4.350 } },
    { type: 'city', name: { en: 'Villeurbanne', ru: 'Виллёрбанн' }, location: { lat: 45.767, lng: 4.883 } },
    { type: 'city', name: { en: 'Villiers', ru: 'Виллье' }, location: { lat: 49.083, lng: -0.333 } },
    { type: 'city', name: { en: 'Villigen', ru: 'Виллиген' }, location: { lat: 47.533, lng: 8.217 } },
    { type: 'city', name: { en: 'Villingen-Schwenningen', ru: 'Виллинген-Швеннинген' }, location: { lat: 48.062, lng: 8.462 } },
    { type: 'city', name: { en: 'Vincennes', ru: 'Венсенн' }, location: { lat: 48.850, lng: 2.433 } },
    { type: 'city', name: { en: 'Viroflay', ru: 'Вирофле' }, location: { lat: 48.800, lng: 2.167 } },
    { type: 'city', name: { en: 'Visp', ru: 'Фисп' }, location: { lat: 46.300, lng: 7.883 } },
    { type: 'city', name: { en: 'Vitry', ru: 'Витри' }, location: { lat: 49.350, lng: 4.583 } },
    { type: 'city', name: { en: 'Vittel', ru: 'Виттель' }, location: { lat: 48.200, lng: 5.950 } },
    { type: 'city', name: { en: 'Vitznau', ru: 'Витцнау' }, location: { lat: 47.000, lng: 8.483 } },
    { type: 'city', name: { en: 'Viviers', ru: 'Вивье' }, location: { lat: 44.483, lng: 4.683 } },
    { type: 'city', name: { en: 'Volketswil', ru: 'Фолькетсвиль' }, location: { lat: 47.383, lng: 8.683 } },
    { type: 'city', name: { en: 'Voreppe', ru: 'Вореп' }, location: { lat: 45.283, lng: 5.633 } },
    { type: 'city', name: { en: 'Vovray', ru: 'Вовре' }, location: { lat: 46.017, lng: 6.500 } },
    { type: 'city', name: { en: 'Wagrain', ru: 'Вагрейн' }, location: { lat: 47.333, lng: 13.300 } },
    { type: 'city', name: { en: 'Waidring Schneewinkl', ru: 'Вайдринг Шневинкль' }, location: { lat: 47.533, lng: 12.600 } },
    { type: 'city', name: { en: 'Walzenhausen', ru: 'Вальценхаузен' }, location: { lat: 47.367, lng: 9.617 } },
    { type: 'city', name: { en: 'Warth', ru: 'Варт' }, location: { lat: 47.267, lng: 10.183 } },
    { type: 'city', name: { en: 'Warth', ru: 'Варт' }, location: { lat: 47.617, lng: 8.767 } },
    { type: 'city', name: { en: 'Wasquehal', ru: 'Васкаль' }, location: { lat: 50.667, lng: 3.133 } },
    { type: 'city', name: { en: 'Weer-Kolsass', ru: 'Веер-Кользас' }, location: { lat: 47.300, lng: 11.633 } },
    { type: 'city', name: { en: 'Weggis', ru: 'Веггис' }, location: { lat: 47.033, lng: 8.433 } },
    { type: 'city', name: { en: 'Weinfelden', ru: 'Вайнфельден' }, location: { lat: 47.567, lng: 9.100 } },
    { type: 'city', name: { en: 'Wellenberg', ru: 'Велленберг' }, location: { lat: 47.067, lng: 8.650 } },
    { type: 'city', name: { en: 'Welschnofen', ru: 'Вельшнофен' }, location: { lat: 46.517, lng: 11.467 } },
    { type: 'city', name: { en: 'Wengen', ru: 'Венген' }, location: { lat: 46.608, lng: 7.922 } },
    { type: 'city', name: { en: 'Westendorf Skiwelt', ru: 'Вестендорф Скивельт' }, location: { lat: 47.433, lng: 12.200 } },
    { type: 'city', name: { en: 'Wetzikon', ru: 'Ветцикон' }, location: { lat: 47.333, lng: 8.800 } },
    { type: 'city', name: { en: 'Wiggensbach', ru: 'Виггенсбах' }, location: { lat: 47.650, lng: 10.233 } },
    { type: 'city', name: { en: 'Wikon Willisau', ru: 'Викон Виллизау' }, location: { lat: 47.117, lng: 7.983 } },
    { type: 'city', name: { en: 'Wil', ru: 'Виль' }, location: { lat: 47.467, lng: 9.050 } },
    { type: 'city', name: { en: 'Wilderswil Interlaken', ru: 'Вильдерсвиль Интерлакен' }, location: { lat: 46.667, lng: 7.867 } },
    { type: 'city', name: { en: 'Wildhaus Toggenburg', ru: 'Вильдхаус Тоггенбург' }, location: { lat: 47.200, lng: 9.350 } },
    { type: 'city', name: { en: 'Wiler', ru: 'Вилер' }, location: { lat: 46.317, lng: 7.817 } },
    { type: 'city', name: { en: 'Winterthur', ru: 'Винтертур' }, location: { lat: 47.500, lng: 8.733 } },
    { type: 'city', name: { en: 'Woergl', ru: 'Вёргль' }, location: { lat: 47.483, lng: 12.067 } },
    { type: 'city', name: { en: 'Wohlen', ru: 'Волен' }, location: { lat: 47.350, lng: 8.283 } },
    { type: 'city', name: { en: 'Woippy', ru: 'Вуаппи' }, location: { lat: 49.150, lng: 6.150 } },
    { type: 'city', name: { en: 'Wollerau', ru: 'Воллерау' }, location: { lat: 47.200, lng: 8.717 } },
    { type: 'city', name: { en: 'Wurmlingen', ru: 'Вурмлинген' }, location: { lat: 48.517, lng: 8.783 } },
    { type: 'city', name: { en: 'Xonrupt-Longemer', ru: 'Ксонрюпт-Лонжемер' }, location: { lat: 48.083, lng: 6.933 } },
    { type: 'city', name: { en: 'Yffiniac', ru: 'Ифиньяк' }, location: { lat: 48.483, lng: -2.683 } },
    { type: 'city', name: { en: 'Yutz', ru: 'Ютц' }, location: { lat: 49.367, lng: 6.200 } },
    { type: 'city', name: { en: 'Yverdon-les-Bains', ru: 'Ивердон-ле-Бен' }, location: { lat: 46.783, lng: 6.633 } },
    { type: 'city', name: { en: 'Zambla', ru: 'Замбла' }, location: { lat: 45.883, lng: 9.833 } },
    { type: 'city', name: { en: 'Zams', ru: 'Цамс' }, location: { lat: 47.150, lng: 10.583 } },
    { type: 'city', name: { en: 'Zellam See', ru: 'Цель-ам-Зе' }, location: { lat: 47.317, lng: 12.800 } },
    { type: 'city', name: { en: 'Zellam Ziller', ru: 'Цель-ам-Циллер' }, location: { lat: 47.233, lng: 11.883 } },
    { type: 'railway', name: { en: 'Zermatt Bahnhofplatz', ru: 'Церматт Банхофплац' }, location: { lat: 46.021, lng: 7.749 } },
    { type: 'city', name: { en: 'Zernez', ru: 'Цернец' }, location: { lat: 46.700, lng: 10.100 } },
    { type: 'city', name: { en: 'Zinal', ru: 'Зиналь' }, location: { lat: 46.133, lng: 7.617 } },
    { type: 'city', name: { en: 'Zofingen', ru: 'Цофинген' }, location: { lat: 47.283, lng: 7.950 } },
    { type: 'city', name: { en: 'Zoldo Alto', ru: 'Цольдо Альто' }, location: { lat: 46.367, lng: 12.183 } },
    { type: 'city', name: { en: 'Zuchwil', ru: 'Цухвиль' }, location: { lat: 47.183, lng: 7.533 } },
    { type: 'city', name: { en: 'Zug', ru: 'Цуг' }, location: { lat: 47.167, lng: 8.517 } },
    { type: 'city', name: { en: 'Zumikon', ru: 'Цумикон' }, location: { lat: 47.333, lng: 8.617 } },
    { type: 'city', name: { en: 'Zuoz', ru: 'Цуоц' }, location: { lat: 46.600, lng: 9.967 } },
    { type: 'airport', name: { en: 'Zurich Airport ZRH', ru: 'Аэропорт Цюрих' }, location: { lat: 47.464, lng: 8.549 } },
    { type: 'city', name: { en: 'Zurich City', ru: 'Город Цюрих' }, location: { lat: 47.378, lng: 8.540 } },
    { type: 'railway', name: { en: 'Zurich Train Station', ru: 'Вокзал Цюрих' }, location: { lat: 47.378, lng: 8.540 } },
    { type: 'city', name: { en: 'Zweibrucken', ru: 'Цвайбрюккен' }, location: { lat: 49.250, lng: 7.367 } },
    { type: 'city', name: { en: 'Zweisimmen', ru: 'Цвайзиммен' }, location: { lat: 46.550, lng: 7.383 } }
  ]
};

// ===================================================================
// 4. MODERN AUTOCOMPLETE CLASS - ES6+ OPTIMIZED
// ===================================================================

/**
 * Modern BookingAutocomplete class with ES6+ features
 * - WeakMap for private data
 * - Async/await for better flow control
 * - Modern array methods and destructuring
 * - Enhanced performance and security
 */
class BookingAutocomplete {
  constructor() {
    // Private properties using WeakMap pattern
    const privates = new WeakMap();
    privates.set(this, {
      searchTimeouts: new Map(),
      abortControllers: new Map(),
      isInitialized: false
    });
    
    // Language detection with fallback
    this.currentLang = document.documentElement?.lang || 'en';
    this.isRussian = this.currentLang === 'ru' || window.location.pathname.includes('/ru/');
    
    // DOM elements (will be populated during initialization)
    this.elements = {
      fromInput: null,
      toInput: null,
      fromDropdown: null,
      toDropdown: null,
      fromContent: null,
      toContent: null
    };
    
    // Data references with pre-sorted cache
    this.data = {
      from: [],
      to: [],
      sortedFrom: null,
      sortedTo: null
    };
    
    // Performance optimization - debounce is handled in setupInput method
    
    // Private methods accessor
    this._private = privates.get(this);
    
  }

  /**
   * Get SVG icon for location type (optimized with caching)
   * @param {string} type - Location type (city, airport, railway)
   * @returns {string} - Safe SVG HTML
   */
  getTypeIcon = (type) => SVG_ICONS[type?.toUpperCase()] || SVG_ICONS.CITY;

  /**
   * Modern search with enhanced performance and caching
   * @param {string} query - Search query
   * @param {Array} data - Data array to search
   * @param {boolean} showAll - Show all results
   * @returns {Array} - Filtered and sorted results
   */
  search = (query, data, showAll = false) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    // Early return for full list (use cached sorted data)
    if (showAll || query.length < AUTOCOMPLETE_CONFIG.MIN_SEARCH_LENGTH) {
      return this.getSortedData(data);
    }
    
    // ES2024: Enhanced Unicode validation
    const normalizedQuery = sanitizeInput(query).toLowerCase().trim();
    if (!normalizedQuery || !normalizedQuery.isWellFormed?.()) return [];
    
    // Use modern array methods for better performance
    const matchResults = data
      .filter(this.isValidItem)
      .map(item => this.calculateItemScore(item, normalizedQuery))
      .filter(({ score }) => score > 0)
      .sort(this.compareByScore)
      .slice(0, AUTOCOMPLETE_CONFIG.MAX_RESULTS)
      .map(({ item }) => item);
    
    // ES2024: Group results by type for better organization
    const groupedResults = Object.groupBy?.(matchResults, item => item.type) || 
                          this.fallbackGroupBy(matchResults);
    
    return this.sortByTypeAndAlphabet(matchResults);
  }
  
  /**
   * Fallback groupBy for browsers without ES2024 support
   * @param {Array} items - Items to group
   * @returns {Object} - Grouped items
   */
  fallbackGroupBy = (items) => {
    return items.reduce((groups, item) => {
      const key = item.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, Object.create(null));
  }
  
  /**
   * Validate item structure
   * @param {Object} item - Item to validate
   * @returns {boolean} - Is valid
   */
  isValidItem = (item) => item?.name?.en && item?.name?.ru;
  
  /**
   * Calculate search score for item
   * @param {Object} item - Item to score
   * @param {string} query - Normalized query
   * @returns {Object} - Item with score
   */
  calculateItemScore = (item, query) => {
    const { en: enName, ru: ruName } = item.name;
    const enLower = enName.toLowerCase();
    const ruLower = ruName.toLowerCase();
    
    let score = 0;
    
    // Priority scoring based on language preference
    const primaryName = this.isRussian ? ruLower : enLower;
    const secondaryName = this.isRussian ? enLower : ruLower;
    
    if (primaryName.startsWith(query)) {
      score = AUTOCOMPLETE_CONFIG.PRIORITY_WEIGHTS.EXACT_START;
    } else if (secondaryName.startsWith(query)) {
      score = AUTOCOMPLETE_CONFIG.PRIORITY_WEIGHTS.OTHER_START;
    } else if (primaryName.includes(query) || secondaryName.includes(query)) {
      score = AUTOCOMPLETE_CONFIG.PRIORITY_WEIGHTS.CONTAINS;
    }
    
    return { item, score };
  }
  
  /**
   * Compare items by score (descending)
   * @param {Object} a - First item with score
   * @param {Object} b - Second item with score
   * @returns {number} - Comparison result
   */
  compareByScore = ({ score: scoreA }, { score: scoreB }) => scoreB - scoreA;
  
  /**
   * Get cached sorted data or create cache
   * @param {Array} data - Raw data
   * @returns {Array} - Sorted data
   */
  getSortedData = (data) => {
    const cacheKey = data === this.data.from ? 'sortedFrom' : 'sortedTo';
    
    if (!this.data[cacheKey]) {
      this.data[cacheKey] = this.sortByTypeAndAlphabet([...data]);
    }
    
    return this.data[cacheKey];
  }
  
  /**
   * Sort items by type priority and alphabetically
   * @param {Array} items - Items to sort
   * @returns {Array} - Sorted items
   */
  sortByTypeAndAlphabet = (items) => {
    return items.sort((a, b) => {
      const { TYPE_ORDER } = AUTOCOMPLETE_CONFIG;
      const aOrder = TYPE_ORDER[a.type] ?? 3;
      const bOrder = TYPE_ORDER[b.type] ?? 3;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // Use Intl.Collator for better localization
      const primaryA = this.isRussian ? a.name.ru : a.name.en;
      const primaryB = this.isRussian ? b.name.ru : b.name.en;
      
      return primaryA.localeCompare(primaryB, this.currentLang, { numeric: true });
    });
  }

  /**
   * Show results with proper security and responsive scroll
   * @param {Array} results - Search results
   * @param {HTMLElement} content - Content container
   * @param {HTMLElement} dropdown - Dropdown container
   */
  showResults(results, content, dropdown) {
    // Clear previous results
    content.innerHTML = '';
    
    if (results.length === 0) {
      const noResultsMsg = this.isRussian ? 'Ничего не найдено' : 'No results found';
      const noResultsDiv = document.createElement('div');
      noResultsDiv.textContent = noResultsMsg; // Use textContent for security
      noResultsDiv.style.cssText = 'padding: 12px; color: #999; text-align: center;';
      content.appendChild(noResultsDiv);
      dropdown.style.display = 'block';
      return;
    }
    
    // Use DocumentFragment for performance
    const fragment = document.createDocumentFragment();
    
    results.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'booking__dropdown-item';
      div.setAttribute('data-index', index);
      div.setAttribute('role', 'option');
      div.setAttribute('tabindex', '-1');
      
      // Create icon container
      const iconDiv = document.createElement('div');
      iconDiv.className = 'booking__dropdown-icon';
      iconDiv.innerHTML = this.getTypeIcon(item.type); // SVG is pre-validated
      
      // Create text container
      const textDiv = document.createElement('div');
      textDiv.className = 'booking__dropdown-text';
      
      // Primary name (secure)
      const primaryName = this.isRussian ? item.name.ru : item.name.en;
      const nameDiv = document.createElement('div');
      nameDiv.className = 'booking__dropdown-name';
      nameDiv.textContent = primaryName; // Use textContent for security
      textDiv.appendChild(nameDiv);
      
      // Secondary name for Russian version (secure)
      if (this.isRussian) {
        const secondaryName = item.name.en;
        const secondaryDiv = document.createElement('div');
        secondaryDiv.className = 'booking__dropdown-name booking__dropdown-name--ru';
        secondaryDiv.textContent = secondaryName; // Use textContent for security
        textDiv.appendChild(secondaryDiv);
      }
      
      // Assemble item
      div.appendChild(iconDiv);
      div.appendChild(textDiv);
      
      // Add event listeners with proper context
      this.addItemEventListeners(div, item, dropdown);
      
      fragment.appendChild(div);
    });
    
    // Add all items at once
    content.appendChild(fragment);
    
    // Show dropdown and reset scroll
    dropdown.style.display = 'block';
    
    // CRITICAL: Reset scroll on main dropdown container for proper desktop scrolling
    requestAnimationFrame(() => {
      dropdown.scrollTop = 0;

    });
  }

  /**
   * Add event listeners to dropdown item with proper security
   * @param {HTMLElement} element - Item element
   * @param {Object} item - Data item
   * @param {HTMLElement} dropdown - Dropdown container
   */
  addItemEventListeners(element, item, dropdown) {
    // Hover effects
    element.addEventListener('mouseenter', () => {
      this.clearHighlights(dropdown);
      element.classList.add('booking__dropdown-item--highlighted');
    });
    
    element.addEventListener('mouseleave', () => {
      element.classList.remove('booking__dropdown-item--highlighted');
    });
    
    // Click selection
    element.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Find input more reliably by dropdown ID
      let input, fieldType;
      if (dropdown.id === 'dropdown_from') {
        input = document.getElementById('booking_from');
        fieldType = 'from';
      } else if (dropdown.id === 'dropdown_to') {
        input = document.getElementById('booking_to');
        fieldType = 'to';
      } else {
        // Fallback to class-based detection
        input = dropdown === this.fromDropdown ? this.fromInput : this.toInput;
        fieldType = dropdown === this.fromDropdown ? 'from' : 'to';
      }
      
      const primaryName = this.isRussian ? item.name.ru : item.name.en;
      
      // Check if input exists
      if (!input) {
        console.warn('Input element not found for dropdown:', dropdown.id || dropdown.className);
        return;
      }
      
      // VALIDATE: Check for duplicate selection
      if (!validateNoDuplicateSelection(item, fieldType)) {
        dropdown.style.display = 'none';
        return; // Prevent selection of duplicate
      }
      
      // UPDATE SELECTED ADDRESSES IMMEDIATELY after validation
      if (fieldType === 'from') {
        selectedAddresses.setFrom(item);
      } else if (fieldType === 'to') {
        selectedAddresses.setTo(item);
      }
      
      // Secure value assignment
      input.value = sanitizeInput(primaryName);
      dropdown.style.display = 'none';
      
      // Dispatch custom event for external handling
      input.dispatchEvent(new CustomEvent('autocomplete:select', {
        detail: { item, selectedName: primaryName, fieldType }
      }));
    });
  }

  /**
   * Clear all highlights in dropdown
   * @param {HTMLElement} dropdown - Dropdown container
   */
  clearHighlights(dropdown) {
    const highlighted = dropdown.querySelectorAll('.booking__dropdown-item--highlighted');
    highlighted.forEach(item => item.classList.remove('booking__dropdown-item--highlighted'));
  }

  /**
   * Setup input event handlers with security
   * @param {HTMLElement} input - Input element
   * @param {Array} data - Data array
   * @param {HTMLElement} content - Content container
   * @param {HTMLElement} dropdown - Dropdown container
   */
  setupInput(input, data, content, dropdown) {
    // Input search with debouncing
    input.addEventListener('input', (e) => {
      const inputId = input.id;
      
      // Clear previous timeout
      if (this._private.searchTimeouts.has(inputId)) {
        clearTimeout(this._private.searchTimeouts.get(inputId));
      }
      
      // Debounced search with filtering
      const timeout = setTimeout(() => {
        // Apply filtering for "To" field to exclude selected "From" address
        let filteredData = data;
        if (inputId === 'booking_to' && selectedAddresses.from) {
          filteredData = filterExcludedAddress(data, selectedAddresses.from);
        }
        
        const results = this.search(e.target.value, filteredData);
        this.showResults(results, content, dropdown);
        this._private.searchTimeouts.delete(inputId);
      }, AUTOCOMPLETE_CONFIG.DEBOUNCE_DELAY);
      
      this._private.searchTimeouts.set(inputId, timeout);
    });
    
    // Focus handler - show full list or search results with filtering
    input.addEventListener('focus', (e) => {
      const inputId = input.id;
      
      if (this._private.searchTimeouts.has(inputId)) {
        clearTimeout(this._private.searchTimeouts.get(inputId));
      }
      
      // Apply filtering for "To" field to exclude selected "From" address
      let filteredData = data;
      if (inputId === 'booking_to' && selectedAddresses.from) {
        filteredData = filterExcludedAddress(data, selectedAddresses.from);
      }
      
      if (e.target.value.length >= AUTOCOMPLETE_CONFIG.MIN_SEARCH_LENGTH) {
        // Show search results
        const results = this.search(e.target.value, filteredData);
        this.showResults(results, content, dropdown);
      } else {
        // Show FULL filtered list
        const results = this.search('', filteredData, true);
        this.showResults(results, content, dropdown);
      }
    });
    
    // Blur handler with delay for click handling
    input.addEventListener('blur', () => {
      setTimeout(() => {
        dropdown.style.display = 'none';
      }, 200);
    });
    
    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e, dropdown);
    });
    
    // Simple wheel handling - prevent page scroll when scrolling dropdown
    dropdown.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }

  /**
   * Handle keyboard navigation with accessibility
   * @param {KeyboardEvent} e - Keyboard event
   * @param {HTMLElement} dropdown - Dropdown container
   */
  handleKeyboardNavigation(e, dropdown) {
    const items = dropdown.querySelectorAll('.booking__dropdown-item');
    const currentHighlighted = dropdown.querySelector('.booking__dropdown-item--highlighted');
    let highlightIndex = -1;
    
    if (currentHighlighted) {
      highlightIndex = Array.from(items).indexOf(currentHighlighted);
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightIndex = Math.min(highlightIndex + 1, items.length - 1);
        this.updateHighlight(items, highlightIndex, dropdown);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        highlightIndex = Math.max(highlightIndex - 1, -1);
        this.updateHighlight(items, highlightIndex, dropdown);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && items[highlightIndex]) {
          items[highlightIndex].click();
        }
        break;
        
      case 'Escape':
        dropdown.style.display = 'none';
        break;
    }
  }

  /**
   * Update highlight for keyboard navigation with proper scrolling
   * @param {NodeList} items - Item elements
   * @param {number} index - Index to highlight
   * @param {HTMLElement} dropdown - Dropdown container
   */
  updateHighlight(items, index, dropdown) {
    this.clearHighlights(dropdown);
    
    if (index >= 0 && index < items.length) {
      const item = items[index];
      item.classList.add('booking__dropdown-item--highlighted');
      
      // Ensure item is visible with proper scroll calculation
      const dropdownRect = dropdown.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      
      if (itemRect.top < dropdownRect.top) {
        dropdown.scrollTop -= (dropdownRect.top - itemRect.top) + 10;
      } else if (itemRect.bottom > dropdownRect.bottom) {
        dropdown.scrollTop += (itemRect.bottom - dropdownRect.bottom) + 10;
      }
    }
  }

  /**
   * Sort data with proper type ordering
   * @param {Array} data - Data to sort
   * @returns {Array} - Sorted data
   */
  sortData(data) {
    return [...data].sort((a, b) => {
      const typeOrder = AUTOCOMPLETE_CONFIG.TYPE_ORDER;
      const aOrder = typeOrder[a.type] || 3;
      const bOrder = typeOrder[b.type] || 3;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      return a.name.en.localeCompare(b.name.en);
    });
  }

  /**
   * Initialize autocomplete with proper error handling
   */
  async init() {
    try {
      // Wait for DOM elements
      await this.waitForElements();
      
      // Wait for data
      await this.waitForData();
      
      // Sort data for consistent ordering
      this.data.from = this.sortData(bookingAutocompleteData.from);
      this.data.to = this.sortData(bookingAutocompleteData.to);
       
      // Setup inputs
      this.setupInput(this.elements.fromInput, this.data.from, this.elements.fromContent, this.elements.fromDropdown);
      this.setupInput(this.elements.toInput, this.data.to, this.elements.toContent, this.elements.toDropdown);
      
      // Setup click outside to close
      this.setupClickOutside();    
      
    } catch (error) {
    }
  }

  /**
   * Wait for required DOM elements (only autocomplete fields)
   */
  waitForElements() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkElements = () => {
        // CRITICAL: Only handle specific autocomplete fields
        this.elements.fromInput = document.getElementById('booking_from');
        this.elements.toInput = document.getElementById('booking_to');
        this.elements.fromDropdown = document.getElementById('dropdown_from');
        this.elements.toDropdown = document.getElementById('dropdown_to');
        this.elements.fromContent = document.getElementById('dropdown_content_from');
        this.elements.toContent = document.getElementById('dropdown_content_to');
        
        // Verify we have all required autocomplete elements
        if (this.elements.fromInput && this.elements.toInput && this.elements.fromDropdown && 
            this.elements.toDropdown && this.elements.fromContent && this.elements.toContent) {
          
          // SECURITY: Ensure we don't interfere with other booking form fields
          const dateInput = document.getElementById('booking_date');
          const passengersInput = document.getElementById('booking_passengers');
          const luggageInput = document.getElementById('booking_luggage');
          
          if (dateInput) {
            // Remove any autocomplete attributes that might interfere with datepicker
            dateInput.setAttribute('autocomplete', 'off');
            dateInput.setAttribute('data-autocomplete-exclude', 'true');
 
          }
          
          if (passengersInput) {
            passengersInput.setAttribute('autocomplete', 'off');
            passengersInput.setAttribute('data-autocomplete-exclude', 'true');
          }
          
          if (luggageInput) {
            luggageInput.setAttribute('autocomplete', 'off');
            luggageInput.setAttribute('data-autocomplete-exclude', 'true');
          }
          
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkElements, 100);
        } else {
          reject(new Error('Required DOM elements not found'));
        }
      };
      
      checkElements();
    });
  }

  /**
   * Wait for autocomplete data (ES2024 enhanced)
   */
  waitForData() {
    // ES2024: Use Promise.withResolvers for cleaner async code
    const { promise, resolve, reject } = Promise.withResolvers?.() || this.createPromiseWithResolvers();
    
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkData = () => {
      if (window.bookingAutocompleteData && 
          window.bookingAutocompleteData.from && 
          window.bookingAutocompleteData.to) {
        resolve();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkData, 100);
      } else {
        reject(new Error('Autocomplete data not available'));
      }
    };
    
    checkData();
    return promise;
  }
  
  /**
   * Fallback for browsers without Promise.withResolvers (ES2024)
   * @returns {Object} - Promise with resolvers
   */
  createPromiseWithResolvers() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  /**
   * Setup click outside to close dropdowns
   */
  setupClickOutside() {
    document.addEventListener('click', (e) => {
      // Close from dropdown if clicked outside
      if (!this.elements.fromInput.contains(e.target) && !this.elements.fromDropdown.contains(e.target)) {
        this.elements.fromDropdown.style.display = 'none';
      }
      
      // Close to dropdown if clicked outside
      if (!this.elements.toInput.contains(e.target) && !this.elements.toDropdown.contains(e.target)) {
        this.elements.toDropdown.style.display = 'none';
      }
    });
  }
}

// ===================================================================
// 5. FIELD ICON MANAGEMENT AND VALIDATION FUNCTIONS
// ===================================================================

/**
 * Show notification above field
 * @param {HTMLElement} field - Field element
 * @param {string} message - Notification message
 * @param {string} type - Notification type (error, success, warning)
 */
const showFieldNotification = (field, message, type = 'error') => {
  try {
    // Remove existing notification
    const existingNotification = field.querySelector('.booking__notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `booking__notification booking__notification--${type}`;
    notification.textContent = message;
    
    // Insert at the beginning of field
    field.insertBefore(notification, field.firstChild);
    
    // Show notification with animation
    requestAnimationFrame(() => {
      notification.classList.add('booking__notification--show');
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.classList.remove('booking__notification--show');
        setTimeout(() => {
          if (notification && notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
    
  } catch (error) {

  }
};

/**
 * State management for selected addresses
 */
const selectedAddresses = {
  from: null,
  to: null,
  
  setFrom(address) {
    this.from = address;

  },
  
  setTo(address) {
    this.to = address;

  },
  
  clear() {
    this.from = null;
    this.to = null;

  },
  
  getFromKey() {
    return this.from ? `${this.from.name?.en}_${this.from.type}` : null;
  },
  
  getToKey() {
    return this.to ? `${this.to.name?.en}_${this.to.type}` : null;
  }
};

window.selectedAddresses = selectedAddresses;

/**
 * Update field icon based on selected address type (keep yellow color)
 * @param {HTMLElement} input - Input element
 * @param {string} type - Address type (city, airport, railway)
 */
const updateFieldIcon = (input, type) => {
  try {
    // Find the icon container in the same field
    const field = input.closest('.booking__field');
    if (!field) return;
    
    const iconContainer = field.querySelector('.booking__icon');
    if (!iconContainer) return;
    
    // Get appropriate SVG based on type - KEEP YELLOW COLOR
    const iconSvg = SVG_ICONS[type?.toUpperCase()] || SVG_ICONS.CITY;
    
    // Replace the location marker with type-specific SVG
    iconContainer.innerHTML = iconSvg;
    
    // Add appropriate class for styling but KEEP YELLOW COLOR
    iconContainer.className = `booking__icon booking__icon--${type || 'city'}`;
    
    // FORCE yellow color via CSS custom property
    iconContainer.style.setProperty('color', 'var(--color-accent-light)', 'important');
    
  } catch (error) {

  }
};

/**
 * Reset field icon back to location marker
 * @param {HTMLElement} input - Input element
 */
const resetFieldIcon = (input) => {
  try {
    // Find the icon container in the same field
    const field = input.closest('.booking__field');
    if (!field) return;
    
    const iconContainer = field.querySelector('.booking__icon');
    if (!iconContainer) return;
    
    // Reset to location marker SVG
    const locationMarkerSvg = `<svg fill="currentColor" viewBox="-3 0 24 24" xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true">
      <path d="m8.075 23.52c-6.811-9.878-8.075-10.891-8.075-14.52 0-4.971 4.029-9 9-9s9 4.029 9 9c0 3.629-1.264 4.64-8.075 14.516-.206.294-.543.484-.925.484s-.719-.19-.922-.48l-.002-.004zm.925-10.77c2.07 0 3.749-1.679 3.749-3.75s-1.679-3.75-3.75-3.75-3.75 1.679-3.75 3.75c0 2.071 1.679 3.75 3.75 3.75z"></path>
    </svg>`;
    
    // Replace with location marker
    iconContainer.innerHTML = locationMarkerSvg;
    
    // Reset class to location
    iconContainer.className = 'booking__icon booking__icon--location';
    
  } catch (error) {

  }
};

/**
 * Filter data to exclude selected "From" address from "To" options
 * @param {Array} data - Original data array
 * @param {Object} excludeAddress - Address object to exclude
 * @returns {Array} - Filtered data
 */
const filterExcludedAddress = (data, excludeAddress) => {
  if (!excludeAddress || !Array.isArray(data)) return data;
  
  const filtered = data.filter(item => 
    !(item.name?.en === excludeAddress.name?.en && item.type === excludeAddress.type)
  );

  return filtered;
};

/**
 * Validate field selection order (From must be selected before To)
 * @param {string} fieldType - 'from' or 'to'
 * @returns {boolean} - True if valid, false if invalid
 */
const validateSelectionOrder = (fieldType) => {
  if (fieldType === 'to' && !selectedAddresses.from) {
    // User trying to select "To" without selecting "From" first
    const toField = document.getElementById('booking_to')?.closest('.booking__field');
    const fromField = document.getElementById('booking_from')?.closest('.booking__field');
    const fromInput = document.getElementById('booking_from');
    
    if (toField && fromField && fromInput) {
      // Show error notification
      const isRussian = document.documentElement?.lang === 'ru' || window.location.pathname.includes('/ru/');
      const message = isRussian ? 'Сначала выберите "Откуда"' : 'Please select "From" first';
      
      showFieldNotification(toField, message, 'warning');
      
      // Focus on "From" field and OPEN its dropdown
      fromInput.focus();
      
      // Trigger dropdown opening for "From" field
      setTimeout(() => {
        const fromDropdown = document.getElementById('dropdown_from');
        const fromContent = document.getElementById('dropdown_content_from');
        
        if (fromDropdown && fromContent && window.bookingAutocomplete) {
          // Get autocomplete instance and show full list
          const autocomplete = window.bookingAutocomplete;
          const fromData = autocomplete.data?.from || [];
          const results = autocomplete.search('', fromData, true);
          autocomplete.showResults(results, fromContent, fromDropdown);
        }
      }, 100);
      
      return false;
    }
  }
  
  return true;
};

/**
 * Validate that same address is not selected in both fields
 * @param {Object} newItem - Item being selected
 * @param {string} fieldType - 'from' or 'to'
 * @returns {boolean} - True if valid, false if duplicate
 */
const validateNoDuplicateSelection = (newItem, fieldType) => {
  const otherField = fieldType === 'from' ? selectedAddresses.to : selectedAddresses.from;
  
  // Check for duplicate selection using name and type (since no ID field exists)
  const isDuplicate = otherField && newItem && 
    otherField.name?.en === newItem.name?.en && 
    otherField.type === newItem.type;
  
  // Validate duplicate selection
  
  if (isDuplicate) {
    // Same address selected in both fields
    const currentField = document.getElementById(`booking_${fieldType}`)?.closest('.booking__field');
    
    if (currentField) {
      const isRussian = document.documentElement?.lang === 'ru' || window.location.pathname.includes('/ru/');
      const message = isRussian 
        ? 'Нельзя выбрать одинаковый адрес в обоих полях' 
        : 'Cannot select the same address in both fields';
      
      showFieldNotification(currentField, message, 'error');

      return false;
    }
  }
  

  return true;
};

/**
 * Initialize field icon handlers with enhanced validation
 * Setup event listeners for address selection and field clearing
 */
const initFieldIconHandlers = () => {
  try {
    const fromInput = document.getElementById('booking_from');
    const toInput = document.getElementById('booking_to');
    
    if (fromInput) {
      // FROM field handlers
      fromInput.addEventListener('autocomplete:select', (e) => {
        const { item, fieldType } = e.detail;
        
        // selectedAddresses already updated in click handler
        updateFieldIcon(fromInput, item.type);
        
      });
      
      fromInput.addEventListener('input', (e) => {
        if (!e.target.value.trim()) {
          selectedAddresses.setFrom(null);
          resetFieldIcon(fromInput);
        }
      });
    }
    
    if (toInput) {
      // TO field handlers with validation
      toInput.addEventListener('focus', (e) => {
        // Validate selection order before allowing focus
        if (!validateSelectionOrder('to')) {
          e.preventDefault();
          return false;
        }
      });
      
      toInput.addEventListener('autocomplete:select', (e) => {
        const { item, fieldType } = e.detail;
        
        // selectedAddresses already updated in click handler
        updateFieldIcon(toInput, item.type);
        
      });
      
      toInput.addEventListener('input', (e) => {
        if (!e.target.value.trim()) {
          selectedAddresses.setTo(null);
          resetFieldIcon(toInput);
        }
      });
    }
    
  } catch (error) {

  }
};

// ===================================================================
// 6. INITIALIZATION AND GLOBAL EXPOSURE
// ===================================================================

// Make data globally available for backward compatibility
window.bookingAutocompleteData = bookingAutocompleteData;

// Initialize when DOM is ready
function initBookingAutocomplete() {
  // Check if elements exist
  const fromInput = document.getElementById('booking_from');
  const toInput = document.getElementById('booking_to');
  const fromDropdown = document.getElementById('dropdown_from');
  const toDropdown = document.getElementById('dropdown_to');
  
  if (!fromInput || !toInput || !fromDropdown || !toDropdown) {
    console.error('Required elements not found, retrying in 500ms...');
    setTimeout(initBookingAutocomplete, 500);
    return;
  }
  
  const autocomplete = new BookingAutocomplete();
  autocomplete.init();
  
  // Initialize field icon handlers
  initFieldIconHandlers();
  
  // Expose instance globally for debugging
  window.bookingAutocomplete = autocomplete;
}

// Auto-initialize with multiple attempts
let initAttempts = 0;
const maxInitAttempts = 10;

function tryInit() {
  initAttempts++;
  
  if (initAttempts > maxInitAttempts) {

    return;
  }
  
  try {
    initBookingAutocomplete();
  } catch (error) {

    setTimeout(tryInit, 500);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInit);
} else {
  tryInit();
}
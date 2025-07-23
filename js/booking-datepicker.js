/**
 * Modern Booking DatePicker Module (ES2024)
 * Secure, fast, and accessible date picker for booking forms
 * Features: auto-detect client date, dd.mm.yyyy format, min date validation
 */

// Security and performance configuration
const DATEPICKER_CONFIG = Object.freeze({
  DATE_FORMAT: 'dd.mm.yyyy',
  MIN_YEAR: new Date().getFullYear(),
  MAX_YEAR: new Date().getFullYear() + 2,
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 100,
  MAX_INPUT_LENGTH: 10,
  ALLOWED_CHARS: /[0-9.]/g,
  DATE_REGEX: /^(\d{2})\.(\d{2})\.(\d{4})$/
});

// SVG icons for navigation
const DATEPICKER_ICONS = Object.freeze({
  PREV: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10 12l-4-4 4-4"/></svg>',
  NEXT: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 12l4-4-4-4"/></svg>',
  CALENDAR: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a1 1 0 0 0-2 0v1H3a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-1V2a1 1 0 1 0-2 0v1H6V2zM3 7h14v9H3V7z"/></svg>'
});

// Utility functions with ES2024 optimizations
const DateUtils = Object.freeze({
  /**
   * Get current date with timezone handling
   */
  getCurrentDate() {
    return new Date();
  },

  /**
   * Format date to dd.mm.yyyy
   */
  formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  },

  /**
   * Parse dd.mm.yyyy format to Date object
   */
  parseDate(dateString) {
    if (!dateString?.isWellFormed?.()) {
      dateString = dateString?.toWellFormed?.() ?? String(dateString);
    }
    
    const match = dateString.match(DATEPICKER_CONFIG.DATE_REGEX);
    if (!match) return null;
    
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Validate the parsed date
    if (date.getDate() !== parseInt(day) || 
        date.getMonth() !== parseInt(month) - 1 || 
        date.getFullYear() !== parseInt(year)) {
      return null;
    }
    
    return date;
  },

  /**
   * Check if date is valid and not in the past
   */
  isValidFutureDate(date) {
    if (!(date instanceof Date) || isNaN(date)) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    return date >= today;
  },

  /**
   * Get month names for current language
   */
  getMonthNames(isRussian = false) {
    return isRussian 
      ? ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
         'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
      : ['January', 'February', 'March', 'April', 'May', 'June',
         'July', 'August', 'September', 'October', 'November', 'December'];
  },

  /**
   * Get day names for current language
   */
  getDayNames(isRussian = false) {
    return isRussian 
      ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
      : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  }
});

// Performance utilities for DatePicker
const datepickerDebounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const datepickerThrottle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Modern DatePicker Class with ES2024 features
 */
class BookingDatePicker {
  #private = new WeakMap();

  constructor() {
    // Private state management
    this.#private.set(this, {
      isOpen: false,
      selectedDate: null,
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      eventListeners: new Map(),
      animationFrame: null
    });

    // Public elements and data
    this.elements = {};
    this.isRussian = false;
  }

  /**
   * Initialize the datepicker
   */
  async init() {
    try {
      await this.waitForElements();
      this.detectLanguage();
      this.setupDateInput();
      this.createDatePicker();
      this.setupEventListeners();
      this.setupClickOutside();
      
      return true;
    } catch (error) {
      console.error('❌ BookingDatePicker initialization error:', error);
      return false;
    }
  }

  /**
   * Wait for DOM elements to be available
   */
  async waitForElements() {
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const dateInput = document.getElementById('booking_date');
      
      if (dateInput) {
        this.elements.dateInput = dateInput;
        return true;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    throw new Error('DatePicker elements not found after maximum attempts');
  }

  /**
   * Detect current language
   */
  detectLanguage() {
    this.isRussian = document.documentElement.lang === 'ru' || 
                     window.location.pathname.includes('/ru/') ||
                     document.querySelector('html[lang="ru"]') !== null;
    
  }

  /**
   * Setup date input field
   */
  setupDateInput() {
    const input = this.elements.dateInput;
    if (!input) return;

    // Calendar icon is already set in HTML as SVG
    const field = input.closest('.booking__field');
    if (field) {
      const icon = field.querySelector('.booking__icon');
      if (icon && !icon.classList.contains('booking__icon--calendar')) {
        icon.classList.add('booking__icon--calendar');
      }
    }

    // Input event handlers with security
    const handleInput = datepickerDebounce((e) => {
      let value = e.target.value;
      
      // Security: limit length and filter characters
      if (value.length > DATEPICKER_CONFIG.MAX_INPUT_LENGTH) {
        value = value.substring(0, DATEPICKER_CONFIG.MAX_INPUT_LENGTH);
      }
      
      // Allow only digits and dots
      value = value.replace(/[^0-9.]/g, '');
      
      // Auto-format as user types
      value = this.formatInputValue(value);
      
      e.target.value = value;
      this.validateAndSetDate(value);
    }, DATEPICKER_CONFIG.DEBOUNCE_DELAY);

    input.addEventListener('input', handleInput);
    input.addEventListener('focus', () => this.openDatePicker());
    input.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  /**
   * Format input value as user types
   */
  formatInputValue(value) {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.substring(0, 2)}.${digits.substring(2)}`;
    } else {
      return `${digits.substring(0, 2)}.${digits.substring(2, 4)}.${digits.substring(4, 8)}`;
    }
  }

  /**
   * Validate and set date
   */
  validateAndSetDate(value) {
    if (value.length === 10) {
      const date = DateUtils.parseDate(value);
      if (date && DateUtils.isValidFutureDate(date)) {
        const privateState = this.#private.get(this);
        privateState.selectedDate = date;
        privateState.currentMonth = date.getMonth();
        privateState.currentYear = date.getFullYear();
        
        this.updateCalendarView();
        this.dispatchDateChange(date);
      }
    }
  }

  /**
   * Handle keyboard navigation
   */
  handleKeydown(e) {
    const privateState = this.#private.get(this);
    
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.closeDatePicker();
        break;
      case 'Enter':
        e.preventDefault();
        if (!privateState.isOpen) {
          this.openDatePicker();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!privateState.isOpen) {
          this.openDatePicker();
        }
        break;
    }
  }

  /**
   * Setup event listeners (placeholder for future events)
   */
  setupEventListeners() {
    // Additional event listeners can be added here if needed
    // Currently, all events are handled in setupDateInput and setupCalendarEvents
  }

  /**
   * Create datepicker calendar
   */
  createDatePicker() {
    const calendar = document.createElement('div');
    calendar.className = 'booking__datepicker';
    calendar.id = 'booking_datepicker';
    
    calendar.innerHTML = `
      <div class="booking__datepicker-header">
        <button type="button" class="booking__datepicker-nav booking__datepicker-nav--prev" aria-label="Previous month">
          ${DATEPICKER_ICONS.PREV}
        </button>
        <div class="booking__datepicker-title">
          <span class="booking__datepicker-month"></span>
          <span class="booking__datepicker-year"></span>
        </div>
        <button type="button" class="booking__datepicker-nav booking__datepicker-nav--next" aria-label="Next month">
          ${DATEPICKER_ICONS.NEXT}
        </button>
      </div>
      <div class="booking__datepicker-weekdays"></div>
      <div class="booking__datepicker-days"></div>
    `;

    // Insert after the input field
    const field = this.elements.dateInput.closest('.booking__field');
    if (field) {
      field.appendChild(calendar);
      this.elements.calendar = calendar;
    }

    this.updateCalendarView();
    this.setupCalendarEvents();
  }

  /**
   * Setup calendar event listeners
   */
  setupCalendarEvents() {
    const calendar = this.elements.calendar;
    if (!calendar) return;

    // Navigation buttons
    const prevBtn = calendar.querySelector('.booking__datepicker-nav--prev');
    const nextBtn = calendar.querySelector('.booking__datepicker-nav--next');
    
    prevBtn?.addEventListener('click', () => this.navigateMonth(-1));
    nextBtn?.addEventListener('click', () => this.navigateMonth(1));

    // Day selection
    calendar.addEventListener('click', (e) => {
      if (e.target.classList.contains('booking__datepicker-day') && 
          !e.target.classList.contains('booking__datepicker-day--disabled')) {
        this.selectDate(e.target);
      }
    });
  }

  /**
   * Navigate to previous/next month
   */
  navigateMonth(direction) {
    const privateState = this.#private.get(this);
    let { currentMonth, currentYear } = privateState;
    
    currentMonth += direction;
    
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    
    // Prevent navigation to past months
    const today = new Date();
    const targetDate = new Date(currentYear, currentMonth, 1);
    const currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (targetDate < currentDate) return;
    
    privateState.currentMonth = currentMonth;
    privateState.currentYear = currentYear;
    
    this.updateCalendarView();
  }

  /**
   * Update calendar view
   */
  updateCalendarView() {
    const privateState = this.#private.get(this);
    const { currentMonth, currentYear } = privateState;
    const calendar = this.elements.calendar;
    
    if (!calendar) return;

    // Update header
    const monthNames = DateUtils.getMonthNames(this.isRussian);
    calendar.querySelector('.booking__datepicker-month').textContent = monthNames[currentMonth];
    calendar.querySelector('.booking__datepicker-year').textContent = currentYear;

    // Update weekdays
    this.updateWeekdays();
    
    // Update days
    this.updateDays();
  }

  /**
   * Update weekdays header
   */
  updateWeekdays() {
    const calendar = this.elements.calendar;
    const weekdaysContainer = calendar.querySelector('.booking__datepicker-weekdays');
    const dayNames = DateUtils.getDayNames(this.isRussian);
    
    weekdaysContainer.innerHTML = dayNames
      .map(day => `<div class="booking__datepicker-weekday">${day}</div>`)
      .join('');
  }

  /**
   * Update days grid
   */
  updateDays() {
    const privateState = this.#private.get(this);
    const { currentMonth, currentYear, selectedDate } = privateState;
    const calendar = this.elements.calendar;
    const daysContainer = calendar.querySelector('.booking__datepicker-days');
    
    const today = new Date();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    
    // Adjust for Monday start (European style)
    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === currentMonth;
      const isToday = this.isSameDay(currentDate, today);
      const isSelected = selectedDate && this.isSameDay(currentDate, selectedDate);
      const isPast = currentDate < today;
      
      const dayElement = document.createElement('button');
      dayElement.type = 'button';
      dayElement.className = 'booking__datepicker-day';
      dayElement.textContent = currentDate.getDate();
      dayElement.setAttribute('data-date', DateUtils.formatDate(currentDate));
      
      if (!isCurrentMonth) {
        dayElement.classList.add('booking__datepicker-day--other-month');
      }
      
      if (isToday) {
        dayElement.classList.add('booking__datepicker-day--today');
      }
      
      if (isSelected) {
        dayElement.classList.add('booking__datepicker-day--selected');
      }
      
      if (isPast || !isCurrentMonth) {
        dayElement.classList.add('booking__datepicker-day--disabled');
        dayElement.disabled = true;
      }
      
      days.push(dayElement.outerHTML);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    daysContainer.innerHTML = days.join('');
  }

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  /**
   * Select a date
   */
  selectDate(dayElement) {
    const dateString = dayElement.getAttribute('data-date');
    const date = DateUtils.parseDate(dateString);
    
    if (!date || !DateUtils.isValidFutureDate(date)) return;
    
    // Update input
    this.elements.dateInput.value = dateString;
    
    // Update private state
    const privateState = this.#private.get(this);
    privateState.selectedDate = date;
    
    // Update calendar
    this.updateCalendarView();
    
    // Dispatch event
    this.dispatchDateChange(date);
    
    // Close picker
    this.closeDatePicker();
  }

  /**
   * Open date picker
   */
  openDatePicker() {
    const privateState = this.#private.get(this);
    const calendar = this.elements.calendar;
    
    if (!calendar || privateState.isOpen) return;
    
    privateState.isOpen = true;
    calendar.style.display = 'block';
    
    // Animate in
    requestAnimationFrame(() => {
      calendar.classList.add('booking__datepicker--open');
    });
    
    // Set initial date if input has value
    const currentValue = this.elements.dateInput.value;
    if (currentValue) {
      const date = DateUtils.parseDate(currentValue);
      if (date && DateUtils.isValidFutureDate(date)) {
        privateState.selectedDate = date;
        privateState.currentMonth = date.getMonth();
        privateState.currentYear = date.getFullYear();
        this.updateCalendarView();
      }
    }
  }

  /**
   * Close date picker
   */
  closeDatePicker() {
    const privateState = this.#private.get(this);
    const calendar = this.elements.calendar;
    
    if (!calendar || !privateState.isOpen) return;
    
    privateState.isOpen = false;
    calendar.classList.remove('booking__datepicker--open');
    
    // Animate out
    setTimeout(() => {
      if (!privateState.isOpen) {
        calendar.style.display = 'none';
      }
    }, DATEPICKER_CONFIG.ANIMATION_DURATION);
  }

  /**
   * Setup click outside handler
   */
  setupClickOutside() {
    document.addEventListener('click', (e) => {
      const privateState = this.#private.get(this);
      if (!privateState.isOpen) return;
      
      const calendar = this.elements.calendar;
      const input = this.elements.dateInput;
      
      if (!calendar?.contains(e.target) && !input?.contains(e.target)) {
        this.closeDatePicker();
      }
    });
  }

  /**
   * Dispatch date change event
   */
  dispatchDateChange(date) {
    const event = new CustomEvent('datepicker:change', {
      detail: { date, formattedDate: DateUtils.formatDate(date) },
      bubbles: true
    });
    
    this.elements.dateInput.dispatchEvent(event);
  }
}

/**
 * Initialize datepicker when DOM is ready
 */
const initBookingDatePicker = async () => {
  const maxRetries = 10;
  let attempts = 0;

  const tryInit = async () => {
    attempts++;

    try {
      const datePicker = new BookingDatePicker();
      const success = await datePicker.init();
      
      if (success) {
        return true;
      }
    } catch (error) {
      console.error('❌ DatePicker init error:', error);
    }

    if (attempts < maxRetries) {
      setTimeout(tryInit, 500);
    } else {
      console.error('❌ DatePicker: Maximum initialization attempts reached');
    }
    
    return false;
  };

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInit);
  } else {
    await tryInit();
  }
};

// Auto-initialize
initBookingDatePicker();

// Export for manual initialization if needed
window.BookingDatePicker = BookingDatePicker;
window.initBookingDatePicker = initBookingDatePicker; 
const listeners = {};

const addEventListener = jest.fn((eventType, callback) => {
  listeners[eventType] = listeners[eventType] || [];
  listeners[eventType].push(callback);
});

const removeEventListener = jest.fn((eventType, callback) => {
  listeners[eventType] = (listeners[eventType] || []).filter(cb => cb !== callback);
});

function __emit(eventType, ...args) {
  (listeners[eventType] || []).forEach(cb => cb(...args));
}

function __reset() {
  Object.keys(listeners).forEach(key => delete listeners[key]);
}

module.exports = {
  voices: jest.fn(() => Promise.resolve([])),
  setDefaultLanguage: jest.fn(() => Promise.resolve()),
  speak: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  addEventListener,
  removeEventListener,
  __emit,
  __reset,
};

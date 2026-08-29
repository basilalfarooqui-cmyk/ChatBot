module.exports = {
  voices: jest.fn(() => Promise.resolve([])),
  setDefaultLanguage: jest.fn(() => Promise.resolve()),
  speak: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
};

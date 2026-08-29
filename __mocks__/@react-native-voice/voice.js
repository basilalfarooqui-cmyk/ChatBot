module.exports = {
  isAvailable: jest.fn(() => Promise.resolve(1)),
  getSpeechRecognitionServices: jest.fn(() => Promise.resolve([])),
  start: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  destroy: jest.fn(() => Promise.resolve()),
  removeAllListeners: jest.fn(),
  onSpeechResults: null,
  onSpeechError: null,
  onSpeechEnd: null,
};

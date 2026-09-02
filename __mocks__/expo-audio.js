const React = require('react');

let mockRecorder = null;
let mockPlayer = null;

function createMockRecorder() {
  return {
    uri: null,
    isRecording: false,
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    record: jest.fn(function () {
      this.isRecording = true;
      this.uri = 'file://mock-recording.m4a';
    }),
    stop: jest.fn(function () {
      this.isRecording = false;
      return Promise.resolve();
    }),
  };
}

function createMockPlayer() {
  const listeners = new Set();
  const player = {
    playing: false,
    replace: jest.fn(source => {
      player.__source = source;
    }),
    play: jest.fn(() => {
      player.playing = true;
      listeners.forEach(fn => fn());
    }),
    pause: jest.fn(() => {
      player.playing = false;
      listeners.forEach(fn => fn());
    }),
    seekTo: jest.fn(() => Promise.resolve()),
    __listeners: listeners,
  };
  return player;
}

function useAudioRecorder() {
  if (!mockRecorder) mockRecorder = createMockRecorder();
  return mockRecorder;
}

function useAudioPlayer() {
  if (!mockPlayer) mockPlayer = createMockPlayer();
  return mockPlayer;
}

function useAudioPlayerStatus(player) {
  const [, forceRender] = React.useState(0);
  React.useEffect(() => {
    const listener = () => forceRender(x => x + 1);
    player.__listeners.add(listener);
    return () => player.__listeners.delete(listener);
  }, [player]);
  return { playing: player.playing, isLoaded: true, currentTime: 0, duration: 0 };
}

const RecordingPresets = { HIGH_QUALITY: {}, LOW_QUALITY: {} };

const requestRecordingPermissionsAsync = jest.fn(() => Promise.resolve({ granted: true }));
const setAudioModeAsync = jest.fn(() => Promise.resolve());

function __reset() {
  mockRecorder = null;
  mockPlayer = null;
  requestRecordingPermissionsAsync.mockClear();
  requestRecordingPermissionsAsync.mockImplementation(() => Promise.resolve({ granted: true }));
  setAudioModeAsync.mockClear();
}

module.exports = {
  useAudioRecorder,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  __reset,
  __getMockRecorder: () => mockRecorder,
  __getMockPlayer: () => mockPlayer,
};

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

// @expo/vector-icons loads fonts async and calls setState after mount, which
// triggers "not wrapped in act(...)" warnings in every test that renders an
// icon. Swap it for a plain Text stand-in so no font loading happens.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const createIconSet = iconSetName =>
    function MockIcon(props) {
      return React.createElement(Text, props, iconSetName);
    };
  return new Proxy({}, { get: (_target, iconSetName) => createIconSet(iconSetName) });
});

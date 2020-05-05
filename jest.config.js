module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|react-navigation|@react-navigation|@react-native-community))',
  ],
  globals: {
    __DEV__: true,
  },
  timers: 'fake',
}

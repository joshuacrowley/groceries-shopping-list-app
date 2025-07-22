module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // React Native Reanimated plugin should be last
      "react-native-reanimated/plugin",
    ],
  };
};
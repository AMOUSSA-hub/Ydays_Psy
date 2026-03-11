module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Ensure nativewind/babel is the last plugin and explicitly resolved
      require.resolve('nativewind/babel'),
    ],
  };
};
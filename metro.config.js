// Temporarily disable NativeWind to test touch issues
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;

// ORIGINAL CONFIG WITH NATIVEWIND:
// const { withNativeWind } = require("nativewind/metro");
// module.exports = withNativeWind(config, { input: "./global.css" });

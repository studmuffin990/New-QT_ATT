const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite loads its browser SQLite engine as a WebAssembly asset.
config.resolver.assetExts.push('wasm');

module.exports = config;

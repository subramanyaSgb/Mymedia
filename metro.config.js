// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle: bundle .sql migration files as source so they can be inline-imported.
config.resolver.sourceExts.push('sql');

module.exports = config;

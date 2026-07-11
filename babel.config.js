module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle: inline .sql migration files as strings (RN can't read them off disk).
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};

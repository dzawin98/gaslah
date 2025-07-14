// Buat model untuk settings
module.exports = (sequelize, DataTypes) => {
  const Settings = sequelize.define('Settings', {
    key: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    value: {
      type: DataTypes.TEXT
    }
  });
  return Settings;
};
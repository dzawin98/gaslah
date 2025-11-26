module.exports = (sequelize, DataTypes) => {
  const WahaConfig = sequelize.define('WahaConfig', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    baseUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    session: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sendDelayMs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5000
    }
  }, {
    tableName: 'waha_configs',
    timestamps: true
  });

  return WahaConfig;
};
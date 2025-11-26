module.exports = (sequelize, DataTypes) => {
  const MessageTemplate = sequelize.define('MessageTemplate', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('maintenance', 'payment', 'promotion', 'general'),
      allowNull: false,
      defaultValue: 'general'
    },
    scope: {
      type: DataTypes.ENUM('broadcast', 'transaction', 'customer'),
      allowNull: false,
      defaultValue: 'broadcast'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'message_templates',
    timestamps: true
  });

  return MessageTemplate;
};
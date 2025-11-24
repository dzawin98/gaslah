module.exports = (sequelize, DataTypes) => {
  const MessageLog = sequelize.define('MessageLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM('new_customer', 'transaction', 'manual'),
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    chatId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('sent', 'failed'),
      allowNull: false
    },
    endpoint: {
      type: DataTypes.STRING,
      allowNull: true
    },
    session: {
      type: DataTypes.STRING,
      allowNull: true
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'message_logs',
    timestamps: true
  });

  MessageLog.associate = function(models) {
    MessageLog.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
  };

  return MessageLog;
};
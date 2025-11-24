"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('message_templates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('maintenance', 'payment', 'promotion', 'general'),
        allowNull: false,
        defaultValue: 'general'
      },
      scope: {
        type: Sequelize.ENUM('broadcast', 'transaction', 'customer'),
        allowNull: false,
        defaultValue: 'broadcast'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('message_templates');
  }
};
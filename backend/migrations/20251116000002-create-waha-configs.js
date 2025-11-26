"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('waha_configs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      baseUrl: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      },
      session: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      },
      apiKey: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sendDelayMs: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5000
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
    await queryInterface.dropTable('waha_configs');
  }
};
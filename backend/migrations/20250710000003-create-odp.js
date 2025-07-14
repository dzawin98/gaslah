'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('ODPs', {
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
      location: {
        type: Sequelize.STRING,
        allowNull: false
      },
      area: {
        type: Sequelize.STRING,
        allowNull: false
      },
      totalSlots: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 8
      },
      usedSlots: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      // Tambahkan kolom lainnya sesuai dengan file asli
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
<<<<<<<< HEAD:backend/migrations/20250713151223-create-odps.js

  async down (queryInterface, Sequelize) {
========
  async down(queryInterface, Sequelize) {
>>>>>>>> 29c19e4c47fa75f62a5e62ea7773fe66f86380cc:backend/migrations/20250710000003-create-odp.js
    await queryInterface.dropTable('ODPs');
  }
};
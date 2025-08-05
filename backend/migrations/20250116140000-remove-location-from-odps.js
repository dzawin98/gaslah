'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ODPs', 'location');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('ODPs', 'location', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });
  }
};
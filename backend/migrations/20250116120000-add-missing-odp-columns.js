'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ODPs', 'availableSlots', {
      type: Sequelize.INTEGER,
      defaultValue: 8,
      allowNull: false
    });
    
    await queryInterface.addColumn('ODPs', 'latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true
    });
    
    await queryInterface.addColumn('ODPs', 'longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true
    });
    
    await queryInterface.addColumn('ODPs', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'active',
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ODPs', 'availableSlots');
    await queryInterface.removeColumn('ODPs', 'latitude');
    await queryInterface.removeColumn('ODPs', 'longitude');
    await queryInterface.removeColumn('ODPs', 'status');
  }
};
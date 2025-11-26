'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add availableSlots to ODPs table
    await queryInterface.addColumn('ODPs', 'availableSlots', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 8
    });

    // Add latitude to ODPs table
    await queryInterface.addColumn('ODPs', 'latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true
    });

    // Add longitude to ODPs table
    await queryInterface.addColumn('ODPs', 'longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true
    });

    // Add status to ODPs table
    await queryInterface.addColumn('ODPs', 'status', {
      type: Sequelize.ENUM('active', 'maintenance', 'inactive'),
      allowNull: false,
      defaultValue: 'active'
    });

    // Add salesId to Packages table
    await queryInterface.addColumn('Packages', 'salesId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Sales',
        key: 'id'
      }
    });

    // Add commissionType to Packages table
    await queryInterface.addColumn('Packages', 'commissionType', {
      type: Sequelize.ENUM('percentage', 'nominal'),
      allowNull: false,
      defaultValue: 'percentage'
    });

    // Add commissionValue to Packages table
    await queryInterface.addColumn('Packages', 'commissionValue', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns from ODPs table
    await queryInterface.removeColumn('ODPs', 'availableSlots');
    await queryInterface.removeColumn('ODPs', 'latitude');
    await queryInterface.removeColumn('ODPs', 'longitude');
    await queryInterface.removeColumn('ODPs', 'status');

    // Remove columns from Packages table
    await queryInterface.removeColumn('Packages', 'salesId');
    await queryInterface.removeColumn('Packages', 'commissionType');
    await queryInterface.removeColumn('Packages', 'commissionValue');
  }
};
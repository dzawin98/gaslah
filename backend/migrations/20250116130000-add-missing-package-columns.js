'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Packages', 'salesId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Sales',
        key: 'id'
      }
    });
    
    await queryInterface.addColumn('Packages', 'commissionType', {
      type: Sequelize.ENUM('percentage', 'nominal'),
      allowNull: false,
      defaultValue: 'percentage'
    });
    
    await queryInterface.addColumn('Packages', 'commissionValue', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Packages', 'salesId');
    await queryInterface.removeColumn('Packages', 'commissionType');
    await queryInterface.removeColumn('Packages', 'commissionValue');
  }
};
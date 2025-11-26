'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change amount column from DECIMAL(10,2) to INTEGER
    await queryInterface.changeColumn('Transactions', 'amount', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: change amount column back to DECIMAL(10,2)
    await queryInterface.changeColumn('Transactions', 'amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
  }
};
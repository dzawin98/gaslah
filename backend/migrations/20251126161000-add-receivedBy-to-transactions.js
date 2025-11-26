'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    let tableDesc;
    try {
      tableDesc = await queryInterface.describeTable('Transactions');
    } catch (err) {
      tableDesc = null;
    }

    if (tableDesc && !tableDesc.receivedBy) {
      await queryInterface.addColumn('Transactions', 'receivedBy', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    let tableDesc;
    try {
      tableDesc = await queryInterface.describeTable('Transactions');
    } catch (err) {
      tableDesc = null;
    }

    if (tableDesc && tableDesc.receivedBy) {
      await queryInterface.removeColumn('Transactions', 'receivedBy');
    }
  }
};


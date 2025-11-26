'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: only remove if table and column exist
    let tableDesc;
    try {
      tableDesc = await queryInterface.describeTable('ODPs');
    } catch (err) {
      tableDesc = null;
    }

    if (tableDesc && tableDesc.location) {
      await queryInterface.removeColumn('ODPs', 'location');
    }
  },

  async down(queryInterface, Sequelize) {
    // Re-add column if missing
    let tableDesc;
    try {
      tableDesc = await queryInterface.describeTable('ODPs');
    } catch (err) {
      tableDesc = null;
    }

    if (tableDesc && !tableDesc.location) {
      await queryInterface.addColumn('ODPs', 'location', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: ''
      });
    }
  }
};
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      customerNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      idNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      area: {
        type: Sequelize.STRING,
        allowNull: false
      },
      package: {
        type: Sequelize.STRING,
        allowNull: false
      },
      packagePrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      addonPrice: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      discount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      pppSecret: {
        type: Sequelize.STRING,
        allowNull: true
      },
      pppSecretType: {
        type: Sequelize.ENUM('existing', 'new', 'none'),
        defaultValue: 'none'
      },
      odpSlot: {
        type: Sequelize.STRING,
        allowNull: true
      },
      odpId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ODPs',
          key: 'id'
        }
      },
      billingType: {
        type: Sequelize.ENUM('prepaid', 'postpaid'),
        defaultValue: 'prepaid'
      },
      activePeriod: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      activePeriodUnit: {
        type: Sequelize.ENUM('days', 'months'),
        defaultValue: 'months'
      },
      installationStatus: {
        type: Sequelize.ENUM('not_installed', 'installed'),
        defaultValue: 'not_installed'
      },
      serviceStatus: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'inactive'
      },
      activeDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      expireDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      paymentDueDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'suspended', 'terminated', 'pending'),
        defaultValue: 'pending'
      },
      isIsolated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      routerName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      routerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'routers',
          key: 'id'
        }
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      billingStatus: {
        type: Sequelize.ENUM('belum_lunas', 'lunas', 'suspend'),
        defaultValue: 'belum_lunas',
        allowNull: false
      },
      lastBillingDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextBillingDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      mikrotikStatus: {
        type: Sequelize.ENUM('active', 'disabled'),
        defaultValue: 'active',
        allowNull: false
      },
      lastSuspendDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isProRataApplied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      proRataAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
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

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('customers');
  }
};

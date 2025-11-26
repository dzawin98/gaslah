'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Define associations here if needed
    }

    // Instance method to check password
    async validatePassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Instance method to increment login attempts
    async incrementLoginAttempts() {
      // If we have a previous lock that has expired, restart at 1
      if (this.lockedUntil && this.lockedUntil < new Date()) {
        return this.update({
          loginAttempts: 1,
          lockedUntil: null
        });
      }
      
      const updates = { loginAttempts: this.loginAttempts + 1 };
      
      // If we have exceeded max attempts and it's not locked already, lock the account
      if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.lockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // Lock for 2 hours
      }
      
      return this.update(updates);
    }

    // Instance method to reset login attempts
    async resetLoginAttempts() {
      return this.update({
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date()
      });
    }

    // Virtual property to check if account is locked
    get isLocked() {
      return !!(this.lockedUntil && this.lockedUntil > new Date());
    }

    // Method to get user data without sensitive information
    toSafeObject() {
      const { id, username, email, fullName, role, isActive, lastLogin, createdAt } = this;
      return { id, username, email, fullName, role, isActive, lastLogin, createdAt };
    }
  }

  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [2, 100]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'operator', 'viewer'),
      allowNull: false,
      defaultValue: 'operator'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  return User;
};
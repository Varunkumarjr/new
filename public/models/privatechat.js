// models/privatechat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PrivateChat = sequelize.define('PrivateChat', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sender: { type: DataTypes.STRING, allowNull: false },
  receiver: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false }
});

module.exports = PrivateChat;

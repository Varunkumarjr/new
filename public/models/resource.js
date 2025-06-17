// models/resource.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Resource = sequelize.define('Resource', {
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  data: { type: DataTypes.STRING, allowNull: false }
});

module.exports = Resource;

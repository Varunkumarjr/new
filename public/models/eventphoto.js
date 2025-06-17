// models/eventphoto.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const EventPhoto = sequelize.define('EventPhoto', {
  url: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'all' }
});

module.exports = EventPhoto;

// models/bloglike.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const BlogLike = sequelize.define('BlogLike', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  blogId: { type: DataTypes.INTEGER, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: false }
});

module.exports = BlogLike;

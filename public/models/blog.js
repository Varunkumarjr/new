// models/blog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Blog = sequelize.define('Blog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  image: { type: DataTypes.STRING, allowNull: true },
  likes: { type: DataTypes.INTEGER, defaultValue: 0 }
});

module.exports = Blog;

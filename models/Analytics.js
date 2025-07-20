const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM('view', 'play', 'download', 'like', 'share', 'comment'),
    allowNull: false
  },
  session_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'analytics',
  timestamps: true
});

module.exports = Analytics; 
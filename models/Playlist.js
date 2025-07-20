const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Playlist = sequelize.define('Playlist', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  cover_image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  total_items: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'playlists',
  timestamps: true
});

module.exports = Playlist; 
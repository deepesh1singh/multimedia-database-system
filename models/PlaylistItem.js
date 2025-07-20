const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const PlaylistItem = sequelize.define('PlaylistItem', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  playlist_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'playlists',
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
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  added_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'playlist_items',
  timestamps: true
});

module.exports = PlaylistItem; 
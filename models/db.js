const config = require('../config.json');
const log = require('../lib/log');
const Sequelize = require('sequelize');

const sql = new Sequelize(config.database.database, config.database.username, config.database.password,
    Object.assign(config.database.options, {logging: log.sql}));

const Battletag = sql.define('battleTag', {
    userId: Sequelize.STRING,
    battleTag: Sequelize.STRING
});

const TagChannel = sql.define('tagChannel', {
    guildId: Sequelize.STRING,
    channelId: Sequelize.STRING
});

module.exports = {connection: sql.sync(), Battletag, TagChannel};

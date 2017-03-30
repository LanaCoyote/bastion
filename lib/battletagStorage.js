const log = require('./log');
const {Battletag, TagChannel} = require('../models/db');

const tagPattern = /\w+#\d{3,6}/;
let tagChannelCache = {};

function updateBattleTag(userId, battleTag) {
    if (userId.id) userId = userId.id;
    return Battletag.findOrCreate({where: {userId}, defaults: {battleTag}})
        .spread((record, created) => {
            if (created) return record;
            record.battleTag = battleTag;
            return record.save();
        });
}

function fetchBattleTag(userId) {
    if (userId.id) userId = userId.id;
    return Battletag.findOne({where: {userId}})
        .then(record => {
            if (!record) return null;
            return record.battleTag;
        });
}

function updateBattleTagsFromChannel(channel, start) {
    let query = {limit: 100};
    if (start) query.before = start;
    return channel.fetchMessages(query)
        .then(messages => Promise.all(messages.map(message => {
            log.debug("checking message:", message.content);
            if (isMessageInTagChannel(message)) return updateBattleTagFromMessage(message);
        })))
        .then(updated => {
            log.debug(`Updated ${updated.filter(x => x).length} Battletags!`);
        })
}

function isMessageInTagChannel(message) {
    return tagChannelCache[message.guild.id] && tagChannelCache[message.guild.id] === message.channel.id;
}

function updateBattleTagFromMessage(message) {
    let battleTag = message.content.match(tagPattern);
    if (!battleTag) return;
    battleTag = battleTag[0];

    return updateBattleTag(message.author.id, battleTag)
        .then(() => log.debug(`Updated ${message.member.displayName}'s Battletag to ${battleTag}`));
}

function addTagChannel(channel) {
    return TagChannel.findOrCreate({where: {guildId: channel.guild.id}, defaults: {channelId: channel.id}})
        .then((record, created) => {
            if (!created) {
                log.debug(`adding ${channel.name} as a tagchannel`);
                tagChannelCache[channel.guild.id] = channel.id;
            } else {
                record.channelId = channel.id;
                return record.save();
            }
        });
}

function removeTagChannel(channel) {
    return TagChannel.findOne({where: {guildId: channel.guild.id}})
        .then(record => {
            if (!record) return;
            log.debug(`removing ${channel.name} from the tagchannels`);
            delete tagChannelCache[channel.guild.id];
            return record.destroy();
        });
}

function loadTagChannelCache() {
    return TagChannel.findAll({})
        .then(records => {
            tagChannelCache = records.reduce((groups, row) => {
                groups[row.guildId] = row.channelId;
                return groups;
            }, {});
        });
}

module.exports = {
    updateBattleTag,
    fetchBattleTag,
    isMessageInTagChannel,
    updateBattleTagsFromChannel,
    updateBattleTagFromMessage,
    addTagChannel,
    removeTagChannel,
    loadTagChannelCache
};

const Promise = require('bluebird');
const battletag = require('../lib/battletagStorage');

const battleTagPattern = /^\w+#|-\d{3,6}$/;

function get(message) {
    const user = message.mentions.users.first();
    if (!user) return message.reply("you need to mention a user to get the Battletag for");
    return battletag.fetchBattleTag(user)
        .then(tag => {
            if (!tag) return message.channel.send(`${user.username} does not have a Battletag set yet!`);
            return message.channel.send(tag);
        });
}

function set(message) {
    const battleTag = message.content.split(" ")[2];
    if (!battleTag) return message.reply("you must provide a Battletag to set");
    if (battleTag === "channel") {
        return Promise.join(
            battletag.updateBattleTagsFromChannel(message.channel),
            battletag.addTagChannel(message.channel)
        );
    }
    if (!battleTagPattern.match(battleTag)) return message.reply("the Battletag you specified is invalid");
    return battletag.updateBattleTag(message.author.id, battleTag)
        .then(() => message.reply("your new Battletag has been set"));
}

function remove(message, params) {
    return params[1] === "channel" && battletag.removeTagChannel(message.channel);
}

module.exports = {
    alias: ['battletag'],
    handler: function(message, params) {
        if (params[0] === "set") return set(message);
        if (params[0] === "remove") return remove(message, params);
        return get(message);
    },

    help: {
        usage: "@<SomeUser> | set <Battletag>",
        description: "Gets the Battletag of a user or sets your Battletag"
    }
};

const overwatch = require('overwatch-js');
const RichEmbed = require('discord.js').RichEmbed;

const drawStatGrid = require('../lib/statgrid');
const log = require('../lib/log');

const battleTagPattern = /^\w+#|-\d{3,6}$/;

class OverwatchStatsError extends Error {
    constructor(code, message) {
        this.code = code;
        super(message);
    }
}

function getProfileByTag(tag, region) {
    if (!tag) throw new Error("Attempted to get Overwatch profile where no tag was provided");
    if (tag.includes('#')) tag = tag.replace('#', '-');
    region = region || "us";

    return overwatch.getAll("pc", region, tag)
}

function collectStats(message, params) {
    if (!params[0]) return message.reply("you must provide a Battletag!");
    if (!battleTagPattern.test(params[0])) return message.reply("the Battletag you provided is invalid!");

    try {
        return getProfileByTag(params[0], params[1])
            .then(profile => {
                return drawStatGrid(profile).then(buffer => {
                    const response = `Stats for ${profile.profile.nick} | Level ${profile.profile.level} | `
                        + (isNaN(profile.profile.rank) ? "Unranked" : `Rank ${profile.profile.rank}`)
                        + `\n<${profile.profile.url}>`;
                    message.channel.sendFile(buffer, profile.profile.nick + ".png", response);
                });
            })
            .catch(err => {
                if (err.message === "PROFILE_NOT_FOUND") {
                    return message.reply("that profile doesn't exist!");
                } else {
                    log.error(err);
                    return this.fetchUser("160504921781829643")
                        .then(lana => lana && lana.sendMessage("Error: " + message.content));
                }
            });
    } catch (err) {
        log.error(err);
    }
}

module.exports = {
    alias: ["stats", "profile"],
    handler: collectStats
};

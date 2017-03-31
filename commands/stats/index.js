const overwatch = require('overwatch-js');
const Promise = require('bluebird');

const battletag = require('../../lib/battletagStorage');
const drawStatGrid = require('../../lib/statgrid');
const log = require('../../lib/log');
const Mapper = require('./mapper');

const battleTagPattern = /^\w+#|-\d{3,6}$/;

function getBattleTag(message, params) {
    const user = message.mentions.users.first();
    if (params[0] && !user) {
        if (!battleTagPattern.test(params[0])) return message.reply("the Battletag you provided is invalid!");
        return Promise.resolve(params[0]);
    } else {
        const userId = user ? user.id : message.author.id;
        if (userId === "296764768197279744") return Promise.resolve('self');
        return battletag.fetchBattleTag(userId);
    }
}

function getProfileByTag(tag, mapper) {
    if (!tag) throw new Error("Attempted to get Overwatch profile where no tag was provided");
    if (tag.includes('#')) tag = tag.replace('#', '-');
    if (tag === 'self') return Promise.resolve(fakeAssProfile());

    return overwatch.getAll("pc", mapper.region || "us", tag)
}

function fakeAssProfile() {
    return {
        profile: {nick: "SaltPoweredRobot", level: 99, rank: 5096, avatar: "https://blzgdapipro-a.akamaihd.net/game/unlocks/0x02500000000008B8.png", url: ""},
        competitive: {global: {
            solo_kills_average: 69,
            eliminations_average: 69,
            damage_done_average: 420000,
            deaths_average: 0,
            final_blows_average: 69,
            healing_done_average: 0,
            objective_kills_average: 42,
            objective_time_average: 60 * 60 * 1000,
            games_won: 1,
            games_lost: 0
        }}
    };
}

function getSubtitle(profile, mapper) {
    let subtitle = "";
    if (mapper.gamemode === "competitive") {
        if (isNaN(profile.profile.rank)) subtitle += "Unranked";
        else subtitle += `Rank ${profile.profile.rank}`;
    } else {
        subtitle += "Quick Play";
    }

    if (mapper.hero) {
        subtitle += " | " + (mapper.hero[0].toUpperCase() + mapper.hero.slice(1).replace('_',' '));
    }

    return subtitle;
}

function collectStats(message, params) {
    return getBattleTag(message, params).then(battleTag => {
        if (battleTag === null) return params[0] ?
            message.reply("that user does not have a Battletag set") :
            message.reply("you don't have a Battletag set! Use `!battletag set <your battletag>` to set one");
        if (typeof battleTag !== "string") return;
        const mapper = new Mapper(battleTag, params.slice(1));
        return getProfileByTag(battleTag, mapper)
            .then(profile => {
                return drawStatGrid(mapper.mapProfileToStats(profile)).then(buffer => {
                    const response = `Stats for ${profile.profile.nick} | Level ${profile.profile.level} | `
                        + getSubtitle(profile, mapper)
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
    });
}

module.exports = {
    alias: ["stats", "profile"],
    handler: collectStats,

    help: {
        usage: "<Battletag>|@<SomeUser> [qp|comp|quickplay|competitive|casual] [<Hero>]",
        description: "Gets someone's stats by Battletag"
    }
};

const _ = require('lodash');

const propertyMap = {
    region: ["us", "eu", "ptr"],
    gamemode: ["competitive", "comp", "casual", "quickplay", "qp"]
};

const heroMap = {
    "torbjörn": ["torbjorn", "toblerone", "torb"],
    "soldier:_76": ["soldier_76", "soldier", "soldier76", "76", "cod"],
    "lúcio": ["lucio", "blackscout"],
    "d.va": ["dva"],
    "genji": ["weeb"],
    "reinhardt": ["rein"]
};

class OverwatchStatsMapper {
    constructor(battleTag, params) {
        this.battleTag = battleTag;

        const extend = params.reduce((props, param) => {
            const property = _.findKey(propertyMap, values => values.includes(param));
            if (property) props[property] = param;
            else props.hero = param;
            return props;
        }, _.mapValues(propertyMap, values => values[0]));
        Object.assign(this, extend);
        if (!this.region) this.region = "us";

        const heroAlias = _.findKey(heroMap, values => values.includes(this.hero));
        if (heroAlias) this.hero = heroAlias;
    }

    mapProfileToStats(profile) {
        let ptrProfile = profile;

        if (!this.gamemode || this.gamemode.startsWith("comp")) this.gamemode = "competitive";
        else this.gamemode = "quickplay";
        ptrProfile = ptrProfile[this.gamemode];

        if (this.hero) {
            this.hero = ptrProfile.heroes[this.hero] ? this.hero : null;
            ptrProfile = ptrProfile.heroes[this.hero] || ptrProfile.global;
        } else ptrProfile = ptrProfile.global;

        return {stats: ptrProfile, profile: profile.profile, gamemode: this.gamemode, hero: this.hero};
    }
}

module.exports = OverwatchStatsMapper;

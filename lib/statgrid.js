const Jimp = require('jimp');
const Promise = require('bluebird');
const request = require('request-promise');

function drawBaseImage() {
    return new Promise((ok,fail) => {
        new Jimp(610, 335, 0x405275FF, function(err, image) {
            if (err) return fail(err);
            return ok(image);
        });
    });
}

function drawNameOnImage(image, profile) {
    const rank = isNaN(profile.profile.rank) ? "Unranked" : profile.profile.rank;
    const deets = `Level: ${profile.profile.level} | Rank: ${rank}`;

    return Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
        .then(nickFont => {
            return Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
                .then(deetsFont => {
                    image.print(nickFont, 84, 10, profile.profile.nick);
                    image.print(deetsFont, 84, 52, deets);
                    return image;
                });
        });
}

function drawAvatarOnImage(image, avatarUrl) {
    return Jimp.read(avatarUrl).then(avatar => {
        avatar.resize(64, 64);
        image.blit(avatar, 10, 10);
        return image;
    });
}

function createStatBlock(name, value) {
    return new Promise((ok,fail) => {
        new Jimp(185, 75, 0x3c4860FF, function(err, image) {
            if (err) return fail(err);
            Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
                .then(valueFont => {
                    image.print(valueFont, 10, 10, value);
                    return Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
                })
                .then(nameFont => {
                    image.print(nameFont, 10, 50, name);
                    ok(image);
                });
        });
    });
}

function padZero(num) {
    if (num >= 10) return num.toString();
    return '0' + num;
}

function getDateString(date) {
    date = new Date(date);
    let timeString = padZero(date.getUTCSeconds());
    if (date.getUTCMinutes()) timeString = padZero(date.getUTCMinutes()) + ':' + timeString;
    else timeString = "00:" + timeString;
    if (date.getUTCHours()) timeString = date.getUTCHours() + ':' + timeString;
    return timeString;
}

function drawStatGridOnImage(image, profile) {
    const wlRatio = profile.competitive.global.games_won / profile.competitive.global.games_lost;
    const objTimeString = getDateString(profile.competitive.global.objective_time_average);
    const statBlocks = [
        {name: "Avg Solo Kills", value: profile.competitive.global.solo_kills_average},
        {name: "Avg Eliminations", value: profile.competitive.global.eliminations_average},
        {name: "Avg Damage", value: profile.competitive.global.damage_done_average},
        {name: "Avg Deaths", value: profile.competitive.global.deaths_average},
        {name: "Avg Kills Stolen", value: profile.competitive.global.final_blows_average},
        {name: "Avg Healing", value: profile.competitive.global.healing_done_average},
        {name: "Avg Objective Kills", value: profile.competitive.global.objective_kills_average},
        {name: "Avg Objective Time", value: objTimeString},
        {name: "Win/Loss Ratio", value: wlRatio.toFixed(2)}
    ];

    return Promise.map(statBlocks, stat => createStatBlock(stat.name, stat.value ? stat.value.toString() : '0'))
        .map((statBlock, idx) => {
            const x = (idx % 3) * 195 + 15;
            const y = Math.floor(idx / 3) * 85 + 80;
            return image.blit(statBlock, x, y);
        })
        .return(image);
}

function drawStatGrid(profile) {
    return drawBaseImage()
        .then(image => Promise.join(
            drawNameOnImage(image, profile),
            drawAvatarOnImage(image, profile.profile.avatar),
            drawStatGridOnImage(image, profile),
            image => new Promise((ok, fail) => image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                if (err) return fail(err);
                ok(buffer);
            }))
        ));
}

module.exports = drawStatGrid;

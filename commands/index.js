const fs = require('fs');
const Promise = require('bluebird');

const Command = require('../models/command');
const log = require('../lib/log');

const COMMAND_PATH = __dirname;
const STATIC_COMMANDS = [
    new Command({alias: ["hook2.0", "roadhog"], handler:
        message => message.channel.send("https://clips.twitch.tv/CogentFreezingVultureWholeWheat")}),
    new Command({alias: ["orisa"], handler: message => message.channel.send("https://gfycat.com/AdorableObviousCondor")}),
    new Command({alias: ["dva"], handler: message => message.channel.send("https://gfycat.com/TerribleBoilingKudu")}),
    new Command({alias: ["rein"], handler: message => message.channel.send("http://i.imgur.com/1gJ0lVN.jpg")}),
    new Command({alias: ["healing"], handler:
        message => message.channel.send("https://soundcloud.com/roymakesmusic/every-overwatch-need-healing-at-the-same-time")})
];

function loadCommands() {
    log.debug("Loading commands in", COMMAND_PATH, "...");
    return new Promise((ok, fail) => fs.readdir(COMMAND_PATH, (err, files) => err ? fail(err) : ok(files)))
        .map(fileToCommand)
        .then(commands => commands.concat(STATIC_COMMANDS).filter(command => command instanceof Command))
        .tap((commands) => log.debug("Loaded", commands.length, "commands!"));
}

function reloadCommands(bot) {
    log.debug("Unloading prepared commands...");
    bot.commands.forEach(command => {
        delete require.cache[require.resolve('./' + command.filename)];
    });
    log.debug("Unloaded", bot.commands.length, "commands!");
    return loadCommands().tap(commands => {
        bot.commands = commands;
    });
}

function fileToCommand(filename) {
    // validate incoming filenames
    if (filename === 'index.js') return;
    let splitName = filename.split('.');
    let extension = splitName.pop();
    if (splitName.length && extension !== 'js' && extension !== 'node') return;

    // attempt to build a command from module.exports
    try {
        let commandDef = require('./' + filename);
        if (!Object.keys(commandDef).length) return log.error("Command definition not exported:", filename);
        return new Command(commandDef, filename);
    } catch (err) {
        if (err instanceof Command.Error) return log.error(err.message + ':', filename);
        if (err.message.startsWith("Cannot find module")) return log.error("Invalid node module:", filename);
        log.error("Error loading command:", err.stack);
    }
}


module.exports = {
    loadCommands,
    reloadCommands
};

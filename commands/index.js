const fs = require('fs');
const Promise = require('bluebird');

const Command = require('../models/command');
const log = require('../lib/log');

const COMMAND_PATH = __dirname;

function loadCommands() {
    log.debug("Loading commands in", COMMAND_PATH, "...");
    return new Promise((ok, fail) => fs.readdir(COMMAND_PATH, (err, files) => err ? fail(err) : ok(files)))
        .map(fileToCommand)
        .then(commands => commands.filter(command => command instanceof Command))
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

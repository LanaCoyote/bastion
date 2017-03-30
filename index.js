const Discord = require('discord.js');
const Promise = require('bluebird');

const config = require('./config.json');
const commandLoader = require('./commands');
const log = require('./lib/log');

const bot = new Discord.Client();
const prefix = config.prefix || ';';

bot.errorCount = 0;

bot.on('ready', () => {
    log.info("Bot is online");
});

bot.on('message', message => {
    if (message.author.bot) return;
    if (message.content.startsWith(prefix)) {
        if (!bot.commands) return message.reply("Error loading commands");
        let argv = message.content.split(' '), executed;
        for (let idx in bot.commands) {
            if (bot.commands[idx].matches(argv[0].substr(1))) {
                executeCommand(bot.commands[idx], argv, message);
                executed = true;
                break;
            }
        }
        if (!executed) log.error("Command not found:", argv[0].substr(1));
    }
});

function executeCommand(command, argv, message) {
    let startTime = new Date(), commandName = command.help.name || argv[0].substr(1);

    try {
        let cmdProm = command.execute(message, argv.splice(1), bot);
        if (!(cmdProm instanceof Promise)) cmdProm = Promise.resolve(cmdProm);
        cmdProm.then(() => {
            let runtime = new Date() - startTime;
            log.info(`Executed command "${commandName}" in ${runtime}ms`);
        }).catch(err => {
            bot.errorCount++;
            log.error(`Encountered an error executing ${commandName}:`, err);
        });
    } catch (err) {
        bot.errorCount++;
        return log.error(`Critical error executing ${commandName}:`, err);
    }
}

log.debug("Initializing bot...");
commandLoader.loadCommands().then(cmds => {
    bot.commands = cmds;
    bot.login(config.token);
});

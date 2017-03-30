const prefix = require('../config.json').prefix;

function help(message) {
    let messageBod = "Beep broop beep:\n";
    this.commands.forEach(cmd => {
        if (cmd.help) {
            cmd.alias.forEach(alias => messageBod += `    ${prefix}${alias}  ${cmd.help.usage || ""}\n`);
            messageBod += (cmd.help.description || "") + '\n\n';
        }
    });

    message.channel.send(messageBod);
}

module.exports = {
    alias: ['help'],
    handler: help,

    help: {
        description: "Gets this list of commands"
    }
};

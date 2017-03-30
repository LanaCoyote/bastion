

class CommandError extends Error {
    constructor(message, def) {
        super(message);
        this.commandDef = def;
    }
}

class Command {
    constructor(commandDef, filename) {
        if (!commandDef.alias || !commandDef.handler) throw new CommandError("Invalid command definition", commandDef);
        if (!commandDef.handler instanceof Function) throw new CommandError("Handler is not a function", commandDef);
        this.alias = Array.isArray(commandDef.alias) ? commandDef.alias : [commandDef.alias];
        this._handler = commandDef.handler;
        this.help = commandDef.help || {};
        this.filename = filename;
    }

    matches(testStr) {
        return !!~this.alias.indexOf(testStr);
    }

    execute(message, params, bot) {
        return this._handler.call(bot, message, params);
    }
}

module.exports = Command;
module.exports.Error = CommandError;

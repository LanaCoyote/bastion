const chalk = require('chalk');

let logLevel = 3;

function log() {
    if (this.level === undefined) return console.error("nonstandard log used!!!");
    if (logLevel < this.level) return;
    let timestamp = getTimestamp();
    let outstring = [].slice.call(arguments).map(logArgToString).join(' ');
    let colorFn = this.colorFn || (str => str);
    console.log(timestamp, colorFn(this.label || " OUT: "), outstring);
}

function logArgToString(arg) {
    if (arg instanceof Error) return chalk.red(arg.stack || arg.toString());
    if (arg instanceof Object) return JSON.stringify(arg, null, 4);
    if (arg === undefined) return "undefined";
    if (arg === null) return "null";
    return arg.toString();
}

function getTimestamp() {
    let now = new Date();
    return '[' + (now.getMonth() + 1) + '/' + now.getDate() + ' ' + now.toTimeString().split(' ')[0] + ']';
}

function setLogLevel(level) {
    logLevel = level;
}

module.exports = {
    setLogLevel,

    error:  log.bind({level: 0, label: " ERR! ", colorFn: chalk.red.inverse}),
    warn:   log.bind({level: 1, label: " WARN ", colorFn: chalk.yellow.inverse}),
    info:   log.bind({level: 2, label: " INFO ", colorFn: chalk.green.inverse}),
    debug:  log.bind({level: 3, label: "DEBUG ", colorFn: chalk.bgWhite}),
    sql:    log.bind({level: 3, label: " ~SQL ", colorFn: chalk.blue}),
    logFactory: (def) => log.bind(def)
};
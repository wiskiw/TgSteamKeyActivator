const config = require("./config");
const utils = require("./utils");
const KeyActivator = require("./steam/key_activator.js");
const Telegram = require('./telegram/telegram-client');
const EventHandler = require('./telegram/event-handler');

const colors = require('colors');

// https://www.npmjs.com/package/colors
colors.setTheme({
    time: ['white', 'dim'],
    silly: 'rainbow',
    input: ['white', 'dim'],
    verbose: 'cyan',
    prompt: 'grey',
    info: ['green'],
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    steam_error: 'yellow',
    steam_warn: 'yellow',
    steam_ok: 'cyan',
    ok: 'cyan',
    tg_error: 'yellow',
    tg_warn: 'yellow',
    tg_ok: 'cyan',
    debug: 'blue',
    error: ['red']
});


Promise.resolve()
    .then(() => {
        return KeyActivator.init(config.steam_username, config.steam_password)
    })
    .then(() => {
        utils.log("Steam ready".inverse);
        //return KeyActivator.activate("TZFT3-JEZ6J-B68BG").catch(() => {})
    })
    .then(Telegram.init)
    .then(() => {
        utils.log("Telegram ready".inverse);
        //Telegram.showChats()
        //Telegram.showHistory("14589563643703868565", 1195028505, 3)
    })
    .then(EventHandler.loadHandlers)
    .then(EventHandler.startEventHandler)
    .then(() => {
        utils.log("Handlers ready".inverse);
    })
    .then(() => {
        utils.log("Launch complete, waiting for telegram messages".bgWhite.green.dim);
    })
    .catch((err) => {
        utils.log(("Runtime error:" + err).error);
        process.exit();
    });
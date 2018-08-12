const readlineSync = require("readline-sync");
const config = require("../config");
const utils = require("../utils");
const telegram = require('./init');

const colors = require('colors');

// https://www.npmjs.com/package/colors
colors.setTheme({
    time: ['white', 'dim'],
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
    tg_error: 'yellow',
    tg_warn: 'yellow',
    tg_ok: 'cyan',
    debug: 'blue',
    error: ['red']
});


const signUp = async () => {
    try {
        //await telegram.app.storage.clear();
        utils.log((" === TELEGRAM REGISTRATION (please enable dev server) === ").tg_ok);
        const phone = readlineSync.question('Phone: '.input);
        utils.log(("Requesting for auth key...").tg_ok);

        const {phone_code_hash} = await telegram.app('auth.sendCode', {
            phone_number: phone,
            current_number: false,
            api_id: config.tg_id,
            api_hash: config.tg_hash
        }, telegram.reqConf);

        const code = readlineSync.questionInt('Auth code: '.input);
        const firstName = readlineSync.question('First name: '.input);

        utils.log(("Checking Telegram auth key...").tg_ok);

        let res = await telegram.app('auth.signUp', {
            phone_number: phone,
            //sms_type: 5,
            first_name: firstName,
            phone_code_hash,
            phone_code: (code + "")
        }, telegram.reqConf);
        const {user} = res;

        utils.log(("Telegram user " + user.first_name.white + " sign up success!").tg_ok);
        return user
    } catch (error) {
        throw error
    }
};

signUp();
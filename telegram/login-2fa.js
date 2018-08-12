const crypto = require('crypto');
const readlineSync = require("readline-sync");
const config = require("../config");
const utils = require("../utils");
const telegram = require('./init');


const login = async (phone, password) => {
    try {
        //await telegram.app.storage.clear();
        utils.log(("Requesting for Telegram auth key...").tg_ok);

        const {phone_code_hash} = await telegram.app('auth.sendCode', {
            phone_number: phone,
            current_number: false,
            //sms_type: 5,
            api_id: config.tg_id,
            api_hash: config.tg_hash
        }, telegram.reqConf);

        const code = readlineSync.questionInt('Telegram auth code: '.input);

        utils.log(("Checking Telegram auth key...").tg_ok);

        let res;
        try {
            res = await telegram.app('auth.signIn', {
                phone_number: phone,
                //sms_type: 5,
                phone_code_hash,
                phone_code: (code + "")
            }, telegram.reqConf)

        } catch (error) {
            if (telegram.errorType(error) === "SESSION_PASSWORD_NEEDED") {

                utils.log(("Telegram password required").tg_warn);
                if (!password) password = readlineSync.question('Telegram password: '.input, {noEchoBack: true});

                utils.log(("Checking Telegram password...").tg_ok);
                const {current_salt} = await telegram.app('account.getPassword', {}, telegram.reqConf);
                const password_hash = crypto.createHash('sha256')
                    .update(current_salt + password + current_salt).digest();
                res = await telegram.app('auth.checkPassword', {
                    password_hash
                }, telegram.reqConf)

            } else {
                throw error;
            }
        }
        const {user} = res;

        console.log("res: " + JSON.stringify(res));
        //utils.log(("Telegram user " + res.user.first_name /*.white */+ " login success").tg_ok);
        return user
    } catch (error) {
        throw error
    }
};

module.exports = login;
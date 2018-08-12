var steamKey = require("./"),
    Steam = require("steam"),
    bot = new Steam.SteamClient(),
    steamUser = new Steam.SteamUser(bot),
    fs = require('fs'),
    crypto = require("crypto");

const DEBUG_MODE = true;

const CACHE_FILE = "./cache/sentry";


const _LOGIN_CODE_REQUIRED = 63;

exports.EC_ACTIVATION_FAILED = 1;
exports.EC_ACTIVATION_FAILED_ALREADY_ACTIVATED = 2;
exports.EC_NOT_INITED = 3;
exports.EC_AUTH_FAILED = 4;
exports.EC_AUTH_CODE_REQUIRED = 5;


function MakeSha(bytes) {
    const hash = crypto.createHash('sha1');
    hash.update(bytes);
    return hash.digest();
}

let inted = false;

exports.init = function (loginData) {
    return new Promise(function (resolve, reject) {

        if (DEBUG_MODE) bot.on('debug', (msg) => console.log(("debug: " + msg).debug));

        const logonDetails = {
            "account_name": loginData.username,
            "password": loginData.password
        };

        if (typeof loginData.authCode !== 'undefined'
            && loginData.authCode && loginData.authCode !== "") {
            logonDetails.auth_code = loginData.authCode;
        }

        try {
            const sentry = fs.readFileSync(CACHE_FILE);
            if (sentry.length) {
                logonDetails.sha_sentryfile = MakeSha(sentry);
            }
        } catch (e) {

        }

        bot.connect();



        steamUser.on('updateMachineAuth', function (response, callback) {
            console.log("updateMachineAuth.");
            fs.writeFileSync(CACHE_FILE, response.bytes);
            callback({sha_file: MakeSha(response.bytes)});
        });

        bot.on("logOnResponse", function (response) {
            const code = response.eresult;
            if (code === Steam.EResult.OK) {
                console.log('Steam login: success'.steam_ok);
                inted = true;
                resolve(steamUser)
            } else if (code === _LOGIN_CODE_REQUIRED) {
                console.log("Steam login: failed - steam auth code required".steam_error);

                reject(exports.EC_AUTH_CODE_REQUIRED, response);
            } else {
                console.log("Steam login: failed".steam_error);
                reject(exports.EC_AUTH_FAILED, response)
            }
        });

        bot.on('sentry', function (sentry) {
            console.log("Received sentry.");
            fs.writeFileSync(CACHE_FILE, sentry);
        });

        bot.on('connected', function () {
            console.log("Steam connection: success".steam_ok);
            steamUser.logOn(logonDetails);
        });
    });
};

exports.activate = function (keyCd) {
    return new Promise(function (resolve, reject) {
        if (!inted) {
            console.log("Steam error: not initialised".steam_error);
            reject(exports.EC_NOT_INITED);
        } else {
            new steamKey.SteamRegistrar(steamUser, bot, DEBUG_MODE)
                .activateKey(keyCd, function (purchaseResponse) {
                    const code = purchaseResponse.eresult;
                    if (code === Steam.EResult.OK) {
                        console.log("Steam key '".info + keyCd.toUpperCase()
                            + "' activation: success".steam_ok);
                        resolve(keyCd)
                    } else {
                        let detailsMsg;
                        let errorCode = exports.EC_ACTIVATION_FAILED;
                        switch (purchaseResponse.purchase_result_details) {
                            case 53:
                                detailsMsg = "already activated";
                                errorCode = exports.EC_ACTIVATION_FAILED_ALREADY_ACTIVATED;
                                break;
                            default:
                                detailsMsg = purchaseResponse.purchase_result_details
                        }

                        console.log(("Steam key '" + keyCd.toUpperCase().white + "' activation: failed - ["
                            + code + "] " + detailsMsg).steam_error);
                        reject(errorCode)
                    }
                });
        }
    });
};




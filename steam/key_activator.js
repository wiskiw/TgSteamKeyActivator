const crypto = require("crypto");
const fs = require('fs');
const Steam = require("steam");
const client = new Steam.SteamClient();
const steamUser = new Steam.SteamUser(client);
const steamKey = require("./");
const readlineSync = require("readline-sync");
const utils = require("../utils");

const SENTRY_FILE_PATH = './cache/sentry';
const _LOGIN_CODE_REQUIRED = 63;

exports.EC_ACTIVATION_FAILED = 1;
exports.EC_ACTIVATION_FAILED_ALREADY_ACTIVATED = 2;
exports.EC_NOT_INITED = 3;
exports.EC_AUTH_FAILED = 4;
exports.EC_AUTH_CODE_REQUIRED = 5;

let _ready = false;

exports.debugMode = false;

exports.isReady = () => _ready;

exports.init = function (username, password) {

    return new Promise(function (resolve, reject) {
        if (exports.debugMode) client.on('debug', (msg) => utils.log(("debug: " + msg).debug));

        if (!username) username = readlineSync.question('Steam username: '.input);
        if (!password) password = readlineSync.question('Steam password: '.input, {noEchoBack: true});

        utils.log(("Connecting to " + username.white + " Steam account...").steam_ok);

        const logonDetails = {
            "account_name": username,
            "password": password
        };

        const mSentry = _readFileSentry();
        if (mSentry !== "") logonDetails.sha_sentryfile = mSentry;

        client.connect();

        steamUser.on('updateMachineAuth', function (response, callback) {
            utils.log("Update machine auth.".steam_ok);
            fs.writeFileSync(SENTRY_FILE_PATH, response.bytes);
            callback({
                sha_file: _makeSHA(response.bytes)
            });
        });

        client.on('sentry', function (sentry) {
            utils.log("Received sentry.".steam_ok);
            fs.writeFileSync(SENTRY_FILE_PATH, sentry);
        });

        client.on('connected', function () {
            utils.log("Steam connection: success".steam_ok);
            steamUser.logOn(logonDetails); // попытка входа после подлючения
        });

        client.on("logOnResponse", function (response) {
            const code = response.eresult;
            if (code === Steam.EResult.OK) {
                utils.log('Steam login: success'.steam_ok);
                _ready = true;
                resolve(steamUser)

            } else if (code === _LOGIN_CODE_REQUIRED) {
                utils.log("Steam auth code required(check email)".steam_warn);

                logonDetails.auth_code = readlineSync.question('Steam auth code: '.input);

                client.connect(); // переподключаем клиента после ошибки
                steamUser.logOn(logonDetails); // повторный вход уже с authCode

            } else {
                utils.log('logOnDetails: ' + JSON.stringify(response));
                utils.log("Steam login: failed".steam_error);
                reject(exports.EC_AUTH_FAILED, response)
            }
        });
    });
};

function _makeSHA(bytes) {
    const hash = crypto.createHash('sha1');
    hash.update(bytes);
    return hash.digest();
}

function _readFileSentry() {
    try {
        const sentry = fs.readFileSync(SENTRY_FILE_PATH);
        if (sentry.length) {
            return _makeSHA(sentry);
        }
    } catch (e) {
    }
}

function getGameName(purchaseResponse) {
    const list = purchaseResponse.purchase_receipt_info.MessageObject.lineitems;
    if (list.length > 0) {
        return list[0].ItemDescription + "";
    } else {
        return "unknown"
    }
}


exports.activate = (cdKey) => {
    return new Promise(function (resolve, reject) {


        if (!_ready) {
            utils.log("Steam error: not initialised".steam_error);
            reject(exports.EC_NOT_INITED);
        } else {
            cdKey = cdKey.trim();
            utils.log("An attempt to activate the Steam key '".steam_ok
                + cdKey.toUpperCase().white + "'".steam_ok);

            new steamKey.SteamRegistrar(steamUser, client, exports.debugMode)
                .activateKey(cdKey, function (purchaseResponse) {
                    //console.log("purchaseResponse: " + JSON.stringify(purchaseResponse));
                    const code = purchaseResponse.eresult;
                    if (code === Steam.EResult.OK) {
                        utils.log("Steam key '".steam_ok + cdKey.toUpperCase().rainbow.bold + "' for ".steam_ok +
                            getGameName(purchaseResponse).rainbow.bold + " successfully activated!".steam_ok);
                        resolve(cdKey)
                    } else {
                        let errorCode = exports.EC_ACTIVATION_FAILED;
                        switch (purchaseResponse.purchase_result_details) {
                            case 9:
                                utils.log(("Steam key '" + cdKey.toUpperCase().white + "' for " +
                                    getGameName(purchaseResponse).white
                                    + " din't activate: you already own that game - " + purchaseResponse.purchase_result_details).steam_error);
                                break;
                            case 14:
                                utils.log(("Steam key '" + cdKey.toUpperCase().white + "' invalid - " +
                                    purchaseResponse.purchase_result_details).steam_error);
                                break;
                            case 15:
                                errorCode = exports.EC_ACTIVATION_FAILED_ALREADY_ACTIVATED;
                                utils.log(("Steam key '" + cdKey.toUpperCase().white + "' for " +
                                    getGameName(purchaseResponse).white
                                    + " already activated - " + purchaseResponse.purchase_result_details).steam_error);

                                break;
                            case 53: //- слишком частые запросы?
                            default:
                                utils.log(("Steam key '" + cdKey.toUpperCase().white + "' activation: failed - " +
                                    purchaseResponse.purchase_result_details).steam_error);
                        }
                        reject(errorCode);
                    }
                });
        }
    });
};
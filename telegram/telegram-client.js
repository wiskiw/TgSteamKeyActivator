const config = require("../config");
const utils = require("../utils");
const login = require("./login-2fa");
const telegram = require('./init');

exports.showChats = async () => {
    const chats = await exports.getChat();
    console.log("chats: " + JSON.stringify(chats));
};

exports.getChat = async () => {
    const dialogs = await telegram.app('messages.getDialogs', {
        limit: 50,
    });
    const {chats} = dialogs;
    return chats
};


exports.showHistory = async (accessHash, channelId, limit) => {
    const getHistory = await exports.getHistory(accessHash, channelId, limit);
    console.log("chats history: " + JSON.stringify(getHistory));
};

exports.getHistory = async (accessHash, channelId, limit) => {
    if (!limit) limit = 100;
    let offset = 0;

    return await telegram.app('messages.getHistory', {
        peer: {
            _: 'inputPeerChannel',
            channel_id: channelId,
            access_hash: accessHash
        },
        max_id: offset,
        offset: 0,
        limit
    })
};


/**
 * Загрузкает картинку из телеги
 * @param fileLocation
 * "fileLocation": {
          "dc_id": 2,
          "volume_id": "246134018",
          "local_id": 196864,
          "secret": "15746201273923682848"
        },
 * @returns {Promise<Buffer>}
 */
exports.loadImage = async (fileLocation) => {

    function toBuffer(bytesObj) {
        const byteArray = [];
        Object.keys(bytesObj).forEach(function (key) {
            byteArray.push(bytesObj[key]);
        });
        return Buffer.from(byteArray);
    }

    const params = {
        location: {
            _: "inputFileLocation",
            dc_id: fileLocation.dc_id,
            volume_id: fileLocation.volume_id,
            secret: fileLocation.secret,
            local_id: fileLocation.local_id
        }//, limit: size
    };

    //console.log("loadImage params: " + JSON.stringify(params));
    const res = await telegram.app('upload.getFile', params, telegram.app.reqConf);
    return toBuffer(res.bytes);
};


function isUserAuthorized(phone) {
    return new Promise((resolve, reject) => {
        //setTimeout(resolve, 15000, false);
        telegram.app('users.getFullUser', {id: {_: 'inputUserSelf'}}, telegram.reqConf)
            .then((fullUser) => {

                    /*
                    fullUser: {"_":"userFull","flags":0,"user":{"_":"user","flags":1107,"self":true,"id":531989413,"access_hash":"4955602953163397353","first_name":"Ульяна","phone":"375447168120","status":{"_":"userStatusOffline","was_online":1530093749}},"link":{"_":"contacts.link","my_link":{"_":"contactLinkNone"},"foreign_link":{"_":"contactLinkUnknown"},"user":{"_":"user","flags":1107,"self":true,"id":531989413,"access_hash":"4955602953163397353","first_name":"Ульяна","phone":"375447168120","status":{"_":"userStatusOffline","was_online":1530093749}}},"notify_settings":{"_":"peerNotifySettings","flags":1,"show_previews":true,"mute_until":0,"sound":"default"}}
                     */

                    utils.log(("Telegram user " + fullUser.user.first_name.white + " (" + phone.white
                        + ") login success").tg_ok);
                    resolve(true)
                }
            )
            .catch(authCheckEx => {
                    if (telegram.errorType(authCheckEx) === "AUTH_KEY_UNREGISTERED" ||
                        telegram.errorType(authCheckEx) === "SESSION_PASSWORD_NEEDED") {
                        // пользователь не авторизован
                        resolve(false)
                    } else {
                        // другая ошибка авторизации

                        reject(authCheckEx)
                    }
                }
            );
    })
        ;
}

exports.init = function () {
    const phone = config.tg_user_phone;

    if (config.tg_debug_server) {
        utils.log(("Telegram debug server enabled!").debug);
    }


    utils.log(("Connecting to " + phone.white + " Telegram account...").tg_ok);

    return new Promise(function (resolve, reject) {
        function _login() {
            login(phone).then((logResult) => {
                connect() // рекурсивынй вызов

            }).catch((loginEx) => {
                if (telegram.errorType(loginEx) === "PHONE_CODE_INVALID") {
                    utils.log("Telegram login failed: PHONE_CODE_INVALID".tg_error);
                } else {
                    utils.log(
                        ("Telegram login failed: " +
                            JSON.stringify(loginEx, ["message", "arguments", "type", "name"])).tg_error
                    );
                }
                reject(loginEx)
            });
        }

        function connect() {
            isUserAuthorized(phone).then((authed) => {
                if (authed) {
                    resolve();
                } else {
                    //telegram.app.storage.clear();
                    utils.log(("Telegram auth required").tg_ok);
                    // пользователь не авторизован
                    _login();
                }
            }).catch((authCheckEx) => {
                // другая ошибка авторизации/подключения к серверу
                if (telegram.errorType(authCheckEx) === "AUTH_KEY_UNREGISTERED") {
                    utils.log(
                        ("Telegram check login/connection error: AUTH_KEY_UNREGISTERED. " +
                            "Try to remove ./cache/tg_storage.json file").tg_error
                    );
                } else {
                    utils.log(
                        ("Telegram check login/connection error: " +
                            JSON.stringify(authCheckEx, ["message", "arguments", "type", "name"])).tg_error
                    );
                }
                reject(authCheckEx)
            })
        }

        connect();
    });
};



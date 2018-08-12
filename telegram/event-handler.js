const telegram = require('./init');
const utils = require("../utils");
const fs = require('fs');
const path_module = require('path');

const events = require('events');
const eventEmitter = new events.EventEmitter();

exports.debug = true;

exports.startEventHandler = function () {
    return new Promise(function (resolve, reject) {
        // https://github.com/zerobias/telegram-mtproto/issues/174
        // https://tjhorner.com/tl-schema/type/Updates
        telegram.app.bus.untypedMessage.observe(data => {
            if (exports.debug) {
                console.log("------------------------------------");
                utils.log(JSON.stringify(data.message));
            }
            utils.saveTgLog(JSON.stringify(data));
            eventEmitter.emit("event", data.message)
        });

        setInterval(() => {
            telegram.app("updates.getState", {}, telegram.reqConf)
        }, 1000);

        utils.log("Telegram events handler ready".ok);

        resolve()
    });
};

const handlersFolder = './handler/';

exports.loadHandlers = function () {
    return new Promise(function (resolve, reject) {
        utils.log("Connecting Telegram events handlers...".ok);

        function loadModule(path) {
            require('../' + path)(eventEmitter);
        }

        fs.readdir(handlersFolder, function (err, files) {
                let handlerPath;

                const handlersCount = files.length;
                if (handlersCount === 0) {
                    utils.log("No event handlers found".warn);
                    reject(new Error("No event handlers found"))
                } else {
                    utils.log(("Found " + handlersCount + " events handler(s): ").ok + (files.join(', ')).white);
                    for (let i = 0; i < handlersCount; i++) {
                        handlerPath = path_module.join(handlersFolder, files[i]);
                        loadModule(handlerPath);
                    }
                    resolve(handlersCount)
                }
            }
        );
    });
};
const utils = require("../utils");
const fs = require("fs");
const path_module = require('path');
const Telegram = require('../telegram/telegram-client');
const KeyActivator = require("../steam/key_activator.js");

// https://www.npmjs.com/package/node-tesseract
const tesseract = require('node-tesseract');


//const chatId = 1340035066; // debug
const chatId = 1195028505;
const chatName = "freebie_steam";
const imgDirPath = "./res/";

const handlerTag = "[" + chatName + "]"; // debug

/*
    "id": 1195028505,
    "access_hash": "14589563643703868565",
    "title": "Free Steam",
    "username": "freebie_steam",
 */

module.exports = function (eventEmitter) {
    eventEmitter.on('event', (eventData) => {
        const fileInfo = eventsFilter(eventData);
        if (fileInfo !== undefined) {
            Promise.resolve()
                .then(() => {
                    utils.log((handlerTag + " Loading image " + fileInfo.id.toString().white + " ...").verbose);
                    return Telegram.loadImage(fileInfo.location)
                })
                .then((imageBuffer) => {
                    utils.log((handlerTag + " Saving image " + fileInfo.id.toString().white
                        + " ...").verbose);
                    return saveImage(imageBuffer, fileInfo.id.toString())
                })
                .then((imagePath) => {
                    utils.log((handlerTag + " Image " + fileInfo.id.toString().white
                        + " saved to " + imagePath.white).verbose);
                    return recognice(imagePath)
                })
                .then((cdKey) => {
                    //console.log("activatind : " + cdKey);
                    return KeyActivator.activate(cdKey);
                })
                .catch((ex) => {
                    utils.log((handlerTag + " Handler error: " + ex.white).warn);
                });
        }
    });
};


async function saveImage(imageBuffer, imgName) {
    const imgPath = path_module.join(imgDirPath, imgName + ".jpg");
    await fs.writeFileSync(imgPath, imageBuffer, "binary", () => {
    });
    return imgPath
}

function recognice(imgPath) {
    return new Promise((resolve, reject) => {

        function filterCdKeyText(cdKey) {
            utils.log((handlerTag + " CD Key scanned: '" + cdKey.replace(/\n*/g, '').white + "'").verbose);

            cdKey = cdKey.replace(/[^\w—-]/g, '');
            cdKey = cdKey.replace(/[—-]/g, '-');

            utils.log((handlerTag + " CD Key filtered: '" + cdKey.white + "'").verbose);
            return cdKey
        }

        const options = {
            l: 'eng'
        };

        tesseract.process(imgPath, options, function (err, text) {
            if (err) {
                utils.error(err.warn);
                reject(err);
            } else {
                resolve(filterCdKeyText(text));
            }
        })
    });
}

function eventsFilter(eventData) {
    if (eventData._ !== 'updates') return;
    const updateArray = eventData.updates;

    //utils.log("freebie_steam: " + JSON.stringify(updateArray));

    let media, current, len = updateArray.length;
    for (let i = 0; i < len; i++) {
        current = updateArray[i];
        if (current._ !== "updateNewChannelMessage") continue;
        if (current.message.to_id.channel_id !== chatId) continue;

        media = current.message.media;

        if (current.message.message !== "" || !media || media._ !== "messageMediaPhoto") continue;

        const last = media.photo.sizes[media.photo.sizes.length - 1];

        return {
            location: last.location,
            size: last.size,
            id: media.photo.id
        }
    }
}
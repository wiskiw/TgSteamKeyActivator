const utils = require("../utils");
const KeyActivator = require("../steam/key_activator.js");

//const chatId = 1340035066; // debug
const chatId = 1298051109;
const chatName = "g2keys";

const handlerTag = "[" + chatName + "]"; // debug


module.exports = function (eventEmitter) {
    eventEmitter.on('event', (eventData) => {

        const chatMessage = eventsFilter(eventData);
        if (chatMessage !== undefined) {
            const cdKey = parseCdKey(chatMessage);
            if (cdKey !== undefined)
                KeyActivator.activate(cdKey).catch((e) => {})
        }
    });
};


let lastMsg = "";

function eventsFilter(eventData) {
    if (eventData._ !== 'updates') return;
    const updateArray = eventData.updates;

    //utils.log("updateArray: " + JSON.stringify(updateArray));

    let msg, current, len = updateArray.length;
    for (let i = 0; i < len; i++) {
        current = updateArray[i];
        if (current._ !== "updateNewChannelMessage") continue;
        if (current.message.to_id.channel_id !== chatId) continue;

        msg = current.message.message;
        if (lastMsg !== msg) {
            lastMsg = msg;
            return msg
        }
    }
}

function parseCdKey(chatMessage) {

    const probalyKeys = chatMessage.match(/[ A-Z0-9—-]{5,}/g);

    utils.log((handlerTag + " Probably keys: ").verbose + ("" + probalyKeys).white.underline);

    if (probalyKeys !== undefined && probalyKeys.length > 0) {
        const cdKey = probalyKeys[0].trim();
        utils.log((handlerTag + " Found CD Key in " + chatName.white + " - '" + cdKey.white + "'").verbose);
        return cdKey;
    }

}

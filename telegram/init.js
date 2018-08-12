const MTProto = require('telegram-mtproto').MTProto;
const {Storage} = require('mtproto-storage-fs');
const config = require("../config");

// npm install telegram-mtproto@3.1.3 --save   WORKS!
// npm install telegram-mtproto@beta --save   WORKS!

exports.cache_file = './cache/tg_storage.json';

//exports.reqConf = {dcID: 2};


// Same issue in 3.2.11, but in 3.2.06 is working as expected
const api = {
    invokeWithLayer: 0xda9b0d0d,
    layer: 57,
    initConnection: 0x69796de9,
    api_id: config.tg_id,
    app_version: '1.0.0',
    lang_code: 'en'
};

const app = {
    // https://github.com/zerobias/telegram-mtproto/issues/59
    storage: new Storage(exports.cache_file)
};

const dcHost = config.tg_debug_server ? "149.154.167.40" : "149.154.167.50";

const server = {
    webogram: false,//This option allows you to use undocumented additional servers
    //used by the official web client
    dev: config.tg_debug_server
    /*
    ,
    dcList: [{
        id: 2,
        host: dcHost,
        //host: "149.154.167.40", // debug
        //host: "149.154.167.50", /// prod
        port: 443
    }]
    */
};


const telegram = MTProto({server: server, api: api, app: app});

exports.app = telegram;

exports.errorType = function (error) {
    // type - lib.v @beta
    // message - lib.v @3.1.3
    // error_message - lib.v @3.2.06

    // важен порядок вызова!
    if (error.message) return error.message;
    if (error.error_message) return error.error_message;
    if (error.type) return error.type;
};
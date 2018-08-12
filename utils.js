const date = require('date-and-time');
const fs = require('fs');

const logFile = 'tg_logs.json';

exports.date = function () {
    return date.format(new Date(), 'HH:mm:ss');
};
exports.log = function (str) {
    console.log(("[" + exports.date() + "]").time + " " + str);
};

exports.toLog = function (str) {
    return ("[" + exports.date() + "]").time + " " + str;
};


exports.saveTgLog = function (str) {
    str = "//-------------------------[" + exports.date() + "]------------------------------\n"
        + str + "\n\n";
    fs.appendFile(logFile, str, function (err) {
        if (err) throw err;
    });
};